import { NextResponse } from 'next/server';
import { seedFirestoreDatabase } from '@/lib/firebaseSeed';

export async function GET() {
  try {
    const result = await seedFirestoreDatabase();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
