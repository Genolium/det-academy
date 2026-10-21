# Production edge and Directus readiness

Read-only production evidence collected on 2026-10-21:

```bash
node scripts/edge_preflight.mjs
```

| Check | `det-academy.ru` | `directus.det-academy.ru` |
|---|---|---|
| DNS | `5.42.220.14` | `5.42.220.14` |
| TLS hostname | valid | **mismatch** (certificate SAN only contains `det-academy.ru`, `www.det-academy.ru`) |
| Certificate expiry | 2027-01-03 (73 days) | 2027-01-03 (73 days) |
| HTTP/2 (ALPN) | yes | yes |
| HSTS | **missing** | **missing** |
| CSP / X-Frame-Options / Referrer-Policy / Permissions-Policy | **missing** | **missing** |
| HTTP status | `200` | `404` from the Next.js app, not Directus |
| Server | `nginx/1.24.0 (Ubuntu)` | `nginx/1.24.0 (Ubuntu)` |

The Directus hostname currently points at the apex Nginx default/app server. The
dedicated Directus server block is not deployed, and the TLS certificate does not
cover the subdomain. The repository already contains the corrected config:

- `nginx/det-academy.ru.conf` — production-compatible with nginx 1.24
  (`listen ... http2`, dedicated `directus.det-academy.ru` certificate);
- `nginx/det-academy.ru.modern.conf` — for nginx >= 1.25.1 (`http2 on`);
- `scripts/validate_nginx_config.sh` — validates both versions in Docker;
- `scripts/setup_nginx_ssl.sh` — requests a separate Directus certificate and
  selects the correct config based on the installed nginx version.

## Required server-side steps

These steps need SSH access to `5.42.220.14` (or another authorized deployment
channel) and were **not executed** by this repository change:

```bash
# On the server, from an updated checkout:
sudo certbot --nginx -d directus.det-academy.ru --redirect
sudo cp nginx/det-academy.ru.conf /etc/nginx/sites-available/det-academy.ru
sudo nginx -t
sudo systemctl reload nginx
```

Then verify from a trusted workstation:

```bash
node scripts/edge_preflight.mjs
DIRECTUS_URL=https://directus.det-academy.ru \
DIRECTUS_TOKEN="<production-admin-token>" \
node scripts/directus_preflight.mjs --production
```

`edge_preflight.mjs` exits non-zero until hostname validation, HSTS, security
headers, HTTP/2 and the Directus health endpoint all pass. `directus_preflight.mjs`
also verifies the `vocabulary_publication` collection, its fields, the public read
permission and an anonymous published row.

## Current status

The edge is **BLOCKED** on server access: the repository-side configuration and
preflight are ready, but production still serves the wrong certificate/vhost and
omits the security headers.
