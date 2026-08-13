const Mood = require("../models/Mood");

const defaultMoods = [
  { name: "开心", description: "心里亮起来，适合记录小高光。", icon_type: 1, icon_value: "😊", is_system: 1, sort_order: 10 },
  { name: "难过", description: "今天有点低落，想把情绪写下来。", icon_type: 1, icon_value: "😢", is_system: 1, sort_order: 9 },
  { name: "生气", description: "情绪有点顶，需要一个出口。", icon_type: 1, icon_value: "😠", is_system: 1, sort_order: 8 },
  { name: "平静", description: "没有太大波澜，是舒服安稳的一天。", icon_type: 1, icon_value: "😌", is_system: 1, sort_order: 7 },
  { name: "心动", description: "有被某件事温柔击中。", icon_type: 1, icon_value: "🥰", is_system: 1, sort_order: 6 },
  { name: "疲惫", description: "身心都想慢下来一点。", icon_type: 1, icon_value: "🥱", is_system: 1, sort_order: 5 },
  { name: "焦虑", description: "脑子有点吵，适合先整理出来。", icon_type: 1, icon_value: "😵", is_system: 1, sort_order: 4 },
  { name: "专注", description: "进入状态，推进得很顺。", icon_type: 1, icon_value: "😎", is_system: 1, sort_order: 3 },
  { name: "放松", description: "终于能把肩膀放下来。", icon_type: 1, icon_value: "🌿", is_system: 1, sort_order: 2 },
  { name: "充实", description: "今天虽然忙，但很有收获。", icon_type: 1, icon_value: "✨", is_system: 1, sort_order: 1 },
];

async function initDefaultMoods() {
  try {
    console.log("开始初始化默认心情...");
    const existingSystemMoods = await Mood.countDocuments({ is_system: 1 });
    if (existingSystemMoods > 0) {
      console.log("系统心情已存在，跳过初始化");
      return;
    }

    const createdMoods = await Mood.insertMany(defaultMoods);
    console.log(`成功创建 ${createdMoods.length} 个默认心情`);
  } catch (error) {
    console.error("初始化默认心情失败:", error);
  }
}

module.exports = initDefaultMoods;
