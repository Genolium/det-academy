-- Word-level pronunciation clarity feedback computed in the browser.
--
-- This is display-only feedback: it is never used for scoring. The report
-- carries `method = "clarity-proxy"` and must not be presented as a phoneme
-- accuracy score.
ALTER TABLE evaluations
    ADD COLUMN IF NOT EXISTS pronunciation JSONB NOT NULL DEFAULT 'null'::jsonb;
