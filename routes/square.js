const Router = require("koa-router");
const auth = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");
const Diary = require("../models/Diary");
const User = require("../models/User");
const Follow = require("../models/Follow");
const Like = require("../models/Like");
const Comment = require("../models/Comment");
const CommentLike = require("../models/CommentLike");
const UserBlock = require("../models/UserBlock");

const router = new Router();

// 统一格式化广场日记数据
function formatSquareDiary(diary, isLiked = false, isFollowed = false) {
  return {
    id: diary._id,
    user: {
      id: diary.user_id._id,
      nickname: diary.user_id.nickname,
      avatar: diary.user_id.avatar,
    },
    title: diary.title,
    content: diary.content,
    cover: diary.cover,
    images: diary.images,
    tags: diary.tags,
    weather: diary.weather,
    mood: diary.mood,
    signature: diary.signature,
    location: diary.location,
    location_city: diary.location_city,
    location_coords: diary.location_coords,
    diary_date: diary.diary_date,
    created_at: diary.created_at,
    updated_at: diary.updatedAt,
    stats: {
      like_count: diary.like_count,
      comment_count: diary.comment_count,
      share_count: diary.share_count,
      view_count: diary.view_count,
    },
    is_liked: isLiked,
    is_followed: isFollowed,
  };
}

/**
 * @swagger
 * /api/square/recommend:
 *   get:
 *     summary: 获取推荐内容
 *     description: 根据热度评分获取推荐内容
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get("/square/recommend", optionalAuth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { page = 1, per_page = 10 } = ctx.query;

    // 获取推荐日记（按score倒序）
    const diaries = await Diary.find({ is_public: true, status: 1 })
      .populate("user_id", "id nickname avatar city")
      .sort({ score: -1, created_at: -1 })
      .skip((page - 1) * per_page)
      .limit(parseInt(per_page));

    // 处理返回数据，添加是否点赞和是否关注（如果用户已登录）
    const diaryList = await Promise.all(
      diaries.map(async (diary) => {
        let isLiked = false;
        let isFollowed = false;

        if (user) {
          // 检查是否点赞
          isLiked = await Like.exists({
            user_id: user._id,
            diary_id: diary._id,
          });
          // 检查是否关注作者
          isFollowed = await Follow.exists({
            follower_id: user._id,
            following_id: diary.user_id._id,
          });
        }

        return formatSquareDiary(diary, isLiked, isFollowed);
      }),
    );

    ctx.body = {
      success: true,
      data: diaryList,
      pagination: {
        page: parseInt(page),
        per_page: parseInt(per_page),
      },
    };
  } catch (error) {
    console.error("[获取推荐内容错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取推荐内容失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/square/hot:
 *   get:
 *     summary: 获取热门内容
 *     description: 根据点赞数或评论数获取热门内容
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: likes
 *           enum: [likes, comments]
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get("/square/hot", optionalAuth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { page = 1, per_page = 10, sort_by = "likes" } = ctx.query;

    // 确定排序字段
    const sortField = sort_by === "comments" ? "comment_count" : "like_count";

    // 获取热门日记
    const diaries = await Diary.find({ is_public: true, status: 1 })
      .populate("user_id", "id nickname avatar city")
      .sort({ [sortField]: -1, created_at: -1 })
      .skip((page - 1) * per_page)
      .limit(parseInt(per_page));

    // 处理返回数据
    const diaryList = await Promise.all(
      diaries.map(async (diary) => {
        let isLiked = false;
        let isFollowed = false;

        if (user) {
          isLiked = await Like.exists({
            user_id: user._id,
            diary_id: diary._id,
          });
          isFollowed = await Follow.exists({
            follower_id: user._id,
            following_id: diary.user_id._id,
          });
        }

        return formatSquareDiary(diary, isLiked, isFollowed);
      }),
    );

    ctx.body = {
      success: true,
      data: diaryList,
      pagination: {
        page: parseInt(page),
        per_page: parseInt(per_page),
      },
    };
  } catch (error) {
    console.error("[获取热门内容错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取热门内容失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/square/latest:
 *   get:
 *     summary: 获取最新内容
 *     description: 根据发布时间获取最新内容
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get("/square/latest", optionalAuth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { page = 1, per_page = 10 } = ctx.query;

    // 获取最新日记
    const diaries = await Diary.find({ is_public: true, status: 1 })
      .populate("user_id", "id nickname avatar city")
      .sort({ created_at: -1 })
      .skip((page - 1) * per_page)
      .limit(parseInt(per_page));

    // 处理返回数据
    const diaryList = await Promise.all(
      diaries.map(async (diary) => {
        let isLiked = false;
        let isFollowed = false;

        if (user) {
          isLiked = await Like.exists({
            user_id: user._id,
            diary_id: diary._id,
          });
          isFollowed = await Follow.exists({
            follower_id: user._id,
            following_id: diary.user_id._id,
          });
        }

        return formatSquareDiary(diary, isLiked, isFollowed);
      }),
    );

    ctx.body = {
      success: true,
      data: diaryList,
      pagination: {
        page: parseInt(page),
        per_page: parseInt(per_page),
      },
    };
  } catch (error) {
    console.error("[获取最新内容错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取最新内容失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/square/following:
 *   get:
 *     summary: 获取关注用户的内容
 *     description: 获取当前用户关注的用户发布的公开内容
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get("/square/following", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { page = 1, per_page = 10 } = ctx.query;

    // 获取用户关注的用户ID列表
    const follows = await Follow.find({ follower_id: user._id });
    const followingIds = follows.map((follow) => follow.following_id);

    if (followingIds.length === 0) {
      ctx.body = {
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          per_page: parseInt(per_page),
        },
      };
      return;
    }

    // 获取关注用户的日记
    const diaries = await Diary.find({
      user_id: { $in: followingIds },
      is_public: true,
      status: 1,
    })
      .populate("user_id", "id nickname avatar city")
      .sort({ created_at: -1 })
      .skip((page - 1) * per_page)
      .limit(parseInt(per_page));

    // 处理返回数据
    const diaryList = await Promise.all(
      diaries.map(async (diary) => {
        const isLiked = await Like.exists({
          user_id: user._id,
          diary_id: diary._id,
        });
        const isFollowed = await Follow.exists({
          follower_id: user._id,
          following_id: diary.user_id._id,
        });

        return formatSquareDiary(diary, isLiked, isFollowed);
      }),
    );

    ctx.body = {
      success: true,
      data: diaryList,
      pagination: {
        page: parseInt(page),
        per_page: parseInt(per_page),
      },
    };
  } catch (error) {
    console.error("[获取关注用户内容错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取关注用户内容失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/square/local:
 *   get:
 *     summary: 获取同城内容
 *     description: 获取与当前用户同城市的用户发布的公开内容
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get("/square/local", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { page = 1, per_page = 10 } = ctx.query;

    // 获取用户所在城市
    const currentUser = await User.findById(user._id);
    if (!currentUser.city) {
      ctx.body = {
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          per_page: parseInt(per_page),
        },
        message: "请先设置您的城市信息",
      };
      return;
    }

    // 获取同城用户的日记
    const diaries = await Diary.find({
      is_public: true,
      status: 1,
    })
      .populate("user_id", "id nickname avatar city")
      .sort({ created_at: -1 })
      .skip((page - 1) * per_page)
      .limit(parseInt(per_page));

    // 过滤出同城日记
    const localDiaries = diaries.filter(
      (diary) => diary.user_id.city && diary.user_id.city === currentUser.city,
    );

    // 处理返回数据
    const diaryList = await Promise.all(
      localDiaries.map(async (diary) => {
        const isLiked = await Like.exists({
          user_id: user._id,
          diary_id: diary._id,
        });
        const isFollowed = await Follow.exists({
          follower_id: user._id,
          following_id: diary.user_id._id,
        });

        return formatSquareDiary(diary, isLiked, isFollowed);
      }),
    );

    ctx.body = {
      success: true,
      data: diaryList,
      pagination: {
        page: parseInt(page),
        per_page: parseInt(per_page),
      },
    };
  } catch (error) {
    console.error("[获取同城内容错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取同城内容失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/square/like:
 *   post:
 *     summary: 点赞内容
 *     description: 为指定内容点赞
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - diary_id
 *             properties:
 *               diary_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: 点赞成功
 *       401:
 *         description: 未认证
 *       404:
 *         description: 内容不存在
 */
router.post("/square/like", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { diary_id } = ctx.request.body;

    // 检查日记是否存在
    const diary = await Diary.findById(diary_id);
    if (!diary) {
      ctx.status = 404;
      ctx.body = { success: false, message: "日记不存在" };
      return;
    }

    // 检查是否已经点赞
    const existingLike = await Like.findOne({ user_id: user._id, diary_id });
    if (existingLike) {
      ctx.body = { success: false, message: "已经点赞过了" };
      return;
    }

    // 创建点赞记录
    const like = new Like({ user_id: user._id, diary_id });
    await like.save();

    // 更新日记点赞数
    diary.like_count += 1;
    // 更新热度评分
    diary.score =
      diary.like_count * 2 + diary.comment_count * 3 + diary.share_count * 5;
    await diary.save();

    ctx.body = {
      success: true,
      message: "点赞成功",
      data: {
        like_count: diary.like_count,
        is_liked: true,
      },
    };
  } catch (error) {
    console.error("[点赞错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "点赞失败：" + error.message };
  }
});

/**
 * @swagger
 * /api/square/unlike:
 *   post:
 *     summary: 取消点赞
 *     description: 取消对指定内容的点赞
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - diary_id
 *             properties:
 *               diary_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: 取消点赞成功
 *       401:
 *         description: 未认证
 *       404:
 *         description: 点赞记录不存在
 */
router.post("/square/unlike", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { diary_id } = ctx.request.body;

    // 检查点赞记录是否存在
    const like = await Like.findOneAndDelete({ user_id: user._id, diary_id });
    if (!like) {
      ctx.status = 404;
      ctx.body = { success: false, message: "未找到点赞记录" };
      return;
    }

    // 更新日记点赞数
    const diary = await Diary.findById(diary_id);
    if (diary) {
      diary.like_count = Math.max(0, diary.like_count - 1);
      // 更新热度评分
      diary.score =
        diary.like_count * 2 + diary.comment_count * 3 + diary.share_count * 5;
      await diary.save();

      ctx.body = {
        success: true,
        message: "取消点赞成功",
        data: {
          like_count: diary.like_count,
          is_liked: false,
        },
      };
    } else {
      ctx.status = 404;
      ctx.body = { success: false, message: "日记不存在" };
    }
  } catch (error) {
    console.error("[取消点赞错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "取消点赞失败：" + error.message };
  }
});

/**
 * @swagger
 * /api/square/comment:
 *   post:
 *     summary: 评论内容
 *     description: 为指定内容添加评论
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - diary_id
 *               - content
 *             properties:
 *               diary_id:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: 评论成功
 *       401:
 *         description: 未认证
 *       404:
 *         description: 内容不存在
 */
router.post("/square/comment", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { diary_id, content } = ctx.request.body;

    // 检查日记是否存在
    const diary = await Diary.findById(diary_id);
    if (!diary) {
      ctx.status = 404;
      ctx.body = { success: false, message: "日记不存在" };
      return;
    }

    // 创建评论
    const comment = new Comment({
      user_id: user._id,
      diary_id,
      content,
    });
    await comment.save();

    // 更新日记评论数
    diary.comment_count += 1;
    // 更新热度评分
    diary.score =
      diary.like_count * 2 + diary.comment_count * 3 + diary.share_count * 5;
    await diary.save();

    // 获取用户信息
    const userInfo = await User.findById(user._id, "id nickname avatar");

    ctx.body = {
      success: true,
      message: "评论成功",
      data: {
        id: comment._id,
        user: {
          id: userInfo._id,
          nickname: userInfo.nickname,
          avatar: userInfo.avatar,
        },
        content: comment.content,
        created_at: comment.created_at,
        comment_count: diary.comment_count,
      },
    };
  } catch (error) {
    console.error("[评论错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "评论失败：" + error.message };
  }
});

/**
 * @swagger
 * /api/square/follow:
 *   post:
 *     summary: 关注用户
 *     description: 关注指定用户
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: 关注成功
 *       401:
 *         description: 未认证
 *       404:
 *         description: 用户不存在
 */
router.post("/square/follow", auth, async (ctx) => {
  try {
    const currentUser = ctx.state.user;
    const { user_id } = ctx.request.body;

    // 检查是否关注自己
    if (currentUser._id.toString() === user_id) {
      ctx.body = { success: false, message: "不能关注自己" };
      return;
    }

    // 检查用户是否存在
    const targetUser = await User.findById(user_id);
    if (!targetUser) {
      ctx.status = 404;
      ctx.body = { success: false, message: "用户不存在" };
      return;
    }

    // 检查是否已经关注
    const existingFollow = await Follow.findOne({
      follower_id: currentUser._id,
      following_id: user_id,
    });
    if (existingFollow) {
      ctx.body = { success: false, message: "已经关注过了" };
      return;
    }

    // 创建关注记录
    const follow = new Follow({
      follower_id: currentUser._id,
      following_id: user_id,
    });
    await follow.save();

    // 更新用户关注数和粉丝数
    await User.findByIdAndUpdate(currentUser._id, {
      $inc: { following_count: 1 },
    });

    await User.findByIdAndUpdate(user_id, {
      $inc: { follower_count: 1 },
    });

    ctx.body = {
      success: true,
      message: "关注成功",
      data: {
        is_followed: true,
      },
    };
  } catch (error) {
    console.error("[关注错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "关注失败：" + error.message };
  }
});

/**
 * @swagger
 * /api/square/unfollow:
 *   post:
 *     summary: 取消关注
 *     description: 取消对指定用户的关注
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: 取消关注成功
 *       401:
 *         description: 未认证
 *       404:
 *         description: 关注记录不存在
 */
router.post("/square/unfollow", auth, async (ctx) => {
  try {
    const currentUser = ctx.state.user;
    const { user_id } = ctx.request.body;

    // 检查关注记录是否存在
    const follow = await Follow.findOneAndDelete({
      follower_id: currentUser._id,
      following_id: user_id,
    });
    if (!follow) {
      ctx.status = 404;
      ctx.body = { success: false, message: "未找到关注记录" };
      return;
    }

    // 更新用户关注数和粉丝数
    await User.findByIdAndUpdate(currentUser._id, {
      $inc: { following_count: -1 },
    });

    await User.findByIdAndUpdate(user_id, {
      $inc: { follower_count: -1 },
    });

    ctx.body = {
      success: true,
      message: "取消关注成功",
      data: {
        is_followed: false,
      },
    };
  } catch (error) {
    console.error("[取消关注错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "取消关注失败：" + error.message };
  }
});

/**
 * @swagger
 * /api/square/detail/{diary_id}:
 *   get:
 *     summary: 获取广场内容详情
 *     description: 获取指定内容的详细信息，包括作者信息、互动数据、评论列表和相关推荐
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: diary_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       404:
 *         description: 内容不存在
 */
router.get("/square/detail/:diary_id", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { diary_id } = ctx.params;
    const { page = 1, per_page = 20 } = ctx.query;

    // 获取日记详情
    const diary = await Diary.findOne({
      _id: diary_id,
      is_public: true,
      status: 1,
    }).populate("user_id", "id nickname avatar bio follower_count");

    if (!diary) {
      ctx.status = 404;
      ctx.body = { success: false, message: "日记不存在" };
      return;
    }

    // 增加阅读数
    await Diary.updateOne({ _id: diary_id }, { $inc: { view_count: 1 } });

    // 检查当前用户是否点赞
    const isLiked = await Like.exists({
      user_id: user._id,
      diary_id: diary_id,
    });

    // 检查是否关注作者
    const isFollowed = await Follow.exists({
      follower_id: user._id,
      following_id: diary.user_id._id,
    });

    // 获取评论总数
    const totalComments = await Comment.countDocuments({
      diary_id: diary_id,
      status: 1,
    });

    // 获取评论列表
    const comments = await Comment.find({
      diary_id: diary_id,
      status: 1,
    })
      .populate("user_id", "id nickname avatar")
      .sort({ created_at: -1 })
      .skip((page - 1) * per_page)
      .limit(parseInt(per_page));

    // 检查当前用户是否点赞每条评论
    const commentIds = comments.map((comment) => comment._id);
    const userCommentLikes = await CommentLike.find({
      user_id: user._id,
      comment_id: { $in: commentIds },
    });
    const likedCommentIds = new Set(
      userCommentLikes.map((like) => like.comment_id.toString()),
    );

    // 标记评论是否被当前用户点赞
    const commentsWithLikeStatus = comments.map((comment) => ({
      id: comment._id,
      user: {
        id: comment.user_id._id,
        nickname: comment.user_id.nickname,
        avatar: comment.user_id.avatar,
      },
      content: comment.content,
      like_count: comment.like_count || 0,
      is_liked: likedCommentIds.has(comment._id.toString()),
      created_at: comment.created_at,
      reply_to: comment.reply_to || null,
    }));

    // 获取推荐日记（同标签或同作者）
    const recommendations = await Diary.find({
      _id: { $ne: diary_id },
      is_public: true,
      status: 1,
      $or: [{ user_id: diary.user_id._id }, { tags: { $in: diary.tags } }],
    })
      .populate("user_id", "nickname avatar")
      .sort({ like_count: -1 })
      .limit(6);

    const recommendedDiaries = recommendations.map((rec) => ({
      id: rec._id,
      title: rec.title,
      cover: rec.cover,
      author: {
        nickname: rec.user_id.nickname,
        avatar: rec.user_id.avatar,
      },
      like_count: rec.like_count,
    }));

    // 构建返回数据
    const result = {
      id: diary._id,
      title: diary.title,
      content: diary.content,
      cover: diary.cover,
      images: diary.images,
      tags: diary.tags,
      weather: diary.weather,
      mood: diary.mood,
      signature: diary.signature,
      location: diary.location,
      created_at: diary.created_at,
      updated_at: diary.updated_at,
      diary_date: diary.diary_date,
      author: {
        id: diary.user_id._id,
        nickname: diary.user_id.nickname,
        avatar: diary.user_id.avatar,
        bio: diary.user_id.bio,
        follower_count: diary.user_id.follower_count,
        is_followed: isFollowed,
      },
      stats: {
        like_count: diary.like_count,
        comment_count: totalComments, // 使用实时查询的评论总数
        share_count: diary.share_count,
        view_count: diary.view_count + 1, // 加上本次阅读
      },
      is_liked: isLiked,
      is_favorited: false, // 收藏功能暂未实现
      is_owner: diary.user_id._id.toString() === user._id.toString(),
      comments: {
        total: totalComments,
        page: parseInt(page),
        per_page: parseInt(per_page),
        items: commentsWithLikeStatus,
      },
      recommendations: recommendedDiaries,
    };

    ctx.body = {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("[获取广场内容详情错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取广场内容详情失败：" + error.message,
    };
  }
});

router.post("/square/share", auth, async (ctx) => {
  try {
    const { diary_id } = ctx.request.body || {};

    if (!diary_id) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "缺少日记ID",
      };
      return;
    }

    const diary = await Diary.findOne({
      _id: diary_id,
      is_public: true,
      status: 1,
    });

    if (!diary) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "广场日记不存在",
      };
      return;
    }

    diary.share_count = (diary.share_count || 0) + 1;
    await diary.save();

    ctx.body = {
      success: true,
      message: "分享计数成功",
      data: {
        id: diary._id,
        share_count: diary.share_count,
      },
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "分享失败：" + error.message,
    };
  }
});

router.post("/square/block", auth, async (ctx) => {
  try {
    const blockerId = ctx.state.user._id;
    const { user_id, reason = "广场内容不感兴趣" } = ctx.request.body || {};

    if (!user_id) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "缺少用户ID",
      };
      return;
    }

    if (String(user_id) === String(blockerId)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "不能拉黑自己",
      };
      return;
    }

    const targetUser = await User.findById(user_id);
    if (!targetUser) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "用户不存在",
      };
      return;
    }

    const existing = await UserBlock.findOne({ blockerId, blockedUserId: user_id });
    if (existing) {
      ctx.body = {
        success: true,
        message: "该用户已在黑名单中",
      };
      return;
    }

    await UserBlock.create({
      blockerId,
      blockedUserId: user_id,
      reason: String(reason || "").trim(),
    });

    ctx.body = {
      success: true,
      message: "已加入黑名单",
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "拉黑失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/square/comment/like:
 *   post:
 *     summary: 点赞评论
 *     description: 为指定评论点赞
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment_id
 *             properties:
 *               comment_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: 点赞成功
 *       401:
 *         description: 未认证
 *       404:
 *         description: 评论不存在
 */
router.post("/square/comment/like", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { comment_id } = ctx.request.body;

    // 检查评论是否存在
    const comment = await Comment.findById(comment_id);
    if (!comment) {
      ctx.status = 404;
      ctx.body = { success: false, message: "评论不存在" };
      return;
    }

    // 检查是否已经点赞
    const existingLike = await CommentLike.findOne({
      user_id: user._id,
      comment_id,
    });
    if (existingLike) {
      ctx.body = { success: false, message: "已经点赞过了" };
      return;
    }

    // 创建点赞记录
    const like = new CommentLike({ user_id: user._id, comment_id });
    await like.save();

    // 更新评论点赞数
    comment.like_count = (comment.like_count || 0) + 1;
    await comment.save();

    ctx.body = {
      success: true,
      message: "点赞成功",
      data: {
        like_count: comment.like_count,
        is_liked: true,
      },
    };
  } catch (error) {
    console.error("[评论点赞错误]:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: "评论点赞失败：" + error.message };
  }
});

/**
 * @swagger
 * /api/square/comment/unlike:
 *   post:
 *     summary: 取消评论点赞
 *     description: 取消对指定评论的点赞
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment_id
 *             properties:
 *               comment_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: 取消点赞成功
 *       401:
 *         description: 未认证
 *       404:
 *         description: 点赞记录不存在
 */
router.post("/square/comment/unlike", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { comment_id } = ctx.request.body;

    // 检查点赞记录是否存在
    const like = await CommentLike.findOneAndDelete({
      user_id: user._id,
      comment_id,
    });
    if (!like) {
      ctx.status = 404;
      ctx.body = { success: false, message: "未找到点赞记录" };
      return;
    }

    // 更新评论点赞数
    const comment = await Comment.findById(comment_id);
    if (comment) {
      comment.like_count = Math.max(0, (comment.like_count || 0) - 1);
      await comment.save();

      ctx.body = {
        success: true,
        message: "取消点赞成功",
        data: {
          like_count: comment.like_count,
          is_liked: false,
        },
      };
    } else {
      ctx.status = 404;
      ctx.body = { success: false, message: "评论不存在" };
    }
  } catch (error) {
    console.error("[取消评论点赞错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "取消评论点赞失败：" + error.message,
    };
  }
});

// 注册路由前缀
router.prefix("/api");

module.exports = router;
