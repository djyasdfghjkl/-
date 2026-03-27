const mongoose = require("mongoose");

const userAnalysisSummarySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date_type: {
      type: String,
      enum: ["day", "week", "month"],
      required: true,
    },
    stat_date: {
      type: Date,
      required: true,
    },
    diary_count: {
      type: Number,
      default: 0,
    },
    avg_sentiment: {
      type: Number,
      default: 0,
    },
    total_word_count: {
      type: Number,
      default: 0,
    },
    top_topics: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    top_keywords: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    common_mood: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    common_weather: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
    },
  },
);

userAnalysisSummarySchema.index({ user_id: 1, date_type: 1, stat_date: 1 }, { unique: true });

module.exports = mongoose.model("UserAnalysisSummary", userAnalysisSummarySchema);
