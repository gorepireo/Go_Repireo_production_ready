import { NextResponse } from 'next/server';
import { isTursoConfigured } from '@/lib/server/turso';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const connected = isTursoConfigured();
  return NextResponse.json({
    status: connected ? 'configured' : 'missing_configuration',
    connected,
    provider: 'Turso (authentication, sessions, and application data)',
  }, { status: connected ? 200 : 503 });
}
