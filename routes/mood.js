const Router = require("koa-router");
const router = new Router();
const Mood = require("../models/Mood");
const UserMoodUsage = require("../models/UserMoodUsage");
const auth = require("../middleware/auth");
const { isConnected } = require("../config/mongodb");
const { getError } = require("../config/errorConfig");

/**
 * @swagger
 * /api/moods:
 *   get:
 *     summary: 获取心情列表
 *     description: 获取心情列表，支持分类、类型筛选和关键词搜索
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: number
 *         description: 分类ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [system, custom, all]
 *         description: 心情类型
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: number
 *           default: 20
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get("/moods", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { category_id, type = "all", keyword, page = 1, page_size = 20 } = ctx.query;

    // 检查MongoDB连接状态
    if (!isConnected()) {
      ctx.status = 503;
      ctx.body = getError("database.connectionFailed");
      return;
    }

    const query = {
      status: 1
    };

    // 分类筛选
    if (category_id) {
      query.category_id = category_id;
    }

    // 类型筛选
    if (type !== "all") {
      if (type === "system") {
        query.is_system = 1;
      } else if (type === "custom") {
        query.is_system = 0;
        query.user_id = user._id;
      }
    } else {
      // 系统心情 + 用户自定义心情
      query.$or = [
        { is_system: 1 },
        { is_system: 0, user_id: user._id }
      ];
    }

    // 关键词搜索
    if (keyword) {
      query.name = { $regex: keyword, $options: 'i' };
    }

    // 计算总数
    const total = await Mood.countDocuments(query);

    // 获取心情列表
    const moods = await Mood.find(query)
      .sort({ is_system: -1, sort_order: -1, use_count: -1 })
      .skip((page - 1) * page_size)
      .limit(parseInt(page_size));

    // 获取用户使用次数
    const moodIds = moods.map(mood => mood._id);
    const userUsage = await UserMoodUsage.aggregate([
      { $match: { user_id: user._id, mood_id: { $in: moodIds } } },
      { $group: { _id: "$mood_id", count: { $sum: 1 } } }
    ]);

    const usageMap = {};
    userUsage.forEach(item => {
      usageMap[item._id.toString()] = item.count;
    });

    // 格式化返回数据
    const items = moods.map(mood => ({
      id: mood.uuid,
      name: mood.name,
      description: mood.description,
      icon_type: mood.icon_type,
      icon_value: mood.icon_value,
      is_system: mood.is_system === 1,
      use_count: mood.use_count,
      user_use_count: usageMap[mood._id.toString()] || 0
    }));

    ctx.body = {
      success: true,
      data: {
        total,
        items
      }
    };
  } catch (error) {
    console.error("[获取心情列表错误]:", error);
    ctx.status = 500;
    ctx.body = getError("common.serverError");
  }
});

/**
 * @swagger
 * /api/moods/{uuid}:
 *   get:
 *     summary: 获取心情详情
 *     description: 根据UUID获取心情详情
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         schema:
 *           type: string
 *         required: true
 *         description: 心情UUID
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       404:
 *         description: 心情不存在
 */
router.get("/moods/:uuid", auth, async (ctx) => {
  try {
    const { uuid } = ctx.params;

    // 检查MongoDB连接状态
    if (!isConnected()) {
      ctx.status = 503;
      ctx.body = getError("database.connectionFailed");
      return;
    }

    const mood = await Mood.findOne({ uuid, status: 1 });
    if (!mood) {
      ctx.status = 404;
      ctx.body = { success: false, message: "心情不存在" };
      return;
    }

    ctx.body = {
      success: true,
      data: {
        id: mood.uuid,
        name: mood.name,
        description: mood.description,
        icon_type: mood.icon_type,
        icon_value: mood.icon_value,
        is_system: mood.is_system === 1,
        use_count: mood.use_count
      }
    };
  } catch (error) {
    console.error("[获取心情详情错误]:", error);
    ctx.status = 500;
    ctx.body = getError("common.serverError");
  }
});

/**
 * @swagger
 * /api/moods/recommend:
 *   get:
 *     summary: 获取推荐心情
 *     description: 获取基于时间和使用频率的推荐心情
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get("/moods/recommend", auth, async (ctx) => {
  try {
    const user = ctx.state.user;

    // 检查MongoDB连接状态
    if (!isConnected()) {
      ctx.status = 503;
      ctx.body = getError("database.connectionFailed");
      return;
    }

    // 获取当前时间
    const hour = new Date().getHours();
    let recommendedMoods = [];

    // 根据时间推荐心情
    if (hour >= 6 && hour < 12) {
      // 早上
      recommendedMoods = await Mood.find({ 
        status: 1,
        $or: [
          { is_system: 1, name: { $in: ["开心", "活力", "平静"] } },
          { is_system: 0, user_id: user._id }
        ]
      }).limit(5);
    } else if (hour >= 12 && hour < 18) {
      // 下午
      recommendedMoods = await Mood.find({ 
        status: 1,
        $or: [
          { is_system: 1, name: { $in: ["充实", "专注", "愉快"] } },
          { is_system: 0, user_id: user._id }
        ]
      }).limit(5);
    } else {
      // 晚上
      recommendedMoods = await Mood.find({ 
        status: 1,
        $or: [
          { is_system: 1, name: { $in: ["放松", "满足", "平静"] } },
          { is_system: 0, user_id: user._id }
        ]
      }).limit(5);
    }

    // 格式化返回数据
    const items = recommendedMoods.map(mood => ({
      id: mood.uuid,
      name: mood.name,
      icon_type: mood.icon_type,
      icon_value: mood.icon_value,
      is_system: mood.is_system === 1
    }));

    ctx.body = {
      success: true,
      data: items
    };
  } catch (error) {
    console.error("[获取推荐心情错误]:", error);
    ctx.status = 500;
    ctx.body = getError("common.serverError");
  }
});

/**
 * @swagger
 * /api/user/moods:
 *   post:
 *     summary: 创建自定义心情
 *     description: 创建用户自定义心情
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - icon_type
 *               - icon_value
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon_type:
 *                 type: number
 *                 enum: [1, 2, 3]
 *               icon_value:
 *                 type: string
 *     responses:
 *       201:
 *         description: 创建成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 */
router.post("/user/moods", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { name, description, icon_type, icon_value } = ctx.request.body;

    // 检查MongoDB连接状态
    if (!isConnected()) {
      ctx.status = 503;
      ctx.body = getError("database.connectionFailed");
      return;
    }

    // 验证参数
    if (!name || !icon_type || !icon_value) {
      ctx.status = 400;
      ctx.body = getError("common.badRequest");
      return;
    }

    // 检查同名心情
    const existingMood = await Mood.findOne({ 
      name, 
      user_id: user._id, 
      is_system: 0, 
      status: 1 
    });
    if (existingMood) {
      ctx.status = 400;
      ctx.body = { success: false, message: "该心情名称已存在" };
      return;
    }

    // 创建心情
    const mood = new Mood({
      name,
      description: description || "",
      icon_type,
      icon_value,
      is_system: 0,
      user_id: user._id
    });

    await mood.save();

    ctx.status = 201;
    ctx.body = {
      success: true,
      message: "自定义心情创建成功",
      data: {
        id: mood.uuid,
        name: mood.name,
        description: mood.description,
        icon_type: mood.icon_type,
        icon_value: mood.icon_value
      }
    };
  } catch (error) {
    console.error("[创建自定义心情错误]:", error);
    ctx.status = 500;
    ctx.body = getError("common.serverError");
  }
});

/**
 * @swagger
 * /api/user/moods/{uuid}:
 *   put:
 *     summary: 修改自定义心情
 *     description: 修改用户自定义心情
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         schema:
 *           type: string
 *         required: true
 *         description: 心情UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon_type:
 *                 type: number
 *                 enum: [1, 2, 3]
 *               icon_value:
 *                 type: string
 *     responses:
 *       200:
 *         description: 修改成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       404:
 *         description: 心情不存在
 */
router.put("/user/moods/:uuid", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { uuid } = ctx.params;
    const { name, description, icon_type, icon_value } = ctx.request.body;

    // 检查MongoDB连接状态
    if (!isConnected()) {
      ctx.status = 503;
      ctx.body = getError("database.connectionFailed");
      return;
    }

    // 查找心情
    const mood = await Mood.findOne({ 
      uuid, 
      user_id: user._id, 
      is_system: 0, 
      status: 1 
    });
    if (!mood) {
      ctx.status = 404;
      ctx.body = { success: false, message: "心情不存在" };
      return;
    }

    // 检查同名心情
    if (name && name !== mood.name) {
      const existingMood = await Mood.findOne({ 
        name, 
        user_id: user._id, 
        is_system: 0, 
        status: 1,
        _id: { $ne: mood._id }
      });
      if (existingMood) {
        ctx.status = 400;
        ctx.body = { success: false, message: "该心情名称已存在" };
        return;
      }
    }

    // 更新心情
    if (name) mood.name = name;
    if (description !== undefined) mood.description = description;
    if (icon_type) mood.icon_type = icon_type;
    if (icon_value) mood.icon_value = icon_value;

    await mood.save();

    ctx.body = {
      success: true,
      message: "心情修改成功",
      data: {
        id: mood.uuid,
        name: mood.name,
        description: mood.description,
        icon_type: mood.icon_type,
        icon_value: mood.icon_value
      }
    };
  } catch (error) {
    console.error("[修改自定义心情错误]:", error);
    ctx.status = 500;
    ctx.body = getError("common.serverError");
  }
});

/**
 * @swagger
 * /api/user/moods/{uuid}:
 *   delete:
 *     summary: 删除自定义心情
 *     description: 软删除用户自定义心情
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         schema:
 *           type: string
 *         required: true
 *         description: 心情UUID
 *     responses:
 *       200:
 *         description: 删除成功
 *       401:
 *         description: 未认证
 *       404:
 *         description: 心情不存在
 */
router.delete("/user/moods/:uuid", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { uuid } = ctx.params;

    // 检查MongoDB连接状态
    if (!isConnected()) {
      ctx.status = 503;
      ctx.body = getError("database.connectionFailed");
      return;
    }

    // 查找心情
    const mood = await Mood.findOne({ 
      uuid, 
      user_id: user._id, 
      is_system: 0, 
      status: 1 
    });
    if (!mood) {
      ctx.status = 404;
      ctx.body = { success: false, message: "心情不存在" };
      return;
    }

    // 软删除
    mood.status = 0;
    await mood.save();

    ctx.body = {
      success: true,
      message: "心情删除成功"
    };
  } catch (error) {
    console.error("[删除自定义心情错误]:", error);
    ctx.status = 500;
    ctx.body = getError("common.serverError");
  }
});

/**
 * @swagger
 * /api/user/moods/custom:
 *   get:
 *     summary: 获取用户自定义心情列表
 *     description: 获取当前用户的自定义心情列表
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get("/user/moods/custom", auth, async (ctx) => {
  try {
    const user = ctx.state.user;

    // 检查MongoDB连接状态
    if (!isConnected()) {
      ctx.status = 503;
      ctx.body = getError("database.connectionFailed");
      return;
    }

    const moods = await Mood.find({ 
      user_id: user._id, 
      is_system: 0, 
      status: 1 
    }).sort({ created_at: -1 });

    // 格式化返回数据
    const items = moods.map(mood => ({
      id: mood.uuid,
      name: mood.name,
      description: mood.description,
      icon_type: mood.icon_type,
      icon_value: mood.icon_value,
      created_at: mood.created_at
    }));

    ctx.body = {
      success: true,
      data: items
    };
  } catch (error) {
    console.error("[获取自定义心情列表错误]:", error);
    ctx.status = 500;
    ctx.body = getError("common.serverError");
  }
});

/**
 * @swagger
 * /api/user/moods/frequent:
 *   get:
 *     summary: 获取用户常用心情
 *     description: 获取当前用户使用频率最高的心情
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 5
 *         description: 返回数量限制
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get("/user/moods/frequent", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { limit = 5 } = ctx.query;

    // 检查MongoDB连接状态
    if (!isConnected()) {
      ctx.status = 503;
      ctx.body = getError("database.connectionFailed");
      return;
    }

    // 获取用户使用频率最高的心情
    const usageStats = await UserMoodUsage.aggregate([
      { $match: { user_id: user._id } },
      { $group: { _id: "$mood_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    const moodIds = usageStats.map(item => item._id);
    const moods = await Mood.find({ 
      _id: { $in: moodIds },
      status: 1
    });

    // 构建心情映射
    const moodMap = {};
    moods.forEach(mood => {
      moodMap[mood._id.toString()] = mood;
    });

    // 按使用频率排序
    const items = usageStats.map(item => {
      const mood = moodMap[item._id.toString()];
      if (mood) {
        return {
          id: mood.uuid,
          name: mood.name,
          icon_type: mood.icon_type,
          icon_value: mood.icon_value,
          is_system: mood.is_system === 1,
          use_count: item.count
        };
      }
      return null;
    }).filter(Boolean);

    ctx.body = {
      success: true,
      data: items
    };
  } catch (error) {
    console.error("[获取常用心情错误]:", error);
    ctx.status = 500;
    ctx.body = getError("common.serverError");
  }
});

/**
 * @swagger
 * /api/moods/stats:
 *   get:
 *     summary: 获取心情使用统计
 *     description: 获取心情使用统计信息
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get("/moods/stats", auth, async (ctx) => {
  try {
    const user = ctx.state.user;

    // 检查MongoDB连接状态
    if (!isConnected()) {
      ctx.status = 503;
      ctx.body = getError("database.connectionFailed");
      return;
    }

    // 获取全局热门心情
    const globalHotMoods = await Mood.find({ 
      status: 1,
      is_system: 1
    }).sort({ use_count: -1 }).limit(5);

    // 获取用户常用心情
    const userUsage = await UserMoodUsage.aggregate([
      { $match: { user_id: user._id } },
      { $group: { _id: "$mood_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const userMoodIds = userUsage.map(item => item._id);
    const userMoods = await Mood.find({ _id: { $in: userMoodIds }, status: 1 });

    const userMoodMap = {};
    userMoods.forEach(mood => {
      userMoodMap[mood._id.toString()] = mood;
    });

    const userFrequentMoods = userUsage.map(item => {
      const mood = userMoodMap[item._id.toString()];
      if (mood) {
        return {
          id: mood.uuid,
          name: mood.name,
          icon_type: mood.icon_type,
          icon_value: mood.icon_value,
          use_count: item.count
        };
      }
      return null;
    }).filter(Boolean);

    ctx.body = {
      success: true,
      data: {
        global_hot: globalHotMoods.map(mood => ({
          id: mood.uuid,
          name: mood.name,
          icon_type: mood.icon_type,
          icon_value: mood.icon_value,
          use_count: mood.use_count
        })),
        user_frequent: userFrequentMoods
      }
    };
  } catch (error) {
    console.error("[获取心情统计错误]:", error);
    ctx.status = 500;
    ctx.body = getError("common.serverError");
  }
});

// 注册路由前缀
router.prefix("/api");

module.exports = router;
