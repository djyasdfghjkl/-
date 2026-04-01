require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/note").then(async () => {
  const u = await User.findOne({ email: "15574356798@qq.com" }).select("username email role password status");
  if (!u) {
    console.log("用户不存在");
  } else {
    console.log("username:", u.username);
    console.log("role:", u.role);
    console.log("status:", u.status);
    console.log("password length:", u.password ? u.password.length : 0);
    const isBcrypt = u.password && u.password.startsWith("$2");
    console.log("password is bcrypt hashed:", isBcrypt);
    if (!isBcrypt) {
      console.log("password raw value:", u.password);
      console.log("\n>>> 密码是明文，需要重置！");
    } else {
      console.log("密码已加密，格式正常");
      // 验证密码是否匹配
      const bcrypt = require("bcryptjs");
      const match = await bcrypt.compare("19223073501", u.password);
      console.log("密码 19223073501 验证结果:", match);
    }
  }
  mongoose.disconnect();
}).catch(e => console.error(e.message));
