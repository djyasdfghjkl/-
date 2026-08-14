const test = require("node:test");
const assert = require("node:assert/strict");

test("server pins uuid to the Node 18 CommonJS-compatible release line", () => {
  const packageJson = require("../package.json");
  assert.equal(packageJson.dependencies.uuid, "^9.0.1");
});
