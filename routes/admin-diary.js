const Router = require("koa-router");
const auth = require("../middleware/auth");
const { role } = require("../middleware/role");
const Diary = require("../models/Diary");
const User = require("../models/User");

const adminRouter = new Router();
const USER_FIELDS = "username nickname email avatar city role status";

function normalizeDiary(record) {
  const item = record?.toJSON ? record.toJSON() : record;
  const user = item.user_id?.toJSON ? item.user_id.toJSON() : item.user_id;
  return {
    ...item,
    user: user
      ? {
          id: user._id || user.id,
          username: user.username || "",
          nickname: user.nickname || "",
          email: user.email || "",
          avatar: user.avatar || "",
          city: user.city || "",
          role: user.role,
          status: user.status,
        }
      : null,
  };
}

adminRouter.get("/console/diaries", auth, role(["superadmin"]), async (ctx) => {
  try {
    const page = Math.max(1, Number(ctx.query.page) || 1);
    const perPage = Math.min(100, Math.max(1, Number(ctx.query.per_page) || 20));
    const userId = String(ctx.query.user_id || "").trim();
    const keyword = String(ctx.query.keyword || "").trim();
    const visibility = String(ctx.query.visibility || "all").trim();
    const status = String(ctx.query.status || "all").trim();

    const query = {};
    if (userId) query.user_id = userId;
    if (visibility === "public") query.is_public = true;
    if (visibility === "private") query.is_public = false;
    if (status === "active") query.status = 1;
    if (status === "deleted") query.status = 0;

    if (keyword) {
      const matchedUsers = await User.find({
        $or: [
          { username: { $regex: keyword, $options: "i" } },
          { nickname: { $regex: keyword, $options: "i" } },
          { email: { $regex: keyword, $options: "i" } },
        ],
      }).select("_id");

      const userIds = matchedUsers.map((item) => item._id);
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { content: { $regex: keyword, $options: "i" } },
        ...(userIds.length ? [{ user_id: { $in: userIds } }] : []),
      ];
    }

    const total = await Diary.countDocuments(query);
    const diaries = await Diary.find(query)
      .populate("user_id", USER_FIELDS)
      .sort({ diary_date: -1, updatedAt: -1, createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const items = diaries.map(normalizeDiary);
    const users = [];
    const seen = new Map();
    for (const item of items) {
      if (!item.user) continue;
      const id = String(item.user.id);
      if (!seen.has(id)) {
        seen.set(id, {
          ...item.user,
          diaryCount: 0,
        });
      }
      seen.get(id).diaryCount += 1;
    }
    users.push(...seen.values());

    ctx.body = {
      success: true,
      data: {
        items,
        users,
      },
      pagination: {
        total,
        page,
        per_page: perPage,
        total_pages: Math.ceil(total / perPage),
      },
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `获取日记列表失败: ${error.message}`,
    };
  }
});

adminRouter.get("/console/diaries/:id", auth, role(["superadmin"]), async (ctx) => {
  try {
    const diary = await Diary.findById(ctx.params.id).populate("user_id", USER_FIELDS);
    if (!diary) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "日记不存在",
      };
      return;
    }

    ctx.body = {
      success: true,
      data: normalizeDiary(diary),
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `获取日记详情失败: ${error.message}`,
    };
  }
});

adminRouter.delete("/console/diaries/:id", auth, role(["superadmin"]), async (ctx) => {
  try {
    const diary = await Diary.findById(ctx.params.id);
    if (!diary) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "日记不存在",
      };
      return;
    }

    diary.status = 0;
    await diary.save();

    ctx.body = {
      success: true,
      message: "日记已删除",
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `删除日记失败: ${error.message}`,
    };
  }
});

adminRouter.prefix("/api/admin");

module.exports = {
  adminRouter,
};
