#!/usr/bin/env bash
set -euo pipefail

TARGET_BRANCH="${TARGET_BRANCH:-refs/heads/main}"
DEPLOY_COMMAND="${DEPLOY_COMMAND:-/usr/local/bin/update-note-dist}"
LOG_FILE="${LOG_FILE:-/www/wwwroot/deploy.log}"

while read -r oldrev newrev refname; do
  if [ "$refname" != "$TARGET_BRANCH" ]; then
    continue
  fi

  {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] post-receive: deploying $refname at $newrev"
    "$DEPLOY_COMMAND"
  } >>"$LOG_FILE" 2>&1
done
