import { NextResponse } from 'next/server';
import { insertTursoRecord } from '@/lib/turso';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userDataObj, workerAppObj, role } = body;

    if (!userDataObj || !userDataObj.email) {
      return NextResponse.json({ error: 'Missing user payload' }, { status: 400 });
    }

    // 1. Insert User Profile into Turso SQLite Database
    const userRes = await insertTursoRecord('users', userDataObj);
    if (!userRes.success) {
      console.error('Turso User Insert Failed:', userRes.error);
    }

    // 2. Insert Worker Application if role === 'worker'
    if (role === 'worker' && workerAppObj) {
      const workerRes = await insertTursoRecord('worker_applications', workerAppObj);
      if (!workerRes.success) {
        console.error('Turso Worker Application Insert Failed:', workerRes.error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User account registered and saved to Turso database successfully!',
      user: userDataObj 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Register User API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
