const mongoose = require('mongoose');

const RequestLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  method: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  referer: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  ip: {
    type: String,
    required: true
  },
  host: {
    type: String,
    default: ''
  },
  query: {
    type: String,
    default: ''
  },
  body: {
    type: String,
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  sessionId: {
    type: String,
    default: null
  },
  statusCode: {
    type: Number,
    required: true
  },
  responseTime: {
    type: Number,
    required: true
  },
  responseSize: {
    type: Number,
    default: null
  },
  error: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 索引优化
RequestLogSchema.index({ timestamp: -1 });
RequestLogSchema.index({ userId: 1, timestamp: -1 });
RequestLogSchema.index({ method: 1, url: 1 });

module.exports = mongoose.model('RequestLog', RequestLogSchema);