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
    token_version INT NOT NULL DEFAULT 0,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email_verification_token_hash VARCHAR(128) DEFAULT '',
    email_verification_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User social accounts / linked OAuth identities
CREATE TABLE IF NOT EXISTS user_social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'google', 'vk', 'yandex', 'apple'
    provider_user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_provider_user_id UNIQUE (provider, provider_user_id),
    CONSTRAINT uq_user_provider UNIQUE (user_id, provider)
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
    time_limit TEXT NOT NULL,
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
    mode VARCHAR(20) NOT NULL DEFAULT 'full',
    overall_score INT,
    reading_score INT,
    listening_score INT,
    writing_score INT,
    speaking_score INT,
    literacy_score INT,
    comprehension_score INT,
    production_score INT,
    conversation_score INT,
    deadline_at TIMESTAMP WITH TIME ZONE,
    blueprint_version VARCHAR(50) DEFAULT '2026.1',
    scoring_version VARCHAR(50) DEFAULT 'irt-2pl-v2',
    content_snapshot JSONB NOT NULL DEFAULT '{}',
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

-- Immutable attempt events (timeouts, rejected answers, security signals)
CREATE TABLE IF NOT EXISTS session_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    stage_name VARCHAR(50) NOT NULL DEFAULT '',
    question_id VARCHAR(100) DEFAULT '',
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Server-issued question assignments (allowlist + per-item deadlines)
CREATE TABLE IF NOT EXISTS session_questions (
    session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(100) NOT NULL,
    stage_name VARCHAR(50) NOT NULL,
    position INT NOT NULL DEFAULT 0,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deadline_at TIMESTAMP WITH TIME ZONE NOT NULL,
    question_snapshot JSONB NOT NULL DEFAULT '{}',
    PRIMARY KEY (session_id, question_id)
);

-- Media Assets (Recorded audio & speech blobs)
CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES test_sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(100),
    file_type VARCHAR(50) NOT NULL,
    file_path TEXT NOT NULL,
    url TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    duration_sec DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rubric & NLP Evaluation Results
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID REFERENCES question_responses(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(100) NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    word_count INT NOT NULL DEFAULT 0,
    unique_words INT NOT NULL DEFAULT 0,
    lexical_diversity DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    academic_words JSONB NOT NULL DEFAULT '[]',
    connectors JSONB NOT NULL DEFAULT '[]',
    relevance_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    cefr_level VARCHAR(10) NOT NULL DEFAULT '',
    speaking_duration DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    wpm DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    recommendations JSONB NOT NULL DEFAULT '[]',
    audio_url TEXT DEFAULT '',
    transcript TEXT DEFAULT '',
    transcript_source VARCHAR(20) DEFAULT 'none',
    provider VARCHAR(50) DEFAULT '',
    evaluator_version VARCHAR(30) DEFAULT '',
    feedback_status VARCHAR(30) DEFAULT 'completed',
    feedback TEXT DEFAULT '',
    evidence_spans JSONB NOT NULL DEFAULT '[]',
    retry_count INT NOT NULL DEFAULT 0,
    last_error TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Async evaluation jobs (STT + rubric + optional AI enrichment)
CREATE TABLE IF NOT EXISTS evaluation_jobs (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(100) NOT NULL,
    evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    audio_path TEXT DEFAULT '',
    audio_mime VARCHAR(100) DEFAULT '',
    client_transcript TEXT DEFAULT '',
    mode VARCHAR(20) NOT NULL DEFAULT 'speaking',
    status VARCHAR(30) NOT NULL DEFAULT 'queued',
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    next_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_error TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_session_id UUID UNIQUE NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
    candidate_name VARCHAR(255) NOT NULL,
    overall_score INT NOT NULL,
    reading_score INT DEFAULT 0,
    listening_score INT DEFAULT 0,
    writing_score INT DEFAULT 0,
    speaking_score INT DEFAULT 0,
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

-- User Goals and Study Plan parameters
CREATE TABLE IF NOT EXISTS user_goals (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    target_score INT NOT NULL DEFAULT 125,
    target_date VARCHAR(20) NOT NULL DEFAULT '',
    daily_minutes INT NOT NULL DEFAULT 45,
    target_university_id VARCHAR(100) DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Error Notebook
CREATE TABLE IF NOT EXISTS user_errors (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_type VARCHAR(50) NOT NULL,
    prompt TEXT NOT NULL,
    user_answer TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT DEFAULT '',
    error_category VARCHAR(50) NOT NULL DEFAULT 'general',
    error_rule VARCHAR(100) NOT NULL DEFAULT '',
    context_variants JSONB NOT NULL DEFAULT '[]',
    consecutive_successes INT NOT NULL DEFAULT 0,
    attempts_count INT NOT NULL DEFAULT 0,
    mastered BOOLEAN NOT NULL DEFAULT FALSE,
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rotating refresh tokens (HttpOnly cookie transport)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id, expires_at);

-- Daily study plan task completions
CREATE TABLE IF NOT EXISTS study_plan_task_completions (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id VARCHAR(100) NOT NULL,
    task_date DATE NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'manual',
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, task_id, task_date)
);

-- Daily activity ledger (server-owned streak)
CREATE TABLE IF NOT EXISTS user_activity (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'app',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, activity_date)
);

-- User SRS Spaced Repetition Progress
CREATE TABLE IF NOT EXISTS user_srs_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    streak_days INT NOT NULL DEFAULT 0,
    last_studied_date VARCHAR(20) NOT NULL DEFAULT '',
    total_reviewed INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_srs_cards (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id VARCHAR(100) NOT NULL,
    interval_days INT NOT NULL DEFAULT 1,
    repetitions INT NOT NULL DEFAULT 0,
    easiness_factor DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    due_date VARCHAR(20) NOT NULL,
    last_reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, card_id)
);

-- Vocabulary publishing table (Directus/CMS managed, public read only when published)
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

-- One-time OAuth transactions (server-side state, nonce, PKCE)
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_theory_progress_user ON theory_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_type_diff ON questions(type, difficulty_band, is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_test_sessions_user ON test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_question_responses_session ON question_responses(session_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_question_responses_session_question ON question_responses(session_id, question_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_session ON media_assets(session_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_session ON evaluations(session_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_jobs_status ON evaluation_jobs(status, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_evaluation_jobs_lease ON evaluation_jobs(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_session_events_session ON session_events(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_session_questions_session ON session_questions(session_id, stage_name, position);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_banners_placement ON ad_banners(placement, is_active);
CREATE INDEX IF NOT EXISTS idx_institutions_country ON institutions(country, min_score);
CREATE INDEX IF NOT EXISTS idx_user_errors_user ON user_errors(user_id, mastered);
CREATE INDEX IF NOT EXISTS idx_user_srs_cards_due ON user_srs_cards(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_date ON user_activity(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_vocabulary_status_level ON vocabulary_entries(status, level, word);
CREATE INDEX IF NOT EXISTS idx_oauth_transactions_state ON oauth_transactions(state_hash);
CREATE INDEX IF NOT EXISTS idx_oauth_transactions_expiry ON oauth_transactions(expires_at);

-- Token and cost accounting for external AI providers.
CREATE TABLE IF NOT EXISTS ai_usage_events (
    id UUID PRIMARY KEY,
    kind VARCHAR(30) NOT NULL,
    model VARCHAR(160) NOT NULL,
    prompt_tokens INT NOT NULL DEFAULT 0,
    completion_tokens INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_events(created_at DESC);

-- Server-side XP ledger (one immutable reward per idempotency key).
CREATE TABLE IF NOT EXISTS xp_events (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    idempotency_key VARCHAR(160) NOT NULL,
    xp INT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_xp_events_user_key UNIQUE (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_xp_events_user_created ON xp_events(user_id, created_at DESC);

-- Learning events and mastery history (Sprint 2)
CREATE TABLE IF NOT EXISTS learning_events (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    idempotency_key VARCHAR(160) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_learning_events_user_key UNIQUE (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_learning_events_user_type_created
    ON learning_events(user_id, event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS practice_attempts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_type VARCHAR(50) NOT NULL,
    question_id VARCHAR(100),
    prompt_context TEXT NOT NULL DEFAULT '',
    user_response JSONB NOT NULL DEFAULT '{}',
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    time_spent_sec INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_type
    ON practice_attempts(user_id, question_type, created_at DESC);

CREATE TABLE IF NOT EXISTS practice_assignments (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id VARCHAR(100) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    question_type VARCHAR(50) NOT NULL,
    difficulty_band VARCHAR(20) NOT NULL DEFAULT 'B1',
    content_payload JSONB NOT NULL DEFAULT '{}',
    time_limit_sec INT NOT NULL DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_assignments_user_created
    ON practice_assignments(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS typing_attempts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wpm INT NOT NULL,
    accuracy DOUBLE PRECISION NOT NULL,
    mode VARCHAR(20) NOT NULL DEFAULT 'time',
    duration_sec INT NOT NULL DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_typing_attempts_user_created
    ON typing_attempts(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_skill_mastery (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill VARCHAR(50) NOT NULL,
    mastery_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    attempts_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, skill)
);

-- Seed Initial Questions Bank for 13 Modern DET Question Types
INSERT INTO questions (id, type, difficulty_band, content_payload, correct_answers, time_limit_sec, is_active)
VALUES
('q-rs-01', 'READ_SELECT', 'B1', '{"word":"ambiguous"}', '{"isReal":true}', 5, true),
('q-rs-02', 'READ_SELECT', 'B1', '{"word":"disflown"}', '{"isReal":false}', 5, true),
('q-rs-03', 'READ_SELECT', 'B2', '{"word":"empirical"}', '{"isReal":true}', 5, true),
('q-rs-04', 'READ_SELECT', 'C1', '{"word":"refulgent"}', '{"isReal":true}', 5, true),
('q-rs-05', 'READ_SELECT', 'B2', '{"word":"substantiate"}', '{"isReal":true}', 5, true),
('q-rs-06', 'READ_SELECT', 'B2', '{"word":"incomplience"}', '{"isReal":false}', 5, true),
('q-rs-07', 'READ_SELECT', 'C1', '{"word":"ephemeral"}', '{"isReal":true}', 5, true),
('q-rs-08', 'READ_SELECT', 'C1', '{"word":"transpeciate"}', '{"isReal":false}', 5, true),
('q-fb-01', 'FILL_BLANKS', 'B1', '{"sentence":"The research team made a breakthrough in renewable en____ yesterday.","prefix":"en","length":4}', '{"answer":"ergy"}', 20, true),
('q-fb-02', 'FILL_BLANKS', 'B2', '{"sentence":"Students must sub___ their thesis proposals by Friday.","prefix":"sub","length":3}', '{"answer":"mit"}', 20, true),
('q-fb-03', 'FILL_BLANKS', 'B1', '{"sentence":"The professor asked the students to cl___fy their thesis argument.","prefix":"cl","length":3}', '{"answer":"arify"}', 20, true),
('q-fb-04', 'FILL_BLANKS', 'C1', '{"sentence":"The committee reached a unan_____ decision after lengthy debates.","prefix":"unan","length":5}', '{"answer":"imous"}', 20, true),
('q-lt-01', 'LISTEN_TYPE', 'B1', '{"audioUrl":"","spokenText":"The library provides free access to academic journals."}', '{"text":"The library provides free access to academic journals."}', 60, true),
('q-lt-02', 'LISTEN_TYPE', 'B2', '{"audioUrl":"","spokenText":"Technological innovations are reshaping global transportation networks."}', '{"text":"Technological innovations are reshaping global transportation networks."}', 60, true),
('q-lt-03', 'LISTEN_TYPE', 'C1', '{"audioUrl":"","spokenText":"The economic consequences of inflation require comprehensive fiscal intervention."}', '{"text":"The economic consequences of inflation require comprehensive fiscal intervention."}', 60, true),
('q-ct-01', 'C_TEST', 'B2', '{"text":"Urban architecture is rapidly transforming modern cities worldwide. Architects now inc________ sustainable materials to mi________ environmental damage. Green spaces are cr______ within high-density districts. This innovative approach fosters community resilience and improves public well-being."}', '{"answers":["orporate","nimize","eated"]}', 180, true),
('q-ct-02', 'C_TEST', 'B1', '{"text":"Environmental conservation is essential for preserving global biodiversity. Forest ec________ provide critical habitats for en________ species. Without rigorous prot______, numerous species could face extinction in coming decades."}', '{"answers":["osystems","dangered","ection"]}', 180, true),
('q-ct-03', 'C_TEST', 'C1', '{"text":"Cognitive psychology investigates the underlying mechanisms of human memory retention. Researchers hypothesize that sleep facilitates mem________ consolidation, allowing the brain to str________ synaptic connections. Further empirical st________ are warranted to substantiate this model."}', '{"answers":["ory","engthen","udies"]}', 180, true),
('q-ir-01', 'INTERACTIVE_READING', 'B1', '{"passageTitle":"Marine Ecosystems","passageText":"Coral reefs represent some of the most biodiverse ecosystems on our planet. They provide vital coastal protection against severe storms and support thousands of marine species. Recent rises in ocean temperatures have accelerated coral bleaching worldwide. Conservationists are deploying artificial reefs to facilitate habitat regeneration.","gapSentence":{"before":"Coral reefs provide vital coastal ","options":["protection","destruction","pollution","navigation"],"correct":"protection","after":" against severe tropical storms."}}', '{"gapCorrect":"protection","highlightCorrect":"provide vital coastal protection"}', 420, true),
('q-ir-02', 'INTERACTIVE_READING', 'B2', '{"passageTitle":"Renewable Energy Storage","passageText":"As renewable generation expands, grid-scale energy storage becomes essential. Lithium-ion batteries currently dominate short-duration balancing, while pumped hydroelectric systems handle long-term demands. Emerging technologies like flow batteries and compressed air offer scalable alternatives for multi-day storage needs.","gapSentence":{"before":"Grid-scale storage becomes essential to balance ","options":["intermittent","permanent","negligible","identical"],"correct":"intermittent","after":" renewable energy production."}}', '{"gapCorrect":"intermittent","highlightCorrect":"grid-scale energy storage becomes essential"}', 420, true),
('q-ir-03', 'INTERACTIVE_READING', 'C1', '{"passageTitle":"Quantum Computing Horizons","passageText":"Quantum computing harnesses superposition and entanglement to solve computational problems intractable for classical hardware. While cryptographic implications raise pressing security concerns, quantum algorithms promise unprecedented acceleration in molecular simulation and materials design.","gapSentence":{"before":"Quantum algorithms offer unprecedented acceleration in ","options":["materials","destructive","negligible","obsolete"],"correct":"materials","after":" design and pharmaceutical modeling."}}', '{"gapCorrect":"materials","highlightCorrect":"cryptographic implications raise pressing security concerns"}', 420, true),
('q-il-01', 'INTERACTIVE_LISTENING', 'B1', '{"scenario":"You are talking to your academic advisor about your course schedule.","turns":[{"speaker":"Advisor","speakerAudioText":"Good morning! How are your preparation plans coming along for next semester?","options":["I would like to discuss enrolling in advanced statistics and economics.","I forgot where the library is located.","I am looking for the cafeteria."],"correctIndex":0}],"summaryPrompt":"Write a 75-word summary of your conversation with your academic advisor."}', '{"turnsAnswers":[0],"summaryRubric":"advisor_course_schedule"}', 240, true),
('q-il-02', 'INTERACTIVE_LISTENING', 'B2', '{"scenario":"You are speaking with your biology lab instructor regarding a project deadline.","turns":[{"speaker":"Instructor","speakerAudioText":"Hello! Did your group complete the water quality sampling protocol?","options":["Yes, we gathered all field samples and are ready to run the spectrometry analysis.","No, we decided to cancel the entire semester.","We have not attended any classes."],"correctIndex":0}],"summaryPrompt":"Summarize the key decisions agreed upon during the lab briefing."}', '{"turnsAnswers":[0],"summaryRubric":"lab_water_sampling"}', 240, true),
('q-il-03', 'INTERACTIVE_LISTENING', 'C1', '{"scenario":"You are speaking with a university admissions officer regarding international scholarship requirements.","turns":[{"speaker":"Officer","speakerAudioText":"Welcome to the office. Are you applying for the merit-based global leadership stipend?","options":["Yes, I would like to confirm the submission criteria and minimum Duolingo score required.","No, I want to withdraw my application immediately.","Where can I buy lunch on campus?"],"correctIndex":0}],"summaryPrompt":"Summarize the required application credentials discussed in your consultation."}', '{"turnsAnswers":[0],"summaryRubric":"admissions_scholarship_criteria"}', 240, true),
('q-wp-01', 'WRITE_PHOTO', 'B1', '{"imageUrl":"/images/practice/student-library.jpg","prompt":"Write one or more complete sentences describing what you see in the photo."}', '{"rubric":"grammar_vocabulary_structure"}', 60, true),
('q-wp-02', 'WRITE_PHOTO', 'B2', '{"imageUrl":"/images/practice/laboratory-science.jpg","prompt":"Write one or more complete sentences describing what you see in the photo."}', '{"rubric":"grammar_vocabulary_structure"}', 60, true),
('q-wp-03', 'WRITE_PHOTO', 'C1', '{"imageUrl":"/images/practice/university-lecture.jpg","prompt":"Write one or more complete sentences describing what you see in the photo."}', '{"rubric":"grammar_vocabulary_structure"}', 60, true),
('q-iw-01', 'INTERACTIVE_WRITING', 'B1', '{"part1Prompt":"Describe an important hobby or interest that you pursue in your free time. Explain why it is valuable to you. Write for 5 minutes (minimum 80 words).","part2Prompt":"How does engaging in hobbies help people maintain balance during demanding academic or professional periods? Write for 3 minutes (minimum 50 words)."}', '{"rubric":"academic_cohesion_min80_min50"}', 480, true),
('q-iw-02', 'INTERACTIVE_WRITING', 'B2', '{"part1Prompt":"Some universities require students to complete community service hours prior to graduation. Do you support this policy? Explain your reasons with examples. Write for 5 minutes (minimum 80 words).","part2Prompt":"What unintended challenges might students encounter when community service is made mandatory rather than voluntary? Write for 3 minutes (minimum 50 words)."}', '{"rubric":"academic_cohesion_min80_min50"}', 480, true),
('q-iw-03', 'INTERACTIVE_WRITING', 'C1', '{"part1Prompt":"Some educational theorists propose that remote learning should permanently replace traditional lecture halls in higher education. To what extent do you agree or disagree? Write for 5 minutes (minimum 80 words).","part2Prompt":"What psychological impacts might fully virtual university degree programs have on student collaboration and networking? Write for 3 minutes (minimum 50 words)."}', '{"rubric":"academic_cohesion_min80_min50"}', 480, true),
('q-sp-01', 'SPEAK_PHOTO', 'B1', '{"imageUrl":"/images/practice/park-gathering.jpg","prompt":"Speak for 90 seconds about the scene in this image. Describe what the people are doing and the environment around them."}', '{"rubric":"fluency_pronunciation_vocabulary_min90s"}', 90, true),
('q-sp-02', 'SPEAK_PHOTO', 'B2', '{"imageUrl":"/images/practice/engineering-workshop.jpg","prompt":"Speak for 90 seconds about what you see in the photo. Describe the equipment, the people involved, and what they appear to be building."}', '{"rubric":"fluency_pronunciation_vocabulary_min90s"}', 90, true),
('q-sp-03', 'SPEAK_PHOTO', 'C1', '{"imageUrl":"/images/practice/city-skyline.jpg","prompt":"Speak for 90 seconds about the scene in this urban photograph, focusing on architectural dynamics and sustainability."}', '{"rubric":"fluency_pronunciation_vocabulary_min90s"}', 90, true),
('q-rts-01', 'READ_THEN_SPEAK', 'B1', '{"prompt":"Describe a memorable journey or trip you have taken. Where did you travel, who accompanied you, and what made this experience unforgettable? Speak for 90 seconds."}', '{"rubric":"fluency_organization_academic_discourse_min90s"}', 90, true),
('q-rts-02', 'READ_THEN_SPEAK', 'B2', '{"prompt":"Discuss a technological advancement that has significantly affected human communication over the past decade. Explain how it has altered relationships and what drawbacks have arisen. Speak for 90 seconds."}', '{"rubric":"fluency_organization_academic_discourse_min90s"}', 90, true),
('q-rts-03', 'READ_THEN_SPEAK', 'C1', '{"prompt":"Many sociologists argue that rapid urbanization has eroded local community cohesion in favor of individualized lifestyles. Do you agree with this assessment? Provide concrete reasons and examples. Speak for 90 seconds."}', '{"rubric":"fluency_organization_academic_discourse_min90s"}', 90, true),
('q-is-01', 'INTERACTIVE_SPEAKING', 'B1', '{"scenario":"You are speaking with your academic advisor about your study schedule.","prompt":"Explain why you want to change one of your elective courses for next term. Speak clearly for 35 seconds."}', '{"rubric":"conversational_fluency_responsiveness"}', 210, true),
('q-is-02', 'INTERACTIVE_SPEAKING', 'B2', '{"scenario":"You are participating in an academic seminar discussing public health initiatives.","prompt":"Address the question: how can local governments incentivize healthy eating habits among urban populations? Speak for 35 seconds."}', '{"rubric":"conversational_fluency_responsiveness"}', 210, true),
('q-is-03', 'INTERACTIVE_SPEAKING', 'C1', '{"scenario":"You are participating in an academic panel debating global carbon offset programs.","prompt":"Explain how verifiable third-party auditing can prevent corporate greenwashing. Speak clearly for 35 seconds."}', '{"rubric":"conversational_fluency_responsiveness"}', 210, true),
('q-ws-01', 'WRITING_SAMPLE', 'B1', '{"prompt":"Many people argue that students benefit more from studying practical career skills than theoretical academic subjects. Which do you consider more beneficial for long-term success? Write for 5 minutes (minimum 100 words)."}', '{"rubric":"academic_argumentation_min100"}', 300, true),
('q-ws-02', 'WRITING_SAMPLE', 'B2', '{"prompt":"Do you believe governments should prioritize public funding for space exploration or for resolving pressing environmental issues on Earth? State your position and defend it with reasons and evidence. Write for 5 minutes (minimum 100 words)."}', '{"rubric":"academic_argumentation_min100"}', 300, true),
('q-ws-03', 'WRITING_SAMPLE', 'C1', '{"prompt":"Should scientific research funded by public tax revenues be published under open-access mandates without embargo periods, or should academic publishers retain copyright monetization? Defend your viewpoint. Write for 5 minutes (minimum 100 words)."}', '{"rubric":"academic_argumentation_min100"}', 300, true),
('q-ss-01', 'SPEAKING_SAMPLE', 'B1', '{"prompt":"Some people prefer living in large cosmopolitan cities, while others find life in smaller rural towns more satisfying. Which lifestyle do you personally prefer, and why? Speak for 1 to 3 minutes."}', '{"rubric":"extended_discourse_academic_speech_min180s"}', 180, true),
('q-ss-02', 'SPEAKING_SAMPLE', 'B2', '{"prompt":"With the rapid development of artificial intelligence, should schools mandate AI literacy courses for all students, or should AI tools be restricted in academic evaluations? Defend your opinion for 1 to 3 minutes."}', '{"rubric":"extended_discourse_academic_speech_min180s"}', 180, true),
('q-ss-03', 'SPEAKING_SAMPLE', 'C1', '{"prompt":"Some experts predict that autonomous artificial intelligence will eliminate more jobs than it creates over the next generation. In your view, will technological disruption exacerbate societal inequality or stimulate new industries? Speak for 1 to 3 minutes."}', '{"rubric":"extended_discourse_academic_speech_min180s"}', 180, true)
ON CONFLICT (id) DO NOTHING;


