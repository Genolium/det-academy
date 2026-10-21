-- Stale processing jobs are reclaimed by updated_at lease; keep the lookup hot.
CREATE INDEX IF NOT EXISTS idx_evaluation_jobs_lease
  ON evaluation_jobs(status, updated_at);
