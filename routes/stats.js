const Router = require("koa-router");
const router = new Router();
const UserSession = require("../models/UserSession");
const UserStatsDaily = require("../models/UserStatsDaily");
const AdClick = require("../models/AdClick");
const auth = require("../middleware/auth");
const { getError } = require("../config/errorConfig");
const { v4: uuidv4 } = require("uuid");

/**
 * @swagger
 * /api/stats/session/start:
 *   post:
 *     summary: 开始用户会话
 *     description: 开始用户会话并返回 session_id
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enter_page:
 *                 type: string
 *                 description: 进入页面路径
 *     responses:
 *       200:
 *         description: 会话开始成功
 *       401:
 *         description: 未认证
 *       500:
 *         description: 服务器错误
 */
router.post("/stats/session/start", auth, async (ctx) => {
  try {
    console.log("[会话开始请求]", ctx.request.body);
    const { enter_page = "" } = ctx.request.body;
    
    // 生成会话ID
    const session_id = uuidv4();
    
    // 获取用户IP和用户代理
    const ip = ctx.headers["x-forwarded-for"] || ctx.ip || ctx.ips[0] || "";
    const user_agent = ctx.headers["user-agent"] || "";
    
    // 创建会话记录
    const session = new UserSession({
      user_id: ctx.state.user._id,
      session_id,
      enter_time: new Date(),
      enter_page,
      ip,
      user_agent,
      last_heartbeat: new Date(),
    });
    
    await session.save();
    console.log("[会话开始成功]", `用户: ${ctx.state.user.username}, 会话ID: ${session_id}`);
    
    ctx.status = 200;
    ctx.body = {
      success: true,
      message: "会话开始成功",
      data: {
        session_id,
      },
    };
  } catch (error) {
    console.error("[会话开始错误]:", error);
    console.error("[错误堆栈]:", error.stack);
    ctx.status = 500;
    ctx.body = getError("common.serverError");
  }
});

/**
 * @swagger
 * /api/stats/session/end:
 *   post:
 *     summary: 结束用户会话
 *     description: 结束用户会话并更新会话时长
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - session_id
 *             properties:
 *               session_id:
 *                 type: string
 *                 description: 会话ID
 *     responses:
 *       200:
 *         description: 会话结束成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       500:
 *         description: 服务器错误
 */
router.post("/stats/session/end", auth, async (ctx) => {
  try {
    console.log("[会话结束请求]", ctx.request.body);
    const { session_id } = ctx.request.body;
    
    if (!session_id) {
      console.log("[会话结束失败]", "缺少session_id参数");
      ctx.status = 400;
      ctx.body = getError("common.badRequest");
      return;
    }
    
    // 查找会话
    const session = await UserSession.findOne({
      session_id,
      user_id: ctx.state.user._id,
      leave_time: null,
    });
    
    if (!session) {
      console.log("[会话结束失败]", "会话不存在或已结束");
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "会话不存在或已结束",
      };
      return;
    }
    
    // 计算会话时长
    const leave_time = new Date();
    const duration = Math.floor((leave_time - session.enter_time) / 1000);
    
    // 更新会话
    session.leave_time = leave_time;
    session.duration = duration;
    await session.save();
    
    // 更新每日统计
    await updateUserDailyStats(ctx.state.user._id, {
      duration,
      session_count: 1,
    });
    
    console.log("[会话结束成功]", `用户: ${ctx.state.user.username}, 会话ID: ${session_id}, 时长: ${duration}秒`);
    
    ctx.status = 200;
    ctx.body = {
      success: true,
      message: "会话结束成功",
      data: {
        session_id,
        duration,
      },
    };
  } catch (error) {
    console.error("[会话结束错误]:", error);
    console.error("[错误堆栈]:", error.stack);
    ctx.status = 500;
    ctx.body = getError("common.serverError");
  }
});

/**
 * @swagger
 * /api/stats/heartbeat:
 *   post:
 *     summary: 发送心跳
 *     description: 发送心跳以保持会话活跃
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - session_id
 *             properties:
 *               session_id:
 *                 type: string
 *                 description: 会话ID
 *     responses:
 *       200:
 *         description: 心跳发送成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       500:
 *         description: 服务器错误
 */
router.post("/stats/heartbeat", auth, async (ctx) => {
  try {
    console.log("[心跳请求]", ctx.request.body);
    const { session_id } = ctx.request.body;
    
    if (!session_id) {
      console.log("[心跳失败]", "缺少session_id参数");
      ctx.status = 400;
      ctx.body = getError("common.badRequest");
      return;
    }
    
    // 更新会话的最后心跳时间
    const result = await UserSession.updateOne(
      {
        session_id,
        user_id: ctx.state.user._id,
        leave_time: null,
      },
      {
        last_heartbeat: new Date(),
      }
    );
    
    if (result.nModified === 0) {
      console.log("[心跳失败]", "会话不存在或已结束");
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "会话不存在或已结束",
      };
      return;
    }
    
    console.log("[心跳成功]", `用户: ${ctx.state.user.username}, 会话ID: ${session_id}`);
    
    ctx.status = 200;
    ctx.body = {
      success: true,
      message: "心跳发送成功",
    };
  } catch (error) {
    console.error("[心跳错误]:", error);
    console.error("[错误堆栈]:", error.stack);
    ctx.status = 500;
    ctx.body = getError("common.serverError");
  }
});

/**
 * @swagger
 * /api/stats/ad/action:
 *   post:
 *     summary: 上报广告行为
 *     description: 上报用户的广告行为（请求、曝光、点击、播放完成）
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - session_id
 *               - ad_id
 *               - ad_type
 *               - action_type
 *             properties:
 *               session_id:
 *                 type: string
 *                 description: 会话ID
 *               ad_id:
 *                 type: string
 *                 description: 广告ID
 *               ad_type:
 *                 type: string
 *                 enum: [banner, video, interstitial, native]
 *                 description: 广告类型
 *               action_type:
 *                 type: string
 *                 enum: [request, exposure, click, play_complete]
 *                 description: 行为类型
 *               action_time:
 *                 type: string
 *                 format: date-time
 *                 description: 行为发生时间
 *               ext_info:
 *                 type: object
 *                 description: 扩展信息
 *     responses:
 *       200:
 *         description: 广告行为上报成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       500:
 *         description: 服务器错误
 */
router.post("/stats/ad/action", auth, async (ctx) => {
  try {
    console.log("[广告行为上报请求]", ctx.request.body);
    const {
      session_id,
      ad_id,
      ad_type,
      action_type,
      action_time,
      ext_info,
    } = ctx.request.body;
    
    if (!session_id || !ad_id || !ad_type || !action_type) {
      console.log("[广告行为上报失败]", "缺少必要参数");
      ctx.status = 400;
      ctx.body = getError("common.badRequest");
      return;
    }
    
    // 验证会话是否存在
    const session = await UserSession.findOne({
      session_id,
      user_id: ctx.state.user._id,
    });
    
    if (!session) {
      console.log("[广告行为上报失败]", "会话不存在");
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "会话不存在",
      };
      return;
    }
    
    // 获取用户IP
    const ip = ctx.headers["x-forwarded-for"] || ctx.ip || ctx.ips[0] || "";
    
    // 记录广告点击（如果是点击行为）
    if (action_type === "click") {
      const adClick = new AdClick({
        user_id: ctx.state.user._id,
        ad_id,
        ad_type,
        duration: 0,
        ip,
        user_agent: ctx.headers["user-agent"] || "",
      });
      await adClick.save();
    }
    
    // 更新每日统计
    await updateUserDailyStats(ctx.state.user._id, {
      [action_type]: 1,
    });
    
    console.log("[广告行为上报成功]", `用户: ${ctx.state.user.username}, 广告ID: ${ad_id}, 行为: ${action_type}`);
    
    ctx.status = 200;
    ctx.body = {
      success: true,
      message: "广告行为上报成功",
    };
  } catch (error) {
    console.error("[广告行为上报错误]:", error);
    console.error("[错误堆栈]:", error.stack);
    ctx.status = 500;
    ctx.body = getError("common.serverError");
  }
});

/**
 * @swagger
 * /api/stats/user:
 *   get:
 *     summary: 获取用户统计数据
 *     description: 获取用户的在线时长和广告行为统计数据
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期（YYYY-MM-DD）
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期（YYYY-MM-DD）
 *     responses:
 *       200:
 *         description: 获取统计数据成功
 *       401:
 *         description: 未认证
 *       500:
 *         description: 服务器错误
 */
router.get("/stats/user", auth, async (ctx) => {
  try {
    console.log("[获取用户统计请求]", ctx.query);
    const { start_date, end_date } = ctx.query;
    
    // 构建查询条件
    const query = {
      user_id: ctx.state.user._id,
    };
    
    if (start_date) {
      query.stat_date = {
        $gte: new Date(start_date),
      };
    }
    
    if (end_date) {
      if (!query.stat_date) {
        query.stat_date = {};
      }
      query.stat_date.$lte = new Date(end_date);
    } else {
      // 默认最近7天
      if (!query.stat_date) {
        query.stat_date = {};
      }
      query.stat_date.$gte = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }
    
    // 获取统计数据
    const stats = await UserStatsDaily.find(query)
      .sort({ stat_date: -1 })
      .select("stat_date total_duration session_count ad_request_count ad_exposure_count ad_click_count ad_play_complete_count");
    
    // 计算总统计
    const total = stats.reduce(
      (acc, item) => {
        acc.total_duration += item.total_duration;
        acc.session_count += item.session_count;
        acc.ad_request_count += item.ad_request_count;
        acc.ad_exposure_count += item.ad_exposure_count;
        acc.ad_click_count += item.ad_click_count;
        acc.ad_play_complete_count += item.ad_play_complete_count;
        return acc;
      },
      {
        total_duration: 0,
        session_count: 0,
        ad_request_count: 0,
        ad_exposure_count: 0,
        ad_click_count: 0,
        ad_play_complete_count: 0,
      }
    );
    
    // 计算平均每日时长
    const avg_duration_per_day = stats.length > 0 ? Math.round(total.total_duration / stats.length) : 0;
    
    console.log("[获取用户统计成功]", `用户: ${ctx.state.user.username}, 总在线时长: ${total.total_duration}秒`);
    
    ctx.status = 200;
    ctx.body = {
      success: true,
      message: "获取用户统计成功",
      data: {
        total,
        avg_duration_per_day,
        daily_stats: stats,
      },
    };
  } catch (error) {
    console.error("[获取用户统计错误]:", error);
    console.error("[错误堆栈]:", error.stack);
    ctx.status = 500;
    ctx.body = getError("common.serverError");
  }
});

// 辅助函数：更新用户每日统计
async function updateUserDailyStats(user_id, stats) {
  try {
    // 获取今天的日期（只保留年月日）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 查找或创建今日统计记录
    let dailyStats = await UserStatsDaily.findOne({
      user_id,
      stat_date: today,
    });
    
    if (!dailyStats) {
      dailyStats = new UserStatsDaily({
        user_id,
        stat_date: today,
      });
    }
    
    // 更新统计数据
    if (stats.duration) {
      dailyStats.total_duration += stats.duration;
    }
    if (stats.session_count) {
      dailyStats.session_count += stats.session_count;
    }
    if (stats.request) {
      dailyStats.ad_request_count += stats.request;
    }
    if (stats.exposure) {
      dailyStats.ad_exposure_count += stats.exposure;
    }
    if (stats.click) {
      dailyStats.ad_click_count += stats.click;
    }
    if (stats.play_complete) {
      dailyStats.ad_play_complete_count += stats.play_complete;
    }
    
    dailyStats.update_time = new Date();
    await dailyStats.save();
  } catch (error) {
    console.error("[更新用户每日统计错误]:", error);
  }
}

module.exports = router;
