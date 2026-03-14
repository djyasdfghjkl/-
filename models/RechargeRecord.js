const mongoose = require('mongoose');

const RechargeRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['vip', 'svip', 'balance'],
    required: true
  },
  duration: {
    type: Number,
    default: 30 // 天数
  },
  expireDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'success'
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

module.exports = mongoose.model('RechargeRecord', RechargeRecordSchema);