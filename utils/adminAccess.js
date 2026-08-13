function getRoleValue(user) {
  if (!user) return -1;
  const role = Number(user.role);
  return Number.isNaN(role) ? -1 : role;
}

function isSuperAdmin(user) {
  return getRoleValue(user) === 4;
}

function isAdmin(user) {
  return getRoleValue(user) >= 3;
}

function canAccessContentAdmin(user) {
  return isSuperAdmin(user);
}

function canManageUser(actor, target) {
  if (!isAdmin(actor) || !target) return false;
  if (isSuperAdmin(actor)) return true;
  return getRoleValue(target) < 3;
}

module.exports = {
  getRoleValue,
  isSuperAdmin,
  isAdmin,
  canAccessContentAdmin,
  canManageUser,
};
