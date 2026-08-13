const Router = require("koa-router");
const CaringQuote = require("../models/CaringQuote");
const auth = require("../middleware/auth");
const { role } = require("../middleware/role");

const adminRouter = new Router();

adminRouter.get(
  "/caring-quotes",
  auth,
  role(["admin", "superadmin"]),
  async (ctx) => {
    const quotes = await CaringQuote.find().sort({ enabled: -1, weight: -1, createdAt: -1 });
    ctx.body = {
      success: true,
      data: quotes,
    };
  },
);

adminRouter.post(
  "/caring-quotes",
  auth,
  role(["admin", "superadmin"]),
  async (ctx) => {
    const { text, sentiment = "all", moods = [], tags = [], enabled = true, weight = 1 } =
      ctx.request.body || {};

    if (!text || !String(text).trim()) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "语录内容不能为空",
      };
      return;
    }

    const quote = await CaringQuote.create({
      text: String(text).trim(),
      sentiment,
      moods: Array.isArray(moods) ? moods.filter(Boolean) : [],
      tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
      enabled: Boolean(enabled),
      weight: Number(weight) > 0 ? Number(weight) : 1,
    });

    ctx.status = 201;
    ctx.body = {
      success: true,
      message: "语录创建成功",
      data: quote,
    };
  },
);

adminRouter.put(
  "/caring-quotes/:id",
  auth,
  role(["admin", "superadmin"]),
  async (ctx) => {
    const { id } = ctx.params;
    const { text, sentiment, moods, tags, enabled, weight } = ctx.request.body || {};

    const quote = await CaringQuote.findById(id);
    if (!quote) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "语录不存在",
      };
      return;
    }

    if (text !== undefined) quote.text = String(text).trim();
    if (sentiment !== undefined) quote.sentiment = sentiment;
    if (moods !== undefined) quote.moods = Array.isArray(moods) ? moods.filter(Boolean) : [];
    if (tags !== undefined) quote.tags = Array.isArray(tags) ? tags.filter(Boolean) : [];
    if (enabled !== undefined) quote.enabled = Boolean(enabled);
    if (weight !== undefined) quote.weight = Number(weight) > 0 ? Number(weight) : 1;

    await quote.save();

    ctx.body = {
      success: true,
      message: "语录更新成功",
      data: quote,
    };
  },
);

adminRouter.delete(
  "/caring-quotes/:id",
  auth,
  role(["admin", "superadmin"]),
  async (ctx) => {
    const { id } = ctx.params;
    const result = await CaringQuote.deleteOne({ _id: id });

    if (!result.deletedCount) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "语录不存在",
      };
      return;
    }

    ctx.body = {
      success: true,
      message: "语录删除成功",
    };
  },
);

adminRouter.prefix("/api/admin");

module.exports = {
  adminRouter,
};
