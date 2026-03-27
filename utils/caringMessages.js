const Diary = require("../models/Diary");
const DiaryAnalysis = require("../models/DiaryAnalysis");

// 关怀语录库
const caringQuotes = {
  positive: [
    "今天的你看起来心情不错呢！愿这份快乐延续到每一天 🌞",
    "开心的日子值得被记录，继续保持这份好心情呀 ✨",
    "看到你这么开心，真好！快乐会传染的 🌸",
    "今天是美好的一天，谢谢你愿意记录下来 🎉",
    "心情好的时候，连空气都是甜的 🍬",
  ],
  neutral: [
    "平淡的日子也藏着美好，继续用心记录吧 📝",
    "每一天都有它的意义，坚持写下去 ✍️",
    "平凡的日常，也是最珍贵的时光 💫",
    "生活就是由这样的小日子组成的呀 🌿",
    "记录本身就是一种力量，继续加油 🤍",
  ],
  negative: [
    "我知道你或许有些低落，但没关系，写下来就是一种释放。明天会更好 💪",
    "难过的时候，允许自己休息一下。你做得已经很好了 🌈",
    "每个人都会有心情不好的时候，这很正常。抱抱你 🤗",
    "心情不好的时候，就把烦恼都写出来吧。写出来，就会好受一些 🌙",
    "你不是一个人在面对这些。慢慢来，一切都会好起来的 🤍",
    "感觉累了就歇一歇，你的感受最重要 💝",
  ],
  streak: [
    "你已经连续记录 {days} 天啦！坚持是件了不起的事 🌟",
    "连续 {days} 天，你真的很棒！继续保持 🎯",
    "{days} 天的坚持，见证了你的成长 🌱",
    "坚持记录 {days} 天，为你点赞 👍",
  ],
  topics: {
    工作: {
      positive: ["工作顺利的感觉真好！继续保持 ✨"],
      neutral: ["工作虽然平凡，但也很有意义 💼"],
      negative: [
        "工作压力是暂时的，记得照顾好自己 💼",
        "工作辛苦了，下班后好好放松一下 🍵",
        "忙完这阵，记得给自己放个假 🏖️",
      ],
    },
    学习: {
      positive: ["学习进步的感觉真棒！继续加油 📚"],
      neutral: ["学习是一辈子的事，慢慢来 📖"],
      negative: [
        "学习遇到困难很正常，别着急，一步步来 💪",
        "累了就休息一下，然后再继续 🎓",
      ],
    },
    生活: {
      positive: ["热爱生活的你，真的很棒 🌻"],
      neutral: ["生活就是这样，有起有落 🎭"],
      negative: ["生活总会有不如意，但都会过去的 🌅"],
    },
    旅行: {
      positive: ["旅行的回忆真美好！期待下次出发 ✈️"],
      neutral: ["旅行让人开阔眼界 🌍"],
      negative: ["旅途虽有疲惫，但风景值得 🏞️"],
    },
    情感: {
      positive: ["被爱着的感觉真好 💕"],
      neutral: ["情感的起伏，都是成长 🎭"],
      negative: ["受伤的时候，更要好好爱自己 💜"],
    },
  },
};

class CaringMessageGenerator {
  // 获取随机语录
  static getRandomQuote(quotes) {
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  // 计算连续写作天数
  static async calculateStreak(userId) {
    try {
      const diaries = await Diary.find({
        user_id: userId,
        status: 1,
      })
        .select("diary_date created_at")
        .sort({ diary_date: -1 });

      if (diaries.length === 0) return 0;

      // 获取所有日记日期（去重）
      const uniqueDates = new Set();
      diaries.forEach((diary) => {
        const date = new Date(diary.diary_date || diary.createdAt);
        const dateStr = date.toISOString().split("T")[0];
        uniqueDates.add(dateStr);
      });

      const sortedDates = Array.from(uniqueDates).sort().reverse();

      let streak = 0;
      const today = new Date().toISOString().split("T")[0];

      for (let i = 0; i < sortedDates.length; i++) {
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - i);
        const expectedDateStr = expectedDate.toISOString().split("T")[0];

        if (sortedDates[i] === expectedDateStr || (i === 0 && sortedDates[i] <= today)) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error("[计算连续天数错误]:", error);
      return 0;
    }
  }

  // 分析用户状态
  static async analyzeUserState(userId) {
    try {
      // 获取最近的分析结果
      const recentAnalyses = await DiaryAnalysis.find({ user_id: userId })
        .sort({ created_at: -1 })
        .limit(30);

      if (recentAnalyses.length === 0) {
        return {
          avgSentiment: 0,
          sentiment: "neutral",
          topTopics: [],
          streak: 0,
        };
      }

      // 计算平均情感得分
      const avgSentiment =
        recentAnalyses.reduce((sum, a) => sum + (a.sentiment_score || 0), 0) /
        recentAnalyses.length;

      // 确定主要情感
      let sentiment;
      if (avgSentiment > 0.2) {
        sentiment = "positive";
      } else if (avgSentiment < -0.2) {
        sentiment = "negative";
      } else {
        sentiment = "neutral";
      }

      // 获取高频主题
      const topicCount = {};
      recentAnalyses.forEach((a) => {
        (a.topics || []).forEach((topic) => {
          topicCount[topic] = (topicCount[topic] || 0) + 1;
        });
      });

      const topTopics = Object.entries(topicCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([topic]) => topic);

      // 计算连续写作天数
      const streak = await this.calculateStreak(userId);

      return {
        avgSentiment: parseFloat(avgSentiment.toFixed(2)),
        sentiment,
        topTopics,
        streak,
      };
    } catch (error) {
      console.error("[分析用户状态错误]:", error);
      return {
        avgSentiment: 0,
        sentiment: "neutral",
        topTopics: [],
        streak: 0,
      };
    }
  }

  // 生成关怀语录
  static async generate(userId) {
    try {
      const state = await this.analyzeUserState(userId);

      const messages = {
        caring_message: "",
        streak_tips: "",
        topic_tip: "",
      };

      // 基础情感语录
      messages.caring_message = this.getRandomQuote(
        caringQuotes[state.sentiment] || caringQuotes.neutral,
      );

      // 连续写作提示
      if (state.streak >= 3) {
        const streakQuote = this.getRandomQuote(caringQuotes.streak);
        messages.streak_tips = streakQuote.replace("{days}", state.streak.toString());
      }

      // 主题特定提示
      if (state.topTopics.length > 0) {
        const mainTopic = state.topTopics[0];
        if (caringQuotes.topics[mainTopic]) {
          const topicQuotes = caringQuotes.topics[mainTopic][state.sentiment] ||
            caringQuotes.topics[mainTopic].neutral;
          if (topicQuotes && topicQuotes.length > 0) {
            messages.topic_tip = this.getRandomQuote(topicQuotes);
          }
        }
      }

      return {
        ...state,
        ...messages,
      };
    } catch (error) {
      console.error("[生成关怀语录错误]:", error);
      return {
        avgSentiment: 0,
        sentiment: "neutral",
        topTopics: [],
        streak: 0,
        caring_message: "记录生活，记录美好 📝",
        streak_tips: "",
        topic_tip: "",
      };
    }
  }

  // 刷新语录（从同类中随机选择）
  static refresh(userId, currentSentiment) {
    const sentiment = currentSentiment || "neutral";
    return {
      caring_message: this.getRandomQuote(
        caringQuotes[sentiment] || caringQuotes.neutral,
      ),
    };
  }
}

module.exports = CaringMessageGenerator;
