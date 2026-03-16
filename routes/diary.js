const Router = require("koa-router");
const router = new Router();
const adminRouter = new Router();
const Diary = require("../models/Diary");
const User = require("../models/User");
const Follow = require("../models/Follow");
const Like = require("../models/Like");
const auth = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");
const { role } = require("../middleware/role");

// ==================== 用户端路由 ====================

/**
 * @swagger
 * /api/diaries:
 *   post:
 *     summary: 创建日记
 *     description: 创建新的日记
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - diary_date
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               diary_date:
 *                 type: string
 *                 format: date
 *               weather:
 *                 type: string
 *               mood:
 *                 type: string
 *               signature:
 *                 type: string
 *               location:
 *                 type: string
 *               location_coords:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *               cover:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               is_public:
 *                 type: boolean
 *               is_top:
 *                 type: boolean
 *               event_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: 日记创建成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 */
router.post("/diaries", auth, async (ctx) => {
  try {
    console.log("[创建日记请求]", ctx.request.body);
    const user = ctx.state.user;
    const {
      title,
      content,
      diary,
      diary_date,
      date,
      weather,
      mood,
      emotion,
      signature,
      location,
      location_coords,
      cover,
      images,
      tags,
      is_public,
      is_top,
      event_id,
    } = ctx.request.body;

    let finalDiaryDate = diary_date || diary || date;
    if (finalDiaryDate && finalDiaryDate.includes("T")) {
      finalDiaryDate = finalDiaryDate.split("T")[0];
    }
    const finalMood = mood || emotion;

    let finalTags = tags;
    if (typeof tags === "string") {
      finalTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
    }

    const missingParams = [];
    if (!title) missingParams.push("title");
    if (!content) missingParams.push("content");
    if (!finalDiaryDate) missingParams.push("diary_date (或 diary, date)");

    if (missingParams.length > 0) {
      console.log("[创建日记失败]", "缺少必要参数:", missingParams);
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: `缺少必要参数: ${missingParams.join(", ")}`,
      };
      return;
    }

    const newDiary = new Diary({
      user_id: user._id,
      title,
      content,
      diary_date: finalDiaryDate,
      weather,
      mood: finalMood,
      signature,
      location,
      location_coords,
      cover,
      images,
      tags: finalTags,
      is_public,
      is_top,
      event_id,
    });

    await newDiary.save();

    console.log("[创建日记成功]", `用户: ${user.username}, 标题: ${title}`);
    ctx.status = 201;
    ctx.body = {
      success: true,
      message: "日记创建成功",
      data: newDiary,
    };
  } catch (error) {
    console.error("[创建日记错误]:", error);
    console.error("[错误堆栈]:", error.stack);
    ctx.status = 500;
    ctx.body = { success: false, message: "创建日记失败：" + error.message };
  }
});

/**
 * @swagger
 * /api/diaries:
 *   get:
 *     summary: 获取日记列表
 *     description: 获取当前用户的日记列表
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *       - in: query
 *         name: mood
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get("/diaries", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    console.log("[获取日记列表请求]", `用户: ${user.username}`);
    const { page = 1, per_page = 10, tag, mood, keyword } = ctx.query;

    const query = {
      user_id: user._id,
      status: 1,
    };

    if (tag) {
      query.tags = tag;
    }

    if (mood) {
      query.mood = mood;
    }

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { content: { $regex: keyword, $options: "i" } },
      ];
    }

    const total = await Diary.countDocuments(query);
    const diaries = await Diary.find(query)
      .sort({ is_top: -1, diary_date: -1, updatedAt: -1 })
      .skip((page - 1) * per_page)
      .limit(parseInt(per_page));

    console.log("[获取日记列表成功]", `共 ${total} 篇日记`);
    ctx.body = {
      success: true,
      data: diaries,
      pagination: {
        total,
        page: parseInt(page),
        per_page: parseInt(per_page),
        total_pages: Math.ceil(total / per_page),
      },
    };
  } catch (error) {
    console.error("[获取日记列表错误]:", error);
    console.error("[错误堆栈]:", error.stack);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取日记列表失败：" + error.message,
    };
  }
});

// 广场相关路由
/**
 * @swagger
 * /api/diaries/square:
 *   get:
 *     summary: 获取广场日记
 *     description: 根据类型获取广场日记列表
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           default: 推荐
 *           enum: [推荐, 热门, 最新, 关注, 同城]
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get("/diaries/square", optionalAuth, async (ctx) => {
  try {
    console.log("[广场路由] 请求到达 /diaries/square");
    const user = ctx.state.user;
    console.log("[广场路由] 用户ID:", user ? user._id : "未登录");

    const { page = 1, pageSize = 10, type = "推荐" } = ctx.query;
    console.log("[广场路由] 参数:", { page, pageSize, type });

    let diaries;
    let query = {
      is_public: true,
      status: 1,
    };
    console.log("[广场路由] 查询条件:", query);

    // 根据类型获取日记
    console.log("[广场路由] 根据类型获取日记:", type);
    switch (type) {
      case "推荐":
        diaries = await Diary.find(query)
          .populate("user_id", "id nickname avatar city")
          .sort({ score: -1, created_at: -1 })
          .skip((page - 1) * pageSize)
          .limit(parseInt(pageSize));
        break;
      case "热门":
        diaries = await Diary.find(query)
          .populate("user_id", "id nickname avatar city")
          .sort({ like_count: -1, comment_count: -1, created_at: -1 })
          .skip((page - 1) * pageSize)
          .limit(parseInt(pageSize));
        break;
      case "最新":
        diaries = await Diary.find(query)
          .populate("user_id", "id nickname avatar city")
          .sort({ created_at: -1 })
          .skip((page - 1) * pageSize)
          .limit(parseInt(pageSize));
        break;
      case "关注":
        // 未登录用户返回空数组
        if (!user) {
          ctx.body = {
            success: true,
            data: [],
            pagination: {
              page: parseInt(page),
              pageSize: parseInt(pageSize),
              total: 0,
            },
            message: "请先登录查看关注内容",
          };
          return;
        }

        // 获取用户关注的用户ID列表
        const follows = await Follow.find({ follower_id: user._id });
        const followingIds = follows.map((follow) => follow.following_id);

        if (followingIds.length === 0) {
          ctx.body = {
            success: true,
            data: [],
            pagination: {
              page: parseInt(page),
              pageSize: parseInt(pageSize),
              total: 0,
            },
          };
          return;
        }

        diaries = await Diary.find({
          user_id: { $in: followingIds },
          ...query,
        })
          .populate("user_id", "id nickname avatar city")
          .sort({ created_at: -1 })
          .skip((page - 1) * pageSize)
          .limit(parseInt(pageSize));
        break;
      case "同城":
        // 未登录用户返回空数组
        if (!user) {
          ctx.body = {
            success: true,
            data: [],
            pagination: {
              page: parseInt(page),
              pageSize: parseInt(pageSize),
              total: 0,
            },
            message: "请先登录查看同城内容",
          };
          return;
        }

        // 获取用户所在城市
        const currentUser = await User.findById(user._id);
        if (!currentUser.city) {
          ctx.body = {
            success: true,
            data: [],
            pagination: {
              page: parseInt(page),
              pageSize: parseInt(pageSize),
              total: 0,
            },
            message: "请先设置您的城市信息",
          };
          return;
        }

        // 获取同城用户的日记
        const allDiaries = await Diary.find(query)
          .populate("user_id", "id nickname avatar city")
          .sort({ created_at: -1 });

        // 过滤出同城日记
        const localDiaries = allDiaries.filter(
          (diary) =>
            diary.user_id.city && diary.user_id.city === currentUser.city,
        );

        // 分页
        diaries = localDiaries.slice((page - 1) * pageSize, page * pageSize);
        break;
      default:
        diaries = await Diary.find(query)
          .populate("user_id", "id nickname avatar city")
          .sort({ score: -1, created_at: -1 })
          .skip((page - 1) * pageSize)
          .limit(parseInt(pageSize));
    }

    console.log("[广场路由] 找到日记数量:", diaries.length);

    // 处理返回数据，添加是否点赞和是否关注
    const diaryList = await Promise.all(
      diaries.map(async (diary) => {
        let isLiked = false;
        let isFollowed = false;

        // 只有登录用户才检查点赞和关注状态
        if (user) {
          // 检查是否点赞
          isLiked = await Like.exists({
            user_id: user._id,
            diary_id: diary._id,
          });
          // 检查是否关注作者
          isFollowed = await Follow.exists({
            follower_id: user._id,
            following_id: diary.user_id._id,
          });
        }

        return {
          id: diary._id,
          user: {
            id: diary.user_id._id,
            nickname: diary.user_id.nickname,
            avatar: diary.user_id.avatar,
          },
          title: diary.title,
          content: diary.content,
          cover: diary.cover,
          images: diary.images,
          tags: diary.tags,
          location: diary.location,
          created_at: diary.created_at,
          stats: {
            like_count: diary.like_count,
            comment_count: diary.comment_count,
            share_count: diary.share_count,
          },
          is_liked: isLiked,
          is_followed: isFollowed,
        };
      }),
    );

    // 计算总数
    let total = 0;
    if (type === "关注") {
      if (user) {
        const follows = await Follow.find({ follower_id: user._id });
        const followingIds = follows.map((follow) => follow.following_id);
        if (followingIds.length > 0) {
          total = await Diary.countDocuments({
            user_id: { $in: followingIds },
            ...query,
          });
        }
      }
    } else if (type === "同城") {
      if (user) {
        const currentUser = await User.findById(user._id);
        if (currentUser.city) {
          const allDiaries = await Diary.find(query).populate(
            "user_id",
            "city",
          );
          total = allDiaries.filter(
            (diary) =>
              diary.user_id.city && diary.user_id.city === currentUser.city,
          ).length;
        }
      }
    } else {
      total = await Diary.countDocuments(query);
    }

    console.log("[获取广场日记成功]", `共 ${total} 篇日记`);
    ctx.body = {
      success: true,
      data: diaryList,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: total,
      },
    };
  } catch (error) {
    console.error("[获取广场日记错误]:", error);
    console.error("[错误堆栈]:", error.stack);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取广场日记失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/diaries/{id}:
 *   get:
 *     summary: 获取日记详情
 *     description: 获取指定日记的详细信息
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
 *       404:
 *         description: 日记不存在
 */
router.get("/diaries/:id", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { id } = ctx.params;
    console.log("[获取日记详情请求]", `用户: ${user.username}, 日记ID: ${id}`);

    const diary = await Diary.findOne({
      _id: id,
      user_id: user._id,
      status: 1,
    });
    if (!diary) {
      console.log("[获取日记详情失败]", "日记不存在");
      ctx.status = 404;
      ctx.body = { success: false, message: "日记不存在" };
      return;
    }

    // 增加阅读量
    diary.view_count += 1;
    await diary.save();

    console.log("[获取日记详情成功]", `标题: ${diary.title}`);
    ctx.body = {
      success: true,
      data: diary,
    };
  } catch (error) {
    console.error("[获取日记详情错误]:", error);
    console.error("[错误堆栈]:", error.stack);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取日记详情失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/diaries/{id}:
 *   put:
 *     summary: 更新日记
 *     description: 更新指定日记的信息
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
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               diary_date:
 *                 type: string
 *                 format: date
 *               weather:
 *                 type: string
 *               mood:
 *                 type: string
 *               signature:
 *                 type: string
 *               location:
 *                 type: string
 *               location_coords:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *               cover:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               is_public:
 *                 type: boolean
 *               is_top:
 *                 type: boolean
 *               event_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       404:
 *         description: 日记不存在
 */
router.put("/diaries/:id", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { id } = ctx.params;
    console.log("[更新日记请求]", `用户: ${user.username}, 日记ID: ${id}`);
    console.log("[更新日记参数]", ctx.request.body);

    const diary = await Diary.findOne({
      _id: id,
      user_id: user._id,
      status: 1,
    });
    if (!diary) {
      console.log("[更新日记失败]", "日记不存在");
      ctx.status = 404;
      ctx.body = { success: false, message: "日记不存在" };
      return;
    }

    // 更新日记信息
    const updateData = ctx.request.body;
    Object.assign(diary, updateData);

    await diary.save();

    console.log("[更新日记成功]", `标题: ${diary.title}`);
    ctx.body = {
      success: true,
      message: "日记更新成功",
      data: diary,
    };
  } catch (error) {
    console.error("[更新日记错误]:", error);
    console.error("[错误堆栈]:", error.stack);
    ctx.status = 500;
    ctx.body = { success: false, message: "更新日记失败：" + error.message };
  }
});

/**
 * @swagger
 * /api/diaries/{id}:
 *   delete:
 *     summary: 删除日记
 *     description: 软删除指定日记
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
 *       404:
 *         description: 日记不存在
 */
router.delete("/diaries/:id", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { id } = ctx.params;
    console.log("[删除日记请求]", `用户: ${user.username}, 日记ID: ${id}`);

    const diary = await Diary.findOne({
      _id: id,
      user_id: user._id,
      status: 1,
    });
    if (!diary) {
      console.log("[删除日记失败]", "日记不存在");
      ctx.status = 404;
      ctx.body = { success: false, message: "日记不存在" };
      return;
    }

    // 软删除
    diary.status = 0;
    await diary.save();

    console.log("[删除日记成功]", `标题: ${diary.title}`);
    ctx.body = {
      success: true,
      message: "日记删除成功",
    };
  } catch (error) {
    console.error("[删除日记错误]:", error);
    console.error("[错误堆栈]:", error.stack);
    ctx.status = 500;
    ctx.body = { success: false, message: "删除日记失败：" + error.message };
  }
});

// ==================== 管理端路由 ====================

/**
 * @swagger
 * /api/admin/diaries:
 *   get:
 *     summary: 获取所有日记
 *     description: 获取所有用户的日记列表（仅管理员可用）
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: is_public
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
adminRouter.get(
  "/diaries",
  auth,
  role(["admin", "superadmin"]),
  async (ctx) => {
    try {
      const adminUser = ctx.state.user;
      console.log("[管理端获取日记列表请求]", `管理员: ${adminUser.username}`);
      const { page = 1, per_page = 10, user_id, is_public } = ctx.query;

      const query = {
        status: 1,
      };

      if (user_id) {
        query.user_id = user_id;
      }

      if (is_public !== undefined) {
        query.is_public = is_public === "true";
      }

      const total = await Diary.countDocuments(query);
      const diaries = await Diary.find(query)
        .populate("user_id", "username email")
        .sort({ is_top: -1, diary_date: -1, updatedAt: -1 })
        .skip((page - 1) * per_page)
        .limit(parseInt(per_page));

      console.log("[管理端获取日记列表成功]", `共 ${total} 篇日记`);
      ctx.body = {
        success: true,
        data: diaries,
        pagination: {
          total,
          page: parseInt(page),
          per_page: parseInt(per_page),
          total_pages: Math.ceil(total / per_page),
        },
      };
    } catch (error) {
      console.error("[管理端获取日记列表错误]:", error);
      console.error("[错误堆栈]:", error.stack);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "获取日记列表失败：" + error.message,
      };
    }
  },
);

/**
 * @swagger
 * /api/admin/diaries/{id}:
 *   get:
 *     summary: 获取日记详情
 *     description: 获取指定日记的详细信息（仅管理员可用）
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
 *         description: 日记不存在
 */
adminRouter.get(
  "/diaries/:id",
  auth,
  role(["admin", "superadmin"]),
  async (ctx) => {
    try {
      const adminUser = ctx.state.user;
      const { id } = ctx.params;
      console.log(
        "[管理端获取日记详情请求]",
        `管理员: ${adminUser.username}, 日记ID: ${id}`,
      );

      const diary = await Diary.findOne({ _id: id, status: 1 }).populate(
        "user_id",
        "username email",
      );
      if (!diary) {
        console.log("[管理端获取日记详情失败]", "日记不存在");
        ctx.status = 404;
        ctx.body = { success: false, message: "日记不存在" };
        return;
      }

      console.log("[管理端获取日记详情成功]", `标题: ${diary.title}`);
      ctx.body = {
        success: true,
        data: diary,
      };
    } catch (error) {
      console.error("[管理端获取日记详情错误]:", error);
      console.error("[错误堆栈]:", error.stack);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "获取日记详情失败：" + error.message,
      };
    }
  },
);

/**
 * @swagger
 * /api/admin/diaries/{id}:
 *   delete:
 *     summary: 删除日记
 *     description: 软删除指定日记（仅管理员可用）
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
 *         description: 日记不存在
 */
adminRouter.delete(
  "/diaries/:id",
  auth,
  role(["admin", "superadmin"]),
  async (ctx) => {
    try {
      const adminUser = ctx.state.user;
      const { id } = ctx.params;
      console.log(
        "[管理端删除日记请求]",
        `管理员: ${adminUser.username}, 日记ID: ${id}`,
      );

      const diary = await Diary.findOne({ _id: id, status: 1 });
      if (!diary) {
        console.log("[管理端删除日记失败]", "日记不存在");
        ctx.status = 404;
        ctx.body = { success: false, message: "日记不存在" };
        return;
      }

      // 软删除
      diary.status = 0;
      await diary.save();

      console.log("[管理端删除日记成功]", `标题: ${diary.title}`);
      ctx.body = {
        success: true,
        message: "日记删除成功",
      };
    } catch (error) {
      console.error("[管理端删除日记错误]:", error);
      console.error("[错误堆栈]:", error.stack);
      ctx.status = 500;
      ctx.body = { success: false, message: "删除日记失败：" + error.message };
    }
  },
);

// 注册路由前缀
router.prefix("/api");
adminRouter.prefix("/api/admin");

module.exports = {
  router,
  adminRouter,
};
