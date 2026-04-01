const mongoose = require('mongoose');

const RedeemCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['vip', 'svip', 'balance', 'transfer_percent', 'special_medal', 'points', 'level'],
    required: true
  },
  medalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medal',
    default: null
  },
  value: {
    type: Number,
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  usedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // 新增字段
  description: {
    type: String,
    trim: true,
    default: '',
    maxlength: 200
  },
  maxUses: {
    type: Number,
    default: 1,
    min: 1
  },
  currentUses: {
    type: Number,
    default: 0,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  usedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // 是否可叠加（vip/svip/balance/points 类型有效）
  // true=在现有到期时间基础上累加，false=直接覆盖/设置为当前时间+value
  stackable: {
    type: Boolean,
    default: true
  },
  // 是否限制同一用户只能使用一个同类型兑换码
  // true=同一用户使用过同 type 的任意兑换码后，不能再用其他同 type 的码
  // false=不限制，只要没用过这个具体的码就能用
  unique_per_type: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('RedeemCode', RedeemCodeSchema);