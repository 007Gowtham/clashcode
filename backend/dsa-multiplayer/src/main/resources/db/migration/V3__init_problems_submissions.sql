-- V3: Problems, Submissions, and user role column

-- ============================================================
-- ADD ROLE TO USERS
-- ============================================================
ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER';

-- ============================================================
-- PROBLEMS
-- ============================================================
CREATE TABLE problems (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title               VARCHAR(200) NOT NULL,
    description         TEXT        NOT NULL,
    difficulty          VARCHAR(10)  NOT NULL,       -- EASY | MEDIUM | HARD
    tags                TEXT[]       DEFAULT '{}',
    template_code       JSONB        DEFAULT '{}',   -- { "java": "...", "python": "..." }
    test_cases          JSONB        NOT NULL DEFAULT '[]',
    -- test_cases format: [{ "input": "...", "expectedOutput": "...", "isHidden": false }]
    time_limit_ms       INT          NOT NULL DEFAULT 2000,
    memory_limit_mb     INT          NOT NULL DEFAULT 256,
    created_by          UUID         REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROOM PROBLEMS (which problems are assigned to a room match)
-- ============================================================
CREATE TABLE room_problems (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    problem_id  UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    position    INT  NOT NULL DEFAULT 0,
    CONSTRAINT uq_room_problem UNIQUE (room_id, problem_id)
);

-- ============================================================
-- SUBMISSIONS
-- ============================================================
CREATE TABLE submissions (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id          UUID        NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    room_id             UUID        REFERENCES rooms(id) ON DELETE SET NULL,
    language            VARCHAR(20) NOT NULL,
    code                TEXT        NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    -- status values: PENDING | ACCEPTED | WRONG_ANSWER | TIME_LIMIT_EXCEEDED |
    --                RUNTIME_ERROR | COMPILE_ERROR | SANDBOX_ERROR
    result              JSONB,
    -- result format: { "passed": 3, "total": 5,
    --                  "testResults": [{input,expected,got,passed,timeMs}] }
    execution_time_ms   INT,
    submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_problems_difficulty   ON problems(difficulty);
CREATE INDEX idx_problems_created_by   ON problems(created_by);
CREATE INDEX idx_room_problems_room    ON room_problems(room_id);
CREATE INDEX idx_submissions_user      ON submissions(user_id);
CREATE INDEX idx_submissions_problem   ON submissions(problem_id);
CREATE INDEX idx_submissions_room      ON submissions(room_id);
CREATE INDEX idx_submissions_status    ON submissions(status);
