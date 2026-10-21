-- Stage 3: trusted attempt integrity.
-- Deduplicate legacy responses before enforcing one answer per question.
DELETE FROM question_responses a
USING question_responses b
WHERE a.ctid < b.ctid
  AND a.session_id = b.session_id
  AND a.question_id = b.question_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_question_responses_session_question
  ON question_responses(session_id, question_id);

-- Certificates are already unique by test_session_id in init.sql; this keeps
-- migration idempotent for older installations.
CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_session
  ON certificates(test_session_id);
