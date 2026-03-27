const Router = require("koa-router");
const router = new Router();
const AdClick = require("../models/AdClick");
const auth = require("../middleware/auth");
const { role } = require("../middleware/role");
const { getError } = require("../config/errorConfig");

/**
 * @swagger
 * /api/ads/click:
 *   post:
 *     summary: 记录广告点击
 *     description: 记录用户点击广告的行为
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ad_id
 *             properties:
 *               ad_id:
 *                 type: string
 *                 description: 广告ID
 *               ad_type:
 *                 type: string
 *                 enum: [video, banner, interstitial]
 *                 description: 广告类型
 *               duration:
 *                 type: number
 *                 description: 观看广告的时长（秒）
 *     responses:
 *       200:
 *         description: 记录成功
 *       401:
 *         description: 未认证
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post("/ads/click", auth, async (ctx) => {
  try {
    console.log("[广告点击记录请求]", ctx.request.body);
    const { ad_id, ad_type, duration } = ctx.request.body;
    
    if (!ad_id) {
      console.log("[广告点击记录失败]", "缺少ad_id参数");
      ctx.status = 400;
      ctx.body = getError("common.badRequest");
      return;
    }
    
    // 获取用户IP和用户代理
    const ip = ctx.headers["x-forwarded-for"] || ctx.ip || ctx.ips[0] || "";
    const user_agent = ctx.headers["user-agent"] || "";
    
    // 创建广告点击记录
    const adClick = new AdClick({
      user_id: ctx.state.user._id,
      user_uuid: ctx.state.user.uuid,
      ad_id,
      ad_type: ad_type || "banner",
      duration: duration || 0,
      ip,
      user_agent,
      app_id: ctx.headers["x-app-id"] || ctx.request.body.app_id || "",
    });
    
    await adClick.save();
    console.log("[广告点击记录成功]", `用户: ${ctx.state.user.username}, 广告ID: ${ad_id}`);
    
    ctx.status = 200;
    ctx.body = {
      success: true,
      message: "广告点击记录成功",
      data: {
        id: adClick._id,
        ad_id: adClick.ad_id,
        ad_type: adClick.ad_type,
        duration: adClick.duration,
        created_at: adClick.created_at,
      },
    };
  } catch (error) {
    console.error("[广告点击记录错误]:", error);
    console.error("[错误堆栈]:", error.stack);
    ctx.status = 500;
    ctx.body = getError("common.serverError");
  }
});

/**
 * @swagger
 * /api/ads/stats:
 *   get:
 *     summary: 获取用户广告点击统计
 *     description: 获取当前用户的广告点击统计信息
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 开始日期
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 结束日期
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       500:
 *         description: 服务器错误
 */
router.get("/ads/stats", auth, async (ctx) => {
  try {
    console.log("[获取广告点击统计请求]", ctx.query);
    const { start_date, end_date } = ctx.query;
    
    // 构建查询条件
    const query = {
      user_id: ctx.state.user._id,
    };
    
    if (start_date) {
      query.created_at = {
        $gte: new Date(start_date),
      };
    }
    
    if (end_date) {
      if (!query.created_at) {
        query.created_at = {};
      }
      query.created_at.$lte = new Date(end_date);
    }
    
    // 获取统计数据
    const totalClicks = await AdClick.countDocuments(query);
    const clickStats = await AdClick.aggregate([
      { $match: query },
      { $group: {
        _id: "$ad_type",
        count: { $sum: 1 },
        total_duration: { $sum: "$duration" },
      }},
    ]);
    
    // 获取最近的广告点击记录
    const recentClicks = await AdClick.find(query)
      .sort({ created_at: -1 })
      .limit(10)
      .select("ad_id ad_type duration created_at");
    
    console.log("[获取广告点击统计成功]", `用户: ${ctx.state.user.username}, 总点击数: ${totalClicks}`);
    
    ctx.status = 200;
    ctx.body = {
      success: true,
      message: "获取广告点击统计成功",
      data: {
        total_clicks: totalClicks,
        click_stats: clickStats,
        recent_clicks: recentClicks,
      },
    };
  } catch (error) {
    console.error("[获取广告点击统计错误]:", error);
    console.error("[错误堆栈]:", error.stack);
    ctx.status = 500;
    ctx.body = getError("common.serverError");
  }
});

/**
 * @swagger
 * /api/ads/clicks:
 *   get:
 *     summary: 获取广告点击列表
 *     description: 获取用户的广告点击记录列表
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: ad_type
 *         schema:
 *           type: string
 *           enum: [video, banner, interstitial]
 *         description: 广告类型
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       500:
 *         description: 服务器错误
 */
router.get("/ads/clicks", auth, async (ctx) => {
  try {
    console.log("[获取广告点击列表请求]", ctx.query);
    const { page = 1, per_page = 20, ad_type } = ctx.query;
    
    // 构建查询条件
    const query = {
      user_id: ctx.state.user._id,
    };
    
    if (ad_type) {
      query.ad_type = ad_type;
    }
    
    // 计算分页参数
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(per_page) || 20;
    const skip = (pageNum - 1) * pageSize;
    
    // 获取数据
    const total = await AdClick.countDocuments(query);
    const clicks = await AdClick.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(pageSize)
      .select("ad_id ad_type duration ip user_agent created_at");
    
    console.log("[获取广告点击列表成功]", `用户: ${ctx.state.user.username}, 总记录数: ${total}`);
    
    ctx.status = 200;
    ctx.body = {
      success: true,
      message: "获取广告点击列表成功",
      data: {
        total,
        page: pageNum,
        per_page: pageSize,
        items: clicks,
      },
    };
  } catch (error) {
    console.error("[获取广告点击列表错误]:", error);
    console.error("[错误堆栈]:", error.stack);
    ctx.status = 500;
    ctx.body = getError("common.serverError");
  }
});

/**
 * @swagger
 * /api/admin/ads/stats: 
 *   get:
 *     summary: 获取所有用户广告统计（管理员）
 *     description: 获取所有用户的广告点击统计信息，仅管理员可用
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 开始日期
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 结束日期
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: 特定用户ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 无权限
 *       500:
 *         description: 服务器错误
 */
router.get("/admin/ads/stats", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    console.log("[获取所有用户广告统计请求]", ctx.query);
    const { start_date, end_date, user_id } = ctx.query;
    
    // 构建查询条件
    const query = {};
    
    if (user_id) {
      query.user_id = user_id;
    }
    
    if (start_date) {
      query.created_at = {
        $gte: new Date(start_date),
      };
    }
    
    if (end_date) {
      if (!query.created_at) {
        query.created_at = {};
      }
      query.created_at.$lte = new Date(end_date);
    }
    
    // 获取统计数据
    const totalClicks = await AdClick.countDocuments(query);
    const clickStats = await AdClick.aggregate([
      { $match: query },
      { $group: {
        _id: "$ad_type",
        count: { $sum: 1 },
        total_duration: { $sum: "$duration" },
      }},
    ]);
    
    // 获取用户统计
    const userStats = await AdClick.aggregate([
      { $match: query },
      { $group: {
        _id: "$user_id",
        user_uuid: { $first: "$user_uuid" },
        app_id: { $first: "$app_id" },
        count: { $sum: 1 },
        total_duration: { $sum: "$duration" },
      }},
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);
    
    // 获取最近的广告点击记录
    const recentClicks = await AdClick.find(query)
      .sort({ created_at: -1 })
      .limit(20)
      .populate("user_id", "username nickname avatar")
      .select("user_id user_uuid app_id ad_id ad_type duration ip user_agent created_at");
    
    console.log("[获取所有用户广告统计成功]", `总点击数: ${totalClicks}`);
    
    ctx.status = 200;
    ctx.body = {
      success: true,
      message: "获取所有用户广告统计成功",
      data: {
        total_clicks: totalClicks,
        click_stats: clickStats,
        user_stats: userStats,
        recent_clicks: recentClicks,
      },
    };
  } catch (error) {
    console.error("[获取所有用户广告统计错误]:", error);
    console.error("[错误堆栈]:", error.stack);
    ctx.status = 500;
    ctx.body = getError("common.serverError");
  }
});

module.exports = router;
