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
 *                 enum: [vip, svip, balance, transfer_percent, special_medal, points, level]
 *               value:
 *                 type: number
 *                 description: 兑换码价值（天数或金额）
 *               count:
 *                 type: number
 *                 description: 生成数量
 *               expireDays:
 *                 type: number
 *                 description: 兑换码有效期（天）
 *               description:
 *                 type: string
 *                 description: 兑换码描述/用途（可选）
 *                 maxLength: 200
 *               maxUses:
 *                 type: number
 *                 description: 最大使用人数（可选，默认1）
 *                 minimum: 1
 *               medalId:
 *                 type: string
 *                 description: 特殊勋章ID（仅special_medal类型需要）
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
      const { type, value, count, expireDays, medalId, description, maxUses } = ctx.request.body;
      const user = ctx.state.user;

      if (!type || !value || !count || !expireDays) {
        ctx.status = 400;
        ctx.body = getError("common.badRequest");
        return;
      }

      // 特殊勋章需要medalId
      if (type === "special_medal" && !medalId) {
        ctx.status = 400;
        ctx.body = getError("common.badRequest");
        return;
      }

      if (count <= 0 || count > 1000) {
        ctx.status = 400;
        ctx.body = getError("common.badRequest");
        return;
      }

      // 验证maxUses参数
      const finalMaxUses = maxUses ? Math.max(1, parseInt(maxUses)) : 1;

      const validTypes = ["vip", "svip", "balance", "transfer_percent", "special_medal", "points", "level"];
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

        const redeemCodeData = {
          code,
          type,
          value,
          expiresAt: expireDate,
          description: description || '',
          maxUses: finalMaxUses,
          currentUses: 0,
          createdBy: user._id,
          usedUsers: []
        };

        // 如果是特殊勋章类型，添加medalId
        if (type === "special_medal" && medalId) {
          redeemCodeData.medalId = medalId;
        }

        const redeemCode = new RedeemCode(redeemCodeData);

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
          description: description || '',
          maxUses: finalMaxUses,
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
router.post("/redeem/use", auth, async (ctx) => {
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

    // 检查用户是否已经使用过这个兑换码
    if (redeemCode.usedUsers && redeemCode.usedUsers.includes(user._id.toString())) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "您已经使用过这个兑换码了"
      };
      return;
    }

    // 检查兑换码是否已达到最大使用次数
    if (redeemCode.currentUses >= redeemCode.maxUses) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "这个兑换码已达到最大使用次数"
      };
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
        // 非超级管理员(4)与非管理员(3)才更新角色
        if (user.role !== 4 && user.role !== 3) {
          user.role = 1;
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
        // 只有非超级管理员(4)才更新角色
        if (user.role !== 4) {
          user.role = 2;
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

      case "transfer_percent":
        // 处理转账百分比兑换
        user.transfer_percent = Math.min(200, Math.max(0, redeemCode.value));
        result = { type: "transfer_percent", transfer_percent: user.transfer_percent };
        break;

      case "special_medal":
        // 处理特殊勋章兑换
        if (redeemCode.medalId) {
          if (!user.special_medals.includes(redeemCode.medalId.toString())) {
            user.special_medals.push(redeemCode.medalId.toString());
          }
          result = { type: "special_medal", medalId: redeemCode.medalId, special_medals: user.special_medals };
        } else {
          result = { type: "special_medal", message: "兑换成功" };
        }
        break;

      case "points":
        // 处理积分兑换
        user.points += redeemCode.value;
        result = { type: "points", points: user.points };
        break;

      case "level":
        // 处理等级兑换
        user.user_level = Math.max(user.user_level, redeemCode.value);
        result = { type: "level", user_level: user.user_level };
        break;
    }

    // 更新用户信息
    await user.save();

    // 更新兑换码使用信息
    redeemCode.currentUses = (redeemCode.currentUses || 0) + 1;
    
    // 记录使用用户
    if (!redeemCode.usedUsers) {
      redeemCode.usedUsers = [];
    }
    if (!redeemCode.usedUsers.includes(user._id.toString())) {
      redeemCode.usedUsers.push(user._id.toString());
    }
    
    // 如果是单次使用的兑换码，标记为已使用
    if (redeemCode.maxUses === 1) {
      redeemCode.isUsed = true;
      redeemCode.usedBy = user._id;
      redeemCode.usedAt = now;
    }
    
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
 *         description: 是否已使用（可选，仅适用于单次使用的兑换码）
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
      const { type, isUsed, page = 1, page_size = 50 } = ctx.query;
      const query = {};

      if (type) query.type = type;
      if (isUsed !== undefined) query.isUsed = isUsed === "true";

      const typeLabels = {
        vip: "VIP会员",
        svip: "SVIP会员",
        balance: "余额",
        transfer_percent: "转账比例",
        special_medal: "特殊勋章",
        points: "积分",
        level: "等级",
      };

      const total = await RedeemCode.countDocuments(query);
      const codes = await RedeemCode.find(query)
        .populate("usedBy", "username nickname email")
        .populate("createdBy", "username nickname email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * page_size)
        .limit(parseInt(page_size));

      const now = new Date();
      const items = codes.map((c) => ({
        id: c._id,
        code: c.code,
        type: c.type,
        type_label: typeLabels[c.type] || c.type,
        value: c.value,
        value_label: ["vip", "svip", "level"].includes(c.type)
          ? `${c.value} 天`
          : c.type === "balance"
          ? `¥${c.value}`
          : c.type === "transfer_percent"
          ? `${c.value}%`
          : `${c.value}`,
        description: c.description || "",
        max_uses: c.maxUses,
        current_uses: c.currentUses || 0,
        is_used: c.isUsed,
        is_expired: now > c.expiresAt,
        status:
          now > c.expiresAt
            ? "已过期"
            : c.currentUses >= c.maxUses
            ? "已用完"
            : "可用",
        expires_at: c.expiresAt,
        created_at: c.createdAt,
        created_by: c.createdBy
          ? { id: c.createdBy._id, username: c.createdBy.username }
          : null,
        used_by: c.usedBy
          ? { id: c.usedBy._id, username: c.usedBy.username }
          : null,
        used_at: c.usedAt,
        medal_id: c.medalId || null,
      }));

      ctx.body = {
        success: true,
        data: {
          total,
          page: parseInt(page),
          page_size: parseInt(page_size),
          items,
        },
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
