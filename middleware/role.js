const User = require("../models/User");
const { getError } = require("../config/errorConfig");
const { getRoleValue } = require("../utils/adminAccess");

const roleHierarchy = {
  0: ["user"],
  1: ["user", "vip"],
  2: ["user", "vip", "svip"],
  3: ["user", "vip", "svip", "admin"],
  4: ["user", "vip", "svip", "admin", "superadmin"],
  user: ["user"],
  vip: ["user", "vip"],
  svip: ["user", "vip", "svip"],
  admin: ["user", "vip", "svip", "admin"],
  superadmin: ["user", "vip", "svip", "admin", "superadmin"],
};

const adminAllowedPaths = [
  /^\/api\/users$/,
  /^\/api\/users\/[^/]+$/,
  /^\/api\/users\/[^/]+\/role$/,
  /^\/api\/admin\/users$/,
  /^\/api\/admin\/users\/[^/]+$/,
  /^\/api\/admin\/users\/[^/]+\/role$/,
  /^\/api\/admin\/blacklist$/,
  /^\/api\/admin\/blacklist\/[^/]+$/,
];

function isAdminAllowedPath(pathname) {
  return adminAllowedPaths.some((pattern) => pattern.test(pathname));
}

const role = (requiredRoles) => {
  return async (ctx, next) => {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.status = 401;
        ctx.body = getError("common.unauthenticated");
        return;
      }

      const userRoles = roleHierarchy[user.role] || [];
      const hasPermission = userRoles.some((item) => requiredRoles.includes(item));

      if (!hasPermission) {
        ctx.status = 403;
        ctx.body = getError("common.forbidden");
        return;
      }

      if (getRoleValue(user) === 3) {
        if (ctx.path.startsWith("/api/admin/") && !isAdminAllowedPath(ctx.path)) {
          ctx.status = 403;
          ctx.body = getError("common.forbidden");
          return;
        }

        if (
          (ctx.method === "PUT" || ctx.method === "DELETE") &&
          /^\/api\/users\/[^/]+(?:\/role)?$/.test(ctx.path) &&
          ctx.params?.id
        ) {
          const targetUser = await User.findById(ctx.params.id).select("role");
          if (targetUser && getRoleValue(targetUser) >= 3) {
            ctx.status = 403;
            ctx.body = getError("common.forbidden");
            return;
          }
        }

        if (
          ctx.method === "PUT" &&
          /^\/api\/users\/[^/]+\/role$/.test(ctx.path) &&
          Number(ctx.request.body?.role) >= 3
        ) {
          ctx.status = 403;
          ctx.body = getError("common.forbidden");
          return;
        }
      }

      await next();
    } catch (error) {
      console.error("Role check failed:", error);
      ctx.status = 500;
      ctx.body = getError("common.serverError");
    }
  };
};

const canSetRole = (currentRole, targetRole) => {
  if (targetRole === "superadmin" || targetRole === 4) {
    return false;
  }

  if (
    (targetRole === "admin" || targetRole === 3) &&
    currentRole !== "superadmin" &&
    currentRole !== 4
  ) {
    return false;
  }

  return true;
};

module.exports = {
  role,
  canSetRole,
};
