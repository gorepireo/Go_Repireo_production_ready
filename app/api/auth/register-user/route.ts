import { NextResponse } from 'next/server';
import { insertTursoRecord } from '@/lib/turso';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userDataObj, workerAppObj, role } = body;

    if (!userDataObj || (!userDataObj.email && !userDataObj.phone)) {
      return NextResponse.json({ error: 'Missing user payload' }, { status: 400 });
    }

    // Prepare clean user record for Turso users table
    const cleanUserRecord = {
      id: userDataObj.id || 'usr_' + Date.now(),
      email: userDataObj.email || null,
      name: userDataObj.name || 'User',
      phone: userDataObj.phone || null,
      role: userDataObj.role || role || 'user',
      status: userDataObj.status || 'active',
      avatar_url: userDataObj.avatar_url || null,
      state: userDataObj.state || null,
      district: userDataObj.district || null,
      pincode: userDataObj.pincode || null,
      area: userDataObj.area || null
    };

    // 1. Insert User Profile into Turso Database
    const userRes = await insertTursoRecord('users', cleanUserRecord);
    if (!userRes.success) {
      console.error('Turso User Insert Failed:', userRes.error);
      return NextResponse.json({ error: `Turso user insert error: ${userRes.error}` }, { status: 500 });
    }

    // 2. Insert Worker Application if role === 'worker'
    if ((role === 'worker' || userDataObj.role === 'worker') && workerAppObj) {
      const cleanWorkerRecord = {
        id: workerAppObj.id || cleanUserRecord.id,
        user_id: workerAppObj.user_id || cleanUserRecord.id,
        from_name: workerAppObj.from_name || cleanUserRecord.name,
        email: workerAppObj.email || cleanUserRecord.email,
        mobile: workerAppObj.mobile || cleanUserRecord.phone,
        service: typeof workerAppObj.service === 'object' ? JSON.stringify(workerAppObj.service) : workerAppObj.service,
        experience: typeof workerAppObj.experience === 'number' ? workerAppObj.experience : (parseInt(workerAppObj.experience) || 0),
        other_skills: workerAppObj.other_skills || null,
        specializations: typeof workerAppObj.specializations === 'object' ? JSON.stringify(workerAppObj.specializations) : workerAppObj.specializations,
        category_tokens: typeof workerAppObj.category_tokens === 'object' ? JSON.stringify(workerAppObj.category_tokens) : workerAppObj.category_tokens,
        status: workerAppObj.status || 'pending_approval',
        state: workerAppObj.state || cleanUserRecord.state,
        district: workerAppObj.district || cleanUserRecord.district,
        pincode: workerAppObj.pincode || cleanUserRecord.pincode,
        address: workerAppObj.address || cleanUserRecord.area
      };

      const workerRes = await insertTursoRecord('worker_applications', cleanWorkerRecord);
      if (!workerRes.success) {
        console.error('Turso Worker Application Insert Failed:', workerRes.error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User account registered and saved to Turso database successfully!',
      user: cleanUserRecord 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Register User API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
