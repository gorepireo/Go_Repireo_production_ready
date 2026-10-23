import 'server-only';
import { getFirebaseAdminAuth } from './firebase-admin';
import { getTurso } from './turso';

export type AppRole = 'customer' | 'worker' | 'admin';
export type AccountStatus = 'active' | 'pending' | 'suspended' | 'disabled';

export interface RequestIdentity {
  uid: string;
  phone: string | null;
  email: string | null;
  displayName: string;
  role: AppRole;
  accountStatus: AccountStatus;
}

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function bearerToken(request: Request) {
  const value = request.headers.get('authorization') || '';
  return value.startsWith('Bearer ') ? value.slice(7).trim() : '';
}

export async function requireIdentity(request: Request, allowedRoles?: AppRole[]): Promise<RequestIdentity> {
  const token = bearerToken(request);
  if (!token) throw new AuthError(401, 'Authentication is required.');

  let decoded;
  try {
    decoded = await getFirebaseAdminAuth().verifyIdToken(token, true);
  } catch {
    throw new AuthError(401, 'The authentication token is invalid or expired.');
  }

  const result = await getTurso().execute({
    sql: `SELECT id, phone, email, display_name, role, account_status
          FROM users WHERE id = ? LIMIT 1`,
    args: [decoded.uid],
  });
  const row = result.rows[0];
  if (!row) throw new AuthError(403, 'The authenticated account is not registered.');

  const accountStatus = String(row.account_status) as AccountStatus;
  if (accountStatus === 'suspended' || accountStatus === 'disabled') {
    throw new AuthError(403, 'This account is not permitted to access the application.');
  }
  const role = String(row.role) as AppRole;
  if (allowedRoles && !allowedRoles.includes(role)) throw new AuthError(403, 'Insufficient permissions.');

  return {
    uid: decoded.uid,
    phone: row.phone ? String(row.phone) : decoded.phone_number || null,
    email: row.email ? String(row.email) : decoded.email || null,
    displayName: String(row.display_name || decoded.name || ''),
    role,
    accountStatus,
  };
}

export async function bootstrapCustomer(request: Request): Promise<RequestIdentity> {
  const token = bearerToken(request);
  if (!token) throw new AuthError(401, 'Authentication is required.');
  let decoded;
  try {
    decoded = await getFirebaseAdminAuth().verifyIdToken(token, true);
  } catch {
    throw new AuthError(401, 'The authentication token is invalid or expired.');
  }

  const now = new Date().toISOString();
  await getTurso().batch([
    {
      sql: `INSERT INTO users (id, phone, email, display_name, role, account_status, created_at, updated_at, last_login_at)
            VALUES (?, ?, ?, ?, 'customer', 'active', ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              phone = COALESCE(excluded.phone, users.phone),
              email = COALESCE(excluded.email, users.email),
              last_login_at = excluded.last_login_at,
              updated_at = excluded.updated_at`,
      args: [decoded.uid, decoded.phone_number || null, decoded.email || null, decoded.name || '', now, now, now],
    },
    {
      sql: `INSERT INTO customer_profiles (user_id, created_at, updated_at)
            VALUES (?, ?, ?) ON CONFLICT(user_id) DO NOTHING`,
      args: [decoded.uid, now, now],
    },
  ], 'write');

  return requireIdentity(request);
}

export function authErrorResponse(error: unknown) {
  const status = error instanceof AuthError ? error.status : 500;
  if (status === 500) console.error('Authenticated API failure:', error);
  const message = error instanceof AuthError ? error.message : 'Unexpected server error.';
  return Response.json({ error: message }, { status });
}
