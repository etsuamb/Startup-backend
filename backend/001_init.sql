CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'Admin', 'Startup', 'Investor', 'Mentor')),
    phone_number VARCHAR(20) UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
    admin_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    privilege_level SMALLINT NOT NULL DEFAULT 1 CHECK (privilege_level BETWEEN 1 AND 10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS startups (
    startup_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    founder_full_name VARCHAR(255) NOT NULL,
    startup_name VARCHAR(255) NOT NULL,
    industry VARCHAR(120),
    startup_tagline VARCHAR(255),
    business_stage VARCHAR(50),
    startup_type VARCHAR(100),
    founded_year INTEGER CHECK (founded_year BETWEEN 1900 AND 2100),
    team_size INTEGER CHECK (team_size >= 0),
    region VARCHAR(100),
    city VARCHAR(100),
    founder_role VARCHAR(100),
    location VARCHAR(150),
    description TEXT,
    website VARCHAR(255),
    uploaded_documents JSONB,
    funding_needed DECIMAL(14,2) CHECK (funding_needed >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS investors (
    investor_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    investor_type VARCHAR(50) NOT NULL,
    organization_name VARCHAR(255),
    investment_budget DECIMAL(14,2) CHECK (investment_budget >= 0),
    preferred_industry VARCHAR(120),
    investment_stage VARCHAR(50),
    location_preference VARCHAR(255),
    linked_in_or_website VARCHAR(255),
    bio TEXT,
    personal_verification VARCHAR(255),
    uploaded_documents JSONB,
    country VARCHAR(100),
    portfolio_size INTEGER CHECK (portfolio_size >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE investors ADD COLUMN IF NOT EXISTS location_preference VARCHAR(255);
ALTER TABLE investors ADD COLUMN IF NOT EXISTS linked_in_or_website VARCHAR(255);
ALTER TABLE investors ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS personal_verification VARCHAR(255);
ALTER TABLE investors ADD COLUMN IF NOT EXISTS uploaded_documents JSONB;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS investor_id INTEGER REFERENCES investors(investor_id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS mentors (
    mentor_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    headline VARCHAR(255),
    expertise TEXT,
    years_experience INTEGER CHECK (years_experience >= 0),
    hourly_rate DECIMAL(10,2) CHECK (hourly_rate >= 0),
    country VARCHAR(100),
    bio TEXT,
    availability JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE mentors ADD COLUMN IF NOT EXISTS professional_title VARCHAR(255);
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS languages VARCHAR(500);
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS linkedin_or_portfolio VARCHAR(500);
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS certification_credentials TEXT;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS availability_preference TEXT;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS session_pricing DECIMAL(10,2) CHECK (session_pricing IS NULL OR session_pricing >= 0);
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS current_organization VARCHAR(255);
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS current_title VARCHAR(255);
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS primary_industry VARCHAR(120);
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS secondary_industry VARCHAR(120);
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS city_location VARCHAR(255);
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS mentor_platform VARCHAR(120);
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS session_frequency VARCHAR(100);
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS required_time_slots TEXT;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS mentoring_style VARCHAR(100);
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS notable_startups_mentored TEXT;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS key_achievement TEXT;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS uploaded_documents JSONB;

DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'mentors'
			AND column_name = 'required_time_slots' AND udt_name = 'jsonb'
	) THEN
		ALTER TABLE mentors ALTER COLUMN required_time_slots TYPE TEXT USING (required_time_slots::text);
	END IF;
END $$;

CREATE TABLE IF NOT EXISTS projects (
    project_id SERIAL PRIMARY KEY,
    startup_id INTEGER NOT NULL REFERENCES startups(startup_id) ON DELETE CASCADE,
    project_title VARCHAR(255) NOT NULL,
    description TEXT,
    funding_goal DECIMAL(14,2) NOT NULL CHECK (funding_goal >= 0),
    amount_raised DECIMAL(14,2) NOT NULL DEFAULT 0 CHECK (amount_raised >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'funded', 'completed', 'cancelled')),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS industry VARCHAR(120);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS lifecycle_stage VARCHAR(80);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS problem_statement TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS solution_statement TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS expected_impact TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS timeline JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS goals JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS market JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS mentor_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS mentor_preferred_field VARCHAR(120);

CREATE TABLE IF NOT EXISTS documents (
    document_id SERIAL PRIMARY KEY,
    startup_id INTEGER REFERENCES startups(startup_id) ON DELETE CASCADE,
    investor_id INTEGER REFERENCES investors(investor_id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(project_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    file_hash VARCHAR(128),
    file_type VARCHAR(100),
    file_size_bytes BIGINT CHECK (file_size_bytes >= 0),
    file_data BYTEA,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE documents ADD COLUMN IF NOT EXISTS mentor_id INTEGER REFERENCES mentors(mentor_id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS mentor_documents (
    mentor_document_id SERIAL PRIMARY KEY,
    mentor_id INTEGER NOT NULL REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    file_type VARCHAR(100),
    file_size_bytes BIGINT CHECK (file_size_bytes >= 0),
    file_data BYTEA,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE mentor_documents DROP CONSTRAINT IF EXISTS mentor_documents_document_type_check;

CREATE TABLE IF NOT EXISTS investment_requests (
    investment_request_id SERIAL PRIMARY KEY,
    startup_id INTEGER NOT NULL REFERENCES startups(startup_id) ON DELETE CASCADE,
    investor_id INTEGER NOT NULL REFERENCES investors(investor_id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    requested_amount DECIMAL(14,2) NOT NULL CHECK (requested_amount > 0),
    proposal_message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS investments (
    investment_id SERIAL PRIMARY KEY,
    investment_request_id INTEGER NOT NULL UNIQUE REFERENCES investment_requests(investment_request_id) ON DELETE CASCADE,
    amount DECIMAL(14,2) NOT NULL CHECK (amount > 0),
    equity_percentage DECIMAL(5,2) CHECK (equity_percentage >= 0 AND equity_percentage <= 100),
    agreement_file_path TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mentorship_requests (
    mentorship_request_id SERIAL PRIMARY KEY,
    startup_id INTEGER NOT NULL REFERENCES startups(startup_id) ON DELETE CASCADE,
    mentor_id INTEGER NOT NULL REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mentorship_sessions (
    mentorship_session_id SERIAL PRIMARY KEY,
    mentorship_request_id INTEGER NOT NULL REFERENCES mentorship_requests(mentorship_request_id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    meeting_link TEXT,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mentorship_reports (
    report_id SERIAL PRIMARY KEY,
    mentorship_request_id INTEGER NOT NULL REFERENCES mentorship_requests(mentorship_request_id) ON DELETE CASCADE,
    mentorship_session_id INTEGER NOT NULL UNIQUE REFERENCES mentorship_sessions(mentorship_session_id) ON DELETE CASCADE,
    startup_id INTEGER NOT NULL REFERENCES startups(startup_id) ON DELETE CASCADE,
    mentor_id INTEGER NOT NULL REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    report_title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    action_items JSONB,
    next_steps JSONB,
    progress_rating SMALLINT CHECK (progress_rating BETWEEN 1 AND 5),
    startup_feedback TEXT,
    mentor_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mentorship_resources (
    resource_id SERIAL PRIMARY KEY,
    mentorship_request_id INTEGER NOT NULL REFERENCES mentorship_requests(mentorship_request_id) ON DELETE CASCADE,
    mentorship_session_id INTEGER REFERENCES mentorship_sessions(mentorship_session_id) ON DELETE CASCADE,
    startup_id INTEGER NOT NULL REFERENCES startups(startup_id) ON DELETE CASCADE,
    mentor_id INTEGER NOT NULL REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    resource_title VARCHAR(255) NOT NULL,
    resource_description TEXT,
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('file', 'link', 'note')),
    file_name VARCHAR(255),
    file_path TEXT UNIQUE,
    file_type VARCHAR(100),
    file_size_bytes BIGINT CHECK (file_size_bytes >= 0),
    external_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id SERIAL PRIMARY KEY,
    from_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    to_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    amount DECIMAL(14,2) NOT NULL CHECK (amount > 0),
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    payment_method VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    reference_type VARCHAR(50),
    reference_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (from_user_id <> to_user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    message_id SERIAL PRIMARY KEY,
    sender_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    receiver_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    subject VARCHAR(255),
    body TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (sender_user_id <> receiver_user_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    reference_type VARCHAR(50),
    reference_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
    review_id SERIAL PRIMARY KEY,
    startup_id INTEGER NOT NULL REFERENCES startups(startup_id) ON DELETE CASCADE,
    mentor_id INTEGER NOT NULL REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    audit_log_id SERIAL PRIMARY KEY,
    actor_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INTEGER,
    details TEXT,
    ip_address INET,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Refresh / session tokens for logout / rotation
CREATE TABLE IF NOT EXISTS refresh_tokens (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Startup discover: bookmarks and soft "interest" in an investor (separate from investment_requests)
CREATE TABLE IF NOT EXISTS startup_discover_favorites (
    favorite_id SERIAL PRIMARY KEY,
    startup_id INTEGER NOT NULL REFERENCES startups(startup_id) ON DELETE CASCADE,
    mentor_id INTEGER REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    investor_id INTEGER REFERENCES investors(investor_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (mentor_id IS NOT NULL AND investor_id IS NULL)
        OR (investor_id IS NOT NULL AND mentor_id IS NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_discover_fav_startup_mentor
    ON startup_discover_favorites (startup_id, mentor_id)
    WHERE mentor_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_discover_fav_startup_investor
    ON startup_discover_favorites (startup_id, investor_id)
    WHERE investor_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS startup_investor_interests (
    interest_id SERIAL PRIMARY KEY,
    startup_id INTEGER NOT NULL REFERENCES startups(startup_id) ON DELETE CASCADE,
    investor_id INTEGER NOT NULL REFERENCES investors(investor_id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'withdrawn', 'acknowledged')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (startup_id, investor_id)
);

-- Discover: full investor / mentor application payloads (JSON), one active row per pair
CREATE TABLE IF NOT EXISTS discover_investor_applications (
    id SERIAL PRIMARY KEY,
    startup_id INTEGER NOT NULL REFERENCES startups(startup_id) ON DELETE CASCADE,
    investor_id INTEGER NOT NULL REFERENCES investors(investor_id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    application_status VARCHAR(30) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (startup_id, investor_id)
);

CREATE TABLE IF NOT EXISTS discover_mentor_applications (
    id SERIAL PRIMARY KEY,
    startup_id INTEGER NOT NULL REFERENCES startups(startup_id) ON DELETE CASCADE,
    mentor_id INTEGER NOT NULL REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    application_status VARCHAR(30) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (startup_id, mentor_id)
);

-- Startup–Investor chat threads, messages, and video session metadata (WebRTC room id + status)
CREATE TABLE IF NOT EXISTS chat_conversations (
    conversation_id SERIAL PRIMARY KEY,
    startup_id INTEGER NOT NULL REFERENCES startups(startup_id) ON DELETE CASCADE,
    investor_id INTEGER NOT NULL REFERENCES investors(investor_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMPTZ,
    UNIQUE (startup_id, investor_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_startup ON chat_conversations (startup_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_investor ON chat_conversations (investor_id);

CREATE TABLE IF NOT EXISTS chat_messages (
    chat_message_id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES chat_conversations(conversation_id) ON DELETE CASCADE,
    sender_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('text', 'file')),
    text_body TEXT,
    file_name VARCHAR(255),
    file_mime VARCHAR(120),
    file_size_bytes BIGINT CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
    file_data BYTEA,
    read_at_startup TIMESTAMPTZ,
    read_at_investor TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (message_type IN ('text', 'file'))
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages (conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS chat_video_calls (
    video_call_id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES chat_conversations(conversation_id) ON DELETE CASCADE,
    room_id VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing', 'active', 'ended', 'missed')),
    started_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    screen_share_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    participant_user_ids INTEGER[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chat_video_calls_conversation ON chat_video_calls (conversation_id, created_at DESC);

-- Per-user join/leave audit for a video call (session held until end or leave)
CREATE TABLE IF NOT EXISTS chat_video_session_participants (
    participant_row_id SERIAL PRIMARY KEY,
    video_call_id INTEGER NOT NULL REFERENCES chat_video_calls(video_call_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_video_session_participants_call ON chat_video_session_participants (video_call_id);
CREATE INDEX IF NOT EXISTS idx_video_session_participants_user ON chat_video_session_participants (user_id);

-- Startup–Mentor chat (requires a mentorship_requests row for the pair)
CREATE TABLE IF NOT EXISTS mentor_chat_conversations (
    mentor_conversation_id SERIAL PRIMARY KEY,
    startup_id INTEGER NOT NULL REFERENCES startups(startup_id) ON DELETE CASCADE,
    mentor_id INTEGER NOT NULL REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMPTZ,
    UNIQUE (startup_id, mentor_id)
);

CREATE INDEX IF NOT EXISTS idx_mentor_chat_conversations_startup ON mentor_chat_conversations (startup_id);
CREATE INDEX IF NOT EXISTS idx_mentor_chat_conversations_mentor ON mentor_chat_conversations (mentor_id);

CREATE TABLE IF NOT EXISTS mentor_chat_messages (
    mentor_chat_message_id SERIAL PRIMARY KEY,
    mentor_conversation_id INTEGER NOT NULL REFERENCES mentor_chat_conversations(mentor_conversation_id) ON DELETE CASCADE,
    sender_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('text', 'file')),
    text_body TEXT,
    file_name VARCHAR(255),
    file_mime VARCHAR(120),
    file_size_bytes BIGINT CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
    file_data BYTEA,
    read_at_startup TIMESTAMPTZ,
    read_at_mentor TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (message_type IN ('text', 'file'))
);

CREATE INDEX IF NOT EXISTS idx_mentor_chat_messages_conversation ON mentor_chat_messages (mentor_conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS mentor_chat_video_calls (
    mentor_video_call_id SERIAL PRIMARY KEY,
    mentor_conversation_id INTEGER NOT NULL REFERENCES mentor_chat_conversations(mentor_conversation_id) ON DELETE CASCADE,
    room_id VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing', 'active', 'ended', 'missed')),
    started_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    screen_share_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    participant_user_ids INTEGER[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mentor_chat_video_calls_conversation ON mentor_chat_video_calls (mentor_conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS mentor_chat_video_session_participants (
    participant_row_id SERIAL PRIMARY KEY,
    mentor_video_call_id INTEGER NOT NULL REFERENCES mentor_chat_video_calls(mentor_video_call_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mentor_video_session_call ON mentor_chat_video_session_participants (mentor_video_call_id);
CREATE INDEX IF NOT EXISTS idx_mentor_video_session_user ON mentor_chat_video_session_participants (user_id);