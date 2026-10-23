import { NextResponse } from 'next/server';
import type { InStatement } from '@libsql/client';
import { AuthError, authErrorResponse } from '@/lib/server/auth';
import { getFirebaseAdminAuth } from '@/lib/server/firebase-admin';
import { getTurso } from '@/lib/server/turso';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RegistrationBody {
  displayName?: unknown;
  accountType?: unknown;
  email?: unknown;
  state?: unknown;
  district?: unknown;
  pincode?: unknown;
  area?: unknown;
  experienceYears?: unknown;
  description?: unknown;
  serviceCategories?: unknown;
}

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function bearerToken(request: Request) {
  const value = request.headers.get('authorization') || '';
  return value.startsWith('Bearer ') ? value.slice(7).trim() : '';
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as RegistrationBody;
    const token = bearerToken(request);
    if (!token) throw new AuthError(401, 'Authentication is required.');

    let decoded;
    try {
      decoded = await getFirebaseAdminAuth().verifyIdToken(token, true);
    } catch {
      throw new AuthError(401, 'The authentication token is invalid or expired.');
    }

    const displayName = text(body.displayName, 120);
    const accountType = body.accountType === 'partner' ? 'partner' : body.accountType === 'customer' ? 'customer' : '';
    const email = text(body.email, 254).toLowerCase() || decoded.email || null;
    const state = text(body.state, 100);
    const district = text(body.district, 100);
    const pincode = text(body.pincode, 10);
    const area = text(body.area, 300);
    const description = text(body.description, 2000);
    const experienceYears = Number(body.experienceYears);
    const serviceCategories = Array.isArray(body.serviceCategories)
      ? body.serviceCategories.map((value) => text(value, 80)).filter(Boolean).slice(0, 20)
      : [];

    if (displayName.length < 2 || !accountType) {
      return NextResponse.json({ error: 'Name and account type are required.' }, { status: 400 });
    }
    if (pincode && !/^\d{6}$/.test(pincode)) {
      return NextResponse.json({ error: 'Pincode must contain six digits.' }, { status: 400 });
    }
    if (accountType === 'partner' && (!Number.isInteger(experienceYears) || experienceYears < 0 || experienceYears > 70 || serviceCategories.length === 0)) {
      return NextResponse.json({ error: 'Partners must provide valid experience and at least one service category.' }, { status: 400 });
    }

    const db = getTurso();
    const existing = await db.execute({ sql: 'SELECT role FROM users WHERE id = ? LIMIT 1', args: [decoded.uid] });
    const role = accountType === 'partner' ? 'worker' : 'customer';
    if (existing.rows[0] && String(existing.rows[0].role) !== role) {
      return NextResponse.json({ error: 'This identity is already registered with another account type.' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const accountStatus = role === 'worker' ? 'pending' : 'active';
    const statements: InStatement[] = [
      {
        sql: `INSERT INTO users (id, phone, email, display_name, role, account_status, created_at, updated_at, last_login_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET phone = COALESCE(excluded.phone, users.phone), email = COALESCE(excluded.email, users.email), display_name = excluded.display_name, updated_at = excluded.updated_at`,
        args: [decoded.uid, decoded.phone_number || null, email, displayName, role, accountStatus, now, now, now],
      },
    ];

    if (role === 'customer') {
      statements.push({
        sql: `INSERT INTO customer_profiles (user_id, state, district, pincode, area, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(user_id) DO UPDATE SET state = excluded.state, district = excluded.district, pincode = excluded.pincode, area = excluded.area, updated_at = excluded.updated_at`,
        args: [decoded.uid, state, district, pincode, area, now, now],
      });
    } else {
      statements.push({
        sql: `INSERT INTO worker_profiles (user_id, full_name, experience_years, description, verification_status, approval_status, availability_status, accepting_jobs, state, district, pincode, area, service_categories_json, created_at, updated_at)
              VALUES (?, ?, ?, ?, 'pending', 'pending', 'offline', 0, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(user_id) DO UPDATE SET full_name = excluded.full_name, experience_years = excluded.experience_years, description = excluded.description, state = excluded.state, district = excluded.district, pincode = excluded.pincode, area = excluded.area, service_categories_json = excluded.service_categories_json, verification_status = 'pending', approval_status = 'pending', updated_at = excluded.updated_at`,
        args: [decoded.uid, displayName, experienceYears, description, state, district, pincode, area, JSON.stringify(serviceCategories), now, now],
      });
    }

    await db.batch(statements, 'write');
    return NextResponse.json({
      user: { uid: decoded.uid, phone: decoded.phone_number || null, email, displayName, role, accountStatus },
    }, { status: existing.rows[0] ? 200 : 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
