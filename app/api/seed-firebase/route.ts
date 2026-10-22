import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Database seeding is disabled in production-facing application code.' },
    { status: 410 },
  );
}
