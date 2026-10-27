import { NextResponse } from 'next/server';
import { getTurso } from '@/lib/server/turso';
import { createSession } from '@/lib/server/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ADMIN_MASTER_KEY = 'Prithibi@2006';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const key = typeof body?.key === 'string' ? body.key.trim() : '';

    if (key !== ADMIN_MASTER_KEY) {
      return NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 401 });
    }

    const db = getTurso();
    // Check if an admin user already exists
    const existingAdmin = await db.execute({
      sql: `SELECT id, phone, email, display_name, role, account_status 
            FROM users WHERE role = 'admin' LIMIT 1`,
      args: [],
    });

    let adminId = '';
    let adminPhone = '+919999999999';
    let adminName = 'Administrator';

    const now = new Date().toISOString();

    if (existingAdmin.rows[0]) {
      const row = existingAdmin.rows[0];
      adminId = String(row.id);
      adminPhone = String(row.phone || adminPhone);
      adminName = String(row.display_name || adminName);

      // Ensure account is active
      await db.execute({
        sql: `UPDATE users SET account_status = 'active', last_login_at = ?, updated_at = ? WHERE id = ?`,
        args: [now, now, adminId],
      });
    } else {
      // Create primary admin user
      adminId = crypto.randomUUID();
      await db.execute({
        sql: `INSERT INTO users (id, phone, email, display_name, role, account_status, created_at, updated_at, last_login_at)
              VALUES (?, ?, ?, ?, 'admin', 'active', ?, ?, ?)`,
        args: [adminId, adminPhone, 'admin@gorepireo.com', adminName, now, now, now],
      });
    }

    const session = await createSession(adminPhone, 'login', adminId);

    const response = NextResponse.json({
      success: true,
      user: {
        uid: adminId,
        role: 'admin',
        displayName: adminName,
        phone: adminPhone,
        accountStatus: 'active',
      },
    }, { status: 200 });

    response.headers.set('Set-Cookie', session.cookie);
    return response;
  } catch (error: any) {
    console.error('Admin master key login failure:', error);
    return NextResponse.json({ error: error.message || 'Admin authentication failed.' }, { status: 500 });
  }
}
