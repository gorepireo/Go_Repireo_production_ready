import { NextRequest, NextResponse } from 'next/server';
import { requireIdentity, authErrorResponse } from '@/lib/server/auth';
import { getTurso } from '@/lib/server/turso';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const identity = await requireIdentity(req);
    const body = await req.json().catch(() => ({}));
    const { order_id, latitude, longitude } = body;

    if (!order_id || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Missing required location fields' }, { status: 400 });
    }

    const latNum = Number(latitude);
    const lngNum = Number(longitude);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return NextResponse.json({ error: 'Invalid latitude or longitude values' }, { status: 400 });
    }

    const db = getTurso();
    const now = new Date().toISOString();
    const workerId = identity.uid;

    // Upsert into worker_locations in Turso
    await db.execute({
      sql: `INSERT INTO worker_locations (worker_id, active_booking_id, latitude, longitude, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(worker_id) DO UPDATE SET
              active_booking_id = excluded.active_booking_id,
              latitude = excluded.latitude,
              longitude = excluded.longitude,
              updated_at = excluded.updated_at`,
      args: [workerId, order_id, latNum, lngNum, now],
    });

    return NextResponse.json({ success: true, timestamp: now });
  } catch (err: unknown) {
    return authErrorResponse(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const order_id = searchParams.get('order_id');

    if (!order_id) {
      return NextResponse.json({ error: 'order_id parameter required' }, { status: 400 });
    }

    const db = getTurso();

    // Query worker's latest location for this booking
    const res = await db.execute({
      sql: `SELECT wl.latitude, wl.longitude, wl.updated_at, b.worker_id
            FROM bookings b
            LEFT JOIN worker_locations wl ON wl.worker_id = b.worker_id
            WHERE b.id = ? LIMIT 1`,
      args: [order_id],
    });

    const row = res.rows[0];
    if (!row || row.latitude === null || row.latitude === undefined) {
      return NextResponse.json({ location: null });
    }

    return NextResponse.json({
      location: {
        lat: Number(row.latitude),
        lng: Number(row.longitude),
        updated_at: String(row.updated_at || ''),
      },
    });
  } catch (err: unknown) {
    return authErrorResponse(err);
  }
}
