const mongoose = require('mongoose');
const Medal = require('../models/Medal');
const UserMedal = require('../models/UserMedal');
const User = require('../models/User');
const { checkLoginStreak, checkTotalLoginDays } = require('./loginStats');

// 初始化默认勋章
const initDefaultMedals = async () => {
  try {
    const defaultMedals = [
      {
        name: '初出茅庐',
        description: '完成首次登录',
        type: 'login',
        level: 1,
        condition: { type: 'first_login' },
        icon: '🏅'
      },
      {
        name: '连续登录7天',
        description: '连续登录7天',
        type: 'login',
        level: 2,
        condition: { type: 'consecutive_days', days: 7 },
        icon: '🌟'
      },
      {
        name: '连续登录30天',
        description: '连续登录30天',
        type: 'login',
        level: 3,
        condition: { type: 'consecutive_days', days: 30 },
        icon: '⭐'
      },
      {
        name: '连续登录100天',
        description: '连续登录100天',
        type: 'login',
        level: 4,
        condition: { type: 'consecutive_days', days: 100 },
        icon: '💎'
      },
      {
        name: '连续登录365天',
        description: '连续登录365天',
        type: 'login',
        level: 5,
        condition: { type: 'consecutive_days', days: 365 },
        icon: '👑'
      },
      {
        name: '累计登录10天',
        description: '累计登录10天',
        type: 'login',
        level: 1,
        condition: { type: 'total_days', days: 10 },
        icon: '📅'
      },
      {
        name: '累计登录50天',
        description: '累计登录50天',
        type: 'login',
        level: 2,
        condition: { type: 'total_days', days: 50 },
        icon: '📆'
      },
      {
        name: '累计登录100天',
        description: '累计登录100天',
        type: 'login',
        level: 3,
        condition: { type: 'total_days', days: 100 },
        icon: '🗓️'
      },
      {
        name: '累计登录365天',
        description: '累计登录365天',
        type: 'login',
        level: 4,
        condition: { type: 'total_days', days: 365 },
        icon: '🎊'
      },
      {
        name: '累计登录1000天',
        description: '累计登录1000天',
        type: 'login',
        level: 5,
        condition: { type: 'total_days', days: 1000 },
        icon: '🎉'
      }
    ];

    for (const medalData of defaultMedals) {
      // 检查勋章是否已存在
      const existingMedal = await Medal.findOne({ name: medalData.name });
      if (!existingMedal) {
        const medal = new Medal(medalData);
        await medal.save();
        console.log(`创建默认勋章: ${medalData.name}`);
      }
    }
  } catch (error) {
    console.error('初始化默认勋章失败:', error);
  }
};

// 检查用户是否已获得指定勋章
const hasMedal = async (userId, medalId) => {
  try {
    const userMedal = await UserMedal.findOne({ userId, medalId });
    return !!userMedal;
  } catch (error) {
    console.error('检查用户勋章失败:', error);
    return false;
  }
};

// 颁发勋章给用户
const awardMedal = async (userId, medalId, reason) => {
  try {
    // 转换为ObjectId类型
    const objectUserId = mongoose.Types.ObjectId(userId);
    const objectMedalId = mongoose.Types.ObjectId(medalId);

    // 检查用户是否已获得该勋章
    if (await hasMedal(objectUserId, objectMedalId)) {
      return { success: false, message: '用户已获得该勋章' };
    }

    const userMedal = new UserMedal({
      userId: objectUserId,
      medalId: objectMedalId,
      reason
    });

    await userMedal.save();
    return { success: true, userMedal };
  } catch (error) {
    console.error('颁发勋章失败:', error);
    return { success: false, message: error.message };
  }
};

// 根据登录统计检查并颁发勋章
const checkAndAwardMedals = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    const awardedMedals = [];

    // 检查连续登录天数勋章
    const consecutiveAchievements = checkLoginStreak(user.consecutiveLoginDays);
    for (const achievement of consecutiveAchievements) {
      let days;
      switch (achievement) {
        case '7_days_streak':
          days = 7;
          break;
        case '30_days_streak':
          days = 30;
          break;
        case '100_days_streak':
          days = 100;
          break;
        case '365_days_streak':
          days = 365;
          break;
        default:
          continue;
      }

      const medal = await Medal.findOne({ 
        'condition.type': 'consecutive_days',
        'condition.days': days
      });

      if (medal) {
        const result = await awardMedal(userId, medal._id, `连续登录${days}天`);
        if (result.success) {
          awardedMedals.push({ medal, result });
        }
      }
    }

    // 检查累计登录天数勋章
    const totalAchievements = checkTotalLoginDays(user.totalLoginDays);
    for (const achievement of totalAchievements) {
      let days;
      switch (achievement) {
        case '10_days_total':
          days = 10;
          break;
        case '50_days_total':
          days = 50;
          break;
        case '100_days_total':
          days = 100;
          break;
        case '365_days_total':
          days = 365;
          break;
        case '1000_days_total':
          days = 1000;
          break;
        default:
          continue;
      }

      const medal = await Medal.findOne({ 
        'condition.type': 'total_days',
        'condition.days': days
      });

      if (medal) {
        const result = await awardMedal(userId, medal._id, `累计登录${days}天`);
        if (result.success) {
          awardedMedals.push({ medal, result });
        }
      }
    }

    // 检查首次登录勋章
    if (user.totalLoginDays === 1) {
      const medal = await Medal.findOne({ 'condition.type': 'first_login' });
      if (medal) {
        const result = await awardMedal(userId, medal._id, '首次登录');
        if (result.success) {
          awardedMedals.push({ medal, result });
        }
      }
    }

    return { success: true, awardedMedals };
  } catch (error) {
    console.error('检查并颁发勋章失败:', error);
    return { success: false, message: error.message };
  }
};

// 获取用户的所有勋章
const getUserMedals = async (userId) => {
  try {
    const userMedals = await UserMedal.find({ userId }) 
      .populate('medalId')
      .sort({ obtainedAt: -1 });
    
    return userMedals.map(um => ({
      ...um.toJSON(),
      medal: um.medalId
    }));
  } catch (error) {
    console.error('获取用户勋章失败:', error);
    return [];
  }
};

// 获取所有勋章
const getAllMedals = async () => {
  try {
    return await Medal.find({ enabled: true }).sort({ level: 1, type: 1 });
  } catch (error) {
    console.error('获取所有勋章失败:', error);
    return [];
  }
};

module.exports = {
  initDefaultMedals,
  checkAndAwardMedals,
  getUserMedals,
  getAllMedals,
  awardMedal,
  hasMedal
};