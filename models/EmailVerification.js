const mongoose = require('mongoose');

const EmailVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['register', 'reset_password'],
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // 5分钟后自动过期
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

module.exports = mongoose.model('EmailVerification', EmailVerificationSchema);