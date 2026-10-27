CREATE TABLE IF NOT EXISTS call_ice_candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  call_id TEXT NOT NULL,
  role TEXT NOT NULL,
  user_id TEXT,
  candidate_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_call_ice_candidates_call_id ON call_ice_candidates(call_id);

INSERT OR IGNORE INTO schema_migrations(version, applied_at)
VALUES ('0006_call_ice_candidates', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
