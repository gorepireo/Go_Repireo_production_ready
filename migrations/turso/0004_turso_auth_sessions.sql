CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('login', 'register')),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user
  ON auth_sessions(user_id, expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_phone
  ON auth_sessions(phone, purpose, expires_at DESC);

INSERT OR IGNORE INTO schema_migrations(version, applied_at)
VALUES ('0004_turso_auth_sessions', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
