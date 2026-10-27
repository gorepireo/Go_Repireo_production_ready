import { NextResponse } from 'next/server';
import { requireIdentity, authErrorResponse } from '@/lib/server/auth';
import { getTurso } from '@/lib/server/turso';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    await requireIdentity(request, ['admin']);
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'all';
    const search = searchParams.get('search')?.trim().toLowerCase() || '';

    const db = getTurso();

    let sql = `
      SELECT id, phone, email, display_name, role, account_status, created_at, last_login_at
      FROM users
      WHERE 1=1
    `;
    const args: (string | number)[] = [];

    if (role !== 'all') {
      sql += ` AND role = ?`;
      args.push(role);
    }

    if (search) {
      sql += ` AND (LOWER(display_name) LIKE ? OR phone LIKE ? OR LOWER(email) LIKE ?)`;
      const pattern = `%${search}%`;
      args.push(pattern, pattern, pattern);
    }

    sql += ` ORDER BY created_at DESC LIMIT 100`;

    const result = await db.execute({ sql, args });

    const users = result.rows.map((r) => ({
      id: String(r.id),
      phone: String(r.phone || ''),
      email: r.email ? String(r.email) : null,
      displayName: String(r.display_name || 'User'),
      role: String(r.role || 'customer'),
      accountStatus: String(r.account_status || 'active'),
      createdAt: String(r.created_at || ''),
      lastLoginAt: r.last_login_at ? String(r.last_login_at) : null,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireIdentity(request, ['admin']);
    const body = await request.json().catch(() => ({}));
    const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';
    const status = typeof body?.status === 'string' ? body.status.trim() : '';

    if (!userId || !['active', 'suspended', 'disabled'].includes(status)) {
      return NextResponse.json({ error: 'Valid user ID and status are required.' }, { status: 400 });
    }

    if (userId === admin.uid) {
      return NextResponse.json({ error: 'Cannot change status of currently logged-in administrator.' }, { status: 400 });
    }

    const db = getTurso();
    const now = new Date().toISOString();

    await db.execute({
      sql: `UPDATE users SET account_status = ?, updated_at = ? WHERE id = ?`,
      args: [status, now, userId],
    });

    return NextResponse.json({ success: true, userId, status });
  } catch (error) {
    return authErrorResponse(error);
  }
}
