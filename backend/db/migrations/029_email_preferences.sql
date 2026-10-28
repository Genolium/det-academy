-- Weekly digest opt-out. A missing row means "enabled" so existing users keep
-- receiving the digest until they explicitly unsubscribe.
CREATE TABLE IF NOT EXISTS email_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    digest_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
