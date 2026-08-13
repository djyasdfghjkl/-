const Diary = require("../models/Diary");
const DiaryAnalysis = require("../models/DiaryAnalysis");
const CaringQuote = require("../models/CaringQuote");

const caringQuotes = {
  positive: [
    "今天的你看起来心情不错，愿这份轻盈延续到明天。",
    "快乐值得被认真记录，继续把这份明亮留给生活。",
    "看见你状态在线，真好，愿好运继续发生。",
    "今天也是很有能量的一天，记得为自己点个赞。",
    "心情舒展的时候，连风都像在鼓励你。",
  ],
  neutral: [
    "平常的一天也值得被温柔记下。",
    "生活不一定轰轰烈烈，安稳本身就很珍贵。",
    "继续写下去，你会慢慢看见自己的节奏。",
    "很多温暖都藏在普通日子里。",
    "记录本身，就是在认真对待自己。",
  ],
  negative: [
    "低落的时候还能写下来，本身就是一种勇敢。",
    "先允许自己慢一点，你已经很努力了。",
    "不开心不是失败，只是你也需要被照顾。",
    "把情绪写出来，会比一个人扛着轻一点。",
    "今天难一点也没关系，先把自己放在第一位。",
    "累了就歇一会儿，恢复元气比逞强更重要。",
  ],
  streak: [
    "你已经连续记录 {days} 天了，坚持真的很了不起。",
    "连续 {days} 天的你，很稳，也很棒。",
    "{days} 天的坚持，是你给自己的长期温柔。",
    "别小看这 {days} 天，它们都在证明你的成长。",
  ],
  topics: {
    工作: {
      positive: ["工作状态在线，继续保持这份踏实和光亮。"],
      neutral: ["工作中的普通日常，也在一点点积累你的能力。"],
      negative: [
        "工作辛苦了，记得下班以后把自己还给生活。",
        "压力只是阶段性的，照顾好自己比什么都重要。",
      ],
    },
    学习: {
      positive: ["学习有进展的感觉很棒，继续往前。"],
      neutral: ["学习是缓慢积累的过程，别急，慢慢来。"],
      negative: [
        "遇到卡点很正常，先停一停，再回来解决它。",
        "累了就休息，恢复状态比硬撑更有效。",
      ],
    },
    生活: {
      positive: ["你在认真生活，这件事本身就很闪亮。"],
      neutral: ["生活会有起伏，但日常里也有很多值得收藏的片段。"],
      negative: ["生活偶尔不顺也没关系，先把今天过好。"],
    },
    情感: {
      positive: ["被爱和理解包围的感觉，值得珍惜。"],
      neutral: ["情感里的起伏，也是在帮你更了解自己。"],
      negative: ["受伤的时候，更要记得温柔地站在自己这边。"],
    },
  },
};

class CaringMessageGenerator {
  static getRandomQuote(quotes) {
    if (!Array.isArray(quotes) || !quotes.length) return "";
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  static weightedPick(quotes) {
    if (!Array.isArray(quotes) || !quotes.length) return null;
    const expanded = quotes.flatMap((quote) =>
      Array.from({ length: Math.max(Number(quote.weight) || 1, 1) }, () => quote),
    );
    return expanded[Math.floor(Math.random() * expanded.length)] || quotes[0];
  }

  static async calculateStreak(userId) {
    try {
      const diaries = await Diary.find({ user_id: userId, status: 1 })
        .select("diary_date createdAt")
        .sort({ diary_date: -1, createdAt: -1 });

      if (!diaries.length) return 0;

      const uniqueDates = Array.from(
        new Set(
          diaries.map((diary) => {
            const date = new Date(diary.diary_date || diary.createdAt);
            return date.toISOString().split("T")[0];
          }),
        ),
      ).sort().reverse();

      let streak = 0;
      for (let i = 0; i < uniqueDates.length; i += 1) {
        const expected = new Date();
        expected.setDate(expected.getDate() - i);
        const expectedDate = expected.toISOString().split("T")[0];
        if (uniqueDates[i] === expectedDate) {
          streak += 1;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error("[计算连续写作天数错误]:", error);
      return 0;
    }
  }

  static async analyzeUserState(userId) {
    try {
      const recentAnalyses = await DiaryAnalysis.find({ user_id: userId })
        .sort({ created_at: -1 })
        .limit(30);
      const recentDiaries = await Diary.find({ user_id: userId, status: 1 })
        .sort({ diary_date: -1, createdAt: -1 })
        .limit(30)
        .select("mood tags diary_date createdAt");

      if (!recentAnalyses.length && !recentDiaries.length) {
        return {
          avgSentiment: 0,
          sentiment: "neutral",
          topTopics: [],
          topMoods: [],
          streak: 0,
        };
      }

      const avgSentiment = recentAnalyses.length
        ? recentAnalyses.reduce((sum, item) => sum + (item.sentiment_score || 0), 0) /
          recentAnalyses.length
        : 0;

      const sentiment =
        avgSentiment > 0.2 ? "positive" : avgSentiment < -0.2 ? "negative" : "neutral";

      const topicCount = {};
      recentAnalyses.forEach((item) => {
        (item.topics || []).forEach((topic) => {
          topicCount[topic] = (topicCount[topic] || 0) + 1;
        });
      });

      const moodCount = {};
      recentDiaries.forEach((diary) => {
        if (diary.mood) {
          moodCount[diary.mood] = (moodCount[diary.mood] || 0) + 1;
        }
      });

      return {
        avgSentiment: Number(avgSentiment.toFixed(2)),
        sentiment,
        topTopics: Object.entries(topicCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([topic]) => topic),
        topMoods: Object.entries(moodCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([mood]) => mood),
        streak: await this.calculateStreak(userId),
      };
    } catch (error) {
      console.error("[分析用户状态错误]:", error);
      return {
        avgSentiment: 0,
        sentiment: "neutral",
        topTopics: [],
        topMoods: [],
        streak: 0,
      };
    }
  }

  static async findManagedQuote(state) {
    const quotes = await CaringQuote.find({
      enabled: true,
      sentiment: { $in: [state.sentiment, "all"] },
    }).lean();

    if (!quotes.length) return null;

    const moodSet = new Set(state.topMoods || []);
    const topicSet = new Set(state.topTopics || []);

    const scored = quotes
      .map((quote) => {
        let score = 0;
        if (quote.sentiment === state.sentiment) score += 3;
        if ((quote.moods || []).some((mood) => moodSet.has(mood))) score += 4;
        if ((quote.tags || []).some((tag) => topicSet.has(tag))) score += 4;
        if (!(quote.moods || []).length) score += 1;
        if (!(quote.tags || []).length) score += 1;
        return { ...quote, _score: score };
      })
      .filter((quote) => quote._score > 0)
      .sort((a, b) => b._score - a._score);

    return this.weightedPick(scored);
  }

  static async generate(userId) {
    try {
      const state = await this.analyzeUserState(userId);
      const managedQuote = await this.findManagedQuote(state);

      const caring_message =
        managedQuote?.text ||
        this.getRandomQuote(caringQuotes[state.sentiment] || caringQuotes.neutral);

      const streak_tips =
        state.streak >= 3
          ? this.getRandomQuote(caringQuotes.streak).replace("{days}", String(state.streak))
          : "";

      let topic_tip = "";
      const mainTopic = state.topTopics[0];
      if (mainTopic && caringQuotes.topics[mainTopic]) {
        const topicQuotes =
          caringQuotes.topics[mainTopic][state.sentiment] || caringQuotes.topics[mainTopic].neutral;
        topic_tip = this.getRandomQuote(topicQuotes);
      }

      return {
        ...state,
        caring_message,
        streak_tips,
        topic_tip,
      };
    } catch (error) {
      console.error("[生成关怀语录错误]:", error);
      return {
        avgSentiment: 0,
        sentiment: "neutral",
        topTopics: [],
        topMoods: [],
        streak: 0,
        caring_message: "记录生活，也是在照顾自己。",
        streak_tips: "",
        topic_tip: "",
      };
    }
  }

  static async refresh(userId, currentSentiment, moods = [], tags = []) {
    const state = {
      sentiment: currentSentiment || "neutral",
      topMoods: Array.isArray(moods) ? moods : [],
      topTopics: Array.isArray(tags) ? tags : [],
    };

    const managedQuote = await this.findManagedQuote(state);
    if (managedQuote?.text) {
      return {
        caring_message: managedQuote.text,
      };
    }

    return {
      caring_message: this.getRandomQuote(
        caringQuotes[state.sentiment] || caringQuotes.neutral,
      ),
    };
  }
}

module.exports = CaringMessageGenerator;
