const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  diary_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Diary',
    required: true
  }
}, {
  timestamps: true,
  unique: true,
  index: [
    { fields: { user_id: 1 } },
    { fields: { diary_id: 1 } },
    { fields: { user_id: 1, diary_id: 1 }, unique: true }
  ]
});

module.exports = mongoose.model('Like', likeSchema);