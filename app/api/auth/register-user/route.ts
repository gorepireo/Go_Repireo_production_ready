import { NextResponse } from 'next/server';
import { authErrorResponse, bootstrapCustomer } from '@/lib/server/auth';
import { getTurso } from '@/lib/server/turso';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RegistrationBody {
  displayName?: unknown;
}

export async function POST(request: Request) {
  try {
    const identity = await bootstrapCustomer(request);
    const body = (await request.json().catch(() => ({}))) as RegistrationBody;
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';

    if (displayName.length > 120) {
      return NextResponse.json({ error: 'Display name must be 120 characters or fewer.' }, { status: 400 });
    }

    if (displayName) {
      const now = new Date().toISOString();
      await getTurso().execute({
        sql: 'UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?',
        args: [displayName, now, identity.uid],
      });
      identity.displayName = displayName;
    }

    return NextResponse.json({ user: identity }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
