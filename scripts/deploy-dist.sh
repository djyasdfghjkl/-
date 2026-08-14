#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/www/wwwroot/note/dist}"
BRANCH="${BRANCH:-main}"
NODE_BIN="${NODE_BIN:-/www/server/nodejs/v18.20.8/bin}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3006/api-docs}"
APP_USER="${APP_USER:-www}"
PREVIOUS_REF=""

export PATH="$NODE_BIN:$PATH"
unset npm_config_prefix NPM_CONFIG_PREFIX

run_as_app() {
  if [ "$(id -u)" -eq 0 ]; then
    runuser -u "$APP_USER" -- env "PATH=$PATH" "$@"
  else
    "$@"
  fi
}

rollback() {
  local exit_code=$?
  trap - ERR
  set +e

  if [ -n "$PREVIOUS_REF" ]; then
    echo "Deployment failed. Restoring $PREVIOUS_REF..." >&2
    cd "$APP_DIR"
    run_as_app git reset --hard "$PREVIOUS_REF"
    run_as_app npm ci --omit=dev --no-audit --no-fund
    systemctl restart note-dist
  fi

  exit "$exit_code"
}

trap rollback ERR

cd "$APP_DIR"
if ! run_as_app git diff --quiet; then
  echo "Refusing to deploy: tracked files in $APP_DIR have local changes." >&2
  exit 1
fi

PREVIOUS_REF="$(run_as_app git rev-parse HEAD)"
run_as_app git fetch origin "$BRANCH"
run_as_app git reset --hard "origin/$BRANCH"
run_as_app npm ci --omit=dev --no-audit --no-fund
systemctl restart note-dist

for _ in 1 2 3 4 5 6; do
  if curl -fsS "$HEALTH_URL" >/dev/null; then
    trap - ERR
    echo "Deployment succeeded: $HEALTH_URL"
    exit 0
  fi
  sleep 2
done

echo "Deployment failed health check: $HEALTH_URL" >&2
exit 1
