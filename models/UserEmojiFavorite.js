const mongoose = require("mongoose");

const userEmojiFavoriteSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  emoji_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Emoji",
    required: true
  }
}, {
  timestamps: {
    createdAt: "created_at",
    updatedAt: false
  }
});

userEmojiFavoriteSchema.index({ user_id: 1, emoji_id: 1 }, { unique: true });

module.exports = mongoose.model("UserEmojiFavorite", userEmojiFavoriteSchema);
