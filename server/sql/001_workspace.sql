-- Future Postgres schema for Notes Hub workspace sync (Neon / Render Postgres).
-- One row per workspace token in the MVP; expand to user accounts later.

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  revision INTEGER NOT NULL DEFAULT 0,
  active_id TEXT,
  payload JSONB NOT NULL DEFAULT '{"items":[]}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workspaces_token_hash_idx ON workspaces (token_hash);
