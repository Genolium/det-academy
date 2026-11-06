-- Separate the platform owner from operational administrators. The oldest
-- existing administrator becomes the first superadmin so role escalation is
-- never left without an owner after this migration.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'superadmin') THEN
        UPDATE users
        SET role = 'superadmin'
        WHERE id = (
            SELECT id FROM users
            WHERE role = 'admin'
            ORDER BY created_at ASC
            LIMIT 1
        );
    END IF;
END $$;
