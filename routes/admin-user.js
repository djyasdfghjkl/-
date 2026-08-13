const Router = require("koa-router");
const auth = require("../middleware/auth");
const { role } = require("../middleware/role");
const User = require("../models/User");
const { canManageUser, isSuperAdmin } = require("../utils/adminAccess");

const adminRouter = new Router();

function normalizeUser(user) {
  const item = user?.toJSON ? user.toJSON() : user;
  if (!item) return null;
  delete item.password;
  return item;
}

adminRouter.get("/users", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const actor = ctx.state.user;
    const keyword = String(ctx.query.keyword || "").trim();
    const query = {};

    if (!isSuperAdmin(actor)) {
      query.role = { $lt: 3 };
    }

    if (keyword) {
      query.$or = [
        { username: { $regex: keyword, $options: "i" } },
        { nickname: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
      ];
    }

    const users = await User.find(query).select("-password").sort({ createdAt: -1 });
    ctx.body = {
      success: true,
      data: users.map(normalizeUser).filter(Boolean),
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `获取用户列表失败: ${error.message}`,
    };
  }
});

adminRouter.post("/users", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const actor = ctx.state.user;
    const payload = ctx.request.body || {};
    const username = String(payload.username || "").trim();
    const nickname = String(payload.nickname || username).trim();
    const email = String(payload.email || "").trim();
    const phone = String(payload.phone || "").trim();
    const password = String(payload.password || "").trim();
    const avatar = String(payload.avatar || "").trim();
    const signature = String(payload.signature || "").trim();
    const bio = String(payload.bio || "").trim();
    const city = String(payload.location || "").trim();
    const gender = payload.gender === undefined ? 0 : Number(payload.gender) || 0;
    const status = payload.status === undefined ? 1 : Number(payload.status);
    const nextRole = payload.role === undefined ? 0 : Number(payload.role);
    const allowedRoles = isSuperAdmin(actor) ? [0, 1, 2, 3] : [0, 1, 2];

    if (!username || !password) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "用户名和密码不能为空",
      };
      return;
    }

    if (![0, 1, 2].includes(status)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "无效的状态",
      };
      return;
    }

    if (!allowedRoles.includes(nextRole)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "无效的角色",
      };
      return;
    }

    const duplicateQuery = [];
    duplicateQuery.push({ username });
    if (email) duplicateQuery.push({ email });
    if (phone) duplicateQuery.push({ phone });

    const existingUser = await User.findOne({ $or: duplicateQuery });
    if (existingUser) {
      ctx.status = 409;
      ctx.body = {
        success: false,
        message: "用户名、邮箱或手机号已存在",
      };
      return;
    }

    const user = await User.create({
      username,
      nickname,
      email: email || undefined,
      phone: phone || undefined,
      password,
      avatar: avatar || undefined,
      signature,
      bio,
      city,
      gender,
      status,
      role: nextRole,
    });

    ctx.status = 201;
    ctx.body = {
      success: true,
      message: "用户创建成功",
      data: normalizeUser(user),
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `创建用户失败: ${error.message}`,
    };
  }
});

adminRouter.put("/users/:id/role", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const actor = ctx.state.user;
    const target = await User.findById(ctx.params.id);
    if (!target) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "用户不存在",
      };
      return;
    }

    if (!canManageUser(actor, target)) {
      ctx.status = 403;
      ctx.body = {
        success: false,
        message: "无权修改该用户角色",
      };
      return;
    }

    const nextRole = Number(ctx.request.body?.role);
    const allowedRoles = isSuperAdmin(actor) ? [0, 1, 2, 3] : [0, 1, 2];
    if (!allowedRoles.includes(nextRole)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "无效的角色",
      };
      return;
    }

    target.role = nextRole;
    await target.save();

    ctx.body = {
      success: true,
      message: "角色更新成功",
      data: {
        id: target._id,
        role: target.role,
      },
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `更新角色失败: ${error.message}`,
    };
  }
});

adminRouter.put("/users/:id", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const actor = ctx.state.user;
    const target = await User.findById(ctx.params.id);
    if (!target) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "用户不存在",
      };
      return;
    }

    if (!canManageUser(actor, target)) {
      ctx.status = 403;
      ctx.body = {
        success: false,
        message: "无权修改该用户",
      };
      return;
    }

    const payload = ctx.request.body || {};
    const fields = [
      "username",
      "nickname",
      "email",
      "phone",
      "avatar",
      "bio",
      "signature",
    ];
    for (const field of fields) {
      if (payload[field] !== undefined) {
        target[field] = String(payload[field] || "").trim();
      }
    }
    if (payload.password !== undefined && String(payload.password).trim()) {
      target.password = String(payload.password).trim();
    }

    if (payload.gender !== undefined) {
      target.gender = Number(payload.gender) || 0;
    }
    if (payload.birthday !== undefined) {
      target.birthday = payload.birthday || undefined;
    }
    if (payload.location !== undefined) {
      target.city = String(payload.location || "").trim();
    }
    if (payload.status !== undefined) {
      const nextStatus = Number(payload.status);
      if (![0, 1, 2].includes(nextStatus)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "无效的状态",
        };
        return;
      }
      target.status = nextStatus;
    }

    await target.save();

    ctx.body = {
      success: true,
      message: "用户更新成功",
      data: normalizeUser(target),
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `更新用户失败: ${error.message}`,
    };
  }
});

adminRouter.delete("/users/:id", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const actor = ctx.state.user;
    const target = await User.findById(ctx.params.id);
    if (!target) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "用户不存在",
      };
      return;
    }

    if (!canManageUser(actor, target)) {
      ctx.status = 403;
      ctx.body = {
        success: false,
        message: "无权禁用该用户",
      };
      return;
    }

    target.status = 0;
    await target.save();

    ctx.body = {
      success: true,
      message: "用户已禁用",
      data: {
        id: target._id,
        status: target.status,
      },
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `禁用用户失败: ${error.message}`,
    };
  }
});

adminRouter.prefix("/api/admin");

module.exports = {
  adminRouter,
};
