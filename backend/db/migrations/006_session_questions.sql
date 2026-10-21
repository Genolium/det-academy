CREATE TABLE IF NOT EXISTS session_questions (
    session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(100) NOT NULL,
    stage_name VARCHAR(50) NOT NULL,
    position INT NOT NULL DEFAULT 0,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deadline_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (session_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_session_questions_session
  ON session_questions(session_id, stage_name, position);
