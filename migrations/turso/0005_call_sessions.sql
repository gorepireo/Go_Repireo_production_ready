CREATE TABLE IF NOT EXISTS call_sessions (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  initiated_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ringing',
  sdp_offer TEXT,
  sdp_answer TEXT,
  ice_candidates_json TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ringing_at TEXT,
  accepted_at TEXT,
  ended_at TEXT,
  ended_by TEXT,
  duration_seconds INTEGER DEFAULT 0
);

INSERT OR IGNORE INTO schema_migrations(version, applied_at)
VALUES ('0005_call_sessions', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
