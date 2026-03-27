const mongoose = require('mongoose');

// 连接 MongoDB
mongoose.connect('mongodb://localhost:27017/note', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB 连接错误:'));
db.once('open', async function() {
  console.log('MongoDB 连接成功');
  
  try {
    // 尝试删除旧的 email 索引
    await db.collection('users').dropIndex('email_1');
    console.log('旧的 email 索引删除成功');
  } catch (error) {
    console.log('删除索引时出错（可能索引不存在）:', error.message);
  }
  
  // 关闭连接
  mongoose.connection.close();
  console.log('MongoDB 连接已关闭');
});
