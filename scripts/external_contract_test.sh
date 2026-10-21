#!/usr/bin/env bash
# Local provider-contract tests. These use httptest servers, not real credentials.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"
go test ./internal/ai -run 'TestOpenAICompatible' -count=1
go test ./internal/email -run 'TestResend' -count=1
go test ./internal/observability -run 'TestCaptureClientError|TestInit|TestMiddleware' -count=1
go test ./internal/service -run 'TestVerifyApple|TestVerifyGoogle|TestYandexOAuthContract|TestVKOAuthContract|TestOAuthTransaction' -count=1
echo "external provider contract tests passed"
