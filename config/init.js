const User = require("../models/User");
const bcrypt = require("bcryptjs");

// 初始化超级管理员账号
const initSuperAdmin = async () => {
  try {
    const existingSuperAdmin = await User.findOne({
      $or: [
        { username: "djy" },
        { email: "15574356798@qq.com" }
      ]
    });

    if (!existingSuperAdmin) {
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
      // 检查密码是否是 bcrypt 格式，不是则修复
      if (!existingSuperAdmin.password || !existingSuperAdmin.password.startsWith("$2")) {
        const hashed = await bcrypt.hash("19223073501", 10);
        await User.updateOne({ _id: existingSuperAdmin._id }, { $set: { password: hashed } });
        console.log("超级管理员密码已修复（明文 -> bcrypt）");
      } else {
        console.log("超级管理员账号已存在");
      }
    }
  } catch (error) {
    console.error("初始化超级管理员账号失败:", error.message);
  }
};

module.exports = initSuperAdmin;
