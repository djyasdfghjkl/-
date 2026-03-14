const User = require("../models/User");

// 格式化日期为YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

// 计算两个日期之间的天数差
const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(formatDate(date1));
  const secondDate = new Date(formatDate(date2));
  return Math.round(Math.abs((firstDate - secondDate) / oneDay));
};

// 更新用户登录统计信息
const updateLoginStats = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: "用户不存在" };
    }

    const today = new Date();
    const todayFormatted = formatDate(today);

    // 如果是首次登录
    if (!user.lastLoginDate) {
      user.totalLoginDays = 1;
      user.consecutiveLoginDays = 1;
      user.lastLoginDate = today;
      await user.save();
      return {
        success: true,
        totalLoginDays: 1,
        consecutiveLoginDays: 1,
        isNewLogin: true,
      };
    }

    const lastLoginFormatted = formatDate(user.lastLoginDate);
    const daysSinceLastLogin = daysBetween(user.lastLoginDate, today);

    // 如果今天已经登录过，不更新统计
    if (todayFormatted === lastLoginFormatted) {
      return {
        success: true,
        totalLoginDays: user.totalLoginDays,
        consecutiveLoginDays: user.consecutiveLoginDays,
        isTodayLogin: true,
      };
    }

    // 更新总登录天数
    user.totalLoginDays += 1;

    // 更新连续登录天数
    if (daysSinceLastLogin === 1) {
      // 连续登录
      user.consecutiveLoginDays += 1;
    } else if (daysSinceLastLogin > 1) {
      // 连续登录中断
      user.consecutiveLoginDays = 1;
      user.loginStreakResetDate = today;
    }

    // 更新最后登录日期
    user.lastLoginDate = today;

    await user.save();

    return {
      success: true,
      totalLoginDays: user.totalLoginDays,
      consecutiveLoginDays: user.consecutiveLoginDays,
      daysSinceLastLogin: daysSinceLastLogin,
    };
  } catch (error) {
    console.error("更新登录统计失败:", error);
    return { success: false, message: error.message };
  }
};

// 检查用户是否达成连续登录目标
const checkLoginStreak = (consecutiveLoginDays) => {
  const achievements = [];

  if (consecutiveLoginDays >= 7) {
    achievements.push("7_days_streak");
  }
  if (consecutiveLoginDays >= 30) {
    achievements.push("30_days_streak");
  }
  if (consecutiveLoginDays >= 100) {
    achievements.push("100_days_streak");
  }
  if (consecutiveLoginDays >= 365) {
    achievements.push("365_days_streak");
  }

  return achievements;
};

// 检查用户是否达成总登录天数目标
const checkTotalLoginDays = (totalLoginDays) => {
  const achievements = [];

  if (totalLoginDays >= 10) {
    achievements.push("10_days_total");
  }
  if (totalLoginDays >= 50) {
    achievements.push("50_days_total");
  }
  if (totalLoginDays >= 100) {
    achievements.push("100_days_total");
  }
  if (totalLoginDays >= 365) {
    achievements.push("365_days_total");
  }
  if (totalLoginDays >= 1000) {
    achievements.push("1000_days_total");
  }

  return achievements;
};

module.exports = {
  updateLoginStats,
  checkLoginStreak,
  checkTotalLoginDays,
  formatDate,
  daysBetween,
};
