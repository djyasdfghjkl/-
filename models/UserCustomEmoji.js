const mongoose = require("mongoose");

const userCustomEmojiSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  name: {
    type: String,
    maxlength: 100
  },
  url: {
    type: String,
    required: true,
    maxlength: 500
  },
  thumbnail_url: {
    type: String,
    maxlength: 500
  },
  file_hash: {
    type: String,
    maxlength: 64
  },
  width: {
    type: Number
  },
  height: {
    type: Number
  }
}, {
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
});

userCustomEmojiSchema.index({ user_id: 1 });

module.exports = mongoose.model("UserCustomEmoji", userCustomEmojiSchema);
