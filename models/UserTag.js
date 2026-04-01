const mongoose = require('mongoose');

const userTagSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    maxlength: 50
  },
  color: {
    type: String,
    maxlength: 20,
    default: ''
  },
  icon: {
    type: String,
    maxlength: 200,
    default: ''
  },
  use_count: {
    type: Number,
    default: 0
  },
  status: {
    type: Number,
    enum: [0, 1],
    default: 1
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

userTagSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

userTagSchema.index({ user_id: 1, name: 1 });
userTagSchema.index({ user_id: 1, status: 1 });

module.exports = mongoose.model('UserTag', userTagSchema);
