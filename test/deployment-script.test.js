const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const readScript = (name) =>
  fs.readFileSync(path.join(__dirname, "..", "scripts", name), "utf8");

test("the update command rolls back when the replacement version is unhealthy", () => {
  const script = readScript("deploy-dist.sh");

  assert.match(script, /PREVIOUS_REF=/);
  assert.match(script, /rollback\(\)/);
  assert.match(script, /trap rollback ERR/);
  assert.match(script, /git fetch origin "\$BRANCH"/);
  assert.match(script, /git reset --hard "\$PREVIOUS_REF"/);
});

test("the bootstrap command refuses to replace the app without its environment file", () => {
  const script = readScript("bootstrap-dist-server.sh");

  assert.match(script, /Missing required environment file/);
  assert.match(script, /if \[ ! -f "\$APP_DIR\/\.env" \]; then/);
});

test("the bootstrap command accepts a server-local Git repository", () => {
  const script = readScript("bootstrap-dist-server.sh");

  assert.match(script, /REPOSITORY_URL="\$\{REPOSITORY_URL:-/);
});
