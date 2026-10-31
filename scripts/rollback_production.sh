#!/usr/bin/env bash
# Roll back backend/frontend to the images tagged before the last deploy.
# Database migrations are not reverted; restore a dump if a migration is the
# cause of the incident.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

previous_tag="${DEPLOY_PREVIOUS_TAG:-previous}"
for service in backend frontend; do
  image="det-academy-${service}:${previous_tag}"
  if ! docker image inspect "$image" >/dev/null 2>&1; then
    echo "rollback image missing: $image" >&2
    exit 1
  fi
  docker tag "$image" "det-academy-${service}:latest"
done

docker compose up -d --no-build backend frontend

for _ in $(seq 1 60); do
  if curl -fsS --max-time 3 http://127.0.0.1:18080/api/v1/ready >/dev/null 2>&1; then
    echo "rollback healthy"
    exit 0
  fi
  sleep 2
done

echo "rollback containers started but /ready did not become healthy" >&2
exit 1
