-- Learning events and mastery history (Sprint 2)
-- Immutable domain events representing actual student activity.

CREATE TABLE IF NOT EXISTS learning_events (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    idempotency_key VARCHAR(160) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_learning_events_user_key UNIQUE (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_learning_events_user_type_created
    ON learning_events(user_id, event_type, created_at DESC);

-- Practice attempts submitted by the student in Practice Hub
CREATE TABLE IF NOT EXISTS practice_attempts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_type VARCHAR(50) NOT NULL,
    prompt_context TEXT NOT NULL DEFAULT '',
    user_response JSONB NOT NULL DEFAULT '{}',
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    time_spent_sec INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_type
    ON practice_attempts(user_id, question_type, created_at DESC);

-- Typing speed & accuracy attempts
CREATE TABLE IF NOT EXISTS typing_attempts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wpm INT NOT NULL,
    accuracy DOUBLE PRECISION NOT NULL,
    mode VARCHAR(20) NOT NULL DEFAULT 'time',
    duration_sec INT NOT NULL DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_typing_attempts_user_created
    ON typing_attempts(user_id, created_at DESC);

-- Aggregated skill mastery per user
CREATE TABLE IF NOT EXISTS user_skill_mastery (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill VARCHAR(50) NOT NULL,
    mastery_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    attempts_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, skill)
);
