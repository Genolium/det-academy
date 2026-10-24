-- 022_server_authoritative_practice_assignments.sql
-- Server-authoritative Practice Hub: assignments table and question_id on attempts

ALTER TABLE practice_attempts ADD COLUMN IF NOT EXISTS question_id VARCHAR(100);

CREATE TABLE IF NOT EXISTS practice_assignments (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id VARCHAR(100) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    question_type VARCHAR(50) NOT NULL,
    difficulty_band VARCHAR(20) NOT NULL DEFAULT 'B1',
    content_payload JSONB NOT NULL DEFAULT '{}',
    time_limit_sec INT NOT NULL DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_assignments_user_created
    ON practice_assignments(user_id, created_at DESC);
