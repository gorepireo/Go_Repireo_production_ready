import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  return NextResponse.json({
    status: projectId ? 'configured' : 'missing_configuration',
    connected: Boolean(projectId),
    provider: 'Firebase (Authentication, Firestore, Functions)',
    projectId: projectId || null,
  }, { status: projectId ? 200 : 503 });
}
