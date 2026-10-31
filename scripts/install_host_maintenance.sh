#!/usr/bin/env bash
# Install a daily host maintenance timer and cap journald growth.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
chmod +x "$REPO_ROOT/scripts/cleanup_host.sh"

cat >/etc/cron.d/det-maintenance <<EOF
SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
15 4 * * * root cd $REPO_ROOT && ./scripts/cleanup_host.sh >> /var/log/det-maintenance.log 2>&1
EOF
chmod 0644 /etc/cron.d/det-maintenance

if [ -f /etc/systemd/journald.conf ]; then
  if ! grep -q '^SystemMaxUse=' /etc/systemd/journald.conf; then
    printf '\nSystemMaxUse=1G\n' >> /etc/systemd/journald.conf
  fi
  systemctl restart systemd-journald || true
fi

echo "installed /etc/cron.d/det-maintenance and capped journald at 1G"
