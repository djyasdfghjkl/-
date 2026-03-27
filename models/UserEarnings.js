const mongoose = require('mongoose');

const UserEarningsSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  total_earned: {
    type: Number,
    default: 0,
    description: '历史累计收益'
  },
  withdrawn: {
    type: Number,
    default: 0,
    description: '已提现金额'
  },
  available: {
    type: Number,
    default: 0,
    description: '可提现金额 = total_earned - withdrawn'
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// 静态方法：获取或创建用户收益记录
UserEarningsSchema.statics.getOrCreateUserEarnings = async function(user_id) {
  let earnings = await this.findOne({ user_id });
  if (!earnings) {
    earnings = await this.create({
      user_id,
      total_earned: 0,
      withdrawn: 0,
      available: 0
    });
  }
  return earnings;
};

module.exports = mongoose.model('UserEarnings', UserEarningsSchema);
