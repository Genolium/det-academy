-- DET Academy Database Initialization Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student', -- 'student', 'editor', 'admin'
    avatar_url TEXT DEFAULT '',
    locale VARCHAR(10) DEFAULT 'ru',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Theory lessons content (managed via Headless CMS / Directus)
CREATE TABLE IF NOT EXISTS theory_lessons (
    id VARCHAR(100) PRIMARY KEY,
    number INT NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title_ru VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    category_label_ru VARCHAR(100) NOT NULL,
    category_label_en VARCHAR(100) NOT NULL,
    format TEXT NOT NULL,
    scoring TEXT NOT NULL,
    time_limit VARCHAR(50) NOT NULL,
    rules JSONB NOT NULL DEFAULT '[]',
    strategy_steps JSONB NOT NULL DEFAULT '[]',
    formula TEXT DEFAULT '',
    examples JSONB NOT NULL DEFAULT '[]',
    pitfalls JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Theory progress table
CREATE TABLE IF NOT EXISTS theory_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_slug VARCHAR(100) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_lesson UNIQUE (user_id, lesson_slug)
);

-- Questions bank
CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(100) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    difficulty_band VARCHAR(10) NOT NULL,
    content_payload JSONB NOT NULL,
    correct_answers JSONB NOT NULL,
    time_limit_sec INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Test sessions
CREATE TABLE IF NOT EXISTS test_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    candidate_name VARCHAR(255) NOT NULL DEFAULT 'Candidate',
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
    current_stage INT NOT NULL DEFAULT 1,
    stage_name VARCHAR(50) NOT NULL DEFAULT 'READ_SELECT',
    difficulty_level VARCHAR(10) NOT NULL DEFAULT 'B1',
    overall_score INT,
    literacy_score INT,
    comprehension_score INT,
    production_score INT,
    conversation_score INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Question responses
CREATE TABLE IF NOT EXISTS question_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(100) NOT NULL,
    user_response JSONB NOT NULL,
    is_correct BOOLEAN,
    raw_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    time_spent_sec INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_session_id UUID UNIQUE NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
    candidate_name VARCHAR(255) NOT NULL,
    overall_score INT NOT NULL,
    literacy_score INT NOT NULL,
    comprehension_score INT NOT NULL,
    production_score INT NOT NULL,
    conversation_score INT NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    pdf_url TEXT
);

-- Ad banners
CREATE TABLE IF NOT EXISTS ad_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement VARCHAR(30) NOT NULL, -- 'HEADER', 'FOOTER'
    image_url TEXT NOT NULL DEFAULT '',
    target_url TEXT NOT NULL,
    alt_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Universities and institutions accepting DET
CREATE TABLE IF NOT EXISTS institutions (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) DEFAULT '',
    min_score INT NOT NULL DEFAULT 115,
    subscore_reqs TEXT DEFAULT '',
    latitude DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    longitude DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    website_url TEXT NOT NULL,
    logo_url TEXT DEFAULT '',
    category VARCHAR(50) DEFAULT 'Top Global',
    acceptance_rate VARCHAR(20) DEFAULT '',
    programs TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_theory_progress_user ON theory_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_type_diff ON questions(type, difficulty_band, is_active);
CREATE INDEX IF NOT EXISTS idx_test_sessions_user ON test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_question_responses_session ON question_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_banners_placement ON ad_banners(placement, is_active);
CREATE INDEX IF NOT EXISTS idx_institutions_country ON institutions(country, min_score);
