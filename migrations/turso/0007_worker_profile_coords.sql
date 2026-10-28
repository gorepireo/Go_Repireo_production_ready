ALTER TABLE worker_profiles ADD COLUMN latitude REAL;
ALTER TABLE worker_profiles ADD COLUMN longitude REAL;

INSERT OR IGNORE INTO schema_migrations(version, applied_at)
VALUES ('0007_worker_profile_coords', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
