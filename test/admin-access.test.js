const test = require("node:test");
const assert = require("node:assert/strict");
const {
  isSuperAdmin,
  canManageUser,
  canAccessContentAdmin,
} = require("../utils/adminAccess");

test("only superadmin can access content administration", () => {
  assert.equal(canAccessContentAdmin({ role: 4 }), true);
  assert.equal(canAccessContentAdmin({ role: 3 }), false);
});

test("administrator can manage normal users but not administrators", () => {
  assert.equal(canManageUser({ role: 3 }, { role: 0 }), true);
  assert.equal(canManageUser({ role: 3 }, { role: 3 }), false);
  assert.equal(canManageUser({ role: 4 }, { role: 3 }), true);
  assert.equal(isSuperAdmin({ role: 4 }), true);
});
