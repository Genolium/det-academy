#!/usr/bin/env bash
# Free disk space on the shared production host without touching running
# containers or volumes. Safe to run by cron and after a successful deploy.
#
# The host is shared with other projects, so this script only prunes:
#   - dangling Docker images (never tagged images of other projects);
#   - det-academy release tags other than latest/previous;
#   - stopped containers and all Docker build cache.
# It never runs `docker image prune -a` or `docker volume prune`.
set -euo pipefail

log() { printf '[cleanup] %s\n' "$1"; }

# Log to the journal so the alert is visible even when cron output goes to a
# log file. Telegram is optional and activates only when both variables are set.
notify() {
  local level="$1"
  local message="$2"
  log "$message"
  if command -v logger >/dev/null 2>&1; then
    logger -t det-maintenance -p "user.${level}" "$message" || true
  fi
  if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ] \
     && command -v curl >/dev/null 2>&1; then
    curl -fsS --max-time 10 \
      "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
      --data-urlencode "text=${message}" >/dev/null 2>&1 || true
  fi
}

prune_det_release_tags() {
  local service="$1"
  local tags tag
  tags="$(docker images "det-academy-${service}" --format '{{.Tag}}' 2>/dev/null || true)"
  while IFS= read -r tag; do
    case "$tag" in
      ''|latest|previous|'<none>') continue ;;
    esac
    log "removing det-academy-${service}:${tag}"
    docker rmi "det-academy-${service}:${tag}" >/dev/null 2>&1 || true
  done <<< "$tags"
}

if command -v docker >/dev/null 2>&1; then
  log "pruning dangling images older than 7 days"
  docker image prune -f --filter "until=168h" >/dev/null || true

  log "pruning all build cache"
  docker builder prune -f >/dev/null || true

  log "removing old det-academy release tags (keeping latest/previous)"
  for service in backend frontend; do
    prune_det_release_tags "$service"
  done

  log "removing stopped containers"
  docker container prune -f >/dev/null || true
fi

if command -v journalctl >/dev/null 2>&1; then
  log "capping journal at 1G"
  journalctl --vacuum-size=1G >/dev/null 2>&1 || true
fi

if command -v df >/dev/null 2>&1; then
  usage="$(df -P / | awk 'NR==2 {gsub(/%/, "", $5); print $5}')"
  log "disk after cleanup: ${usage}% used"
  if [ -n "$usage" ]; then
    if [ "$usage" -ge 90 ]; then
      notify err "CRITICAL: / is ${usage}% full on $(hostname)"
    elif [ "$usage" -ge 85 ]; then
      notify warning "WARNING: / is ${usage}% full on $(hostname)"
    elif [ "$usage" -ge 80 ]; then
      notify notice "NOTICE: / is ${usage}% full on $(hostname)"
    fi
  fi
fi
