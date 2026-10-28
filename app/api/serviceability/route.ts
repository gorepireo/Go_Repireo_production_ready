import { NextRequest, NextResponse } from 'next/server';
import { getTurso } from '@/lib/server/turso';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');

    if (!latParam || !lngParam) {
      return NextResponse.json({
        serviceable: true,
        reason: 'location_not_specified',
      });
    }

    const customerLat = parseFloat(latParam);
    const customerLng = parseFloat(lngParam);

    if (isNaN(customerLat) || isNaN(customerLng)) {
      return NextResponse.json({
        serviceable: true,
        reason: 'invalid_coordinates',
      });
    }

    const db = getTurso();

    // Query all approved workers and their registered/live coordinates
    const res = await db.execute({
      sql: `SELECT wp.user_id, wp.full_name, wp.approval_status, wp.pincode, wp.latitude, wp.longitude,
                   wl.latitude as live_latitude, wl.longitude as live_longitude
            FROM worker_profiles wp
            LEFT JOIN worker_locations wl ON wl.worker_id = wp.user_id
            WHERE wp.approval_status = 'approved'`,
    });

    const rows = res.rows;
    const RADIUS_KM = 10.0;
    let minDistance = Infinity;
    let nearbyWorkerCount = 0;

    for (const row of rows) {
      // Prefer registered base latitude/longitude from worker application, then live location
      const wLat = row.latitude !== null && row.latitude !== undefined 
        ? Number(row.latitude) 
        : row.live_latitude !== null && row.live_latitude !== undefined 
        ? Number(row.live_latitude) 
        : null;

      const wLng = row.longitude !== null && row.longitude !== undefined 
        ? Number(row.longitude) 
        : row.live_longitude !== null && row.live_longitude !== undefined 
        ? Number(row.live_longitude) 
        : null;

      if (wLat !== null && wLng !== null && !isNaN(wLat) && !isNaN(wLng)) {
        const dist = calculateDistanceKm(customerLat, customerLng, wLat, wLng);
        if (dist < minDistance) {
          minDistance = dist;
        }
        if (dist <= RADIUS_KM) {
          nearbyWorkerCount++;
        }
      }
    }

    const isServiceable = nearbyWorkerCount > 0;

    return NextResponse.json({
      serviceable: isServiceable,
      radiusKm: RADIUS_KM,
      nearbyWorkerCount,
      minDistanceKm: minDistance < Infinity ? Math.round(minDistance * 10) / 10 : null,
      totalApprovedWorkers: rows.length,
    });
  } catch (err: unknown) {
    console.error('Serviceability check error:', err);
    // On unexpected server error, default to normal to prevent blocking user
    return NextResponse.json({
      serviceable: true,
      error: 'internal_error',
    });
  }
}
