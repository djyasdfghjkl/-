const Router = require("koa-router");
const auth = require("../middleware/auth");
const { role } = require("../middleware/role");
const Medal = require("../models/Medal");
const UserMedal = require("../models/UserMedal");
const {
  getUserMedals,
  getAllMedals,
  awardMedal,
  checkAndAwardMedals,
  normalizeMedalDefinition,
} = require("../utils/medalManager");

const router = new Router();
const adminRouter = new Router();

const normalizePayload = (payload = {}) => ({
  name: String(payload.name || "").trim(),
  description: String(payload.description || "").trim(),
  type: payload.type || "achievement",
  level: Number(payload.level || 1),
  condition: payload.condition && typeof payload.condition === "object" ? payload.condition : {},
  icon: String(payload.icon || "").trim(),
  iconUrl: String(payload.iconUrl || "").trim(),
  lottieUrl: String(payload.lottieUrl || payload.animPath || "").trim(),
  enabled: payload.enabled !== false,
  sort: Number(payload.sort || 0),
});

const buildPublicSummary = (items = []) => ({
  total: items.length,
  enabled: items.filter((item) => item.enabled !== false).length,
  obtained: items.filter((item) => item.obtained).length,
  lottie: items.filter((item) => item.visualType === "lottie").length,
  renderable: items.filter((item) => item.isRenderable).length,
});

const buildAdminMedalItems = async () => {
  const medals = await Medal.find().sort({ sort: 1, level: 1, createdAt: 1 });
  const medalIds = medals.map((item) => item._id);

  const stats = medalIds.length
    ? await UserMedal.aggregate([
        {
          $match: {
            medalId: { $in: medalIds },
          },
        },
        {
          $group: {
            _id: "$medalId",
            awardCount: { $sum: 1 },
            lastAwardedAt: { $max: "$obtainedAt" },
          },
        },
      ])
    : [];

  const statsMap = new Map(stats.map((item) => [String(item._id), item]));

  const latestRecords = medalIds.length
    ? await UserMedal.find({ medalId: { $in: medalIds } })
        .populate("userId", "username nickname email")
        .sort({ obtainedAt: -1 })
    : [];

  const latestMap = new Map();
  latestRecords.forEach((record) => {
    const key = String(record.medalId);
    if (!latestMap.has(key)) {
      latestMap.set(key, record);
    }
  });

  const items = medals.map((item) => {
    const normalized = normalizeMedalDefinition(item);
    const stat = statsMap.get(String(item._id));
    const latest = latestMap.get(String(item._id));
    const lastUser = latest?.userId
      ? {
          id: latest.userId._id?.toString?.() || "",
          username: latest.userId.username || latest.userId.nickname || latest.userId.email || "未知用户",
        }
      : null;

    return {
      ...normalized,
      awardCount: stat?.awardCount || 0,
      lastAwardedAt: stat?.lastAwardedAt || null,
      lastAwardedUser: lastUser,
      resourceState: normalized.resourceState || (normalized.isRenderable ? "ready" : "missing"),
    };
  });

  const summary = {
    total: items.length,
    enabled: items.filter((item) => item.enabled !== false).length,
    custom: items.filter((item) => !item.isDefault).length,
    lottie: items.filter((item) => item.visualType === "lottie").length,
    renderable: items.filter((item) => item.isRenderable).length,
    awarded: items.reduce((sum, item) => sum + Number(item.awardCount || 0), 0),
  };

  return { items, summary };
};

router.get("/medals/user", auth, async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    await checkAndAwardMedals(userId);
    const medals = await getUserMedals(userId);
    ctx.body = {
      success: true,
      message: "获取用户勋章成功",
      data: medals,
      summary: buildPublicSummary(medals),
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `获取用户勋章失败: ${error.message}`,
    };
  }
});

router.get("/medals", async (ctx) => {
  try {
    const medals = await getAllMedals();
    ctx.body = {
      success: true,
      message: "获取勋章列表成功",
      data: medals,
      summary: buildPublicSummary(medals),
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `获取勋章列表失败: ${error.message}`,
    };
  }
});

router.get("/medals/:id", async (ctx) => {
  try {
    const medal = await Medal.findById(ctx.params.id);
    if (!medal) {
      ctx.status = 404;
      ctx.body = { success: false, message: "勋章不存在" };
      return;
    }

    ctx.body = {
      success: true,
      message: "获取勋章详情成功",
      data: normalizeMedalDefinition(medal),
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `获取勋章详情失败: ${error.message}`,
    };
  }
});

adminRouter.get("/medals", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const data = await buildAdminMedalItems();
    ctx.body = {
      success: true,
      message: "获取管理端勋章成功",
      data,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `获取管理端勋章失败: ${error.message}`,
    };
  }
});

adminRouter.post("/medals", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const payload = normalizePayload(ctx.request.body);
    if (!payload.name || !payload.description) {
      ctx.status = 400;
      ctx.body = { success: false, message: "勋章名称和描述不能为空" };
      return;
    }

    const existing = await Medal.findOne({ name: payload.name });
    if (existing) {
      ctx.status = 400;
      ctx.body = { success: false, message: "勋章名称已存在" };
      return;
    }

    const medal = await Medal.create(payload);
    ctx.status = 201;
    ctx.body = {
      success: true,
      message: "创建勋章成功",
      data: normalizeMedalDefinition(medal),
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `创建勋章失败: ${error.message}`,
    };
  }
});

adminRouter.put("/medals/:id", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const payload = normalizePayload(ctx.request.body);
    const medal = await Medal.findById(ctx.params.id);

    if (!medal) {
      ctx.status = 404;
      ctx.body = { success: false, message: "勋章不存在" };
      return;
    }

    const duplicate = await Medal.findOne({
      name: payload.name,
      _id: { $ne: medal._id },
    });
    if (duplicate) {
      ctx.status = 400;
      ctx.body = { success: false, message: "勋章名称已存在" };
      return;
    }

    Object.assign(medal, payload);
    await medal.save();

    ctx.body = {
      success: true,
      message: "更新勋章成功",
      data: normalizeMedalDefinition(medal),
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `更新勋章失败: ${error.message}`,
    };
  }
});

adminRouter.delete("/medals/:id", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const medal = await Medal.findById(ctx.params.id);
    if (!medal) {
      ctx.status = 404;
      ctx.body = { success: false, message: "勋章不存在" };
      return;
    }

    await medal.deleteOne();
    ctx.body = {
      success: true,
      message: "删除勋章成功",
      data: { id: ctx.params.id },
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `删除勋章失败: ${error.message}`,
    };
  }
});

adminRouter.post("/medals/award", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const { userId, medalId, reason } = ctx.request.body || {};

    if (!userId || !medalId || !reason) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "缺少必要参数",
      };
      return;
    }

    const result = await awardMedal(userId, medalId, reason);
    if (!result.success) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: result.message,
      };
      return;
    }

    ctx.body = {
      success: true,
      message: "勋章颁发成功",
      data: result.userMedal,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `颁发勋章失败: ${error.message}`,
    };
  }
});

router.prefix("/api");
adminRouter.prefix("/api/admin");

module.exports = {
  router,
  adminRouter,
};
