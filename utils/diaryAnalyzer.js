const DiaryAnalysis = require("../models/DiaryAnalysis");

// 积极词汇库
const positiveWords = [
  "开心",
  "快乐",
  "高兴",
  "幸福",
  "满足",
  "满意",
  "喜欢",
  "爱",
  "美好",
  "美妙",
  "精彩",
  "棒",
  "好",
  "优秀",
  "出色",
  "成功",
  "胜利",
  "幸运",
  "感激",
  "感谢",
  "温暖",
  "温馨",
  "甜蜜",
  "愉快",
  "愉悦",
  "兴奋",
  "激动",
  "期待",
  "希望",
  "乐观",
  "积极",
];

// 消极词汇库
const negativeWords = [
  "难过",
  "伤心",
  "痛苦",
  "悲伤",
  "失望",
  "绝望",
  "生气",
  "愤怒",
  "讨厌",
  "恨",
  "糟糕",
  "差",
  "失败",
  "挫折",
  "不幸",
  "倒霉",
  "担心",
  "焦虑",
  "紧张",
  "害怕",
  "恐惧",
  "孤独",
  "寂寞",
  "无聊",
  "郁闷",
  "烦躁",
  "疲劳",
  "累",
  "辛苦",
  "艰难",
  "困难",
  "消极",
];

// 常见停用词
const stopWords = [
  "的",
  "了",
  "在",
  "是",
  "我",
  "有",
  "和",
  "就",
  "不",
  "人",
  "都",
  "一",
  "一个",
  "上",
  "也",
  "很",
  "到",
  "说",
  "要",
  "去",
  "你",
  "会",
  "着",
  "没有",
  "看",
  "好",
  "自己",
  "这",
  "那",
  "但",
  "而",
  "吧",
  "呢",
  "吗",
  "啊",
  "呀",
  "哦",
  "嗯",
];

// 需要过滤的词汇模式
const filterPatterns = [
  /^https?:\/\//i, // URL
  /^www\./i, // www开头的网址
  /\.(com|cn|net|org|io|dev|xyz|tk|ml|ga|cf|gq)$/i, // 常见域名后缀
  /^[a-z]{1,3}$/i, // 太短的英文（1-3个字母）
  /^[0-9]+$/, // 纯数字
  /^[0-9]+[a-z]+$/i, // 数字+字母组合
  /^[a-z]+[0-9]+$/i, // 字母+数字组合
  /^ngrok$/i, // ngrok
  /^free$/i, // free
  /^dev$/i, // dev
  /^image$/i, // image
  /^jpg$/i, // jpg
  /^jpeg$/i, // jpeg
  /^png$/i, // png
  /^gif$/i, // gif
  /^bmp$/i, // bmp
  /^webp$/i, // webp
  /^svg$/i, // svg
  /^mp4$/i, // mp4
  /^mp3$/i, // mp3
  /^wav$/i, // wav
  /^pdf$/i, // pdf
  /^doc$/i, // doc
  /^docx$/i, // docx
  /^xls$/i, // xls
  /^xlsx$/i, // xlsx
  /^ppt$/i, // ppt
  /^pptx$/i, // pptx
  /^zip$/i, // zip
  /^rar$/i, // rar
  /^tar$/i, // tar
  /^gz$/i, // gz
  /^7z$/i, // 7z
];

// 检查词汇是否需要过滤
const shouldFilterWord = (word) => {
  const lowerWord = word.toLowerCase();
  
  // 检查是否匹配过滤模式
  for (const pattern of filterPatterns) {
    if (pattern.test(word)) {
      return true;
    }
  }
  
  // 检查是否是停用词
  if (stopWords.includes(word) || stopWords.includes(lowerWord)) {
    return true;
  }
  
  // 检查是否包含特殊字符
  if (/[!@#$%^&*()_+=\[\]{};:'"\\|,.<>/?`~]/.test(word)) {
    return true;
  }
  
  return false;
};

class DiaryAnalyzer {
  // 简单情感分析
  static analyzeSentiment(text) {
    if (!text) {
      return { sentiment: "neutral", score: 0 };
    }

    let positiveCount = 0;
    let negativeCount = 0;

    // 统计积极词汇
    positiveWords.forEach((word) => {
      const regex = new RegExp(word, "g");
      const matches = text.match(regex);
      if (matches) {
        positiveCount += matches.length;
      }
    });

    // 统计消极词汇
    negativeWords.forEach((word) => {
      const regex = new RegExp(word, "g");
      const matches = text.match(regex);
      if (matches) {
        negativeCount += matches.length;
      }
    });

    const total = positiveCount + negativeCount;
    let score = 0;
    let sentiment = "neutral";

    if (total > 0) {
      score = (positiveCount - negativeCount) / total;
      if (score > 0.1) {
        sentiment = "positive";
      } else if (score < -0.1) {
        sentiment = "negative";
      } else {
        sentiment = "neutral";
      }
    }

    return { sentiment, score };
  }

  // 提取关键词（简单版本）
  static extractKeywords(text, limit = 10) {
    if (!text) {
      return [];
    }

    // 先移除URL和邮箱
    let cleanText = text
      .replace(/https?:\/\/[^\s]+/g, " ") // 移除http/https链接
      .replace(/www\.[^\s]+/g, " ") // 移除www开头的链接
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, " "); // 移除邮箱

    // 只保留中文字符、空格和常见标点
    cleanText = cleanText.replace(/[^\u4e00-\u9fa5\s，。！？、；：""''（）【】]/g, " ");

    // 简单分词（按空格和常见标点）
    const words = cleanText.split(/\s+/).filter((word) => word.length >= 2);

    // 统计词频 - 只保留中文字符
    const wordCount = {};
    words.forEach((word) => {
      const trimmedWord = word.trim();
      // 只保留包含中文字符的词
      if (trimmedWord && /[\u4e00-\u9fa5]/.test(trimmedWord) && !shouldFilterWord(trimmedWord)) {
        wordCount[trimmedWord] = (wordCount[trimmedWord] || 0) + 1;
      }
    });

    // 按词频排序，取前N个
    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);
  }

  // 提取主题（基于标签和关键词）
  static extractTopics(diary) {
    const topics = [];

    // 优先使用用户手动添加的标签
    if (diary.tags && diary.tags.length > 0) {
      topics.push(...diary.tags);
    }

    // 从内容中提取关键词作为补充主题
    if (diary.content) {
      const keywords = this.extractKeywords(diary.content, 3);
      keywords.forEach((keyword) => {
        if (!topics.includes(keyword)) {
          topics.push(keyword);
        }
      });
    }

    // 如果有心情，也作为主题
    if (diary.mood) {
      topics.push(diary.mood);
    }

    return topics.slice(0, 5); // 最多5个主题
  }

  // 统计写作风格
  static analyzeWritingStyle(text) {
    if (!text) {
      return {
        word_count: 0,
        sentence_count: 0,
        avg_sentence_length: 0,
      };
    }

    // 统计字数（去除空白）
    const cleanText = text.replace(/\s/g, "");
    const wordCount = cleanText.length;

    // 统计句子数（按句号、问号、感叹号分割）
    const sentences = text.split(/[。！？.!?]/).filter((s) => s.trim().length > 0);
    const sentenceCount = sentences.length;

    // 平均句长
    const avgSentenceLength =
      sentenceCount > 0 ? wordCount / sentenceCount : 0;

    return {
      word_count: wordCount,
      sentence_count: sentenceCount,
      avg_sentence_length: parseFloat(avgSentenceLength.toFixed(2)),
    };
  }

  // 完整分析日记
  static async analyzeDiary(diary) {
    try {
      const text = diary.content || "";

      // 情感分析
      const sentimentResult = this.analyzeSentiment(text);

      // 关键词提取
      const keywords = this.extractKeywords(text, 10);

      // 主题提取
      const topics = this.extractTopics(diary);

      // 写作风格统计
      const writingStyle = this.analyzeWritingStyle(text);

      // 创建或更新分析结果
      const analysisData = {
        diary_id: diary._id,
        user_id: diary.user_id,
        sentiment: sentimentResult.sentiment,
        sentiment_score: sentimentResult.score,
        topics: topics,
        keywords: keywords,
        word_count: writingStyle.word_count,
        sentence_count: writingStyle.sentence_count,
        avg_sentence_length: writingStyle.avg_sentence_length,
      };

      // 更新或创建分析记录
      const analysis = await DiaryAnalysis.findOneAndUpdate(
        { diary_id: diary._id },
        analysisData,
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      );

      console.log(
        `[日记分析] 完成分析: diary_id=${diary._id}, sentiment=${sentimentResult.sentiment}`,
      );

      return analysis;
    } catch (error) {
      console.error("[日记分析错误]:", error);
      throw error;
    }
  }
}

module.exports = DiaryAnalyzer;
