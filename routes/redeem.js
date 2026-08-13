const Router = require("koa-router");
const User = require("../models/User");
const RedeemCode = require("../models/RedeemCode");
const auth = require("../middleware/auth");
const { role } = require("../middleware/role");
const { formatDateTime, addDays } = require("../utils/dateUtils");
const { getError } = require("../config/errorConfig");

const router = new Router();
const adminRouter = new Router();

const TYPE_LABELS = {
  vip: "VIP会员",
  svip: "SVIP会员",
  balance: "余额",
  transfer_percent: "转账比例",
  special_medal: "特殊勋章",
  points: "积分",
  level: "等级",
};

const VALID_TYPES = Object.keys(TYPE_LABELS);

const generateRedeemCode = (length = 12) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let index = 0; index < length; index += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildValueLabel = (item) => {
  if (item.type === "vip" || item.type === "svip") return `${item.value} 天`;
  if (item.type === "balance") return `￥${item.value}`;
  if (item.type === "transfer_percent") return `${item.value}%`;
  if (item.type === "level") return `Lv.${item.value}`;
  if (item.type === "points") return `${item.value} 积分`;
  return `${item.value}`;
};

adminRouter.post("/redeem/generate", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const {
      type,
      value,
      count,
      expireDays,
      medalId,
      description,
      maxUses,
      stackable,
      unique_per_type,
    } = ctx.request.body || {};

    if (!VALID_TYPES.includes(type)) {
      ctx.status = 400;
      ctx.body = getError("common.badRequest", "兑换码类型不正确");
      return;
    }

    if (type === "special_medal" && !medalId) {
      ctx.status = 400;
      ctx.body = getError("common.badRequest", "特殊勋章兑换码必须传入 medalId");
      return;
    }

    const numericValue = Number(value);
    const numericCount = toPositiveInt(count, 0);
    const numericExpireDays = toPositiveInt(expireDays, 0);
    const numericMaxUses = toPositiveInt(maxUses, 1);

    if (!Number.isFinite(numericValue) || numericValue <= 0 || !numericCount || !numericExpireDays) {
      ctx.status = 400;
      ctx.body = getError("common.badRequest", "兑换码参数无效");
      return;
    }

    if (numericCount > 1000) {
      ctx.status = 400;
      ctx.body = getError("common.badRequest", "单次最多生成 1000 个兑换码");
      return;
    }

    const expireDate = addDays(new Date(), numericExpireDays);
    const codes = [];

    for (let index = 0; index < numericCount; index += 1) {
      let code = generateRedeemCode();
      while (await RedeemCode.findOne({ code })) {
        code = generateRedeemCode();
      }

      const record = await RedeemCode.create({
        code,
        type,
        value: numericValue,
        expiresAt: expireDate,
        description: description || "",
        maxUses: numericMaxUses,
        currentUses: 0,
        createdBy: ctx.state.user._id,
        usedUsers: [],
        stackable: stackable !== undefined ? Boolean(stackable) : true,
        unique_per_type:
          unique_per_type !== undefined ? Boolean(unique_per_type) : false,
        medalId: type === "special_medal" ? medalId : undefined,
      });

      codes.push(record.code);
    }

    ctx.body = {
      success: true,
      message: "兑换码生成成功",
      data: {
        codes,
        type,
        value: numericValue,
        expiresAt: expireDate,
        count: codes.length,
        description: description || "",
        maxUses: numericMaxUses,
      },
    };
  } catch (error) {
    console.error("Generate redeem codes failed:", error);
    ctx.status = 500;
    ctx.body = getError("redeem.generateFailed");
  }
});

router.post("/redeem/use", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { code } = ctx.request.body || {};

    if (!code) {
      ctx.status = 400;
      ctx.body = getError("common.badRequest", "请输入兑换码");
      return;
    }

    const redeemCode = await RedeemCode.findOne({ code: String(code).trim().toUpperCase() });
    if (!redeemCode) {
      ctx.status = 404;
      ctx.body = getError("redeem.codeNotFound");
      return;
    }

    if (new Date() > redeemCode.expiresAt) {
      ctx.status = 400;
      ctx.body = getError("redeem.codeExpired");
      return;
    }

    if ((redeemCode.currentUses || 0) >= (redeemCode.maxUses || 1)) {
      ctx.status = 400;
      ctx.body = getError("redeem.codeUsed", "该兑换码已达到最大使用次数");
      return;
    }

    if (
      Array.isArray(redeemCode.usedUsers) &&
      redeemCode.usedUsers.map((item) => item.toString()).includes(user._id.toString())
    ) {
      ctx.status = 400;
      ctx.body = getError("redeem.codeUsed", "您已经使用过这个兑换码");
      return;
    }

    if (redeemCode.unique_per_type) {
      const usedSameType = await RedeemCode.findOne({
        type: redeemCode.type,
        usedUsers: user._id,
        _id: { $ne: redeemCode._id },
      });
      if (usedSameType) {
        ctx.status = 400;
        ctx.body = getError(
          "redeem.codeUsed",
          `您已经使用过 ${TYPE_LABELS[redeemCode.type] || redeemCode.type} 类型的兑换码`,
        );
        return;
      }
    }

    const now = new Date();
    let result = {};

    switch (redeemCode.type) {
      case "vip": {
        const base =
          redeemCode.stackable !== false && user.vipExpireDate && user.vipExpireDate > now
            ? user.vipExpireDate
            : now;
        user.vipExpireDate = addDays(base, redeemCode.value);
        if (user.role !== 3 && user.role !== 4) user.role = Math.max(user.role || 0, 1);
        result = {
          type: "vip",
          expire_date: formatDateTime(user.vipExpireDate),
        };
        break;
      }
      case "svip": {
        const base =
          redeemCode.stackable !== false && user.svipExpireDate && user.svipExpireDate > now
            ? user.svipExpireDate
            : now;
        user.svipExpireDate = addDays(base, redeemCode.value);
        if (user.role !== 4) user.role = Math.max(user.role || 0, 2);
        result = {
          type: "svip",
          expire_date: formatDateTime(user.svipExpireDate),
        };
        break;
      }
      case "balance":
        user.balance = Number(user.balance || 0) + Number(redeemCode.value || 0);
        result = { type: "balance", balance: user.balance };
        break;
      case "transfer_percent":
        user.transfer_percent = Math.min(200, Math.max(0, Number(redeemCode.value || 0)));
        result = {
          type: "transfer_percent",
          transfer_percent: user.transfer_percent,
        };
        break;
      case "special_medal":
        if (redeemCode.medalId && !user.special_medals.includes(redeemCode.medalId.toString())) {
          user.special_medals.push(redeemCode.medalId.toString());
        }
        result = { type: "special_medal", medal_id: redeemCode.medalId || null };
        break;
      case "points":
        user.points = Number(user.points || 0) + Number(redeemCode.value || 0);
        result = { type: "points", points: user.points };
        break;
      case "level":
        user.user_level = Math.max(Number(user.user_level || 1), Number(redeemCode.value || 1));
        result = { type: "level", user_level: user.user_level };
        break;
      default:
        break;
    }

    await user.save();

    redeemCode.currentUses = Number(redeemCode.currentUses || 0) + 1;
    redeemCode.usedUsers = Array.isArray(redeemCode.usedUsers) ? redeemCode.usedUsers : [];
    redeemCode.usedUsers.push(user._id);
    if ((redeemCode.maxUses || 1) === 1) {
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
    console.error("Use redeem code failed:", error);
    ctx.status = 500;
    ctx.body = getError("common.serverError");
  }
});

adminRouter.get("/redeem/codes", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const {
      type,
      isUsed,
      page = 1,
      page_size = 50,
    } = ctx.query || {};

    const currentPage = toPositiveInt(page, 1);
    const pageSize = toPositiveInt(page_size, 50);
    const query = {};

    if (type) query.type = type;
    if (isUsed !== undefined) query.isUsed = String(isUsed) === "true";

    const total = await RedeemCode.countDocuments(query);
    const records = await RedeemCode.find(query)
      .populate("usedBy", "username nickname email")
      .populate("createdBy", "username nickname email")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    const now = new Date();
    const items = records.map((item) => ({
      id: item._id,
      code: item.code,
      type: item.type,
      type_label: TYPE_LABELS[item.type] || item.type,
      value: item.value,
      value_label: buildValueLabel(item),
      description: item.description || "",
      max_uses: item.maxUses || 1,
      current_uses: item.currentUses || 0,
      is_used: Boolean(item.isUsed),
      is_expired: now > item.expiresAt,
      status:
        now > item.expiresAt
          ? "已过期"
          : (item.currentUses || 0) >= (item.maxUses || 1)
            ? "已用完"
            : "可用",
      stackable: item.stackable !== false,
      unique_per_type: Boolean(item.unique_per_type),
      expires_at: item.expiresAt,
      created_at: item.createdAt,
      created_by: item.createdBy
        ? {
            id: item.createdBy._id,
            username: item.createdBy.username || item.createdBy.nickname || "",
          }
        : null,
      used_by: item.usedBy
        ? {
            id: item.usedBy._id,
            username: item.usedBy.username || item.usedBy.nickname || "",
          }
        : null,
      used_at: item.usedAt || null,
      medal_id: item.medalId || null,
    }));

    ctx.body = {
      success: true,
      message: "获取兑换码列表成功",
      data: {
        total,
        page: currentPage,
        page_size: pageSize,
        items,
      },
    };
  } catch (error) {
    console.error("List redeem codes failed:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `获取兑换码列表失败: ${error.message}`,
    };
  }
});

router.prefix("/api");
adminRouter.prefix("/api/admin");

module.exports = {
  router,
  adminRouter,
};
