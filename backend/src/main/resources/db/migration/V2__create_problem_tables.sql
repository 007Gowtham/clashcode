-- V2__create_problem_tables.sql
-- Schema for Question / Problem Module in ClashCode

CREATE TABLE IF NOT EXISTS problems (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    statement_markdown TEXT NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    time_limit_ms INTEGER NOT NULL DEFAULT 2000,
    memory_limit_mb INTEGER NOT NULL DEFAULT 256,
    points INTEGER NOT NULL DEFAULT 100,
    created_by UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_problems_slug ON problems (slug);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems (difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_status ON problems (status);

CREATE TABLE IF NOT EXISTS problem_tags (
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    PRIMARY KEY (problem_id, tag)
);

CREATE TABLE IF NOT EXISTS test_cases (
    id UUID PRIMARY KEY,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input_text TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_sample BOOLEAN NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_test_cases_problem_id ON test_cases (problem_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_problem_sample ON test_cases (problem_id, is_sample);

CREATE TABLE IF NOT EXISTS starter_codes (
    id UUID PRIMARY KEY,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    language VARCHAR(20) NOT NULL,
    template_code TEXT NOT NULL,
    CONSTRAINT uk_starter_code_problem_lang UNIQUE (problem_id, language)
);

CREATE INDEX IF NOT EXISTS idx_starter_codes_problem_id ON starter_codes (problem_id);

CREATE TABLE IF NOT EXISTS contest_problems (
    id UUID PRIMARY KEY,
    room_id UUID NOT NULL,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 100,
    is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
    frozen_title VARCHAR(255),
    frozen_slug VARCHAR(255),
    frozen_statement_markdown TEXT,
    frozen_difficulty VARCHAR(20),
    frozen_time_limit_ms INTEGER,
    frozen_memory_limit_mb INTEGER,
    frozen_starter_codes_json TEXT,
    frozen_sample_cases_json TEXT,
    CONSTRAINT uk_contest_problem_room_problem UNIQUE (room_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_contest_problems_room_id ON contest_problems (room_id);
CREATE INDEX IF NOT EXISTS idx_contest_problems_problem_id ON contest_problems (problem_id);

