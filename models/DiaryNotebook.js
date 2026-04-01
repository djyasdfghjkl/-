const mongoose = require('mongoose');

const diaryNotebookSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    maxlength: 100,
    default: '我的日记本'
  },
  // 封面类型：1=纯色背景，2=图片封面
  cover_type: {
    type: Number,
    enum: [1, 2],
    default: 1
  },
  // 背景色（cover_type=1时使用）
  bg_color: {
    type: String,
    maxlength: 20,
    default: '#FFFFFF'
  },
  // 封面图片URL（cover_type=2时使用）
  cover_image: {
    type: String,
    maxlength: 500,
    default: ''
  },
  // 封面文字颜色
  text_color: {
    type: String,
    maxlength: 20,
    default: '#333333'
  },
  description: {
    type: String,
    maxlength: 255,
    default: ''
  },
  is_default: {
    type: Boolean,
    default: false
  },
  sort_order: {
    type: Number,
    default: 0
  },
  status: {
    type: Number,
    enum: [0, 1],
    default: 1
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

diaryNotebookSchema.index({ user_id: 1, status: 1 });

module.exports = mongoose.model('DiaryNotebook', diaryNotebookSchema);
