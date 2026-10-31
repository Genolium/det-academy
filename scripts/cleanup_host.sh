#!/usr/bin/env bash
# Free disk space on the shared production host without touching running
# containers or volumes. Safe to run by cron and after a successful deploy.
set -euo pipefail

log() { printf '[cleanup] %s\n' "$1"; }

if command -v docker >/dev/null 2>&1; then
  log "pruning unused images older than 7 days"
  docker image prune -f --filter "until=168h" >/dev/null || true
  log "pruning all build cache"
  docker builder prune -f >/dev/null || true
  log "removing old det-academy release tags (keeping latest/previous)"
  for service in backend frontend; do
    docker images "det-academy-${service}" --format '{{.Tag}}' 2>/dev/null \
      | grep -vE '^(latest|previous|<none>)$' \
      | while IFS= read -r tag; do
          [ -n "$tag" ] && docker rmi "det-academy-${service}:${tag}" >/dev/null 2>&1 || true
        done
  done
  log "removing stopped containers"
  docker container prune -f >/dev/null || true
fi

if command -v journalctl >/dev/null 2>&1; then
  log "capping journal at 1G"
  journalctl --vacuum-size=1G >/dev/null 2>&1 || true
fi

if command -v df >/dev/null 2>&1; then
  log "disk after cleanup"
  df -h / | tail -1
fi
