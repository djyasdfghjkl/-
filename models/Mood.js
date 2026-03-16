const mongoose = require("mongoose");

const MoodSchema = new mongoose.Schema({
  uuid: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return mongoose.Types.ObjectId().toString();
    }
  },
  name: {
    type: String,
    required: true,
    maxlength: 50
  },
  description: {
    type: String,
    maxlength: 255,
    default: ""
  },
  icon_type: {
    type: Number,
    required: true,
    enum: [1, 2, 3], // 1=Emoji，2=内置表情包，3=自定义图片
    default: 1
  },
  icon_value: {
    type: String,
    required: true,
    maxlength: 500
  },
  category_id: {
    type: Number,
    default: null
  },
  is_system: {
    type: Number,
    required: true,
    enum: [0, 1], // 1=系统预设，0=用户自定义
    default: 0
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  status: {
    type: Number,
    required: true,
    enum: [0, 1], // 1=正常，0=禁用
    default: 1
  },
  use_count: {
    type: Number,
    required: true,
    default: 0
  },
  sort_order: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// 自动更新updated_at
MoodSchema.pre("save", function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model("Mood", MoodSchema);
