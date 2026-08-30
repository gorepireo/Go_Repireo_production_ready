import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL || 'libsql://gorepireo-gorepireo.aws-ap-south-1.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN || '';

/**
 * Turso Database Client (libsql / SQLite at the Edge)
 * Database URL: libsql://gorepireo-gorepireo.aws-ap-south-1.turso.io
 */
export const turso = createClient({
  url,
  authToken
});
