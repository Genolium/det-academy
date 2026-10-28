-- Daily limit counters keyed by scope and subject (an IP address or a hashed
-- device identifier). The per-user quota continues to be derived from the
-- activity tables; this table only adds the independent IP/device caps and
-- makes them survive a restart.
CREATE TABLE IF NOT EXISTS daily_limit_counters (
    scope TEXT NOT NULL,
    subject TEXT NOT NULL,
    window_start DATE NOT NULL,
    used INTEGER NOT NULL DEFAULT 0 CHECK (used >= 0),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (scope, subject, window_start)
);

CREATE INDEX IF NOT EXISTS idx_daily_limit_counters_window_start
    ON daily_limit_counters (window_start);
