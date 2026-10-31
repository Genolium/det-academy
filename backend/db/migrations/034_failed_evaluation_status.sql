-- Mark evaluations whose queue job exhausted all retries. Without this,
-- an old permanently_failed job can still look PENDING and contribute a zero
-- score to the session instead of leaving the skill unmeasured.
UPDATE evaluations e
SET status = 'FAILED',
    feedback_status = 'permanently_failed',
    last_error = COALESCE(NULLIF(j.last_error, ''), e.last_error)
FROM evaluation_jobs j
WHERE j.evaluation_id = e.id
  AND j.status = 'permanently_failed'
  AND e.status <> 'FAILED';
