#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/www/wwwroot/note/dist}"
BRANCH="${BRANCH:-main}"
NODE_BIN="${NODE_BIN:-/www/server/nodejs/v18.20.8/bin}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3006/api-docs}"

export PATH="$NODE_BIN:$PATH"
unset npm_config_prefix NPM_CONFIG_PREFIX

cd "$APP_DIR"
git pull --ff-only origin "$BRANCH"
npm ci --omit=dev --no-audit --no-fund
systemctl restart note-dist

for _ in 1 2 3 4 5 6; do
  if curl -fsS "$HEALTH_URL" >/dev/null; then
    echo "Deployment succeeded: $HEALTH_URL"
    exit 0
  fi
  sleep 2
done

echo "Deployment failed health check: $HEALTH_URL" >&2
exit 1
