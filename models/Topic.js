const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  weather: {
    type: String,
    maxlength: 50
  },
  mood: {
    type: String,
    maxlength: 50
  },
  tags: {
    type: [String]
  },
  season: {
    type: String,
    enum: ['spring', 'summer', 'autumn', 'winter']
  },
  month: {
    type: Number,
    min: 1,
    max: 12
  },
  day: {
    type: Number,
    min: 1,
    max: 31
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// 自动更新 updated_at

topicSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Topic', topicSchema);