import { NextResponse } from 'next/server';
import { requireIdentity, authErrorResponse } from '@/lib/server/auth';
import { getTurso } from '@/lib/server/turso';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const identity = await requireIdentity(request);
    const db = getTurso();
    const result = await db.execute({
      sql: `SELECT u.id, u.phone, u.email, u.display_name, u.role, u.account_status,
                   cp.avatar_url, cp.state, cp.district, cp.pincode, cp.area
            FROM users u
            LEFT JOIN customer_profiles cp ON cp.user_id = u.id
            WHERE u.id = ? LIMIT 1`,
      args: [identity.uid],
    });

    const row = result.rows[0];
    if (!row) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        id: String(row.id),
        uid: String(row.id),
        name: String(row.display_name || ''),
        displayName: String(row.display_name || ''),
        phone: row.phone ? String(row.phone) : null,
        email: row.email ? String(row.email) : null,
        avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
        role: String(row.role),
        state: String(row.state || ''),
        district: String(row.district || ''),
        pincode: String(row.pincode || ''),
        area: String(row.area || ''),
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const identity = await requireIdentity(request);
    const body = await request.json().catch(() => ({}));
    const db = getTurso();
    const now = new Date().toISOString();

    const name = typeof body.name === 'string' ? body.name.trim() : typeof body.displayName === 'string' ? body.displayName.trim() : null;
    const avatarUrl = typeof body.avatarUrl === 'string' ? body.avatarUrl.trim() : typeof body.avatarBase64 === 'string' ? body.avatarBase64 : null;

    if (name !== null) {
      await db.execute({
        sql: 'UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?',
        args: [name, now, identity.uid],
      });
    }

    if (avatarUrl !== null) {
      await db.execute({
        sql: `INSERT INTO customer_profiles (user_id, avatar_url, updated_at)
              VALUES (?, ?, ?)
              ON CONFLICT(user_id) DO UPDATE SET avatar_url = excluded.avatar_url, updated_at = excluded.updated_at`,
        args: [identity.uid, avatarUrl, now],
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
