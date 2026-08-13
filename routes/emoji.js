const Router = require("koa-router");
const Emoji = require("../models/Emoji");
const EmojiCategory = require("../models/EmojiCategory");
const UserEmojiFavorite = require("../models/UserEmojiFavorite");
const UserEmojiUsage = require("../models/UserEmojiUsage");
const auth = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");
const { role } = require("../middleware/role");
const { normalizeEmojiDoc, sanitizeEmojiPayload } = require("../utils/emojiManager");

const router = new Router();
const adminRouter = new Router();

function buildSceneQuery(scene) {
  if (!scene) return {};
  return { scenes: scene };
}

async function findCategoryByPayload(payload = {}) {
  if (payload.categoryId) {
    const direct = await EmojiCategory.findById(payload.categoryId);
    if (direct) return direct;
  }
  if (payload.categoryCode) {
    return EmojiCategory.findOne({ code: payload.categoryCode });
  }
  return null;
}

async function buildItems(query = {}, options = {}) {
  const page = Math.max(1, Number(options.page || 1));
  const pageSize = Math.max(1, Math.min(200, Number(options.pageSize || 50)));
  const docs = await Emoji.find(query)
    .populate("category_id")
    .sort({ sort_order: -1, use_count: -1, created_at: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);
  const total = await Emoji.countDocuments(query);
  return {
    total,
    page,
    pageSize,
    items: docs.map(normalizeEmojiDoc),
  };
}

router.get(["/emoji/categories", "/emojis/categories"], async (ctx) => {
  try {
    const { scene } = ctx.query;
    const query = { is_active: true };
    if (scene) {
      query.$or = [{ scene }, { scene: "all" }];
    }
    const categories = await EmojiCategory.find(query).sort({ sort_order: 1, created_at: 1 });
    ctx.body = {
      success: true,
      data: categories.map((item) => ({
        id: item._id,
        code: item.code,
        name: item.name,
        description: item.description || "",
        icon: item.icon || "",
        scene: item.scene || "all",
        sortOrder: Number(item.sort_order || 0),
      })),
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: `获取表情分类失败: ${error.message}` };
  }
});

router.get("/emojis", optionalAuth, async (ctx) => {
  try {
    const { keyword = "", scene = "", categoryCode = "", category_id = "", page = 1, page_size = 50 } = ctx.query;
    const query = { status: 1, is_official: true, ...buildSceneQuery(scene) };

    if (category_id) {
      query.category_id = category_id;
    }

    if (categoryCode) {
      const category = await EmojiCategory.findOne({ code: categoryCode });
      if (category) {
        query.category_id = category._id;
      }
    }

    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { tags: { $in: [new RegExp(keyword, "i")] } },
        { description: { $regex: keyword, $options: "i" } },
      ];
    }

    ctx.body = {
      success: true,
      data: await buildItems(query, { page, pageSize: page_size }),
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: `获取表情列表失败: ${error.message}` };
  }
});

router.get("/emojis/packs", optionalAuth, async (ctx) => {
  try {
    const scene = String(ctx.query.scene || "mood").trim();
    const categories = await EmojiCategory.find({
      is_active: true,
      $or: [{ scene }, { scene: "all" }],
    }).sort({ sort_order: 1, created_at: 1 });

    const emojis = await Emoji.find({
      status: 1,
      is_official: true,
      ...buildSceneQuery(scene),
    })
      .populate("category_id")
      .sort({ sort_order: -1, use_count: -1, created_at: -1 });

    const items = emojis.map(normalizeEmojiDoc);
    const groupMap = new Map();
    categories.forEach((category) => {
      groupMap.set(String(category._id), {
        id: category._id,
        code: category.code,
        name: category.name,
        description: category.description || "",
        icon: category.icon || "",
        sortOrder: Number(category.sort_order || 0),
        items: [],
      });
    });

    items.forEach((item) => {
      const key = String(item.categoryId || "uncategorized");
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          id: item.categoryId || "uncategorized",
          code: item.categoryCode || "uncategorized",
          name: item.categoryName || "其他表情",
          description: "",
          icon: "✨",
          sortOrder: 999,
          items: [],
        });
      }
      groupMap.get(key).items.push(item);
    });

    const groups = [...groupMap.values()]
      .filter((group) => group.items.length > 0)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    ctx.body = {
      success: true,
      data: {
        scene,
        groups,
        items,
      },
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: `获取表情包资源失败: ${error.message}` };
  }
});

router.get("/emojis/trending", async (ctx) => {
  try {
    const docs = await Emoji.find({ status: 1, is_official: true })
      .populate("category_id")
      .sort({ use_count: -1, sort_order: -1, created_at: -1 })
      .limit(20);
    ctx.body = {
      success: true,
      data: docs.map(normalizeEmojiDoc),
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: `获取热门表情失败: ${error.message}` };
  }
});

router.get("/emojis/:uuid", async (ctx) => {
  try {
    const emoji = await Emoji.findOne({ uuid: ctx.params.uuid }).populate("category_id");
    if (!emoji) {
      ctx.status = 404;
      ctx.body = { success: false, message: "表情资源不存在" };
      return;
    }

    ctx.body = {
      success: true,
      data: normalizeEmojiDoc(emoji),
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: `获取表情详情失败: ${error.message}` };
  }
});

router.post("/user/emojis/usage", auth, async (ctx) => {
  try {
    const emojiUuid = String(ctx.request.body.emoji_uuid || ctx.request.body.emojiId || "").trim();
    const emoji = await Emoji.findOne({ uuid: emojiUuid, status: 1 });
    if (!emoji) {
      ctx.status = 404;
      ctx.body = { success: false, message: "表情资源不存在" };
      return;
    }

    emoji.use_count = Number(emoji.use_count || 0) + 1;
    await emoji.save();
    await UserEmojiUsage.create({
      user_id: ctx.state.user._id,
      emoji_id: emoji._id,
    });

    ctx.body = {
      success: true,
      message: "表情使用记录已保存",
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: `记录表情使用失败: ${error.message}` };
  }
});

router.get("/user/emojis/recent", auth, async (ctx) => {
  try {
    const limit = Math.max(1, Math.min(50, Number(ctx.query.limit || 20)));
    const records = await UserEmojiUsage.find({ user_id: ctx.state.user._id })
      .sort({ used_at: -1 })
      .limit(limit)
      .populate({
        path: "emoji_id",
        populate: { path: "category_id" },
      });

    const unique = [];
    const seen = new Set();
    records.forEach((record) => {
      const emoji = record.emoji_id;
      if (!emoji || seen.has(emoji.uuid)) return;
      seen.add(emoji.uuid);
      unique.push(normalizeEmojiDoc(emoji));
    });

    ctx.body = {
      success: true,
      data: unique,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: `获取最近使用失败: ${error.message}` };
  }
});

router.get("/user/emojis/favorites", auth, async (ctx) => {
  try {
    const favorites = await UserEmojiFavorite.find({ user_id: ctx.state.user._id })
      .sort({ created_at: -1 })
      .populate({
        path: "emoji_id",
        populate: { path: "category_id" },
      });

    ctx.body = {
      success: true,
      data: favorites
        .map((item) => (item.emoji_id ? normalizeEmojiDoc(item.emoji_id) : null))
        .filter(Boolean),
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: `获取收藏失败: ${error.message}` };
  }
});

router.post("/user/emojis/favorite", auth, async (ctx) => {
  try {
    const emojiUuid = String(ctx.request.body.emoji_uuid || ctx.request.body.emojiId || "").trim();
    const emoji = await Emoji.findOne({ uuid: emojiUuid, status: 1 });
    if (!emoji) {
      ctx.status = 404;
      ctx.body = { success: false, message: "表情资源不存在" };
      return;
    }

    const existing = await UserEmojiFavorite.findOne({
      user_id: ctx.state.user._id,
      emoji_id: emoji._id,
    });

    if (existing) {
      await existing.deleteOne();
      ctx.body = { success: true, data: { is_favorite: false } };
      return;
    }

    await UserEmojiFavorite.create({
      user_id: ctx.state.user._id,
      emoji_id: emoji._id,
    });
    ctx.body = { success: true, data: { is_favorite: true } };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: `收藏表情失败: ${error.message}` };
  }
});

adminRouter.get("/emojis", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const { keyword = "", scene = "", categoryCode = "" } = ctx.query;
    const query = {};
    if (scene) {
      Object.assign(query, buildSceneQuery(scene));
    }
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { tags: { $in: [new RegExp(keyword, "i")] } },
      ];
    }
    if (categoryCode) {
      const category = await EmojiCategory.findOne({ code: categoryCode });
      if (category) {
        query.category_id = category._id;
      }
    }

    const categories = await EmojiCategory.find().sort({ sort_order: 1, created_at: 1 });
    const docs = await Emoji.find(query)
      .populate("category_id")
      .sort({ sort_order: -1, created_at: -1 });
    const items = docs.map(normalizeEmojiDoc);

    ctx.body = {
      success: true,
      data: {
        categories: categories.map((item) => ({
          id: item._id,
          code: item.code,
          name: item.name,
          description: item.description || "",
          icon: item.icon || "",
          scene: item.scene || "all",
          sortOrder: Number(item.sort_order || 0),
        })),
        items,
        summary: {
          total: items.length,
          enabled: items.filter((item) => item.enabled).length,
          lottie: items.filter((item) => item.resourceType === "lottie").length,
          mood: items.filter((item) => item.scenes.includes("mood")).length,
          editor: items.filter((item) => item.scenes.includes("editor")).length,
        },
      },
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: `获取表情资源管理列表失败: ${error.message}` };
  }
});

adminRouter.post("/emojis", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const payload = sanitizeEmojiPayload(ctx.request.body || {});
    if (!payload.name || !payload.resource_value) {
      ctx.status = 400;
      ctx.body = { success: false, message: "表情名称和资源内容不能为空" };
      return;
    }

    const duplicate = await Emoji.findOne({ name: payload.name, status: { $ne: -1 } });
    if (duplicate) {
      ctx.status = 400;
      ctx.body = { success: false, message: "表情名称已存在" };
      return;
    }

    const category = await findCategoryByPayload(payload);
    const emoji = await Emoji.create({
      uuid: payload.uuid,
      name: payload.name,
      description: payload.description,
      type: payload.type,
      resource_type: payload.resource_type,
      resource_value: payload.resource_value,
      category_id: category?._id || null,
      url: payload.url,
      thumbnail_url: payload.thumbnail_url,
      preview_text: payload.preview_text,
      tags: payload.tags,
      scenes: payload.scenes,
      sort_order: payload.sort_order,
      source: payload.source,
      is_official: payload.is_official,
      status: payload.status,
      width: payload.width,
      height: payload.height,
      duration: payload.duration,
      uploader_id: ctx.state.user._id,
    });

    const populated = await Emoji.findById(emoji._id).populate("category_id");
    ctx.status = 201;
    ctx.body = {
      success: true,
      message: "表情资源创建成功",
      data: normalizeEmojiDoc(populated),
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: `创建表情资源失败: ${error.message}` };
  }
});

adminRouter.put("/emojis/:uuid", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const payload = sanitizeEmojiPayload({ ...ctx.request.body, uuid: ctx.params.uuid });
    const emoji = await Emoji.findOne({ uuid: ctx.params.uuid });
    if (!emoji) {
      ctx.status = 404;
      ctx.body = { success: false, message: "表情资源不存在" };
      return;
    }

    const duplicate = await Emoji.findOne({
      name: payload.name,
      _id: { $ne: emoji._id },
      status: { $ne: -1 },
    });
    if (duplicate) {
      ctx.status = 400;
      ctx.body = { success: false, message: "表情名称已存在" };
      return;
    }

    const category = await findCategoryByPayload(payload);
    Object.assign(emoji, {
      name: payload.name,
      description: payload.description,
      type: payload.type,
      resource_type: payload.resource_type,
      resource_value: payload.resource_value,
      category_id: category?._id || null,
      url: payload.url,
      thumbnail_url: payload.thumbnail_url,
      preview_text: payload.preview_text,
      tags: payload.tags,
      scenes: payload.scenes,
      sort_order: payload.sort_order,
      source: payload.source,
      is_official: payload.is_official,
      status: payload.status,
      width: payload.width,
      height: payload.height,
      duration: payload.duration,
    });
    await emoji.save();

    const populated = await Emoji.findById(emoji._id).populate("category_id");
    ctx.body = {
      success: true,
      message: "表情资源更新成功",
      data: normalizeEmojiDoc(populated),
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: `更新表情资源失败: ${error.message}` };
  }
});

adminRouter.delete("/emojis/:uuid", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const emoji = await Emoji.findOne({ uuid: ctx.params.uuid });
    if (!emoji) {
      ctx.status = 404;
      ctx.body = { success: false, message: "表情资源不存在" };
      return;
    }

    await emoji.deleteOne();
    ctx.body = {
      success: true,
      message: "表情资源删除成功",
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: `删除表情资源失败: ${error.message}` };
  }
});

adminRouter.get("/emoji/categories", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const categories = await EmojiCategory.find().sort({ sort_order: 1, created_at: 1 });
    ctx.body = {
      success: true,
      data: categories,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: `获取分类失败: ${error.message}` };
  }
});

router.prefix("/api");
adminRouter.prefix("/api/admin");

module.exports = {
  router,
  adminRouter,
};
