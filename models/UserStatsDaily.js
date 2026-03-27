const mongoose = require("mongoose");

const UserStatsDailySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  stat_date: {
    type: Date,
    required: true,
  },
  total_duration: {
    type: Number,
    default: 0, // 总在线时长（秒）
  },
  session_count: {
    type: Number,
    default: 0, // 会话次数
  },
  ad_request_count: {
    type: Number,
    default: 0, // 广告请求次数
  },
  ad_exposure_count: {
    type: Number,
    default: 0, // 广告曝光次数
  },
  ad_click_count: {
    type: Number,
    default: 0, // 广告点击次数
  },
  ad_play_complete_count: {
    type: Number,
    default: 0, // 激励视频完整播放次数
  },
  update_time: {
    type: Date,
    default: Date.now,
  },
});

// 添加唯一索引，确保每个用户每天只有一条记录
UserStatsDailySchema.index({ user_id: 1, stat_date: 1 }, { unique: true });

module.exports = mongoose.model("UserStatsDaily", UserStatsDailySchema);
