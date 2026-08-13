const Router = require("koa-router");
const auth = require("../middleware/auth");
const { role } = require("../middleware/role");
const UserBlock = require("../models/UserBlock");

const adminRouter = new Router();

adminRouter.get("/blacklist", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const { keyword = "" } = ctx.query;
    const records = await UserBlock.find()
      .populate("blockerId", "username nickname email avatar")
      .populate("blockedUserId", "username nickname email avatar")
      .sort({ createdAt: -1 });

    const normalized = records
      .map((record) => {
        const blocker = record.blockerId?.toJSON ? record.blockerId.toJSON() : record.blockerId;
        const blocked = record.blockedUserId?.toJSON ? record.blockedUserId.toJSON() : record.blockedUserId;
        if (!blocker || !blocked) return null;
        return {
          id: record.id || record._id?.toString?.(),
          reason: record.reason || "",
          createdAt: record.createdAt,
          blocker: {
            id: blocker.id || blocker._id?.toString?.(),
            username: blocker.username || "",
            nickname: blocker.nickname || "",
            email: blocker.email || "",
            avatar: blocker.avatar || "",
          },
          blocked: {
            id: blocked.id || blocked._id?.toString?.(),
            username: blocked.username || "",
            nickname: blocked.nickname || "",
            email: blocked.email || "",
            avatar: blocked.avatar || "",
          },
        };
      })
      .filter(Boolean);

    const query = String(keyword || "").trim().toLowerCase();
    const items = !query
      ? normalized
      : normalized.filter((item) =>
          [
            item.blocker.username,
            item.blocker.nickname,
            item.blocker.email,
            item.blocked.username,
            item.blocked.nickname,
            item.blocked.email,
            item.reason,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query),
        );

    ctx.body = {
      success: true,
      data: items,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `获取黑名单失败: ${error.message}`,
    };
  }
});

adminRouter.delete("/blacklist/:id", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const record = await UserBlock.findById(ctx.params.id);
    if (!record) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "黑名单记录不存在",
      };
      return;
    }

    await record.deleteOne();
    ctx.body = {
      success: true,
      message: "已移出黑名单",
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `移出黑名单失败: ${error.message}`,
    };
  }
});

adminRouter.prefix("/api/admin");

module.exports = {
  adminRouter,
};
