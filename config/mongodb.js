const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// 检查MongoDB连接状态
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
      serverSelectionTimeoutMS: 5000, // 5秒后连接超时
      socketTimeoutMS: 45000 // 45秒后操作超时
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    // Don't exit process - continue running even if MongoDB is not available
  }
};

module.exports = { connect, isConnected };