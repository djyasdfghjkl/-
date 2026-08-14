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

test("the update command performs Git operations as the application user", () => {
  const script = readScript("deploy-dist.sh");

  assert.match(script, /APP_USER="\$\{APP_USER:-www\}"/);
  assert.match(script, /NPM_CACHE_DIR="\$\{NPM_CACHE_DIR:-\$APP_DIR\/\.npm-cache\}"/);
  assert.match(script, /runuser -u "\$APP_USER" -- env "PATH=\$PATH"/);
  assert.match(script, /NPM_CONFIG_CACHE="\$NPM_CACHE_DIR"/);
});

test("the update command preserves the deployed environment file across Git resets", () => {
  const script = readScript("deploy-dist.sh");

  assert.match(script, /ENV_FILE="\$APP_DIR\/\.env"/);
  assert.match(script, /ENV_BACKUP="\$\(mktemp/);
  assert.match(script, /cp -f "\$ENV_FILE" "\$ENV_BACKUP"/);
  assert.match(script, /cp -f "\$ENV_BACKUP" "\$ENV_FILE"/);
  assert.match(script, /git status --short --untracked-files=no/);
  assert.match(script, /local changes beyond \.env/);
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

test("the bootstrap service forces its dedicated port after loading .env", () => {
  const script = readScript("bootstrap-dist-server.sh");

  assert.match(
    script,
    /ExecStart=\/usr\/bin\/env PORT=3006 \/www\/server\/nodejs\/v18\.20\.8\/bin\/node/,
  );
});

test("the post-receive hook deploys only pushes to main", () => {
  const script = readScript("post-receive-hook.sh");

  assert.match(script, /TARGET_BRANCH="\$\{TARGET_BRANCH:-refs\/heads\/main\}"/);
  assert.match(script, /if \[ "\$refname" != "\$TARGET_BRANCH" \]; then/);
  assert.match(script, /DEPLOY_COMMAND="\$\{DEPLOY_COMMAND:-\/usr\/local\/bin\/update-note-dist\}"/);
  assert.match(script, />>"\$LOG_FILE" 2>&1/);
});
