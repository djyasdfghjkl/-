const mongoose = require("mongoose");
const Router = require("koa-router");
const router = new Router();
const adminRouter = new Router();
const User = require("../models/User");
const RechargeRecord = require("../models/RechargeRecord");
const auth = require("../middleware/auth");
const { role } = require("../middleware/role");
const { formatDateTime, addDays } = require("../utils/dateUtils");

/**
 * @swagger
 * /api/recharge/vip:
 *   post:
 *     summary: 充值VIP
 *     description: 为当前用户充值VIP会员
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - duration
 *             properties:
 *               duration:
 *                 type: number
 *                 description: 充值天数
 *     responses:
 *       200:
 *         description: 充值成功
 *       401:
 *         description: 未认证
 *       400:
 *         description: 请求参数错误
 */
router.post("/api/recharge/vip", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { duration } = ctx.request.body;

    if (!duration || duration <= 0) {
      ctx.status = 400;
      ctx.body = { success: false, message: "充值天数必须大于0" };
      return;
    }

    const now = new Date();
    let expireDate = now;

    // 如果已有VIP，在现有到期时间基础上增加天数
    if (user.vipExpireDate && user.vipExpireDate > now) {
      expireDate = new Date(user.vipExpireDate);
    }

    expireDate = addDays(expireDate, duration);

    // 只有非超级管理员才更新角色
    if (user.role !== "superadmin") {
      user.role = "vip";
    }
    user.vipExpireDate = expireDate;
    await user.save();

    // 记录充值记录
    const rechargeRecord = new RechargeRecord({
      userId: user._id,
      amount: 0, // 实际项目中可以设置价格
      type: "vip",
      duration: duration,
      expireDate: expireDate,
      status: "success",
    });
    await rechargeRecord.save();

    ctx.body = {
      success: true,
      message: "VIP充值成功",
      data: {
        vipExpireDate: formatDateTime(expireDate),
      },
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: "VIP充值失败：" + error.message };
  }
});

/**
 * @swagger
 * /api/recharge/svip:
 *   post:
 *     summary: 充值SVIP
 *     description: 为当前用户充值SVIP会员
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - duration
 *             properties:
 *               duration:
 *                 type: number
 *                 description: 充值天数
 *     responses:
 *       200:
 *         description: 充值成功
 *       401:
 *         description: 未认证
 *       400:
 *         description: 请求参数错误
 */
router.post("/api/recharge/svip", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { duration } = ctx.request.body;

    if (!duration || duration <= 0) {
      ctx.status = 400;
      ctx.body = { success: false, message: "充值天数必须大于0" };
      return;
    }

    const now = new Date();
    let expireDate = now;

    // 如果已有SVIP，在现有到期时间基础上增加天数
    if (user.svipExpireDate && user.svipExpireDate > now) {
      expireDate = new Date(user.svipExpireDate);
    }

    expireDate = addDays(expireDate, duration);

    // 只有非超级管理员才更新角色
    if (user.role !== "superadmin") {
      user.role = "svip";
    }
    user.svipExpireDate = expireDate;
    await user.save();

    // 记录充值记录
    const rechargeRecord = new RechargeRecord({
      userId: user._id,
      amount: 0, // 实际项目中可以设置价格
      type: "svip",
      duration: duration,
      expireDate: expireDate,
      status: "success",
    });
    await rechargeRecord.save();

    ctx.body = {
      success: true,
      message: "SVIP充值成功",
      data: {
        svipExpireDate: formatDateTime(expireDate),
      },
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: "SVIP充值失败：" + error.message };
  }
});

/**
 * @swagger
 * /api/recharge/balance:
 *   post:
 *     summary: 充值余额
 *     description: 为当前用户充值账户余额
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: 充值金额
 *     responses:
 *       200:
 *         description: 充值成功
 *       401:
 *         description: 未认证
 *       400:
 *         description: 请求参数错误
 */
router.post("/api/recharge/balance", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { amount } = ctx.request.body;

    if (!amount || amount <= 0) {
      ctx.status = 400;
      ctx.body = { success: false, message: "充值金额必须大于0" };
      return;
    }

    user.balance += amount;
    await user.save();

    // 记录充值记录
    const rechargeRecord = new RechargeRecord({
      userId: user._id,
      amount: amount,
      type: "balance",
      status: "success",
    });
    await rechargeRecord.save();

    ctx.body = {
      success: true,
      message: "余额充值成功",
      data: {
        balance: user.balance,
      },
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: "余额充值失败：" + error.message };
  }
});

/**
 * @swagger
 * /api/recharge/records:
 *   get:
 *     summary: 获取充值记录
 *     description: 获取当前用户的充值记录
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get("/api/recharge/records", auth, async (ctx) => {
  try {
    const user = ctx.state.user;

    const records = await RechargeRecord.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    ctx.body = {
      success: true,
      data: records,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取充值记录失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/admin/recharge/records:
 *   get:
 *     summary: 获取所有用户充值记录
 *     description: 获取所有用户的充值记录（仅管理员可用）
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: 用户ID（可选）
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
adminRouter.get(
  "/recharge/records",
  auth,
  role(["admin", "superadmin"]),
  async (ctx) => {
    try {
      const { userId } = ctx.query;
      const query = {};

      if (userId) {
        try {
          query.userId = mongoose.Types.ObjectId(userId);
        } catch (e) {
          ctx.status = 400;
          ctx.body = {
            success: false,
            message: "无效的用户ID格式",
          };
          return;
        }
      }

      const records = await RechargeRecord.find(query)
        .populate("userId", "username email")
        .sort({ createdAt: -1 })
        .limit(50);

      ctx.body = {
        success: true,
        message: "充值记录获取成功",
        data: records,
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "获取充值记录失败：" + error.message,
      };
    }
  },
);

// 注册路由前缀
router.prefix("/api");
adminRouter.prefix("/api/admin");

module.exports = {
  router,
  adminRouter
};
