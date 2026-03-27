const mongoose = require('mongoose');

const AdWatchDetailSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ad_id: {
    type: String,
    description: '广告ID（由广告平台返回，可为空）'
  },
  reward: {
    type: Number,
    required: true,
    description: '本次观看获得收益'
  },
  watch_time: {
    type: Date,
    default: Date.now
  },
  ip: {
    type: String,
    description: '用户IP'
  },
  user_agent: {
    type: String,
    description: '用户代理'
  }
});

// 创建索引，提高查询性能
AdWatchDetailSchema.index({ user_id: 1 });
AdWatchDetailSchema.index({ watch_time: 1 });

module.exports = mongoose.model('AdWatchDetail', AdWatchDetailSchema);
