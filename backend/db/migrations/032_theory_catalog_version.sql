-- One versioned catalogue for the theory course. The backend is the source of
-- truth; the frontend static array is only an explicit offline fallback.
ALTER TABLE theory_lessons
    ADD COLUMN IF NOT EXISTS publish_status VARCHAR(20) NOT NULL DEFAULT 'published',
    ADD COLUMN IF NOT EXISTS version VARCHAR(20) NOT NULL DEFAULT '2026.2';
