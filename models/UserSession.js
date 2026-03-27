const mongoose = require("mongoose");

const UserSessionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  session_id: {
    type: String,
    required: true,
    unique: true,
  },
  enter_time: {
    type: Date,
    required: true,
    default: Date.now,
  },
  leave_time: {
    type: Date,
    default: null,
  },
  duration: {
    type: Number,
    default: 0, // 会话时长（秒）
  },
  enter_page: {
    type: String,
    default: "",
  },
  ip: {
    type: String,
    default: "",
  },
  user_agent: {
    type: String,
    default: "",
  },
  last_heartbeat: {
    type: Date,
    default: Date.now,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// 添加索引以提高查询性能
UserSessionSchema.index({ user_id: 1, created_at: -1 });
UserSessionSchema.index({ session_id: 1 });
UserSessionSchema.index({ leave_time: 1 });

module.exports = mongoose.model("UserSession", UserSessionSchema);
