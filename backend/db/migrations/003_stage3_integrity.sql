-- Stage 3: trusted attempt integrity.
-- Deduplicate legacy responses before enforcing one answer per question.
-- Keep the strongest graded row, not an arbitrary ctid: a correct/high-score
-- row must never be replaced by an empty duplicate.
DELETE FROM question_responses a
USING (
  SELECT ctid,
         ROW_NUMBER() OVER (
           PARTITION BY session_id, question_id
           ORDER BY (is_correct IS TRUE) DESC, raw_score DESC, created_at DESC, ctid DESC
         ) AS rn
  FROM question_responses
) d
WHERE a.ctid = d.ctid AND d.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_question_responses_session_question
  ON question_responses(session_id, question_id);

-- Certificates are already unique by test_session_id in init.sql; this keeps
-- migration idempotent for older installations.
CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_session
  ON certificates(test_session_id);
