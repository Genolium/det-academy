.PHONY: install typecheck lint content-lint build test-backend test-postgres test-e2e test-all

install:
	npm ci
	cd backend && go mod download

typecheck:
	npx tsc --noEmit

lint:
	npm run lint

content-lint:
	python3 scripts/lint_content.py

build:
	npm run build

test-backend:
	cd backend && go test ./... -count=1

test-postgres:
	cd backend && TEST_DATABASE_URL="$${TEST_DATABASE_URL:-postgres://postgres:postgres@localhost:15432/det_academy_test?sslmode=disable}" go test ./tests -run TestPostgresTrustedCompletionIntegrity -count=1

test-e2e:
	npx playwright test

test-all: typecheck lint build test-backend test-e2e
