CREATE TABLE IF NOT EXISTS session_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    stage_name VARCHAR(50) NOT NULL DEFAULT '',
    question_id VARCHAR(100) DEFAULT '',
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_session_events_session
  ON session_events(session_id, created_at);
