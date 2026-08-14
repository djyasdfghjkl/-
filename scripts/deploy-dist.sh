#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/www/wwwroot/note/dist}"
BRANCH="${BRANCH:-main}"
NODE_BIN="${NODE_BIN:-/www/server/nodejs/v18.20.8/bin}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3006/api-docs}"
APP_USER="${APP_USER:-www}"
NPM_CACHE_DIR="${NPM_CACHE_DIR:-$APP_DIR/.npm-cache}"
PREVIOUS_REF=""
ENV_FILE="$APP_DIR/.env"
ENV_BACKUP="$(mktemp "${TMPDIR:-/tmp}/note-dist-env.XXXXXX")"

export PATH="$NODE_BIN:$PATH"
unset npm_config_prefix NPM_CONFIG_PREFIX

cleanup() {
  rm -f "$ENV_BACKUP"
}

trap cleanup EXIT

if [ "$(id -u)" -eq 0 ]; then
  install -d -m 750 -o "$APP_USER" -g "$APP_USER" "$NPM_CACHE_DIR"
else
  mkdir -p "$NPM_CACHE_DIR"
fi

run_as_app() {
  if [ "$(id -u)" -eq 0 ]; then
    runuser -u "$APP_USER" -- env "PATH=$PATH" "NPM_CONFIG_CACHE=$NPM_CACHE_DIR" "$@"
  else
    NPM_CONFIG_CACHE="$NPM_CACHE_DIR" "$@"
  fi
}

rollback() {
  local exit_code=$?
  trap - ERR
  set +e

  if [ -n "$PREVIOUS_REF" ]; then
    echo "Deployment failed. Restoring $PREVIOUS_REF..." >&2
    cd "$APP_DIR"
    if [ -f "$ENV_BACKUP" ]; then
      cp -f "$ENV_BACKUP" "$ENV_FILE"
      chown "$APP_USER:$APP_USER" "$ENV_FILE" 2>/dev/null || true
    fi
    run_as_app git reset --hard "$PREVIOUS_REF"
    run_as_app npm ci --omit=dev --no-audit --no-fund
    systemctl restart note-dist
  fi

  exit "$exit_code"
}

trap rollback ERR

cd "$APP_DIR"
if [ ! -f "$ENV_FILE" ]; then
  echo "Missing required environment file: $ENV_FILE" >&2
  exit 1
fi

cp -f "$ENV_FILE" "$ENV_BACKUP"

DIRTY_TRACKED_FILES="$(run_as_app git status --short --untracked-files=no)"
DIRTY_TRACKED_FILES="$(printf '%s\n' "$DIRTY_TRACKED_FILES" | grep -vE '^ M \.env$|^M  \.env$|^MM \.env$|^AM \.env$|^ T \.env$' || true)"
if [ -n "$DIRTY_TRACKED_FILES" ]; then
  echo "Refusing to deploy: tracked files in $APP_DIR have local changes beyond .env." >&2
  printf '%s\n' "$DIRTY_TRACKED_FILES" >&2
  exit 1
fi

PREVIOUS_REF="$(run_as_app git rev-parse HEAD)"
run_as_app git fetch origin "$BRANCH"
run_as_app git reset --hard "origin/$BRANCH"
cp -f "$ENV_BACKUP" "$ENV_FILE"
chown "$APP_USER:$APP_USER" "$ENV_FILE" 2>/dev/null || true
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
