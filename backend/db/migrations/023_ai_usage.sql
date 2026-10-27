-- Token and cost accounting for external AI providers.
CREATE TABLE IF NOT EXISTS ai_usage_events (
    id UUID PRIMARY KEY,
    kind VARCHAR(30) NOT NULL,          -- enrich | evaluate | transcribe
    model VARCHAR(160) NOT NULL,
    prompt_tokens INT NOT NULL DEFAULT 0,
    completion_tokens INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_events(created_at DESC);
