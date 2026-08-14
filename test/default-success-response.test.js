const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const readIndex = () =>
  fs.readFileSync(path.join(__dirname, "..", "index.js"), "utf8");

test("the fallback success payload only applies when a route handled the request", () => {
  const source = readIndex();

  assert.match(
    source,
    /if \(!ctx\.body && Array\.isArray\(ctx\.matched\) && ctx\.matched\.length > 0\)/,
  );
  assert.doesNotMatch(source, /if \(!ctx\.body\) \{/);
  assert.match(source, /message:\s*"操作成功"/);
});

test("the server rewrites legacy /dist/api requests onto /api routes", () => {
  const source = readIndex();

  assert.match(source, /ctx\.path === "\/dist\/api"/);
  assert.match(source, /ctx\.path\.startsWith\("\/dist\/api\/"\)/);
  assert.match(source, /ctx\.path = ctx\.path\.replace\(\/\^\\\/dist\/, ""\) \|\| "\/"/);
});
