-- Seed lessons use descriptive time-limit strings longer than 50 chars.
ALTER TABLE theory_lessons ALTER COLUMN time_limit TYPE TEXT;
