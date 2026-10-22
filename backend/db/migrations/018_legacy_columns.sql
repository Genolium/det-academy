-- Columns that were added to the canonical schema after the first production
-- database was created. That database was initialised from an older revision
-- of init.sql, and init.sql is only applied to new tables, so these columns
-- were missing on production and broke the features that use them.
--
-- Every statement is idempotent and safe to run on a database that already
-- has the columns.
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS reading_score INT DEFAULT 0;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS listening_score INT DEFAULT 0;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS writing_score INT DEFAULT 0;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS speaking_score INT DEFAULT 0;

ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS reading_score INT;
ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS listening_score INT;
ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS writing_score INT;
ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS speaking_score INT;
ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMP WITH TIME ZONE;
