-- Short-window HTTP rate-limit counters. Keeping them in PostgreSQL makes the
-- limiter survive a restart and share state between backend replicas.
CREATE TABLE IF NOT EXISTS rate_limit_counters (
    bucket TEXT NOT NULL,
    subject TEXT NOT NULL,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    used INTEGER NOT NULL DEFAULT 0 CHECK (used >= 0),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (bucket, subject, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_counters_window_start
    ON rate_limit_counters (window_start);
