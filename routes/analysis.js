const Router = require("koa-router");
const router = new Router();
const auth = require("../middleware/auth");
const Diary = require("../models/Diary");
const DiaryAnalysis = require("../models/DiaryAnalysis");
const UserAnalysisSummary = require("../models/UserAnalysisSummary");
const UserTopicSentiment = require("../models/UserTopicSentiment");
const DiaryAnalyzer = require("../utils/diaryAnalyzer");
const CaringMessageGenerator = require("../utils/caringMessages");

const buildMoodDistribution = (diaries = []) => {
  const moodCount = {};
  diaries.forEach((diary) => {
    if (!diary.mood) return;
    moodCount[diary.mood] = (moodCount[diary.mood] || 0) + 1;
  });

  return Object.entries(moodCount)
    .sort((a, b) => b[1] - a[1])
    .map(([mood, count]) => ({ mood, count }));
};

const buildWritingTimes = (diaries = []) => {
  const writingTimes = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  };

  diaries.forEach((diary) => {
    if (!diary.createdAt) return;
    const hour = new Date(diary.createdAt).getHours();
    if (hour >= 6 && hour < 12) writingTimes.morning += 1;
    else if (hour >= 12 && hour < 18) writingTimes.afternoon += 1;
    else if (hour >= 18 && hour < 24) writingTimes.evening += 1;
    else writingTimes.night += 1;
  });

  return writingTimes;
};

const buildTopicDistributionFromTags = (diaries = [], limit = 10) => {
  const tagCount = {};
  diaries.forEach((diary) => {
    (diary.tags || []).forEach((tag) => {
      if (!tag) return;
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });

  return Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([topic, count]) => ({ topic, count }));
};

const buildDiaryStreak = (diaries = []) => {
  const dateSet = new Set(
    diaries
      .filter((diary) => diary.diary_date)
      .map((diary) => new Date(diary.diary_date).toISOString().split("T")[0]),
  );
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (dateSet.has(cursor.toISOString().split("T")[0])) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

// 分析功能逻辑函数
const AnalysisHandlers = {
  async getOverview(user) {
    const diaries = await Diary.find({ user_id: user._id, status: 1 }).lean();
    const totalDiaries = diaries.length;
    const totalWords = diaries.reduce(
      (sum, diary) => sum + (diary.word_count || String(diary.content || "").length || 0),
      0,
    );
    const writingTimes = buildWritingTimes(diaries);
    const moodDistribution = buildMoodDistribution(diaries);
    const diaryStreak = buildDiaryStreak(diaries);

    // 获取用户所有日记分析
    const analyses = await DiaryAnalysis.find({ user_id: user._id });

    if (analyses.length === 0) {
      const caringData = await CaringMessageGenerator.generate(user._id);
      return {
        total_diaries: totalDiaries,
        total_words: totalWords,
        avg_sentiment: 0,
        positive_ratio: 0,
        neutral_ratio: 0,
        negative_ratio: 0,
        top_topics: buildTopicDistributionFromTags(diaries),
        top_keywords: [],
        mood_distribution: moodDistribution,
        dominant_mood: moodDistribution[0]?.mood || "",
        writing_times: writingTimes,
        caring_message: caringData.caring_message,
        streak_tips: caringData.streak_tips,
        topic_tip: caringData.topic_tip,
        streak: diaryStreak || caringData.streak || 0,
      };
    }

    // 计算统计数据
    const analyzedCount = analyses.length;
    const realTotalDiaries = totalDiaries || analyzedCount;
    const realTotalWords =
      totalWords || analyses.reduce((sum, analysis) => sum + (analysis.word_count || 0), 0);
    const avgSentiment =
      analyses.reduce((sum, a) => sum + (a.sentiment_score || 0), 0) /
      analyzedCount;

    // 统计情感分布
    let positiveCount = 0,
      neutralCount = 0,
      negativeCount = 0;
    analyses.forEach((a) => {
      if (a.sentiment === "positive") positiveCount++;
      else if (a.sentiment === "negative") negativeCount++;
      else neutralCount++;
    });

    // 统计主题和关键词
    const topicCount = {};
    const keywordCount = {};
    analyses.forEach((a) => {
      (a.topics || []).forEach((topic) => {
        topicCount[topic] = (topicCount[topic] || 0) + 1;
      });
      (a.keywords || []).forEach((keyword) => {
        keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
      });
    });

    // 生成关怀语录
    const caringData = await CaringMessageGenerator.generate(user._id);

    return {
      total_diaries: realTotalDiaries,
      total_words: realTotalWords,
      avg_sentiment: parseFloat(avgSentiment.toFixed(2)),
      positive_ratio: parseFloat((positiveCount / analyzedCount).toFixed(2)),
      neutral_ratio: parseFloat((neutralCount / analyzedCount).toFixed(2)),
      negative_ratio: parseFloat((negativeCount / analyzedCount).toFixed(2)),
      top_topics: Object.entries(topicCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([topic, count]) => ({ topic, count })),
      top_keywords: Object.entries(keywordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word, count]) => ({ word, count })),
      mood_distribution: moodDistribution,
      dominant_mood: moodDistribution[0]?.mood || "",
      writing_times: writingTimes,
      caring_message: caringData.caring_message,
      streak_tips: caringData.streak_tips,
      topic_tip: caringData.topic_tip,
      streak: diaryStreak || caringData.streak || 0,
    };
  },

  async getSentimentTrend(user, type = "day", range = 30) {
    // 获取用户所有日记分析，按时间排序
    const analyses = await DiaryAnalysis.find({ user_id: user._id }).sort({
      created_at: -1,
    });

    // 获取关联的日记信息
    const diaryIds = analyses.map((a) => a.diary_id);
    const diaries = await Diary.find({ _id: { $in: diaryIds } });

    const diaryMap = {};
    diaries.forEach((d) => {
      diaryMap[d._id.toString()] = d;
    });

    // 按日期分组
    const trendData = {};
    analyses.forEach((analysis) => {
      const diary = diaryMap[analysis.diary_id.toString()];
      if (!diary) return;

      let dateKey;
      const date = new Date(diary.diary_date || diary.createdAt);

      if (type === "day") {
        dateKey = date.toISOString().split("T")[0];
      } else if (type === "week") {
        // 获取周开始日期（周一）
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(date.setDate(diff));
        dateKey = weekStart.toISOString().split("T")[0];
      } else if (type === "month") {
        dateKey = date.toISOString().slice(0, 7);
      }

      if (!trendData[dateKey]) {
        trendData[dateKey] = {
          total_sentiment: 0,
          count: 0,
          diary_count: 0,
        };
      }

      trendData[dateKey].total_sentiment += analysis.sentiment_score || 0;
      trendData[dateKey].count++;
      trendData[dateKey].diary_count++;
    });

    // 转换为数组并排序
    const labels = Object.keys(trendData).sort().slice(-range);
    const values = labels.map((label) => {
      const data = trendData[label];
      return parseFloat((data.total_sentiment / data.count).toFixed(2));
    });
    const diaryCounts = labels.map((label) => trendData[label].diary_count);

    return { labels, values, diary_counts: diaryCounts };
  },

  async getWordcloud(user, limit = 50) {
    // 获取用户所有日记分析
    const analyses = await DiaryAnalysis.find({ user_id: user._id });

    // 词云过滤规则 - 只保留中文字符
    const shouldFilterWordCloudWord = (word) => {
      // 只保留包含中文字符的词
      if (!/[\u4e00-\u9fa5]/.test(word)) {
        return true;
      }

      const lowerWord = word.toLowerCase();

      // 过滤URL相关
      if (
        lowerWord.includes("http") ||
        lowerWord.includes("www") ||
        lowerWord.includes(".com") ||
        lowerWord.includes(".cn") ||
        lowerWord.includes(".net") ||
        lowerWord.includes(".io") ||
        lowerWord.includes(".dev") ||
        lowerWord.includes(".org")
      ) {
        return true;
      }

      // 过滤技术术语和文件名
      const techTerms = [
        "image",
        "jpg",
        "jpeg",
        "png",
        "gif",
        "bmp",
        "webp",
        "svg",
        "mp3",
        "mp4",
        "wav",
        "pdf",
        "doc",
        "docx",
        "xls",
        "xlsx",
        "zip",
        "rar",
        "tar",
        "gz",
        "7z",
        "ngrok",
        "free",
        "dev",
      ];
      if (techTerms.includes(lowerWord)) {
        return true;
      }

      // 过滤纯数字
      if (/^[0-9]+$/.test(word)) {
        return true;
      }

      // 过滤包含特殊字符的词
      if (/[!@#$%^&*()_+=\[\]{};:'"\\|,.<>/?`~]/.test(word)) {
        return true;
      }

      return false;
    };

    // 统计关键词
    const keywordCount = {};
    analyses.forEach((analysis) => {
      (analysis.keywords || []).forEach((keyword) => {
        if (keyword && !shouldFilterWordCloudWord(keyword)) {
          keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
        }
      });
    });

    // 计算最大频次用于归一化
    const maxCount = Math.max(...Object.values(keywordCount), 1);

    // 转换为词云格式
    return Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word, count]) => ({
        word,
        weight: parseFloat((count / maxCount).toFixed(2)),
      }));
  },

  async getWritingHabit(user) {
    const diaries = await Diary.find({ user_id: user._id, status: 1 });
    const writingTimes = {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0,
    };

    diaries.forEach((diary) => {
      if (diary.createdAt) {
        const hour = new Date(diary.createdAt).getHours();
        if (hour >= 6 && hour < 12) writingTimes.morning++;
        else if (hour >= 12 && hour < 18) writingTimes.afternoon++;
        else if (hour >= 18 && hour < 24) writingTimes.evening++;
        else writingTimes.night++;
      }
    });

    return {
      writing_times: writingTimes,
      total_diaries: diaries.length,
    };
  },
};

/**
 * @swagger
 * /api/analysis/diary/{diary_id}:
 *   get:
 *     summary: 获取单篇日记分析结果
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: diary_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get("/analysis/diary/:diary_id", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { diary_id } = ctx.params;

    // 查找日记
    const diary = await Diary.findOne({
      _id: diary_id,
      user_id: user._id,
      status: 1,
    });

    if (!diary) {
      ctx.status = 404;
      ctx.body = { success: false, message: "日记不存在" };
      return;
    }

    // 查找分析结果
    let analysis = await DiaryAnalysis.findOne({ diary_id: diary._id });

    // 如果没有分析结果，立即进行分析
    if (!analysis) {
      analysis = await DiaryAnalyzer.analyzeDiary(diary);
    }

    ctx.body = {
      success: true,
      data: analysis,
    };
  } catch (error) {
    console.error("[获取日记分析错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取日记分析失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/analysis/diary/{diary_id}:
 *   post:
 *     summary: 重新分析日记
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: diary_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 分析成功
 */
router.post("/analysis/diary/:diary_id", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { diary_id } = ctx.params;

    // 查找日记
    const diary = await Diary.findOne({
      _id: diary_id,
      user_id: user._id,
      status: 1,
    });

    if (!diary) {
      ctx.status = 404;
      ctx.body = { success: false, message: "日记不存在" };
      return;
    }

    // 重新分析
    const analysis = await DiaryAnalyzer.analyzeDiary(diary);

    ctx.body = {
      success: true,
      message: "分析成功",
      data: analysis,
    };
  } catch (error) {
    console.error("[重新分析日记错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "分析失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/analysis/overview:
 *   get:
 *     summary: 获取用户分析概览
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get("/analysis/overview", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const data = await AnalysisHandlers.getOverview(user);
    ctx.body = { success: true, data };
  } catch (error) {
    console.error("[获取用户分析概览错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取分析概览失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/user/analysis/overview:
 *   get:
 *     summary: 获取用户分析概览（兼容路径）
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get("/user/analysis/overview", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const data = await AnalysisHandlers.getOverview(user);
    ctx.body = { success: true, data };
  } catch (error) {
    console.error("[获取用户分析概览错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取分析概览失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/analysis/sentiment-trend:
 *   get:
 *     summary: 获取情感趋势
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *       - in: query
 *         name: range
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get("/analysis/sentiment-trend", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { type = "day", range = 30 } = ctx.query;
    const data = await AnalysisHandlers.getSentimentTrend(
      user,
      type,
      parseInt(range),
    );
    ctx.body = { success: true, data };
  } catch (error) {
    console.error("[获取情感趋势错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取情感趋势失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/user/analysis/sentiment-trend:
 *   get:
 *     summary: 获取情感趋势（兼容路径）
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *       - in: query
 *         name: range
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get("/user/analysis/sentiment-trend", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { type = "day", range = 30 } = ctx.query;
    const data = await AnalysisHandlers.getSentimentTrend(
      user,
      type,
      parseInt(range),
    );
    ctx.body = { success: true, data };
  } catch (error) {
    console.error("[获取情感趋势错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取情感趋势失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/analysis/topic-sentiment:
 *   get:
 *     summary: 获取主题情感关联
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get("/analysis/topic-sentiment", auth, async (ctx) => {
  try {
    const user = ctx.state.user;

    // 获取用户所有日记分析
    const analyses = await DiaryAnalysis.find({ user_id: user._id });

    // 按主题统计情感
    const topicStats = {};
    analyses.forEach((analysis) => {
      (analysis.topics || []).forEach((topic) => {
        if (!topicStats[topic]) {
          topicStats[topic] = {
            topic,
            positive: 0,
            neutral: 0,
            negative: 0,
            total_sentiment: 0,
            count: 0,
          };
        }

        if (analysis.sentiment === "positive") topicStats[topic].positive++;
        else if (analysis.sentiment === "negative")
          topicStats[topic].negative++;
        else topicStats[topic].neutral++;

        topicStats[topic].total_sentiment += analysis.sentiment_score || 0;
        topicStats[topic].count++;
      });
    });

    // 转换为数组
    const result = Object.values(topicStats)
      .sort((a, b) => b.count - a.count)
      .map((stat) => ({
        topic: stat.topic,
        positive: stat.positive,
        neutral: stat.neutral,
        negative: stat.negative,
        avg: parseFloat((stat.total_sentiment / stat.count).toFixed(2)),
      }));

    ctx.body = {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("[获取主题情感关联错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取主题情感关联失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/analysis/wordcloud:
 *   get:
 *     summary: 获取词云数据
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get("/analysis/wordcloud", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { limit = 50 } = ctx.query;
    const data = await AnalysisHandlers.getWordcloud(user, parseInt(limit));
    ctx.body = { success: true, data };
  } catch (error) {
    console.error("[获取词云数据错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取词云数据失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/user/analysis/wordcloud:
 *   get:
 *     summary: 获取词云数据（兼容路径）
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get("/user/analysis/wordcloud", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { limit = 50 } = ctx.query;
    const data = await AnalysisHandlers.getWordcloud(user, parseInt(limit));
    ctx.body = { success: true, data };
  } catch (error) {
    console.error("[获取词云数据错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取词云数据失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/user/analysis/writing-habit:
 *   get:
 *     summary: 获取写作习惯（时段分布）
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get("/user/analysis/writing-habit", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const data = await AnalysisHandlers.getWritingHabit(user);
    ctx.body = { success: true, data };
  } catch (error) {
    console.error("[获取写作习惯错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取写作习惯失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/analysis/tag:
 *   post:
 *     summary: 按标签分析日记
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tags
 *             properties:
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 分析成功
 */
router.post("/analysis/tag", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { tags } = ctx.request.body;

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      ctx.status = 400;
      ctx.body = { success: false, message: "请提供标签" };
      return;
    }

    // 查找包含这些标签的日记
    const diaries = await Diary.find({
      user_id: user._id,
      status: 1,
      tags: { $in: tags },
    }).sort({ diary_date: -1 });

    // 获取这些日记的分析结果
    const diaryIds = diaries.map((d) => d._id);
    const analyses = await DiaryAnalysis.find({
      diary_id: { $in: diaryIds },
    });

    const analysisMap = {};
    analyses.forEach((a) => {
      analysisMap[a.diary_id.toString()] = a;
    });

    // 统计结果
    let totalSentiment = 0;
    let positiveCount = 0,
      neutralCount = 0,
      negativeCount = 0;
    const keywordCount = {};
    const topicCount = {};

    diaries.forEach((diary) => {
      const analysis = analysisMap[diary._id.toString()];
      if (analysis) {
        totalSentiment += analysis.sentiment_score || 0;
        if (analysis.sentiment === "positive") positiveCount++;
        else if (analysis.sentiment === "negative") negativeCount++;
        else neutralCount++;

        (analysis.keywords || []).forEach((keyword) => {
          keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
        });
        (analysis.topics || []).forEach((topic) => {
          topicCount[topic] = (topicCount[topic] || 0) + 1;
        });
      }
    });

    const totalCount = diaries.length;
    const avgSentiment = totalCount > 0 ? totalSentiment / totalCount : 0;

    ctx.body = {
      success: true,
      data: {
        tags,
        total_diaries: totalCount,
        avg_sentiment: parseFloat(avgSentiment.toFixed(2)),
        sentiment_distribution: {
          positive: positiveCount,
          neutral: neutralCount,
          negative: negativeCount,
        },
        top_keywords: Object.entries(keywordCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([word, count]) => ({ word, count })),
        top_topics: Object.entries(topicCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([topic, count]) => ({ topic, count })),
        diaries: diaries.map((diary) => ({
          id: diary._id,
          title: diary.title,
          content: diary.content?.substring(0, 100) + "...",
          diary_date: diary.diary_date,
          mood: diary.mood,
          weather: diary.weather,
          tags: diary.tags,
          analysis: analysisMap[diary._id.toString()] || null,
        })),
      },
    };
  } catch (error) {
    console.error("[标签分析错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "标签分析失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/analysis/caring-message/refresh:
 *   post:
 *     summary: 刷新关怀语录
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sentiment:
 *                 type: string
 *                 enum: [positive, neutral, negative]
 *     responses:
 *       200:
 *         description: 刷新成功
 */
router.post("/analysis/caring-message/refresh", auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { sentiment, moods = [], tags = [] } = ctx.request.body;

    const newMessage = await CaringMessageGenerator.refresh(
      user._id,
      sentiment,
      moods,
      tags,
    );

    ctx.body = {
      success: true,
      data: newMessage,
    };
  } catch (error) {
    console.error("[刷新关怀语录错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "刷新关怀语录失败：" + error.message,
    };
  }
});

/**
 * @swagger
 * /api/analysis/reanalyze-all:
 *   post:
 *     summary: 重新分析所有日记（清理旧数据）
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 重新分析成功
 */
router.post("/analysis/reanalyze-all", auth, async (ctx) => {
  try {
    const user = ctx.state.user;

    // 获取用户所有日记
    const diaries = await Diary.find({ user_id: user._id, status: 1 });

    // 删除旧的分析数据
    await DiaryAnalysis.deleteMany({ user_id: user._id });

    // 重新分析每篇日记
    let successCount = 0;
    for (const diary of diaries) {
      try {
        await DiaryAnalyzer.analyzeDiary(diary);
        successCount++;
      } catch (error) {
        console.error(`分析日记失败 diary_id=${diary._id}:`, error);
      }
    }

    ctx.body = {
      success: true,
      message: `重新分析完成，成功 ${successCount}/${diaries.length} 篇`,
      data: {
        total: diaries.length,
        success: successCount,
      },
    };
  } catch (error) {
    console.error("[重新分析所有日记错误]:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "重新分析失败：" + error.message,
    };
  }
});

// 注册路由前缀
router.prefix("/api");

module.exports = router;
