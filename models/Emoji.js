const mongoose = require("mongoose");

const emojiSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 255,
      default: "",
    },
    type: {
      type: Number,
      enum: [1, 2, 3],
      default: 1,
    },
    resource_type: {
      type: String,
      enum: ["emoji", "image", "lottie"],
      default: "emoji",
    },
    resource_value: {
      type: String,
      maxlength: 1000,
      default: "",
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmojiCategory",
    },
    url: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    thumbnail_url: {
      type: String,
      maxlength: 1000,
      default: "",
    },
    preview_text: {
      type: String,
      maxlength: 50,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    scenes: {
      type: [String],
      default: [],
    },
    sort_order: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      maxlength: 100,
      default: "manual",
    },
    is_official: {
      type: Boolean,
      default: true,
    },
    uploader_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: Number,
      enum: [-1, 0, 1],
      default: 1,
    },
    file_size: {
      type: Number,
    },
    file_hash: {
      type: String,
      maxlength: 64,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    duration: {
      type: Number,
    },
    use_count: {
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

emojiSchema.index({ uuid: 1 });
emojiSchema.index({ category_id: 1 });
emojiSchema.index({ is_official: 1, status: 1 });
emojiSchema.index({ tags: 1 });
emojiSchema.index({ scenes: 1, status: 1, sort_order: 1 });
emojiSchema.index({ resource_type: 1, status: 1 });

module.exports = mongoose.model("Emoji", emojiSchema);
