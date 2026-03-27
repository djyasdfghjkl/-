const Router = require("koa-router");
const router = new Router();
const auth = require("../middleware/auth");
const AdTaskConfig = require("../models/AdTaskConfig");
const UserAdWatch = require("../models/UserAdWatch");
const AdWatchDetail = require("../models/AdWatchDetail");
const UserEarnings = require("../models/UserEarnings");

/**
 * @swagger
 * /api/ad/task-info:
 *   get:
 *     summary: 获取任务信息
 *     description: 获取用户的广告任务信息，包括每日限制、已观看次数、已获得收益等
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get("/ad/task-info", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    
    // 获取广告任务配置
    const config = await AdTaskConfig.getConfig();
    
    // 获取用户当日观看记录
    const todayRecord = await UserAdWatch.getOrCreateTodayRecord(user._id);
    
    // 获取用户总收益
    const earnings = await UserEarnings.getOrCreateUserEarnings(user._id);
    
    // 计算预计收益
    const remainingCount = config.daily_limit - todayRecord.watch_count;
    const todayPotential = todayRecord.today_earned + (remainingCount * config.reward_per_ad);
    
    ctx.body = {
      success: true,
      data: {
        daily_limit: config.daily_limit,
        today_watched: todayRecord.watch_count,
        reward_per_ad: config.reward_per_ad,
        today_earned: todayRecord.today_earned,
        today_potential: todayPotential,
        total_earned: earnings.total_earned,
        available: earnings.available
      }
    };
  } catch (error) {
    console.error("[获取任务信息错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "获取任务信息失败" };
  }
});

/**
 * @swagger
 * /api/ad/watch:
 *   post:
 *     summary: 观看广告回调
 *     description: 广告播放完成后，前端回调此接口获得收益
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ad_id: 
 *                 type: string
 *                 description: 广告ID（由广告平台返回）
 *               duration: 
 *                 type: number
 *                 description: 观看时长（秒）
 *     responses:
 *       200:
 *         description: 观看成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 今日次数已达上限
 */
router.post("/ad/watch", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { ad_id, duration } = ctx.request.body;
    
    // 获取广告任务配置
    const config = await AdTaskConfig.getConfig();
    
    // 检查配置是否启用
    if (config.status === 0) {
      ctx.status = 403;
      ctx.body = { success: false, message: "广告任务暂未启用" };
      return;
    }
    
    // 获取用户当日观看记录
    const todayRecord = await UserAdWatch.getOrCreateTodayRecord(user._id);
    
    // 检查是否已达每日上限
    if (todayRecord.watch_count >= config.daily_limit) {
      ctx.status = 403;
      ctx.body = { success: false, message: "今日广告观看次数已达上限" };
      return;
    }
    
    // 计算本次收益
    const reward = config.reward_per_ad;
    
    // 更新观看记录
    todayRecord.watch_count += 1;
    todayRecord.today_earned += reward;
    await todayRecord.save();
    
    // 记录观看明细
    await AdWatchDetail.create({
      user_id: user._id,
      ad_id: ad_id,
      reward: reward,
      ip: ctx.headers["x-forwarded-for"] || ctx.ip,
      user_agent: ctx.headers["user-agent"]
    });
    
    // 更新用户总收益
    const earnings = await UserEarnings.getOrCreateUserEarnings(user._id);
    earnings.total_earned += reward;
    earnings.available += reward;
    await earnings.save();
    
    // 计算剩余次数
    const todayLeft = config.daily_limit - todayRecord.watch_count;
    
    ctx.body = {
      success: true,
      data: {
        reward: reward,
        today_earned: todayRecord.today_earned,
        today_left: todayLeft,
        total_earned: earnings.total_earned
      }
    };
  } catch (error) {
    console.error("[观看广告错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "观看广告失败" };
  }
});

/**
 * @swagger
 * /api/ad/earnings/daily:
 *   get:
 *     summary: 获取收益历史（按天）
 *     description: 按天获取用户的收益历史记录
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         type: number
 *         default: 1
 *         description: 页码
 *       - in: query
 *         name: page_size
 *         type: number
 *         default: 20
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get("/ad/earnings/daily", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const page = parseInt(ctx.query.page) || 1;
    const page_size = parseInt(ctx.query.page_size) || 20;
    
    // 计算跳过的记录数
    const skip = (page - 1) * page_size;
    
    // 查询用户的每日收益记录
    const records = await UserAdWatch.find({ user_id: user._id })
      .sort({ watch_date: -1 })
      .skip(skip)
      .limit(page_size)
      .lean();
    
    // 计算总记录数
    const total = await UserAdWatch.countDocuments({ user_id: user._id });
    
    // 格式化数据
    const items = records.map(record => ({
      date: record.watch_date.toISOString().split('T')[0],
      earned: record.today_earned,
      watch_count: record.watch_count
    }));
    
    ctx.body = {
      success: true,
      data: {
        total: total,
        items: items
      }
    };
  } catch (error) {
    console.error("[获取收益历史错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "获取收益历史失败" };
  }
});

/**
 * @swagger
 * /api/ad/earnings/detail:
 *   get:
 *     summary: 获取收益历史（明细）
 *     description: 获取用户的广告观看明细记录
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         type: number
 *         default: 1
 *         description: 页码
 *       - in: query
 *         name: page_size
 *         type: number
 *         default: 20
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get("/ad/earnings/detail", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const page = parseInt(ctx.query.page) || 1;
    const page_size = parseInt(ctx.query.page_size) || 20;
    
    // 计算跳过的记录数
    const skip = (page - 1) * page_size;
    
    // 查询用户的广告观看明细
    const details = await AdWatchDetail.find({ user_id: user._id })
      .sort({ watch_time: -1 })
      .skip(skip)
      .limit(page_size)
      .lean();
    
    // 计算总记录数
    const total = await AdWatchDetail.countDocuments({ user_id: user._id });
    
    // 格式化数据
    const items = details.map(detail => ({
      id: detail._id,
      ad_id: detail.ad_id,
      reward: detail.reward,
      watch_time: detail.watch_time.toISOString().replace('T', ' ').substring(0, 19)
    }));
    
    ctx.body = {
      success: true,
      data: {
        total: total,
        items: items
      }
    };
  } catch (error) {
    console.error("[获取收益明细错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "获取收益明细失败" };
  }
});

module.exports = router;
