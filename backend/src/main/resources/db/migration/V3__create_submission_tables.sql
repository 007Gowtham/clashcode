-- V3__create_submission_tables.sql
-- Schema for Code Execution (Judge) Module in ClashCode

CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    room_id UUID,
    problem_id UUID NOT NULL REFERENCES problems(id),
    language VARCHAR(20) NOT NULL,
    source_code TEXT NOT NULL,
    mode VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    verdict VARCHAR(30),
    score INTEGER NOT NULL DEFAULT 0,
    runtime_ms BIGINT NOT NULL DEFAULT 0,
    memory_kb BIGINT NOT NULL DEFAULT 0,
    compiler_output TEXT,
    failed_case_index INTEGER,
    sample_results_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_room_id ON submissions (room_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON submissions (problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions (created_at);

