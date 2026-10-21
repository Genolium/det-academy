ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS transcript_source VARCHAR(20) DEFAULT 'none';
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT '';
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS evaluator_version VARCHAR(30) DEFAULT '';
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS feedback_status VARCHAR(30) DEFAULT 'completed';
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS feedback TEXT DEFAULT '';
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS evidence_spans JSONB NOT NULL DEFAULT '[]';
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS last_error TEXT DEFAULT '';

CREATE TABLE IF NOT EXISTS evaluation_jobs (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(100) NOT NULL,
    evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    audio_path TEXT DEFAULT '',
    audio_mime VARCHAR(100) DEFAULT '',
    client_transcript TEXT DEFAULT '',
    status VARCHAR(30) NOT NULL DEFAULT 'queued',
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    next_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_error TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evaluation_jobs_status
  ON evaluation_jobs(status, next_attempt_at);
