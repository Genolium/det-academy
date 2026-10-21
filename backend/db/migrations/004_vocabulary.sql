CREATE TABLE IF NOT EXISTS vocabulary_entries (
    id VARCHAR(100) PRIMARY KEY,
    word VARCHAR(255) NOT NULL,
    ipa VARCHAR(255) DEFAULT '',
    pos VARCHAR(50) DEFAULT '',
    level VARCHAR(10) DEFAULT '',
    meaning_ru TEXT DEFAULT '',
    definition_en TEXT DEFAULT '',
    example TEXT DEFAULT '',
    collocations JSONB NOT NULL DEFAULT '[]',
    source TEXT DEFAULT '',
    source_url TEXT DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    version VARCHAR(20) NOT NULL DEFAULT '',
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vocabulary_status_level
  ON vocabulary_entries(status, level, word);
