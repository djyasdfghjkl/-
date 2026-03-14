const mongoose = require('mongoose');

const diarySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  diary_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  weather: {
    type: String,
    maxlength: 50
  },
  mood: {
    type: String,
    maxlength: 50
  },
  signature: {
    type: String,
    maxlength: 200
  },
  location: {
    type: String,
    maxlength: 255
  },
  location_city: {
    type: String,
    maxlength: 100
  },
  location_coords: {
    type: {
      lat: Number,
      lng: Number
    }
  },
  cover: {
    type: String,
    maxlength: 500
  },
  images: {
    type: [String]
  },
  tags: {
    type: [String]
  },
  is_public: {
    type: Boolean,
    default: false
  },
  is_top: {
    type: Boolean,
    default: false
  },
  status: {
    type: Number,
    default: 1
  },
  word_count: {
    type: Number,
    default: 0
  },
  view_count: {
    type: Number,
    default: 0
  },
  like_count: {
    type: Number,
    default: 0
  },
  comment_count: {
    type: Number,
    default: 0
  },
  event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  score: {
    type: Number,
    default: 0
  },
  share_count: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 自动计算字数
diarySchema.pre('save', function(next) {
  if (this.content) {
    this.word_count = this.content.length;
  }
  next();
});

module.exports = mongoose.model('Diary', diarySchema);