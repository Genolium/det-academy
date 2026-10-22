-- Seed lessons use descriptive time-limit strings longer than 50 chars.
DO $$
BEGIN
  ALTER TABLE theory_lessons ALTER COLUMN time_limit TYPE TEXT;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'could not widen theory_lessons.time_limit';
END $$;
