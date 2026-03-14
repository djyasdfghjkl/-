const mongoose = require('mongoose');

const CommentLikeSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// 建立唯一索引，防止重复点赞
CommentLikeSchema.index({ user_id: 1, comment_id: 1 }, { unique: true });

const CommentLike = mongoose.model('CommentLike', CommentLikeSchema);

module.exports = CommentLike;