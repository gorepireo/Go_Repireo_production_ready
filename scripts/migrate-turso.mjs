import { createClient } from '@libsql/client';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const url = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
if (!url) throw new Error('TURSO_DATABASE_URL is required.');
if (!url.startsWith('file:') && !authToken) throw new Error('TURSO_AUTH_TOKEN is required for remote databases.');

const client = createClient({ url, authToken: authToken || undefined });
const directory = path.join(process.cwd(), 'migrations', 'turso');
await client.execute(`CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
)`);

for (const file of (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort()) {
  const version = file.replace(/\.sql$/, '');
  const existing = await client.execute({
    sql: 'SELECT version FROM schema_migrations WHERE version = ? LIMIT 1',
    args: [version],
  });
  if (existing.rows.length) {
    console.log(`Skipped ${version} (already applied)`);
    continue;
  }
  await client.executeMultiple(await readFile(path.join(directory, file), 'utf8'));
  console.log(`Applied ${version}`);
}
client.close();
