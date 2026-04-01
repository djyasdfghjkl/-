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

    // 检查 VIP/SVIP 是否到期，自动降级
    const now = new Date();
    let roleChanged = false;

    if (user.role === 2) {
      // SVIP：svipExpireDate 到期降为普通用户
      const svipExpired = !user.svipExpireDate || user.svipExpireDate < now;
      if (svipExpired) {
        // SVIP 到期，检查是否还有 VIP
        const vipExpired = !user.vipExpireDate || user.vipExpireDate < now;
        user.role = vipExpired ? 0 : 1;
        roleChanged = true;
      }
    } else if (user.role === 1) {
      // VIP：vipExpireDate 到期降为普通用户
      const vipExpired = !user.vipExpireDate || user.vipExpireDate < now;
      if (vipExpired) {
        user.role = 0;
        roleChanged = true;
      }
    }

    if (roleChanged) {
      await user.save();
    }

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
