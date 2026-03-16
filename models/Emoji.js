const mongoose = require("mongoose");

const emojiSchema = new mongoose.Schema({
  uuid: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 255
  },
  type: {
    type: Number,
    enum: [1, 2, 3],
    default: 1
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EmojiCategory"
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
  tags: {
    type: [String],
    default: []
  },
  is_official: {
    type: Boolean,
    default: true
  },
  uploader_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  status: {
    type: Number,
    enum: [-1, 0, 1],
    default: 1
  },
  file_size: {
    type: Number
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
  },
  duration: {
    type: Number
  },
  use_count: {
    type: Number,
    default: 0
  }
}, {
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
});

emojiSchema.index({ uuid: 1 });
emojiSchema.index({ category_id: 1 });
emojiSchema.index({ is_official: 1, status: 1 });
emojiSchema.index({ tags: 1 });

module.exports = mongoose.model("Emoji", emojiSchema);
