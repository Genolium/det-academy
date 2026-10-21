CREATE TABLE IF NOT EXISTS oauth_transactions (
    id UUID PRIMARY KEY,
    state_hash VARCHAR(128) NOT NULL UNIQUE,
    nonce VARCHAR(128) NOT NULL DEFAULT '',
    pkce_verifier VARCHAR(256) NOT NULL DEFAULT '',
    provider VARCHAR(20) NOT NULL,
    action VARCHAR(20) NOT NULL DEFAULT 'login',
    redirect_uri TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    consumed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_oauth_transactions_state
  ON oauth_transactions(state_hash);

CREATE INDEX IF NOT EXISTS idx_oauth_transactions_expiry
  ON oauth_transactions(expires_at);
