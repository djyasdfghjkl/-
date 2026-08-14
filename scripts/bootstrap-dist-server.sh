#!/usr/bin/env bash
set -euo pipefail

BASE_DIR=/www/wwwroot/note
APP_DIR="$BASE_DIR/dist"
NEXT_DIR="$BASE_DIR/.dist-git-next"
BACKUP_DIR="$BASE_DIR/dist-backup-before-git-$(date +%Y%m%d-%H%M%S)"
REPOSITORY_URL="${REPOSITORY_URL:-https://github.com/djyasdfghjkl/noteServer.git}"
BRANCH=main
NODE_BIN=/www/server/nodejs/v18.20.8/bin

export PATH="$NODE_BIN:$PATH"
unset npm_config_prefix NPM_CONFIG_PREFIX

if [ ! -f "$APP_DIR/.env" ]; then
  echo "Missing required environment file: $APP_DIR/.env" >&2
  exit 1
fi

if [ "$NEXT_DIR" != "$BASE_DIR/.dist-git-next" ]; then
  echo "Refusing to clear an unexpected staging directory: $NEXT_DIR" >&2
  exit 1
fi

if ss -ltn "( sport = :3006 )" | grep -q LISTEN; then
  echo "Port 3006 is already in use. Stop the temporary staging process first." >&2
  exit 1
fi

systemctl stop note-dist 2>/dev/null || true
if [ -e "$NEXT_DIR" ]; then
  rm -rf "$NEXT_DIR"
fi
git clone --branch "$BRANCH" --single-branch "$REPOSITORY_URL" "$NEXT_DIR"

cp -a "$APP_DIR/.env" "$NEXT_DIR/.env"
if [ -d "$APP_DIR/uploads" ]; then cp -a "$APP_DIR/uploads" "$NEXT_DIR/uploads"; fi
if [ -d "$APP_DIR/logs" ]; then cp -a "$APP_DIR/logs" "$NEXT_DIR/logs"; fi

cd "$NEXT_DIR"
NPM_CONFIG_CACHE="$NEXT_DIR/.npm-cache" npm ci --omit=dev --no-audit --no-fund
node --check index.js

rm -f /tmp/note-dist-bootstrap.out /tmp/note-dist-bootstrap.err
PORT=3006 NODE_ENV=production nohup node index.js >/tmp/note-dist-bootstrap.out 2>/tmp/note-dist-bootstrap.err < /dev/null &
TEST_PID=$!
sleep 6

if ! kill -0 "$TEST_PID" 2>/dev/null || ! curl -fsS http://127.0.0.1:3006/api-docs >/dev/null; then
  cat /tmp/note-dist-bootstrap.err >&2 || true
  kill "$TEST_PID" 2>/dev/null || true
  exit 1
fi

kill "$TEST_PID"
wait "$TEST_PID" 2>/dev/null || true

mv "$APP_DIR" "$BACKUP_DIR"
mv "$NEXT_DIR" "$APP_DIR"
chown -R www:www "$APP_DIR"

cat >/etc/systemd/system/note-dist.service <<'SERVICE'
[Unit]
Description=Note dist backend
After=network-online.target mongod.service mysql.service
Wants=network-online.target

[Service]
Type=simple
User=www
Group=www
WorkingDirectory=/www/wwwroot/note/dist
EnvironmentFile=-/www/wwwroot/note/dist/.env
Environment=NODE_ENV=production
Environment=PORT=3006
Environment=PATH=/www/server/nodejs/v18.20.8/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin
ExecStart=/usr/bin/env PORT=3006 /www/server/nodejs/v18.20.8/bin/node /www/wwwroot/note/dist/index.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
SERVICE

chmod +x "$APP_DIR/scripts/deploy-dist.sh"
ln -sfn "$APP_DIR/scripts/deploy-dist.sh" /usr/local/bin/update-note-dist
systemctl daemon-reload
systemctl enable --now note-dist

for _ in 1 2 3 4 5 6; do
  if curl -fsS http://127.0.0.1:3006/api-docs >/dev/null; then
    echo "BOOTSTRAP_OK"
    echo "BACKUP_DIR=$BACKUP_DIR"
    exit 0
  fi
  sleep 2
done

systemctl status note-dist --no-pager >&2 || true
exit 1
