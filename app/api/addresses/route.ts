import { NextResponse } from 'next/server';
import { requireIdentity, authErrorResponse } from '@/lib/server/auth';
import { getTurso } from '@/lib/server/turso';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const identity = await requireIdentity(request);
    const db = getTurso();
    const result = await db.execute({
      sql: `SELECT id, label, formatted_address, latitude, longitude, landmark, is_default, created_at
            FROM addresses WHERE customer_id = ? ORDER BY created_at DESC`,
      args: [identity.uid],
    });

    const addresses = result.rows.map((row) => ({
      id: String(row.id),
      name: String(row.label || 'Home'),
      label: String(row.label || 'Home'),
      address_text: String(row.formatted_address || ''),
      formatted_address: String(row.formatted_address || ''),
      lat: Number(row.latitude || 0),
      lng: Number(row.longitude || 0),
      latitude: Number(row.latitude || 0),
      longitude: Number(row.longitude || 0),
      landmark: String(row.landmark || ''),
      isDefault: Boolean(row.is_default),
    }));

    return NextResponse.json({ addresses });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const identity = await requireIdentity(request);
    const body = await request.json().catch(() => ({}));
    const label = (body.name || body.label || 'Home').trim();
    const addressText = (body.address_text || body.formatted_address || '').trim();
    const lat = Number(body.lat ?? body.latitude ?? 0);
    const lng = Number(body.lng ?? body.longitude ?? 0);
    const landmark = (body.landmark || '').trim();

    if (!addressText) {
      return NextResponse.json({ error: 'Address details are required.' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const db = getTurso();

    await db.execute({
      sql: `INSERT INTO addresses (id, customer_id, label, formatted_address, latitude, longitude, landmark, is_default, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      args: [id, identity.uid, label, addressText, lat, lng, landmark, now, now],
    });

    return NextResponse.json({
      address: {
        id,
        name: label,
        label,
        address_text: addressText,
        formatted_address: addressText,
        lat,
        lng,
        latitude: lat,
        longitude: lng,
        landmark,
      },
    }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const identity = await requireIdentity(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Address ID is required.' }, { status: 400 });

    const db = getTurso();
    await db.execute({
      sql: 'DELETE FROM addresses WHERE id = ? AND customer_id = ?',
      args: [id, identity.uid],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
