CREATE TABLE IF NOT EXISTS study_plan_task_completions (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id VARCHAR(100) NOT NULL,
    task_date DATE NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'manual',
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, task_id, task_date)
);

CREATE INDEX IF NOT EXISTS idx_plan_task_completions_user_date
  ON study_plan_task_completions(user_id, task_date);
