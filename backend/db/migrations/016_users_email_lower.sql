-- Email is normalized to lowercase in the service and repositories.
-- Existing rows are lowercased only when it cannot create a duplicate, and
-- the case-insensitive unique index is created only when the data allows it.
UPDATE users u
SET email = lower(u.email)
WHERE u.email <> lower(u.email)
  AND NOT EXISTS (
    SELECT 1 FROM users d
    WHERE d.id <> u.id AND lower(d.email) = lower(u.email)
  );

DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower
    ON users (LOWER(email));
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'duplicate case-insensitive emails exist; idx_users_email_lower skipped';
END $$;
