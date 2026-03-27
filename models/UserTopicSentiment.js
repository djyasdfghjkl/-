const mongoose = require("mongoose");

const userTopicSentimentSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    positive_count: {
      type: Number,
      default: 0,
    },
    neutral_count: {
      type: Number,
      default: 0,
    },
    negative_count: {
      type: Number,
      default: 0,
    },
    avg_sentiment: {
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

userTopicSentimentSchema.index({ user_id: 1, topic: 1 }, { unique: true });

module.exports = mongoose.model("UserTopicSentiment", userTopicSentimentSchema);
