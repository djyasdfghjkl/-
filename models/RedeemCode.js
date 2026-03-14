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
    enum: ['vip', 'svip', 'balance'],
    required: true
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
  // 预留扩展字段
  extra1: {
    type: String,
    trim: true
  },
  extra2: {
    type: String,
    trim: true
  },
  extra3: {
    type: Number
  },
  extra4: {
    type: Boolean
  },
  extra5: {
    type: Object
  }
});

module.exports = mongoose.model('RedeemCode', RedeemCodeSchema);