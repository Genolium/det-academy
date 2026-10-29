-- Server-issued practice assignments must be owned, immutable and single-use.
ALTER TABLE practice_assignments
    ADD COLUMN IF NOT EXISTS correct_answers JSONB NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS attempt_id VARCHAR(100);

ALTER TABLE practice_attempts
    ADD COLUMN IF NOT EXISTS assignment_id VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS uq_practice_attempts_assignment
    ON practice_attempts(assignment_id)
    WHERE assignment_id IS NOT NULL;
