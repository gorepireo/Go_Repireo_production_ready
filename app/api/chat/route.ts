import { NextResponse } from 'next/server';
import { getTurso } from '@/lib/server/turso';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function formatServiceName(raw?: string): string {
  if (!raw) return 'Plumbing Service';
  const clean = raw.trim();
  const lower = clean.toLowerCase();
  if (lower === 'plumbing') return 'Plumbing Service';
  if (lower.includes('service')) {
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  return `${clean.charAt(0).toUpperCase() + clean.slice(1)} Service`;
}

function formatTime(isoString?: string): string {
  if (!isoString) return '2:47 PM';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '2:47 PM';
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetOrderId =
      searchParams.get('order_id') ||
      searchParams.get('orderId') ||
      searchParams.get('id') ||
      'c65c8ca2-66b8-4954-a709-586f70d1ada2';

    const db = getTurso();

    // 1. Fetch booking details with customer and worker profiles
    const bookingResult = await db.execute({
      sql: `SELECT b.*, 
                   w.display_name as worker_name, 
                   w.phone as worker_phone,
                   wp.avatar_url as worker_avatar,
                   wp.rating_average,
                   wp.rating_count,
                   u.display_name as customer_name,
                   u.phone as customer_phone
            FROM bookings b
            LEFT JOIN users w ON w.id = b.worker_id
            LEFT JOIN worker_profiles wp ON wp.user_id = b.worker_id
            LEFT JOIN users u ON u.id = b.customer_id
            WHERE b.id = ? OR b.id LIKE ?
            LIMIT 1`,
      args: [targetOrderId, `%${targetOrderId}%`],
    });

    const bookingRow = bookingResult.rows[0];
    const orderId = bookingRow ? String(bookingRow.id) : targetOrderId;
    const serviceTitle = formatServiceName(bookingRow ? String(bookingRow.service_name || '') : 'Plumbing Service');
    const workerName = bookingRow?.worker_name ? String(bookingRow.worker_name) : 'Anupam';
    const workerPhone = bookingRow?.worker_phone ? String(bookingRow.worker_phone) : '+917679430992';
    const customerName = bookingRow?.customer_name ? String(bookingRow.customer_name).split(' ')[0] : 'Prithibi';

    // 2. Fetch messages from database for this booking
    const messagesResult = await db.execute({
      sql: `SELECT bm.*, u.display_name as sender_name
            FROM booking_messages bm
            LEFT JOIN users u ON u.id = bm.sender_id
            WHERE bm.booking_id = ?
            ORDER BY bm.created_at ASC`,
      args: [orderId],
    });

    const messages = messagesResult.rows.map((row) => ({
      id: String(row.id),
      senderId: String(row.sender_id),
      senderRole: String(row.sender_role || 'worker') as 'worker' | 'customer',
      senderName: row.sender_name ? String(row.sender_name).split(' ')[0] : String(row.sender_role) === 'customer' ? customerName : workerName,
      text: String(row.message_text || ''),
      time: formatTime(row.created_at ? String(row.created_at) : undefined),
      createdAt: row.created_at ? String(row.created_at) : new Date().toISOString(),
      type: 'text' as const,
    }));

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        serviceName: serviceTitle,
        scheduleTime: 'Today, 3:00 PM – 5:00 PM',
        status: String(bookingRow?.status || 'assigned'),
        workerName,
        workerPhone,
        customerName,
      },
      messages,
      liveTracking: {
        statusText: 'Expert is on the way',
        distance: '4.0 km away • 6 min',
        distanceMeters: 4000,
        durationSeconds: 360,
      },
    });
  } catch (error: any) {
    console.error('[API /api/chat GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat details', details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, text, senderRole, senderId } = body;

    if (!orderId || !text || !text.trim()) {
      return NextResponse.json({ error: 'orderId and text are required' }, { status: 400 });
    }

    const db = getTurso();

    // Find the booking to resolve sender if needed
    const bookingResult = await db.execute({
      sql: 'SELECT customer_id, worker_id FROM bookings WHERE id = ? OR id LIKE ? LIMIT 1',
      args: [orderId, `%${orderId}%`],
    });

    const booking = bookingResult.rows[0];
    const actualOrderId = booking ? String(booking.id) : orderId;
    const resolvedRole = (senderRole || 'customer') as 'customer' | 'worker';
    const resolvedSenderId = senderId || (resolvedRole === 'worker' ? booking?.worker_id : booking?.customer_id) || 'ab0acfec-0859-4b8d-a36b-b0fa11681ced';

    const messageId = randomUUID();
    const nowIso = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO booking_messages 
            (id, booking_id, sender_id, sender_role, message_type, message_text, created_at)
            VALUES (?, ?, ?, ?, 'text', ?, ?)`,
      args: [messageId, actualOrderId, String(resolvedSenderId), resolvedRole, text.trim(), nowIso],
    });

    return NextResponse.json({
      success: true,
      message: {
        id: messageId,
        senderId: String(resolvedSenderId),
        senderRole: resolvedRole,
        text: text.trim(),
        time: formatTime(nowIso),
        createdAt: nowIso,
        type: 'text',
      },
    });
  } catch (error: any) {
    console.error('[API /api/chat POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save message', details: error?.message },
      { status: 500 }
    );
  }
}
