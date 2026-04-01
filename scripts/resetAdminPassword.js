require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const NEW_PASSWORD = "19223073501";

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/note").then(async () => {
  const u = await User.findOne({ email: "15574356798@qq.com" });
  if (!u) {
    console.log("用户不存在");
    mongoose.disconnect();
    return;
  }

  // 直接用 bcrypt 加密后写入，绕过 pre-save 钩子的重复加密问题
  const hashed = await bcrypt.hash(NEW_PASSWORD, 10);
  await User.updateOne({ _id: u._id }, { $set: { password: hashed } });

  // 验证
  const updated = await User.findOne({ _id: u._id }).select("password");
  const ok = await bcrypt.compare(NEW_PASSWORD, updated.password);
  console.log("密码重置结果:", ok ? "成功 ✅" : "失败 ❌");
  console.log("账号:", u.email, "| 新密码:", NEW_PASSWORD);

  mongoose.disconnect();
}).catch(e => console.error(e.message));
