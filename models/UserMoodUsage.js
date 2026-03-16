const mongoose = require("mongoose");

const UserMoodUsageSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  mood_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Mood",
    required: true
  },
  diary_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Diary",
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// 添加索引
UserMoodUsageSchema.index({ user_id: 1, mood_id: 1 });
UserMoodUsageSchema.index({ user_id: 1, created_at: 1 });

module.exports = mongoose.model("UserMoodUsage", UserMoodUsageSchema);
