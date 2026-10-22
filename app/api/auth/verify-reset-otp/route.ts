import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Password reset is not used with Firebase phone authentication.' }, { status: 410 });
}
