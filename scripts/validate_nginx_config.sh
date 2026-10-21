#!/usr/bin/env bash
# Validate both nginx configurations against the nginx versions they target.
# Production (Ubuntu 24.04) ships nginx 1.24, where `listen ... http2` is correct.
# nginx >= 1.25.1 uses `http2 on` and warns about the old form.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

mkdir -p "$TMP/certs"
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout "$TMP/certs/privkey.pem" \
  -out "$TMP/certs/fullchain.pem" \
  -subj '/CN=det-academy.ru' >/dev/null 2>&1
cp "$TMP/certs/fullchain.pem" "$TMP/certs/chain.pem"

cat > "$TMP/nginx.conf" <<'NGINX'
worker_processes 1;
error_log /dev/stderr warn;
pid /tmp/nginx-test.pid;
events { worker_connections 64; }
http {
  access_log off;
  include /etc/nginx-test/site.conf;
}
NGINX

validate() {
  local image="$1" source="$2" label="$3"
  sed -e "s#/etc/letsencrypt/live/[^/]*/#/etc/nginx-test/certs/#g" \
      -e "s#/var/www/certbot#/tmp/certbot#g" \
      "$ROOT/nginx/$source" > "$TMP/site.conf"
  echo "== $label ($image) =="
  local output
  output="$(docker run --rm -v "$TMP:/etc/nginx-test:ro" "nginx:$image" nginx -t -c /etc/nginx-test/nginx.conf 2>&1)"
  echo "$output"
  if grep -Eqi 'deprecated|\[warn\]' <<<"$output"; then
    echo "FAIL: $label produced nginx warnings" >&2
    exit 1
  fi
  grep -q 'test is successful' <<<"$output"
}

validate 1.24-alpine det-academy.ru.conf legacy-1.24
validate 1.27-alpine det-academy.ru.modern.conf modern-1.27
echo "nginx config validation passed for production 1.24 and modern 1.27"
