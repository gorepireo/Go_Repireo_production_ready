ALTER TABLE customer_profiles ADD COLUMN state TEXT NOT NULL DEFAULT '';
ALTER TABLE customer_profiles ADD COLUMN district TEXT NOT NULL DEFAULT '';
ALTER TABLE customer_profiles ADD COLUMN pincode TEXT NOT NULL DEFAULT '';
ALTER TABLE customer_profiles ADD COLUMN area TEXT NOT NULL DEFAULT '';

ALTER TABLE worker_profiles ADD COLUMN state TEXT NOT NULL DEFAULT '';
ALTER TABLE worker_profiles ADD COLUMN district TEXT NOT NULL DEFAULT '';
ALTER TABLE worker_profiles ADD COLUMN pincode TEXT NOT NULL DEFAULT '';
ALTER TABLE worker_profiles ADD COLUMN area TEXT NOT NULL DEFAULT '';
ALTER TABLE worker_profiles ADD COLUMN service_categories_json TEXT NOT NULL DEFAULT '[]';

INSERT OR IGNORE INTO schema_migrations(version, applied_at)
VALUES ('0002_registration_profiles', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
