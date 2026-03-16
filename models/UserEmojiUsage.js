const mongoose = require("mongoose");

const userEmojiUsageSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  emoji_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Emoji",
    required: true
  },
  used_at: {
    type: Date,
    default: Date.now
  }
});

userEmojiUsageSchema.index({ user_id: 1, used_at: -1 });
userEmojiUsageSchema.index({ emoji_id: 1 });

module.exports = mongoose.model("UserEmojiUsage", userEmojiUsageSchema);
