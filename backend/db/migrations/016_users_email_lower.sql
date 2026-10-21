-- Email is normalized to lowercase in the service and repositories.
-- Enforce it at the database level so case variants cannot create duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower
  ON users (LOWER(email));
