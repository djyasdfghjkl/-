// 角色权限层级
const roleHierarchy = {
  0: ["user"],
  1: ["user", "vip"],
  2: ["user", "vip", "svip"],
  3: ["user", "vip", "svip", "admin"],
  4: ["user", "vip", "svip", "admin", "superadmin"],
  // 保留字符串键以保持向后兼容性
  user: ["user"],
  vip: ["user", "vip"],
  svip: ["user", "vip", "svip"],
  admin: ["user", "vip", "svip", "admin"],
  superadmin: ["user", "vip", "svip", "admin", "superadmin"],
};

const { getError } = require("../config/errorConfig");

// 角色授权中间件
const role = (requiredRoles) => {
  return async (ctx, next) => {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = getError("common.unauthenticated");
        return;
      }

      const userRole = user.role;

      // 检查用户角色是否在允许的角色列表中
      const userRoles = roleHierarchy[userRole] || [];
      const hasPermission = userRoles.some((role) =>
        requiredRoles.includes(role),
      );

      if (!hasPermission) {
        ctx.status = 403;
        ctx.body = getError("common.forbidden");
        return;
      }

      await next();
    } catch (error) {
      console.error("权限检查错误:", error);
      ctx.status = 500;
      ctx.body = getError("common.serverError");
    }
  };
};

// 角色设置权限：只有superadmin可以设置admin角色
const canSetRole = (currentRole, targetRole) => {
  // 防止创建新的超级管理员
  if (targetRole === "superadmin" || targetRole === 4) {
    return false;
  }

  // 只有超级管理员可以设置管理员角色
  if ((targetRole === "admin" || targetRole === 3) && (currentRole !== "superadmin" && currentRole !== 4)) {
    return false;
  }

  return true;
};

module.exports = {
  role,
  canSetRole,
};
