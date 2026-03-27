const mongoose = require('mongoose');

const UserAdWatchSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  watch_date: {
    type: Date,
    required: true
  },
  watch_count: {
    type: Number,
    default: 0
  },
  today_earned: {
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

// 创建唯一索引，确保每个用户每天只有一条记录
UserAdWatchSchema.index({ user_id: 1, watch_date: 1 }, { unique: true });

// 静态方法：获取或创建用户当日观看记录
UserAdWatchSchema.statics.getOrCreateTodayRecord = async function(user_id) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let record = await this.findOne({
    user_id,
    watch_date: today
  });
  
  if (!record) {
    record = await this.create({
      user_id,
      watch_date: today,
      watch_count: 0,
      today_earned: 0
    });
  }
  
  return record;
};

module.exports = mongoose.model('UserAdWatch', UserAdWatchSchema);
