const mongoose = require('mongoose');
const AdClick = require('./models/AdClick');

// 连接MongoDB
mongoose.connect('mongodb://localhost:27017/note', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 检查AdClick集合中的数据
async function checkAdClicks() {
  try {
    console.log('正在检查AdClick集合...');
    
    // 获取数据总数
    const count = await AdClick.countDocuments({});
    console.log(`AdClick集合中的记录数: ${count}`);
    
    // 获取前5条记录
    const recentClicks = await AdClick.find({}).sort({ created_at: -1 }).limit(5);
    console.log('最近的广告点击记录:');
    console.log(JSON.stringify(recentClicks, null, 2));
    
    // 断开连接
    mongoose.disconnect();
  } catch (error) {
    console.error('检查AdClick集合时出错:', error);
    mongoose.disconnect();
  }
}

checkAdClicks();