import { NextResponse } from 'next/server';
import type { InStatement } from '@libsql/client';
import { requireIdentity, authErrorResponse } from '@/lib/server/auth';
import { getTurso } from '@/lib/server/turso';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    await requireIdentity(request, ['admin']);
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('status') || 'all';

    const db = getTurso();

    let sql = `
      SELECT u.id, u.display_name, u.phone, u.email, u.account_status, u.created_at, u.last_login_at,
             w.full_name, w.experience_years, w.description, w.verification_status, w.approval_status,
             w.state, w.district, w.pincode, w.area, w.service_categories_json, w.rating_average, w.completed_jobs
      FROM users u
      LEFT JOIN worker_profiles w ON u.id = w.user_id
      WHERE u.role = 'worker'
    `;
    const args: (string | number)[] = [];

    if (filter === 'pending') {
      sql += ` AND (u.account_status = 'pending' OR w.approval_status = 'pending')`;
    } else if (filter === 'approved' || filter === 'active') {
      sql += ` AND u.account_status = 'active' AND w.approval_status = 'approved'`;
    } else if (filter === 'rejected' || filter === 'suspended') {
      sql += ` AND (u.account_status IN ('suspended', 'disabled') OR w.approval_status IN ('rejected', 'suspended'))`;
    }

    sql += ` ORDER BY u.created_at DESC LIMIT 100`;

    const result = await db.execute({ sql, args });

    const workers = result.rows.map((r) => {
      let categories: string[] = [];
      try {
        if (r.service_categories_json) {
          categories = JSON.parse(String(r.service_categories_json));
        }
      } catch {
        categories = [];
      }
      return {
        id: String(r.id),
        name: String(r.full_name || r.display_name || 'Worker'),
        phone: String(r.phone || ''),
        email: r.email ? String(r.email) : null,
        accountStatus: String(r.account_status || 'pending'),
        approvalStatus: String(r.approval_status || 'pending'),
        verificationStatus: String(r.verification_status || 'draft'),
        experienceYears: Number(r.experience_years || 0),
        state: String(r.state || ''),
        district: String(r.district || ''),
        pincode: String(r.pincode || ''),
        area: String(r.area || ''),
        description: String(r.description || ''),
        categories,
        ratingAverage: Number(r.rating_average || 0),
        completedJobs: Number(r.completed_jobs || 0),
        createdAt: String(r.created_at || ''),
        lastLoginAt: r.last_login_at ? String(r.last_login_at) : null,
      };
    });

    return NextResponse.json({ workers });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireIdentity(request, ['admin']);
    const body = await request.json().catch(() => ({}));
    const workerId = typeof body?.workerId === 'string' ? body.workerId.trim() : '';
    const action = typeof body?.action === 'string' ? body.action.trim().toLowerCase() : '';

    if (!workerId || !['approve', 'reject', 'suspend'].includes(action)) {
      return NextResponse.json({ error: 'Worker ID and valid action (approve/reject/suspend) are required.' }, { status: 400 });
    }

    const db = getTurso();
    const now = new Date().toISOString();

    let accountStatus = 'active';
    let approvalStatus = 'approved';
    let verificationStatus = 'verified';

    if (action === 'reject') {
      accountStatus = 'suspended';
      approvalStatus = 'rejected';
      verificationStatus = 'rejected';
    } else if (action === 'suspend') {
      accountStatus = 'suspended';
      approvalStatus = 'suspended';
      verificationStatus = 'pending';
    }

    const statements: InStatement[] = [
      {
        sql: `UPDATE users SET account_status = ?, updated_at = ? WHERE id = ? AND role = 'worker'`,
        args: [accountStatus, now, workerId],
      },
      {
        sql: `UPDATE worker_profiles 
              SET approval_status = ?, verification_status = ?, updated_at = ?
              WHERE user_id = ?`,
        args: [approvalStatus, verificationStatus, now, workerId],
      },
    ];

    await db.batch(statements, 'write');

    return NextResponse.json({
      success: true,
      workerId,
      accountStatus,
      approvalStatus,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
