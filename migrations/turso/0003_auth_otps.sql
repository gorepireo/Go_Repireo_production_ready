CREATE TABLE IF NOT EXISTS auth_otps (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('login', 'register')),
  otp_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_auth_otps_phone_created
  ON auth_otps(phone, purpose, created_at DESC);

INSERT OR IGNORE INTO schema_migrations(version, applied_at)
VALUES ('0003_auth_otps', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
