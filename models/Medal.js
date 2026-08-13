const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MedalSchema = new Schema({
  // 勋章名称
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  
  // 勋章描述
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  // 勋章类型
  type: {
    type: String,
    enum: ['login', 'achievement', 'special'],
    default: 'achievement'
  },
  
  // 勋章等级
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  
  // 达成条件
  condition: {
    type: Object,
    default: {}
  },
  
  // 勋章图标
  icon: {
    type: String,
    trim: true
  },

  // Static icon URL. Keep icon for backward compatibility.
  iconUrl: {
    type: String,
    trim: true,
    default: ""
  },

  // Lottie JSON URL used by the mini-program.
  lottieUrl: {
    type: String,
    trim: true,
    default: ""
  },

  // Display order in the medal center.
  sort: {
    type: Number,
    default: 0
  },
  
  // 是否启用
  enabled: {
    type: Boolean,
    default: true
  },
  
  // 创建时间
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // 更新时间
  updatedAt: {
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

// 定义虚拟字段
MedalSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// 确保JSON序列化时包含虚拟字段
MedalSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// 更新更新时间
MedalSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Medal = mongoose.model('Medal', MedalSchema);
module.exports = Medal;
