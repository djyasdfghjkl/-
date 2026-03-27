const mongoose = require('mongoose');

const diaryTagSchema = new mongoose.Schema({
  diary_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Diary',
    required: true
  },
  tag_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// 创建唯一索引，防止重复关联
diaryTagSchema.index({ diary_id: 1, tag_id: 1 }, { unique: true });

// 创建索引，用于查询某个标签下的日记
diaryTagSchema.index({ tag_id: 1 });

module.exports = mongoose.model('DiaryTag', diaryTagSchema);