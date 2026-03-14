const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  diary_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Diary',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  like_count: {
    type: Number,
    default: 0
  },
  status: {
    type: Number,
    default: 1 // 1=正常，0=删除
  }
}, {
  timestamps: true,
  index: [
    { fields: { diary_id: 1, created_at: 1 } }
  ]
});

module.exports = mongoose.model('Comment', commentSchema);