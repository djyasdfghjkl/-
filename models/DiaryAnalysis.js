const mongoose = require("mongoose");

const diaryAnalysisSchema = new mongoose.Schema(
  {
    diary_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Diary",
      required: true,
      unique: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sentiment: {
      type: String,
      enum: ["positive", "neutral", "negative"],
      default: "neutral",
    },
    sentiment_score: {
      type: Number,
      min: -1,
      max: 1,
      default: 0,
    },
    topics: {
      type: [String],
      default: [],
    },
    keywords: {
      type: [String],
      default: [],
    },
    word_count: {
      type: Number,
      default: 0,
    },
    sentence_count: {
      type: Number,
      default: 0,
    },
    avg_sentence_length: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

diaryAnalysisSchema.index({ diary_id: 1 });
diaryAnalysisSchema.index({ user_id: 1 });

module.exports = mongoose.model("DiaryAnalysis", diaryAnalysisSchema);
