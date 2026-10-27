# Build stage
FROM golang:1.26-alpine AS builder

WORKDIR /app

# Install git and build dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build static binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/bin/server ./cmd/server

# Final stage
FROM alpine:3.20

WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata curl ffmpeg

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# The media volume (uploaded audio and the permanent TTS cache) is mounted at
# /data/media. Docker initialises a fresh named volume with the ownership from
# the image, so it must belong to the runtime user: otherwise synthesis fails
# with "speech cache is unavailable" after the first deploy.
RUN mkdir -p /data/media && chown -R appuser:appgroup /data

COPY --from=builder /app/bin/server /app/server
COPY --from=builder /app/db/migrations /app/db/migrations
COPY --from=builder /app/db/init.sql /app/db/init.sql

ENV MIGRATIONS_DIR=/app/db/migrations

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=5s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:8080/api/v1/health || exit 1

ENTRYPOINT ["/app/server"]
