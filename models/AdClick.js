const mongoose = require("mongoose");

const AdClickSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  user_uuid: {
    type: String,
    required: true,
  },
  ad_id: {
    type: String,
    required: true,
  },
  ad_type: {
    type: String,
    enum: ["video", "banner", "interstitial"],
    default: "banner",
  },
  duration: {
    type: Number,
    default: 0, // 观看广告的时长（秒）
  },
  ip: {
    type: String,
    default: "",
  },
  user_agent: {
    type: String,
    default: "",
  },
  app_id: {
    type: String,
    default: "",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// 添加索引以提高查询性能
AdClickSchema.index({ user_id: 1, created_at: -1 });
AdClickSchema.index({ ad_id: 1, created_at: -1 });

module.exports = mongoose.model("AdClick", AdClickSchema);
