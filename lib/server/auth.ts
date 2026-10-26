import 'server-only';
import { getTurso } from './turso';
import { readSession } from './session';

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

export async function requireIdentity(request: Request, allowedRoles?: AppRole[]): Promise<RequestIdentity> {
  const session = await readSession(request);
  if (!session?.user_id) throw new AuthError(401, 'Authentication is required.');

  const result = await getTurso().execute({
    sql: `SELECT id, phone, email, display_name, role, account_status
          FROM users WHERE id = ? LIMIT 1`,
    args: [String(session.user_id)],
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
    uid: String(row.id),
    phone: row.phone ? String(row.phone) : null,
    email: row.email ? String(row.email) : null,
    displayName: String(row.display_name || ''),
    role,
    accountStatus,
  };
}

export function authErrorResponse(error: unknown) {
  const status = error instanceof AuthError ? error.status : 500;
  if (status === 500) console.error('Authenticated API failure:', error);
  const message = error instanceof AuthError ? error.message : 'Unexpected server error.';
  return Response.json({ error: message }, { status });
}
