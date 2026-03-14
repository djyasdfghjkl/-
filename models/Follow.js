const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  follower_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  following_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  unique: true,
  index: [
    { fields: { follower_id: 1 } },
    { fields: { following_id: 1 } },
    { fields: { follower_id: 1, following_id: 1 }, unique: true }
  ]
});

module.exports = mongoose.model('Follow', followSchema);