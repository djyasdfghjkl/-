const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserMedalSchema = new Schema({
  // 用户ID
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // 勋章ID
  medalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medal',
    required: true
  },
  
  // 获得时间
  obtainedAt: {
    type: Date,
    default: Date.now
  },
  
  // 状态
  status: {
    type: String,
    enum: ['active', 'hidden'],
    default: 'active'
  },
  
  // 获得原因
  reason: {
    type: String,
    trim: true
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

// 定义虚拟字段
UserMedalSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// 确保JSON序列化时包含虚拟字段
UserMedalSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// 创建复合索引，确保一个用户只能获得一个相同的勋章
UserMedalSchema.index({ userId: 1, medalId: 1 }, { unique: true });

const UserMedal = mongoose.model('UserMedal', UserMedalSchema);
module.exports = UserMedal;