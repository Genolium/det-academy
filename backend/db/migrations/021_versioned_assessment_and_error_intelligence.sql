-- Versioned Assessment Snapshot & Error Intelligence (Sprint 4)
-- Enables reproducible mock results across time and deep error categorization with context variations.

-- 1. Add versioning and snapshot columns to test_sessions
ALTER TABLE test_sessions
    ADD COLUMN IF NOT EXISTS blueprint_version VARCHAR(50) DEFAULT '2026.1',
    ADD COLUMN IF NOT EXISTS scoring_version VARCHAR(50) DEFAULT 'irt-2pl-v2',
    ADD COLUMN IF NOT EXISTS content_snapshot JSONB NOT NULL DEFAULT '{}';

-- 2. Add question snapshots to session_questions
ALTER TABLE session_questions
    ADD COLUMN IF NOT EXISTS question_snapshot JSONB NOT NULL DEFAULT '{}';

-- 3. Add error category, error rule, and contextual variants to user_errors
ALTER TABLE user_errors
    ADD COLUMN IF NOT EXISTS error_category VARCHAR(50) NOT NULL DEFAULT 'general',
    ADD COLUMN IF NOT EXISTS error_rule VARCHAR(100) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS context_variants JSONB NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_user_errors_category
    ON user_errors(user_id, error_category);
