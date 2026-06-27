-- V2: Rooms and Teams tables
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(6) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    difficulty VARCHAR(20) NOT NULL,
    questions_per_user INT NOT NULL DEFAULT 3,
    max_team_size INT NOT NULL DEFAULT 4,
    time_limit_minutes INT NOT NULL DEFAULT 60,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(6) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INT NOT NULL DEFAULT 0,
    max_size INT NOT NULL DEFAULT 4,
    is_ready BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_ready BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_team_members_user UNIQUE (user_id)
);

ALTER TABLE users ADD COLUMN active_room_id UUID REFERENCES rooms(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN current_team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_rooms_admin ON rooms(admin_id);
CREATE INDEX idx_teams_code ON teams(code);
CREATE INDEX idx_teams_room_id ON teams(room_id);
CREATE INDEX idx_teams_leader ON teams(leader_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
