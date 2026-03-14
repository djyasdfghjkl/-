const User = require("../models/User");

// 初始化超级管理员账号
const initSuperAdmin = async () => {
  try {
    // 检查超级管理员是否已存在（同时检查用户名或邮箱）
    const existingSuperAdmin = await User.findOne({
      $or: [
        { username: "djy" },
        { email: "15574356798@qq.com" }
      ]
    });

    if (!existingSuperAdmin) {
      // 创建超级管理员账号
      const superAdmin = new User({
        username: "djy",
        nickname: "超级管理员",
        email: "15574356798@qq.com",
        password: "19223073501",
        role: 4,
        status: 1,
      });

      await superAdmin.save();
      console.log("超级管理员账号已创建: 用户名 djy，密码 19223073501");
    } else {
      console.log("超级管理员账号已存在");
    }
  } catch (error) {
    console.error("初始化超级管理员账号失败:", error.message);
  }
};

module.exports = initSuperAdmin;
