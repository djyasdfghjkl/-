const Router = require("koa-router");
const router = new Router();
const adminRouter = new Router();
const superadminRouter = new Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const EmailVerification = require("../models/EmailVerification");
const { sendVerificationEmail } = require("../config/email");
const auth = require("../middleware/auth");
const { role, canSetRole } = require("../middleware/role");
const { isConnected } = require("../config/mongodb");
const { updateLoginStats } = require("../utils/loginStats");
const { checkAndAwardMedals } = require("../utils/medalManager");
const { formatDateTime } = require("../utils/dateUtils");
const { getError } = require("../config/errorConfig");

/**
 * @swagger
 * /api/users/send-code:
 *   post:
 *     summary: 发送验证码
 *     description: 发送验证码到指定邮箱
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - type
 *             properties:
 *               email:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [register, reset_password]
 *     responses:
 *       200:
 *         description: 验证码发送成功
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 验证码发送失败
 */
router.post("/users/send-code", async (ctx) => {
  try {
    console.log("[发送验证码请求]", ctx.request.body);
    // 检查MongoDB连接状态
    if (!isConnected()) {
      console.log("[发送验证码失败]", "数据库连接失败");
      ctx.status = 503;
      ctx.body = getError("database.connectionFailed");
      return;
    }

    const { email, type } = ctx.request.body;

    if (!email || !type) {
      console.log("[发送验证码失败]", "缺少必要参数");
      ctx.status = 400;
      ctx.body = getError("common.badRequest");
      return;
    }

    if (type !== "register" && type !== "reset_password") {
      console.log("[发送验证码失败]", "无效的验证码类型");
      ctx.status = 400;
      ctx.body = getError("common.badRequest");
      return;
    }

    // 注册时检查邮箱是否已存在
    if (type === "register") {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log("[发送验证码失败]", "邮箱已存在");
        ctx.status = 400;
        ctx.body = getError("user.emailExists");
        return;
      }
    }

    // 找回密码时检查邮箱是否存在
    if (type === "reset_password") {
      const existingUser = await User.findOne({ email });
      if (!existingUser) {
        console.log("[发送验证码失败]", "邮箱不存在");
        ctx.status = 400;
        ctx.body = getError("user.emailNotExists");
        return;
      }
    }

    // 生成6位随机验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 删除该邮箱已有的验证码记录
    await EmailVerification.deleteOne({ email, type });

    // 保存新的验证码记录
    const verification = new EmailVerification({
      email,
      code,
      type,
    });
    await verification.save();

    // 发送验证码邮件（实际项目中需要配置正确的邮箱服务）
    const emailResult = await sendVerificationEmail(email, code, type);

    if (!emailResult.success) {
      console.error("[发送验证码邮件失败]:", emailResult.error);
      ctx.status = 500;
      ctx.body = getError("email.sendFailed");
      return;
    }

    console.log("[发送验证码成功]", `邮箱: ${email}, 类型: ${type}`);
    ctx.status = 200;
    ctx.body = { success: true, message: "验证码发送成功，请注意查收" };
  } catch (error) {
    console.error("[发送验证码错误]:", error);
    console.error("[错误堆栈]:", error.stack);
    ctx.status = 500;
    ctx.body = getError("common.serverError");
  }
});

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: 用户注册
 *     description: 创建新用户
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - code
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       201:
 *         description: 用户创建成功
 *       400:
 *         description: 请求参数错误或验证码无效
 *       409:
 *         description: 用户已存在
 */
router.post("/users/register", async (ctx) => {
  try {
    console.log("[注册请求]", ctx.request.body);
    const { username, nickname, email, password, code } = ctx.request.body;

    if (!username || !email || !password || !code) {
      console.log("[注册失败]", "缺少必要参数");
      ctx.status = 400;
      ctx.body = getError("common.badRequest");
      return;
    }

    // 只检查邮箱是否存在，用户名是昵称无所谓
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("[注册失败]", "邮箱已存在");
      ctx.status = 400;
      ctx.body = getError("user.emailExists");
      return;
    }

    // 验证验证码
    const verification = await EmailVerification.findOne({
      email,
      type: "register",
      code,
      isUsed: false,
    });
    console.log("[验证码验证]", verification);

    if (!verification) {
      console.log("[注册失败]", "验证码无效");
      ctx.status = 400;
      ctx.body = getError("email.codeIncorrect");
      return;
    }

    // 标记验证码为已使用
    verification.isUsed = true;
    await verification.save();

    // 创建用户
    const user = new User({
      username: username,
      nickname: nickname || username,
      email,
      password,
    });
    await user.save();

    console.log(
      "[注册成功]",
      `用户名: ${user.username}, 昵称: ${user.nickname}, 邮箱: ${user.email}`,
    );
    ctx.status = 201;
    ctx.body = { success: true, message: "用户注册成功" };
  } catch (error) {
    console.error("[注册错误]:", error);
    console.error("[错误堆栈]:", error.stack);
    ctx.status = 500;
    ctx.body = getError("common.serverError");
  }
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: 用户登录
 *     description: 用户登录并获取JWT令牌
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 登录成功
 *       401:
 *         description: 认证失败
 */
router.post("/users/login", async (ctx) => {
  try {
    console.log("[登录请求]", ctx.request.body);
    const { email, password } = ctx.request.body;

    if (!email || !password) {
      console.log("[登录失败]", "缺少必要参数");
      ctx.status = 400;
      ctx.body = getError("common.badRequest");
      return;
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      console.log("[登录失败]", "邮箱或密码错误");
      ctx.status = 401;
      ctx.body = getError("user.passwordIncorrect");
      return;
    }

    // 获取用户IP
    const userIp = ctx.headers["x-forwarded-for"] || ctx.ip || ctx.ips[0];
    user.lastLoginIp = userIp;
    user.last_login_ip = userIp;
    user.lastLoginDate = new Date();
    user.last_login_at = new Date();
    user.loginCount += 1;
    await user.save();

    // 更新登录统计信息
    const loginStats = await updateLoginStats(user._id);

    // 检查并颁发勋章
    let awardedMedals = [];
    if (loginStats.success) {
      const medalResult = await checkAndAwardMedals(user._id);
      if (medalResult.success) {
        awardedMedals = medalResult.awardedMedals;
      }
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "your-secret-key",
      {
        expiresIn: "7d",
      },
    );

    console.log(
      "[登录成功]",
      `用户: ${user.username}, 邮箱: ${user.email}, 角色: ${user.role}`,
    );
    console.log("[登录成功] Token:", token);
    ctx.status = 200;
    ctx.body = {
      success: true,
      message: "登录成功",
      data: {
        user: {
          id: user._id,
          uuid: user.uuid,
          username: user.username,
          nickname: user.nickname,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
          status: user.status,
          vip_expire: user.vip_expire,
          vipExpireDate: user.vipExpireDate,
          svipExpireDate: user.svipExpireDate,
          balance: user.balance,
          diary_count: user.diary_count,
          word_count: user.word_count,
          like_count: user.like_count,
          follower_count: user.follower_count,
          following_count: user.following_count,
          settings: user.settings,
          medals: user.medals,
          totalLoginDays: user.totalLoginDays || 0,
          consecutiveLoginDays: user.consecutiveLoginDays || 0,
          last_login_at: user.last_login_at,
          last_login_ip: user.last_login_ip,
          signature: user.signature,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
        loginStats: loginStats.success ? loginStats : null,
        awardedMedals: awardedMedals.length > 0 ? awardedMedals : null,
      },
    };
  } catch (error) {
    console.error("[登录错误]:", error);
    console.error("[错误堆栈]:", error.stack);
    ctx.status = 500;
    ctx.body = getError("common.serverError");
  }
});

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: 获取用户个人信息
 *     description: 获取当前登录用户的个人信息
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get("/users/profile", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    console.log(
      "[获取个人信息请求]",
      `用户ID: ${user._id}, 用户名: ${user.username}`,
    );
    console.log(
      "[获取个人信息成功]",
      `用户: ${user.username}, 邮箱: ${user.email}, 角色: ${user.role}`,
    );
    ctx.body = {
      success: true,
      data: {
        id: user._id,
        uuid: user.uuid,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        gender: user.gender,
        birthday: user.birthday,
        bio: user.bio,
        signature: user.signature,
        role: user.role,
        status: user.status,
        vip_expire: user.vip_expire,
        vipExpireDate: user.vipExpireDate,
        svipExpireDate: user.svipExpireDate,
        balance: user.balance,
        diary_count: user.diary_count,
        word_count: user.word_count,
        like_count: user.like_count,
        follower_count: user.follower_count,
        following_count: user.following_count,
        settings: user.settings,
        medals: user.medals,
        totalLoginDays: user.totalLoginDays || 0,
        consecutiveLoginDays: user.consecutiveLoginDays || 0,
        last_login_at: user.last_login_at,
        last_login_ip: user.last_login_ip,
        loginCount: user.loginCount || 0,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  } catch (error) {
    console.error("[获取个人信息错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取个人信息失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: 更新用户个人信息
 *     description: 更新当前登录用户的个人信息
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               avatar:
 *                 type: string
 *               signature:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *       401:
 *         description: 未认证
 *       400:
 *         description: 请求参数错误
 */
router.put("/users/profile", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    console.log(
      "[更新个人信息请求]",
      `用户ID: ${user._id}, 用户名: ${user.username}`,
    );
    console.log("[更新个人信息参数]", ctx.request.body);
    const {
      username,
      nickname,
      password,
      avatar,
      gender,
      birthday,
      bio,
      signature,
      settings,
    } = ctx.request.body;

    // 更新用户信息
    if (username) user.username = username;
    if (nickname) user.nickname = nickname;
    if (password) user.password = password;
    if (avatar) user.avatar = avatar;
    if (gender !== undefined) user.gender = gender;
    if (birthday) user.birthday = birthday;
    if (bio !== undefined) user.bio = bio;
    if (signature !== undefined) user.signature = signature;
    if (settings) user.settings = { ...user.settings, ...settings };

    await user.save();

    console.log(
      "[更新个人信息成功]",
      `用户: ${user.username}, 邮箱: ${user.email}`,
    );
    ctx.body = {
      success: true,
      message: "个人信息更新成功",
      data: {
        id: user._id,
        uuid: user.uuid,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        gender: user.gender,
        birthday: user.birthday,
        bio: user.bio,
        signature: user.signature,
        role: user.role,
        status: user.status,
        settings: user.settings,
        last_login_at: user.last_login_at,
        last_login_ip: user.last_login_ip,
        updatedAt: user.updatedAt,
      },
    };
  } catch (error) {
    console.error("[更新个人信息错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "更新失败：" + error.message };
  }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 获取所有用户
 *     description: 获取所有用户列表（仅管理员可用）
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.get("/users", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const user = ctx.state.user;
    console.log(
      "[获取所有用户请求]",
      `管理员: ${user.username}, 角色: ${user.role}`,
    );
    const users = await User.find().select("-password");
    console.log("[获取所有用户成功]", `共获取 ${users.length} 个用户`);
    ctx.body = {
      success: true,
      data: users,
    };
  } catch (error) {
    console.error("[获取所有用户错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取用户列表失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/users/{id}/role:
 *   put:
 *     summary: 更新用户角色
 *     description: 更新指定用户的角色（仅管理员可用）
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, vip, svip, admin]
 *     responses:
 *       200:
 *         description: 更新成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.put(
  "/users/:id/role",
  auth,
  role(["admin", "superadmin"]),
  async (ctx) => {
    try {
      const adminUser = ctx.state.user;
      const { id } = ctx.params;
      const { role: newRole } = ctx.request.body;
      console.log(
        "[更新用户角色请求]",
        `管理员: ${adminUser.username}, 用户ID: ${id}, 新角色: ${newRole}`,
      );

      const validRoles = [0, 1, 2, 3]; // 0=普通用户，1=VIP，2=SVIP，3=管理员
      if (!validRoles.includes(newRole)) {
        console.log("[更新用户角色失败]", "无效的角色");
        ctx.status = 400;
        ctx.body = { success: false, message: "无效的角色" };
        return;
      }

      const user = await User.findById(id);
      if (!user) {
        console.log("[更新用户角色失败]", "用户不存在");
        ctx.status = 404;
        ctx.body = { success: false, message: "用户不存在" };
        return;
      }

      // 检查目标用户是否为超级管理员，如果是则不允许更改
      if (user.role === 4) {
        console.log("[更新用户角色失败]", "超级管理员身份不能被更改");
        ctx.status = 403;
        ctx.body = { success: false, message: "超级管理员身份不能被更改" };
        return;
      }

      user.role = newRole;
      await user.save();

      console.log(
        "[更新用户角色成功]",
        `用户: ${user.username}, 新角色: ${user.role}`,
      );
      ctx.body = {
        success: true,
        message: "角色更新成功",
        data: { id: user._id, username: user.username, role: user.role },
      };
    } catch (error) {
      console.error("[更新用户角色错误]:", error);
      ctx.status = 500;
      ctx.body = { success: false, message: "更新角色失败：" + error.message };
    }
  },
);

/**
 * @swagger
 * /api/users/reset-password:
 *   post:
 *     summary: 重置密码
 *     description: 使用验证码重置密码
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: 密码重置成功
 *       400:
 *         description: 请求参数错误或验证码无效
 */
router.post("/users/reset-password", async (ctx) => {
  try {
    console.log("[重置密码请求]", ctx.request.body);
    const { email, code, newPassword } = ctx.request.body;

    if (!email || !code || !newPassword) {
      console.log("[重置密码失败]", "缺少必要参数");
      ctx.status = 400;
      ctx.body = { success: false, message: "缺少必要参数" };
      return;
    }

    // 验证验证码
    const verification = await EmailVerification.findOne({
      email,
      type: "reset_password",
      code,
      isUsed: false,
    });

    if (!verification) {
      console.log("[重置密码失败]", "验证码无效或已过期");
      ctx.status = 400;
      ctx.body = { success: false, message: "验证码无效或已过期" };
      return;
    }

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      console.log("[重置密码失败]", "用户不存在");
      ctx.status = 400;
      ctx.body = { success: false, message: "用户不存在" };
      return;
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    // 标记验证码为已使用
    verification.isUsed = true;
    await verification.save();

    console.log(
      "[重置密码成功]",
      `用户: ${user.username}, 邮箱: ${user.email}`,
    );
    ctx.status = 200;
    ctx.body = { success: true, message: "密码重置成功" };
  } catch (error) {
    console.error("[重置密码错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "重置密码失败：" + error.message };
  }
});

// ==================== 超管专用接口 ====================

/**
 * @swagger
 * /api/admin/superadmin/admins:
 *   get:
 *     summary: 获取管理员列表
 *     description: 获取所有管理员用户列表（仅超级管理员可用）
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
superadminRouter.get("/admins", auth, role(["superadmin"]), async (ctx) => {
  try {
    const superadminUser = ctx.state.user;
    console.log(
      "[获取管理员列表请求]",
      `超级管理员: ${superadminUser.username}`,
    );
    const admins = await User.find({ role: 3 }).select("-password");
    console.log("[获取管理员列表成功]", `共获取 ${admins.length} 个管理员`);
    ctx.body = {
      success: true,
      data: admins,
    };
  } catch (error) {
    console.error("[获取管理员列表错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取管理员列表失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/admin/superadmin/admins/{id}:
 *   get:
 *     summary: 获取管理员详情
 *     description: 获取指定管理员的详细信息（仅超级管理员可用）
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 管理员不存在
 */
superadminRouter.get("/admins/:id", auth, role(["superadmin"]), async (ctx) => {
  try {
    const superadminUser = ctx.state.user;
    const { id } = ctx.params;
    console.log(
      "[获取管理员详情请求]",
      `超级管理员: ${superadminUser.username}, 管理员ID: ${id}`,
    );
    const admin = await User.findOne({ _id: id, role: 3 }).select("-password");
    if (!admin) {
      console.log("[获取管理员详情失败]", "管理员不存在");
      ctx.status = 404;
      ctx.body = { success: false, message: "管理员不存在" };
      return;
    }
    console.log(
      "[获取管理员详情成功]",
      `管理员: ${admin.username}, 邮箱: ${admin.email}`,
    );
    ctx.body = {
      success: true,
      data: admin,
    };
  } catch (error) {
    console.error("[获取管理员详情错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取管理员详情失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/admin/superadmin/admins:
 *   post:
 *     summary: 注册管理员
 *     description: 创建新的管理员账号（仅超级管理员可用）
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: 管理员创建成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       400:
 *         description: 请求参数错误或用户已存在
 */
superadminRouter.post("/admins", auth, role(["superadmin"]), async (ctx) => {
  try {
    const superadminUser = ctx.state.user;
    console.log("[创建管理员请求]", `超级管理员: ${superadminUser.username}`);
    console.log("[创建管理员参数]", ctx.request.body);
    const { username, email, password } = ctx.request.body;

    if (!username || !email || !password) {
      console.log("[创建管理员失败]", "缺少必要参数");
      ctx.status = 400;
      ctx.body = { success: false, message: "缺少必要参数" };
      return;
    }

    // 检查用户名或邮箱是否已存在
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      console.log("[创建管理员失败]", "用户名或邮箱已被注册");
      ctx.status = 400;
      ctx.body = { success: false, message: "用户名或邮箱已被注册" };
      return;
    }

    // 创建管理员用户
    const admin = new User({
      username,
      nickname: username,
      email,
      password,
      role: 3,
      status: 1,
    });
    await admin.save();

    console.log(
      "[创建管理员成功]",
      `管理员: ${admin.username}, 邮箱: ${admin.email}`,
    );
    ctx.status = 201;
    ctx.body = {
      success: true,
      message: "管理员创建成功",
      data: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        createdAt: admin.createdAt,
      },
    };
  } catch (error) {
    console.error("[创建管理员错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "创建管理员失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/admin/superadmin/admins/{id}:
 *   put:
 *     summary: 更新管理员信息
 *     description: 更新指定管理员的信息（仅超级管理员可用）
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               avatar:
 *                 type: string
 *               signature:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 管理员不存在
 */
superadminRouter.put("/admins/:id", auth, role(["superadmin"]), async (ctx) => {
  try {
    const superadminUser = ctx.state.user;
    const { id } = ctx.params;
    console.log(
      "[更新管理员信息请求]",
      `超级管理员: ${superadminUser.username}, 管理员ID: ${id}`,
    );
    console.log("[更新管理员信息参数]", ctx.request.body);
    const { username, password, avatar, signature, bio } = ctx.request.body;

    const admin = await User.findOne({ _id: id, role: "admin" });
    if (!admin) {
      console.log("[更新管理员信息失败]", "管理员不存在");
      ctx.status = 404;
      ctx.body = { success: false, message: "管理员不存在" };
      return;
    }

    // 更新管理员信息
    if (username) admin.username = username;
    if (password) admin.password = password;
    if (avatar) admin.avatar = avatar;
    if (signature !== undefined) admin.signature = signature;
    if (bio !== undefined) admin.bio = bio;

    await admin.save();

    console.log(
      "[更新管理员信息成功]",
      `管理员: ${admin.username}, 邮箱: ${admin.email}`,
    );
    ctx.body = {
      success: true,
      message: "管理员信息更新成功",
      data: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        avatar: admin.avatar,
        signature: admin.signature,
        bio: admin.bio,
      },
    };
  } catch (error) {
    console.error("[更新管理员信息错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "更新管理员信息失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/admin/superadmin/admins/{id}/activate:
 *   put:
 *     summary: 启用管理员账号
 *     description: 启用指定的管理员账号（仅超级管理员可用）
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 启用成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 管理员不存在
 */
superadminRouter.put(
  "/admins/:id/activate",
  auth,
  role(["superadmin"]),
  async (ctx) => {
    try {
      const superadminUser = ctx.state.user;
      const { id } = ctx.params;
      console.log(
        "[启用管理员账号请求]",
        `超级管理员: ${superadminUser.username}, 管理员ID: ${id}`,
      );

      const admin = await User.findOne({ _id: id, role: 3 });
      if (!admin) {
        console.log("[启用管理员账号失败]", "管理员不存在");
        ctx.status = 404;
        ctx.body = { success: false, message: "管理员不存在" };
        return;
      }

      admin.status = 1;
      await admin.save();

      console.log(
        "[启用管理员账号成功]",
        `管理员: ${admin.username}, 状态: ${admin.status}`,
      );
      ctx.body = {
        success: true,
        message: "管理员账号已启用",
        data: { id: admin._id, username: admin.username, status: admin.status },
      };
    } catch (error) {
      console.error("[启用管理员账号错误]:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "启用管理员账号失败：" + error.message,
      };
    }
  },
);

/**
 * @swagger
 * /api/admin/superadmin/admins/{id}/deactivate:
 *   put:
 *     summary: 停用管理员账号
 *     description: 停用指定的管理员账号（仅超级管理员可用）
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 停用成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 管理员不存在
 */
superadminRouter.put(
  "/admins/:id/deactivate",
  auth,
  role(["superadmin"]),
  async (ctx) => {
    try {
      const superadminUser = ctx.state.user;
      const { id } = ctx.params;
      console.log(
        "[停用管理员账号请求]",
        `超级管理员: ${superadminUser.username}, 管理员ID: ${id}`,
      );

      const admin = await User.findOne({ _id: id, role: "admin" });
      if (!admin) {
        console.log("[停用管理员账号失败]", "管理员不存在");
        ctx.status = 404;
        ctx.body = { success: false, message: "管理员不存在" };
        return;
      }

      admin.status = "inactive";
      await admin.save();

      console.log(
        "[停用管理员账号成功]",
        `管理员: ${admin.username}, 状态: ${admin.status}`,
      );
      ctx.body = {
        success: true,
        message: "管理员账号已停用",
        data: { id: admin._id, username: admin.username, status: admin.status },
      };
    } catch (error) {
      console.error("[停用管理员账号错误]:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "停用管理员账号失败：" + error.message,
      };
    }
  },
);

/**
 * @swagger
 * /api/admin/superadmin/admins/{id}:
 *   delete:
 *     summary: 删除管理员
 *     description: 删除指定的管理员账号（仅超级管理员可用）
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 管理员不存在
 */
superadminRouter.delete(
  "/admins/:id",
  auth,
  role(["superadmin"]),
  async (ctx) => {
    try {
      const superadminUser = ctx.state.user;
      const { id } = ctx.params;
      console.log(
        "[删除管理员请求]",
        `超级管理员: ${superadminUser.username}, 管理员ID: ${id}`,
      );

      const admin = await User.findOne({ _id: id, role: "admin" });
      if (!admin) {
        console.log("[删除管理员失败]", "管理员不存在");
        ctx.status = 404;
        ctx.body = { success: false, message: "管理员不存在" };
        return;
      }

      await admin.remove();

      console.log("[删除管理员成功]", `管理员: ${admin.username}`);
      ctx.body = {
        success: true,
        message: "管理员删除成功",
        data: { id: id, username: admin.username },
      };
    } catch (error) {
      console.error("[删除管理员错误]:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "删除管理员失败：" + error.message,
      };
    }
  },
);

// 注册路由前缀
router.prefix("/api");
adminRouter.prefix("/api/admin");
superadminRouter.prefix("/api/admin/superadmin");

module.exports = {
  router,
  adminRouter,
  superadminRouter,
};
