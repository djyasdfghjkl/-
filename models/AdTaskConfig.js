const mongoose = require('mongoose');

const AdTaskConfigSchema = new mongoose.Schema({
  daily_limit: {
    type: Number,
    default: 10,
    required: true,
    description: '每日最大观看次数'
  },
  reward_per_ad: {
    type: Number,
    default: 0.1,
    required: true,
    description: '每次观看奖励金额（元）'
  },
  min_withdraw: {
    type: Number,
    default: 1.0,
    description: '最低提现金额'
  },
  status: {
    type: Number,
    default: 1,
    enum: [0, 1],
    description: '1=启用，0=禁用'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 确保只有一条配置记录
AdTaskConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

module.exports = mongoose.model('AdTaskConfig', AdTaskConfigSchema);
