const mongoose = require("mongoose");

const emojiCategorySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      maxlength: 50,
    },
    name: {
      type: String,
      required: true,
      maxlength: 50,
    },
    description: {
      type: String,
      default: "",
      maxlength: 255,
    },
    icon: {
      type: String,
      maxlength: 200,
    },
    scene: {
      type: String,
      default: "all",
      maxlength: 50,
    },
    sort_order: {
      type: Number,
      default: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

emojiCategorySchema.index({ code: 1 }, { unique: true });
emojiCategorySchema.index({ scene: 1, is_active: 1, sort_order: 1 });

module.exports = mongoose.model("EmojiCategory", emojiCategorySchema);
