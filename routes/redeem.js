const Router = require("koa-router");
const router = new Router();
const adminRouter = new Router();
const User = require("../models/User");
const RedeemCode = require("../models/RedeemCode");
const auth = require("../middleware/auth");
const { role } = require("../middleware/role");
const { formatDateTime, addDays } = require("../utils/dateUtils");
const { getError } = require("../config/errorConfig");

// 生成随机兑换码
const generateRedeemCode = (length = 12) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 避免使用易混淆的字符
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * @swagger
 * /api/admin/redeem/generate:
 *   post:
 *     summary: 生成兑换码
 *     description: 生成VIP/SVIP/余额兑换码（仅管理员可用）
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - value
 *               - count
 *               - expireDays
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [vip, svip, balance]
 *               value:
 *                 type: number
 *                 description: 兑换码价值（天数或金额）
 *               count:
 *                 type: number
 *                 description: 生成数量
 *               expireDays:
 *                 type: number
 *                 description: 兑换码有效期（天）
 *     responses:
 *       200:
 *         description: 生成成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       400:
 *         description: 请求参数错误
 */
adminRouter.post(
  "/redeem/generate",
  auth,
  role(["admin", "superadmin"]),
  async (ctx) => {
    try {
      const { type, value, count, expireDays } = ctx.request.body;

      if (!type || !value || !count || !expireDays) {
        ctx.status = 400;
        ctx.body = getError("common.badRequest");
        return;
      }

      if (count <= 0 || count > 1000) {
        ctx.status = 400;
        ctx.body = getError("common.badRequest");
        return;
      }

      const validTypes = ["vip", "svip", "balance"];
      if (!validTypes.includes(type)) {
        ctx.status = 400;
        ctx.body = getError("common.badRequest");
        return;
      }

      const codes = [];
      const expireDate = addDays(new Date(), expireDays);

      for (let i = 0; i < count; i++) {
        const code = generateRedeemCode();

        // 检查兑换码是否已存在
        const existingCode = await RedeemCode.findOne({ code });
        if (existingCode) {
          i--; // 重新生成
          continue;
        }

        const redeemCode = new RedeemCode({
          code,
          type,
          value,
          expiresAt: expireDate,
        });

        await redeemCode.save();
        codes.push(code);
      }

      ctx.body = {
        success: true,
        message: "兑换码生成成功",
        data: {
          codes,
          type,
          value,
          expiresAt: expireDate,
          count: codes.length,
        },
      };
    } catch (error) {
      console.error("生成兑换码错误:", error);
      console.error("错误堆栈:", error.stack);
      ctx.status = 500;
      ctx.body = getError("redeem.generateFailed");
    }
  },
);

/**
 * @swagger
 * /api/redeem/use:
 *   post:
 *     summary: 使用兑换码
 *     description: 用户使用兑换码获取相应权益
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: 兑换码
 *     responses:
 *       200:
 *         description: 使用成功
 *       401:
 *         description: 未认证
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 兑换码不存在或已失效
 */
router.post("/api/redeem/use", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { code } = ctx.request.body;

    if (!code) {
      ctx.status = 400;
      ctx.body = getError("common.badRequest");
      return;
    }

    // 查找兑换码
    const redeemCode = await RedeemCode.findOne({ code });

    if (!redeemCode) {
      ctx.status = 404;
      ctx.body = getError("redeem.codeNotFound");
      return;
    }

    // 检查兑换码是否已使用
    if (redeemCode.isUsed) {
      ctx.status = 400;
      ctx.body = getError("redeem.codeUsed");
      return;
    }

    // 检查兑换码是否过期
    if (new Date() > redeemCode.expiresAt) {
      ctx.status = 400;
      ctx.body = getError("redeem.codeExpired");
      return;
    }

    const now = new Date();
    let result = {};

    // 根据兑换码类型处理
    switch (redeemCode.type) {
      case "vip":
        // 处理VIP兑换
        if (!user.vipExpireDate || user.vipExpireDate < now) {
          user.vipExpireDate = now;
        }
        user.vipExpireDate = addDays(user.vipExpireDate, redeemCode.value);
        // 非超级管理员与非管理员才更新角色
        if (user.role !== "superadmin" && user.role !== "admin") {
          user.role = "vip";
        }
        result = {
          type: "vip",
          expireDate: formatDateTime(user.vipExpireDate),
        };
        break;

      case "svip":
        // 处理SVIP兑换
        if (!user.svipExpireDate || user.svipExpireDate < now) {
          user.svipExpireDate = now;
        }
        user.svipExpireDate = addDays(user.svipExpireDate, redeemCode.value);
        // 只有非超级管理员才更新角色
        if (user.role !== "superadmin") {
          user.role = "svip";
        }
        result = {
          type: "svip",
          expireDate: formatDateTime(user.svipExpireDate),
        };
        break;

      case "balance":
        // 处理余额兑换
        user.balance += redeemCode.value;
        result = { type: "balance", balance: user.balance };
        break;
    }

    // 更新用户信息
    await user.save();

    // 标记兑换码为已使用
    redeemCode.isUsed = true;
    redeemCode.usedBy = user._id;
    redeemCode.usedAt = now;
    await redeemCode.save();

    ctx.body = {
      success: true,
      message: "兑换成功",
      data: result,
    };
  } catch (error) {
    console.error("使用兑换码错误:", error);
    console.error("错误堆栈:", error.stack);
    ctx.status = 500;
    ctx.body = getError("common.serverError");
  }
});

/**
 * @swagger
 * /api/admin/redeem/codes:
 *   get:
 *     summary: 获取兑换码列表
 *     description: 获取所有兑换码列表（仅管理员可用）
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: 兑换码类型（可选）
 *       - in: query
 *         name: isUsed
 *         schema:
 *           type: boolean
 *         description: 是否已使用（可选）
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
adminRouter.get(
  "/redeem/codes",
  auth,
  role(["admin", "superadmin"]),
  async (ctx) => {
    try {
      const { type, isUsed } = ctx.query;
      const query = {};

      if (type) query.type = type;
      if (isUsed !== undefined) query.isUsed = isUsed === "true";

      const codes = await RedeemCode.find(query)
        .populate("usedBy", "username email")
        .sort({ createdAt: -1 })
        .limit(50);

      ctx.body = {
        success: true,
        data: codes,
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "获取兑换码列表失败：" + error.message,
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
