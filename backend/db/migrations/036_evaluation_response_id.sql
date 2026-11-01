-- Calibration exports need exactly one evaluation per answer. Existing rows
-- were written before response_id was populated; backfill them from the
-- session/question pair, then enforce the invariant going forward.
UPDATE evaluations e
SET response_id = qr.id
FROM question_responses qr
WHERE e.response_id IS NULL
  AND e.session_id = qr.session_id
  AND e.question_id = qr.question_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_evaluations_session_question
    ON evaluations (session_id, question_id);
