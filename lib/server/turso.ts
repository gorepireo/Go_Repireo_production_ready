import 'server-only';
import { createClient, type Client } from '@libsql/client';

let client: Client | null = null;

export function getTurso(): Client {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (!url) throw new Error('TURSO_DATABASE_URL is not configured.');
  if (!url.startsWith('file:') && !authToken) throw new Error('TURSO_AUTH_TOKEN is not configured.');
  client = createClient({ url, authToken: authToken || undefined });
  return client;
}

export function isTursoConfigured() {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  return Boolean(url && (url.startsWith('file:') || process.env.TURSO_AUTH_TOKEN?.trim()));
}
