const Router = require("koa-router");
const auth = require("../middleware/auth");
const User = require("../models/User");
const UserBlock = require("../models/UserBlock");

const router = new Router();

const normalizeBlock = (record) => {
  const user = record.blockedUserId?.toJSON ? record.blockedUserId.toJSON() : record.blockedUserId;
  if (!user) return null;

  return {
    id: record.id || record._id?.toString?.(),
    blockedUserId: user.id || user._id?.toString?.(),
    name: user.nickname || user.username || "未知用户",
    avatar: user.avatar || "",
    reason: record.reason || "已加入黑名单",
    date: record.createdAt,
    createdAt: record.createdAt,
  };
};

router.get("/users/blocks", auth, async (ctx) => {
  try {
    const records = await UserBlock.find({ blockerId: ctx.state.user._id })
      .populate("blockedUserId", "username nickname avatar")
      .sort({ createdAt: -1 });

    ctx.body = {
      success: true,
      data: records.map(normalizeBlock).filter(Boolean),
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取黑名单失败：" + error.message,
    };
  }
});

router.post("/users/blocks", auth, async (ctx) => {
  try {
    const blockerId = ctx.state.user._id;
    const { blockedUserId, reason = "" } = ctx.request.body || {};

    if (!blockedUserId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "缺少被拉黑用户ID",
      };
      return;
    }

    if (String(blockedUserId) === String(blockerId)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "不能拉黑自己",
      };
      return;
    }

    const blockedUser = await User.findById(blockedUserId);
    if (!blockedUser) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "用户不存在",
      };
      return;
    }

    const existing = await UserBlock.findOne({ blockerId, blockedUserId });
    if (existing) {
      ctx.body = {
        success: true,
        message: "该用户已在黑名单中",
        data: normalizeBlock(
          await existing.populate("blockedUserId", "username nickname avatar"),
        ),
      };
      return;
    }

    const record = await UserBlock.create({
      blockerId,
      blockedUserId,
      reason: String(reason || "").trim(),
    });

    const populated = await UserBlock.findById(record._id).populate(
      "blockedUserId",
      "username nickname avatar",
    );

    ctx.status = 201;
    ctx.body = {
      success: true,
      message: "已加入黑名单",
      data: normalizeBlock(populated),
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "加入黑名单失败：" + error.message,
    };
  }
});

router.delete("/users/blocks/:blockedUserId", auth, async (ctx) => {
  try {
    const { blockedUserId } = ctx.params;
    const result = await UserBlock.deleteOne({
      blockerId: ctx.state.user._id,
      blockedUserId,
    });

    if (!result.deletedCount) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "黑名单记录不存在",
      };
      return;
    }

    ctx.body = {
      success: true,
      message: "已移出黑名单",
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "移出黑名单失败：" + error.message,
    };
  }
});

router.prefix("/api");

module.exports = router;
