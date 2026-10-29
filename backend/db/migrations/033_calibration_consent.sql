-- Explicit opt-in for using real speaking/writing responses in calibration.
-- Without an active row, the exporter must not include the response.
CREATE TABLE IF NOT EXISTS calibration_consents (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    consent_version VARCHAR(20) NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE
);
