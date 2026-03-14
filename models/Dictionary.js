const mongoose = require('mongoose');

const DictionarySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  items: [
    {
      key: {
        type: String,
        required: true,
        trim: true
      },
      value: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      sort: {
        type: Number,
        default: 0
      },
      status: {
        type: Boolean,
        default: true
      }
    }
  ],
  description: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
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

module.exports = mongoose.model('Dictionary', DictionarySchema);