import { NextResponse } from 'next/server';
import { requireIdentity, authErrorResponse } from '@/lib/server/auth';
import { getTurso } from '@/lib/server/turso';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    await requireIdentity(request, ['admin']);
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('status') || 'all';

    const db = getTurso();

    let sql = `
      SELECT b.id, b.customer_id, b.worker_id, b.service_name, b.problem_description,
             b.formatted_address, b.schedule_type, b.scheduled_at, b.status,
             b.quoted_amount_paise, b.payment_status, b.payment_method, b.created_at,
             cu.display_name as customer_name, cu.phone as customer_phone,
             wu.display_name as worker_name, wu.phone as worker_phone
      FROM bookings b
      LEFT JOIN users cu ON b.customer_id = cu.id
      LEFT JOIN users wu ON b.worker_id = wu.id
    `;
    const args: (string | number)[] = [];

    if (filter !== 'all') {
      sql += ` WHERE b.status = ?`;
      args.push(filter);
    }

    sql += ` ORDER BY b.created_at DESC LIMIT 100`;

    const result = await db.execute({ sql, args });

    const bookings = result.rows.map((r) => ({
      id: String(r.id),
      serviceName: String(r.service_name || 'Service'),
      problemDescription: String(r.problem_description || ''),
      address: String(r.formatted_address || ''),
      scheduleType: String(r.schedule_type || 'immediate'),
      scheduledAt: r.scheduled_at ? String(r.scheduled_at) : null,
      status: String(r.status || 'requested'),
      amount: Math.round(Number(r.quoted_amount_paise || 0) / 100),
      paymentStatus: String(r.payment_status || 'pending'),
      paymentMethod: String(r.payment_method || 'cash'),
      createdAt: String(r.created_at || ''),
      customer: {
        id: String(r.customer_id || ''),
        name: String(r.customer_name || 'Customer'),
        phone: String(r.customer_phone || ''),
      },
      worker: r.worker_id
        ? {
            id: String(r.worker_id),
            name: String(r.worker_name || 'Worker'),
            phone: String(r.worker_phone || ''),
          }
        : null,
    }));

    return NextResponse.json({ bookings });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireIdentity(request, ['admin']);
    const body = await request.json().catch(() => ({}));
    const bookingId = typeof body?.bookingId === 'string' ? body.bookingId.trim() : '';
    const status = typeof body?.status === 'string' ? body.status.trim() : '';

    const allowed = ['requested', 'assigned', 'enRoute', 'arrived', 'inService', 'completed', 'cancelled'];
    if (!bookingId || !allowed.includes(status)) {
      return NextResponse.json({ error: 'Valid booking ID and status are required.' }, { status: 400 });
    }

    const db = getTurso();
    const now = new Date().toISOString();

    await db.execute({
      sql: `UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?`,
      args: [status, now, bookingId],
    });

    return NextResponse.json({ success: true, bookingId, status });
  } catch (error) {
    return authErrorResponse(error);
  }
}
