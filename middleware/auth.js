const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getError } = require("../config/errorConfig");

// JWT 认证中间件
const auth = async (ctx, next) => {
  try {
    let token = ctx.header.authorization;
    if (!token) {
      ctx.status = 401;
      ctx.body = getError("auth.tokenMissing");
      return;
    }

    // 处理重复的Bearer前缀
    token = token.replace(/^Bearer\s+/i, "");

    if (!token) {
      ctx.status = 401;
      ctx.body = getError("auth.tokenInvalid");
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key",
    );

    if (!decoded.id) {
      ctx.status = 401;
      ctx.body = getError("auth.tokenInvalid");
      return;
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      ctx.status = 401;
      ctx.body = getError("user.userNotFound");
      return;
    }

    // 检查用户账号状态
    if (user.status !== 1) {
      ctx.status = 401;
      ctx.body = getError("user.accountInactive");
      return;
    }

    ctx.state.user = user;
    await next();
  } catch (error) {
    console.error("认证错误:", error);
    ctx.status = 401;
    if (error.name === "TokenExpiredError") {
      ctx.body = getError("auth.tokenExpired");
    } else if (error.name === "JsonWebTokenError") {
      ctx.body = getError("auth.tokenInvalid");
    } else {
      ctx.body = getError("auth.verificationFailed");
    }
  }
};

module.exports = auth;
