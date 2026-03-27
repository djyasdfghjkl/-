const Router = require("koa-router");
const router = new Router();
const adminRouter = new Router();
const uuid = require("uuid");
const uuidv4 = uuid.v4;
const Emoji = require("../models/Emoji");
const EmojiCategory = require("../models/EmojiCategory");
const UserEmojiFavorite = require("../models/UserEmojiFavorite");
const UserEmojiUsage = require("../models/UserEmojiUsage");
const UserCustomEmoji = require("../models/UserCustomEmoji");
const auth = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");
const { role } = require("../middleware/role");

// ==================== 基础管理接口 ====================

router.get("/emoji/categories", async (ctx) => {
  try {
    const categories = await EmojiCategory.find({ is_active: true }).sort({ sort_order: 1 });
    ctx.body = {
      success: true,
      data: categories
    };
  } catch (error) {
    console.error("[获取分类错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "获取分类失败" };
  }
});

router.get("/emojis", optionalAuth, async (ctx) => {
  try {
    const { category_id, type, keyword, page = 1, page_size = 20 } = ctx.query;
    const user = ctx.state.user;
    
    const query = { is_official: true, status: 1 };
    
    if (category_id) {
      query.category_id = category_id;
    }
    
    if (type) {
      query.type = parseInt(type);
    }
    
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { tags: { $in: [new RegExp(keyword, "i")] } }
      ];
    }
    
    const total = await Emoji.countDocuments(query);
    const emojis = await Emoji.find(query)
      .sort({ use_count: -1, created_at: -1 })
      .skip((page - 1) * page_size)
      .limit(parseInt(page_size));
    
    let favoriteIds = [];
    if (user) {
      const favorites = await UserEmojiFavorite.find({ user_id: user._id });
      favoriteIds = favorites.map(f => f.emoji_id.toString());
    }
    
    const items = emojis.map(emoji => ({
      id: emoji.uuid,
      _id: emoji._id,
      name: emoji.name,
      type: emoji.type,
      url: emoji.url,
      thumbnail: emoji.thumbnail_url || emoji.url,
      tags: emoji.tags,
      is_favorite: favoriteIds.includes(emoji._id.toString()),
      use_count: emoji.use_count
    }));
    
    ctx.body = {
      success: true,
      data: {
        total,
        page: parseInt(page),
        page_size: parseInt(page_size),
        items
      }
    };
  } catch (error) {
    console.error("[获取表情包错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "获取表情包失败" };
  }
});

router.get("/emojis/:uuid", async (ctx) => {
  try {
    const { uuid } = ctx.params;
    const emoji = await Emoji.findOne({ uuid });
    
    if (!emoji) {
      ctx.status = 404;
      ctx.body = { success: false, message: "表情包不存在" };
      return;
    }
    
    ctx.body = {
      success: true,
      data: emoji
    };
  } catch (error) {
    console.error("[获取表情详情错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "获取表情详情失败" };
  }
});

router.get("/emojis/trending", async (ctx) => {
  try {
    const emojis = await Emoji.find({ is_official: true, status: 1 })
      .sort({ use_count: -1 })
      .limit(20);
    
    ctx.body = {
      success: true,
      data: emojis
    };
  } catch (error) {
    console.error("[获取热门表情错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "获取热门表情失败" };
  }
});

// ==================== 用户相关接口 ====================

router.get("/user/emojis/favorites", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { page = 1, page_size = 20 } = ctx.query;
    
    const total = await UserEmojiFavorite.countDocuments({ user_id: user._id });
    const favorites = await UserEmojiFavorite.find({ user_id: user._id })
      .sort({ created_at: -1 })
      .skip((page - 1) * page_size)
      .limit(parseInt(page_size))
      .populate("emoji_id");
    
    const items = favorites.map(fav => {
      if (!fav.emoji_id) return null;
      return {
        id: fav.emoji_id.uuid,
        _id: fav.emoji_id._id,
        name: fav.emoji_id.name,
        type: fav.emoji_id.type,
        url: fav.emoji_id.url,
        thumbnail: fav.emoji_id.thumbnail_url || fav.emoji_id.url,
        tags: fav.emoji_id.tags,
        is_favorite: true,
        use_count: fav.emoji_id.use_count
      };
    }).filter(Boolean);
    
    ctx.body = {
      success: true,
      data: {
        total,
        page: parseInt(page),
        page_size: parseInt(page_size),
        items
      }
    };
  } catch (error) {
    console.error("[获取收藏错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "获取收藏失败" };
  }
});

router.post("/user/emojis/favorite", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { emoji_uuid } = ctx.request.body;
    
    const emoji = await Emoji.findOne({ uuid: emoji_uuid });
    if (!emoji) {
      ctx.status = 404;
      ctx.body = { success: false, message: "表情包不存在" };
      return;
    }
    
    const existing = await UserEmojiFavorite.findOne({
      user_id: user._id,
      emoji_id: emoji._id
    });
    
    let is_favorite;
    if (existing) {
      await UserEmojiFavorite.deleteOne({ _id: existing._id });
      is_favorite = false;
    } else {
      await UserEmojiFavorite.create({
        user_id: user._id,
        emoji_id: emoji._id
      });
      is_favorite = true;
    }
    
    ctx.body = {
      success: true,
      data: { is_favorite }
    };
  } catch (error) {
    console.error("[收藏错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "操作失败" };
  }
});

router.post("/user/emojis/usage", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { emoji_uuid } = ctx.request.body;
    
    const emoji = await Emoji.findOne({ uuid: emoji_uuid });
    if (!emoji) {
      ctx.status = 404;
      ctx.body = { success: false, message: "表情包不存在" };
      return;
    }
    
    emoji.use_count += 1;
    await emoji.save();
    
    await UserEmojiUsage.create({
      user_id: user._id,
      emoji_id: emoji._id
    });
    
    ctx.body = {
      success: true,
      message: "使用记录已保存"
    };
  } catch (error) {
    console.error("[记录使用错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "记录使用失败" };
  }
});

router.get("/user/emojis/recent", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { limit = 20 } = ctx.query;
    
    const usages = await UserEmojiUsage.aggregate([
      { $match: { user_id: user._id } },
      { $sort: { used_at: -1 } },
      { $group: { _id: "$emoji_id", last_used: { $first: "$used_at" } } },
      { $limit: parseInt(limit) }
    ]);
    
    const emojiIds = usages.map(u => u._id);
    const emojis = await Emoji.find({ _id: { $in: emojiIds } });
    
    const emojiMap = {};
    emojis.forEach(e => {
      emojiMap[e._id.toString()] = e;
    });
    
    const items = usages
      .map(u => {
        const emoji = emojiMap[u._id.toString()];
        if (!emoji) return null;
        return {
          id: emoji.uuid,
          _id: emoji._id,
          name: emoji.name,
          type: emoji.type,
          url: emoji.url,
          thumbnail: emoji.thumbnail_url || emoji.url,
          tags: emoji.tags,
          last_used: u.last_used
        };
      })
      .filter(Boolean);
    
    ctx.body = {
      success: true,
      data: items
    };
  } catch (error) {
    console.error("[获取最近使用错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "获取最近使用失败" };
  }
});

// ==================== 自定义表情包接口 ====================

router.get("/user/emojis/custom", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const emojis = await UserCustomEmoji.find({ user_id: user._id }).sort({ created_at: -1 });
    
    ctx.body = {
      success: true,
      data: emojis
    };
  } catch (error) {
    console.error("[获取自定义表情错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "获取自定义表情失败" };
  }
});

router.delete("/user/emojis/custom/:id", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { id } = ctx.params;
    
    const result = await UserCustomEmoji.deleteOne({ _id: id, user_id: user._id });
    
    if (result.deletedCount === 0) {
      ctx.status = 404;
      ctx.body = { success: false, message: "表情不存在" };
      return;
    }
    
    ctx.body = {
      success: true,
      message: "删除成功"
    };
  } catch (error) {
    console.error("[删除自定义表情错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "删除失败" };
  }
});

// ==================== 管理后台接口 ====================

adminRouter.post("/emojis", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    console.log("[创建表情请求]", ctx.request.body);
    const { name, description, type, category_id, url, thumbnail_url, tags, width, height, duration } = ctx.request.body;
    
    const newUuid = uuidv4();
    console.log("[创建表情] 生成UUID:", newUuid);
    
    const emojiData = {
      uuid: newUuid,
      name,
      description,
      type: type || 1,
      category_id,
      url,
      thumbnail_url,
      tags: tags || [],
      is_official: true,
      status: 1,
      width,
      height,
      duration
    };
    
    console.log("[创建表情] 准备保存数据:", emojiData);
    
    const emoji = await Emoji.create(emojiData);
    console.log("[创建表情] 保存成功:", emoji._id);
    
    ctx.status = 201;
    ctx.body = {
      success: true,
      message: "创建成功",
      data: emoji
    };
  } catch (error) {
    console.error("[创建表情错误]:", error);
    console.error("[创建表情错误堆栈]:", error.stack);
    ctx.status = 500;
    ctx.body = { success: false, message: "创建失败: " + error.message };
  }
});

adminRouter.put("/emojis/:uuid", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const { uuid } = ctx.params;
    const updateData = ctx.request.body;
    
    const emoji = await Emoji.findOneAndUpdate(
      { uuid },
      updateData,
      { new: true }
    );
    
    if (!emoji) {
      ctx.status = 404;
      ctx.body = { success: false, message: "表情包不存在" };
      return;
    }
    
    ctx.body = {
      success: true,
      message: "更新成功",
      data: emoji
    };
  } catch (error) {
    console.error("[更新表情错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "更新失败" };
  }
});

adminRouter.delete("/emojis/:uuid", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const { uuid } = ctx.params;
    
    const result = await Emoji.deleteOne({ uuid });
    
    if (result.deletedCount === 0) {
      ctx.status = 404;
      ctx.body = { success: false, message: "表情包不存在" };
      return;
    }
    
    ctx.body = {
      success: true,
      message: "删除成功"
    };
  } catch (error) {
    console.error("[删除表情错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "删除失败" };
  }
});

adminRouter.post("/emoji/categories", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const { name, icon, sort_order } = ctx.request.body;
    
    const category = await EmojiCategory.create({
      name,
      icon,
      sort_order: sort_order || 0
    });
    
    ctx.status = 201;
    ctx.body = {
      success: true,
      message: "创建成功",
      data: category
    };
  } catch (error) {
    console.error("[创建分类错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "创建失败" };
  }
});

router.prefix("/api");
adminRouter.prefix("/api/admin");

module.exports = {
  router,
  adminRouter
};
