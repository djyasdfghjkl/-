const Mood = require('../models/Mood');

// 默认心情数据
const defaultMoods = [
  { name: '开心', description: '心情愉悦，充满快乐', icon_type: 1, icon_value: '😊', is_system: 1, sort_order: 10 },
  { name: '难过', description: '心情低落，感到悲伤', icon_type: 1, icon_value: '😢', is_system: 1, sort_order: 9 },
  { name: '生气', description: '情绪激动，感到愤怒', icon_type: 1, icon_value: '😡', is_system: 1, sort_order: 8 },
  { name: '平静', description: '心情平和，没有波动', icon_type: 1, icon_value: '😌', is_system: 1, sort_order: 7 },
  { name: '兴奋', description: '情绪高涨，感到激动', icon_type: 1, icon_value: '🤗', is_system: 1, sort_order: 6 },
  { name: '疲惫', description: '身体或精神感到疲劳', icon_type: 1, icon_value: '🥱', is_system: 1, sort_order: 5 },
  { name: '焦虑', description: '感到紧张和不安', icon_type: 1, icon_value: '😰', is_system: 1, sort_order: 4 },
  { name: '专注', description: '全神贯注于某件事', icon_type: 1, icon_value: '🧐', is_system: 1, sort_order: 3 },
  { name: '放松', description: '身心得到休息和舒缓', icon_type: 1, icon_value: '😎', is_system: 1, sort_order: 2 },
  { name: '充实', description: '生活或工作感到满足', icon_type: 1, icon_value: '🙂', is_system: 1, sort_order: 1 }
];

// 初始化默认心情
async function initDefaultMoods() {
  try {
    console.log('开始初始化默认心情...');
    
    // 检查是否已存在系统心情
    const existingSystemMoods = await Mood.countDocuments({ is_system: 1 });
    
    if (existingSystemMoods > 0) {
      console.log('系统心情已存在，跳过初始化');
      return;
    }
    
    // 创建默认心情
    const createdMoods = await Mood.insertMany(defaultMoods);
    console.log(`成功创建 ${createdMoods.length} 个默认心情`);
  } catch (error) {
    console.error('初始化默认心情失败:', error);
  }
}

module.exports = initDefaultMoods;
