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
  }]
});

module.exports = mongoose.model('RedeemCode', RedeemCodeSchema);