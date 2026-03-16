const jwt = require("jsonwebtoken");
const User = require("../models/User");

// 可选的JWT认证中间件
const optionalAuth = async (ctx, next) => {
  try {
    let token = ctx.header.authorization;
    if (!token) {
      // 没有token，设置用户为null，继续执行
      ctx.state.user = null;
      await next();
      return;
    }

    // 处理重复的Bearer前缀
    token = token.replace(/^Bearer\s+/i, "");

    if (!token) {
      ctx.state.user = null;
      await next();
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key",
    );

    if (!decoded.id) {
      ctx.state.user = null;
      await next();
      return;
    }

    const user = await User.findById(decoded.id);

    if (!user || user.status !== 1) {
      ctx.state.user = null;
      await next();
      return;
    }

    ctx.state.user = user;
    await next();
  } catch (error) {
    // 认证失败，设置用户为null，继续执行
    ctx.state.user = null;
    await next();
  }
};

module.exports = optionalAuth;
