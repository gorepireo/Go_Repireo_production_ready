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
      sql: `SELECT id, title, message, notification_type, booking_id, action_url, created_at, read_at
            FROM notifications WHERE owner_id = ? ORDER BY created_at DESC LIMIT 50`,
      args: [identity.uid],
    });

    const notifications = result.rows.map((row) => ({
      id: String(row.id),
      type: String(row.notification_type || 'confirmed'),
      title: String(row.title || 'Notification'),
      message: String(row.message || ''),
      time: row.created_at ? new Date(String(row.created_at)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
      read: Boolean(row.read_at),
      bookingId: row.booking_id ? String(row.booking_id) : undefined,
      actionUrl: row.action_url ? String(row.action_url) : (row.booking_id ? `/track?orderId=${row.booking_id}` : undefined),
    }));

    return NextResponse.json({ notifications });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const identity = await requireIdentity(request);
    const body = await request.json().catch(() => ({}));
    const db = getTurso();
    const now = new Date().toISOString();

    if (body.clearAll || body.id === 'all') {
      await db.execute({
        sql: 'UPDATE notifications SET read_at = ? WHERE owner_id = ? AND read_at IS NULL',
        args: [now, identity.uid],
      });
    } else if (body.id) {
      await db.execute({
        sql: 'UPDATE notifications SET read_at = ? WHERE id = ? AND owner_id = ?',
        args: [now, String(body.id), identity.uid],
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
