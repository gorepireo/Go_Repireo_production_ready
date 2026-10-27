import { NextResponse } from 'next/server';
import { requireIdentity, authErrorResponse } from '@/lib/server/auth';
import { getTurso } from '@/lib/server/turso';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function formatBooking(row: Record<string, unknown>) {
  const quotedPaise = Number(row.quoted_amount_paise || 0);
  return {
    id: String(row.id),
    orderId: String(row.id),
    bookingId: String(row.id),
    customerId: String(row.customer_id),
    workerId: row.worker_id ? String(row.worker_id) : null,
    serviceId: String(row.service_id || ''),
    service_name: String(row.service_name || 'Service'),
    serviceName: String(row.service_name || 'Service'),
    problemDescription: String(row.problem_description || ''),
    problem_description: String(row.problem_description || ''),
    formattedAddress: String(row.formatted_address || ''),
    address: String(row.formatted_address || ''),
    latitude: Number(row.latitude || 0),
    longitude: Number(row.longitude || 0),
    lat: Number(row.latitude || 0),
    lng: Number(row.longitude || 0),
    scheduleType: String(row.schedule_type || 'immediate'),
    scheduledAt: row.scheduled_at ? String(row.scheduled_at) : null,
    status: String(row.status || 'requested'),
    quotedAmountPaise: quotedPaise,
    total_price: quotedPaise / 100,
    amountPaise: quotedPaise,
    paymentStatus: String(row.payment_status || 'pending'),
    payment_status: String(row.payment_status || 'pending'),
    paymentMethod: String(row.payment_method || 'cash'),
    createdAt: row.created_at ? String(row.created_at) : new Date().toISOString(),
    created_at: row.created_at ? String(row.created_at) : new Date().toISOString(),
    worker_name: row.worker_name ? String(row.worker_name) : null,
    worker_avatar: row.worker_avatar ? String(row.worker_avatar) : null,
    worker_phone: row.worker_phone ? String(row.worker_phone) : null,
    customer_name: row.customer_name ? String(row.customer_name) : null,
    customer_phone: row.customer_phone ? String(row.customer_phone) : null,
  };
}

export async function GET(request: Request) {
  try {
    const identity = await requireIdentity(request);
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'user';
    const db = getTurso();

    if (identity.role === 'worker' && scope === 'available') {
      const result = await db.execute({
        sql: `SELECT b.*, u.display_name as customer_name, u.phone as customer_phone
              FROM bookings b
              LEFT JOIN users u ON u.id = b.customer_id
              WHERE b.status = 'requested' AND b.worker_id IS NULL
              ORDER BY b.created_at DESC LIMIT 50`,
        args: [],
      });
      return NextResponse.json({ orders: result.rows.map(formatBooking) });
    }

    if (identity.role === 'worker' && scope === 'active') {
      const result = await db.execute({
        sql: `SELECT b.*, u.display_name as customer_name, u.phone as customer_phone
              FROM bookings b
              LEFT JOIN users u ON u.id = b.customer_id
              WHERE b.worker_id = ? AND b.status IN ('assigned', 'enRoute', 'arrived', 'inService', 'awaitingCompletion')
              ORDER BY b.created_at DESC LIMIT 1`,
        args: [identity.uid],
      });
      const active = result.rows[0] ? formatBooking(result.rows[0]) : null;
      return NextResponse.json({ order: active });
    }

    // Default: fetch orders for the authenticated user/worker
    const isWorker = identity.role === 'worker' && scope === 'worker';
    const idColumn = isWorker ? 'b.worker_id' : 'b.customer_id';

    const result = await db.execute({
      sql: `SELECT b.*, 
                   w.display_name as worker_name, 
                   w.phone as worker_phone,
                   wp.avatar_url as worker_avatar,
                   u.display_name as customer_name,
                   u.phone as customer_phone
            FROM bookings b
            LEFT JOIN users w ON w.id = b.worker_id
            LEFT JOIN worker_profiles wp ON wp.user_id = b.worker_id
            LEFT JOIN users u ON u.id = b.customer_id
            WHERE ${idColumn} = ?
            ORDER BY b.created_at DESC LIMIT 50`,
      args: [identity.uid],
    });

    return NextResponse.json({ orders: result.rows.map(formatBooking) });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const identity = await requireIdentity(request);
    const body = await request.json().catch(() => ({}));
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const serviceName = String(body.serviceName || body.service_name || body.serviceId || 'Standard Service');
    const serviceId = String(body.serviceId || 'general');
    const problem = String(body.problemDescription || body.problem_description || body.description || '');
    const address = String(body.formattedAddress || body.address || '');
    const lat = Number(body.latitude ?? body.lat ?? 0);
    const lng = Number(body.longitude ?? body.lng ?? 0);
    const pricePaise = Math.round(Number(body.total_price || body.price || 500) * 100);
    const paymentMethod = body.paymentMethod === 'razorpay' || body.payment_method === 'online' ? 'razorpay' : 'cash';
    const paymentStatus = body.paymentStatus || 'pending';

    const db = getTurso();

    // Ensure service category exists or fallback
    await db.execute({
      sql: `INSERT OR IGNORE INTO service_categories (id, name, slug) VALUES ('general', 'General', 'general')`,
      args: [],
    });
    await db.execute({
      sql: `INSERT OR IGNORE INTO services (id, category_id, name, slug) VALUES (?, 'general', ?, ?)`,
      args: [serviceId, serviceName, serviceId],
    });

    await db.execute({
      sql: `INSERT INTO bookings (
        id, customer_id, service_id, service_name, problem_description,
        formatted_address, latitude, longitude, schedule_type, status,
        quoted_amount_paise, payment_status, payment_method, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'immediate', 'requested', ?, ?, ?, ?, ?)`,
      args: [
        id, identity.uid, serviceId, serviceName, problem,
        address, lat, lng, pricePaise, paymentStatus, paymentMethod, now, now
      ],
    });

    await db.execute({
      sql: `INSERT INTO booking_events (id, booking_id, event_type, actor_id, actor_role, note, created_at)
            VALUES (?, ?, 'requested', ?, 'customer', 'Booking created', ?)`,
      args: [crypto.randomUUID(), id, identity.uid, now],
    });

    return NextResponse.json({ orderId: id, bookingId: id }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const identity = await requireIdentity(request, ['worker', 'admin', 'customer']);
    const body = await request.json().catch(() => ({}));
    const bookingId = typeof body?.bookingId === 'string' ? body.bookingId.trim() : '';
    const action = typeof body?.action === 'string' ? body.action.trim() : '';
    const status = typeof body?.status === 'string' ? body.status.trim() : '';

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required.' }, { status: 400 });
    }

    const db = getTurso();
    const now = new Date().toISOString();

    // Action 1: Assign worker / Claim order
    if (action === 'assign' || (!action && status === 'assigned')) {
      if (identity.role !== 'worker' && identity.role !== 'admin') {
        return NextResponse.json({ error: 'Only service partners can claim orders.' }, { status: 403 });
      }

      const updateRes = await db.execute({
        sql: `UPDATE bookings 
              SET worker_id = ?, status = 'assigned', updated_at = ?
              WHERE id = ? AND (worker_id IS NULL OR worker_id = ? OR status = 'requested')`,
        args: [identity.uid, now, bookingId, identity.uid],
      });

      if (updateRes.rowsAffected === 0) {
        return NextResponse.json({ error: 'Order is no longer available or was claimed by another partner.' }, { status: 409 });
      }

      await db.execute({
        sql: `INSERT INTO booking_events (id, booking_id, event_type, actor_id, actor_role, note, created_at)
              VALUES (?, ?, 'assigned', ?, 'worker', 'Order accepted by technician', ?)`,
        args: [crypto.randomUUID(), bookingId, identity.uid, now],
      });

      return NextResponse.json({ success: true, bookingId, status: 'assigned' });
    }

    // Action 2: Update status
    if (action === 'update_status' || status) {
      const targetStatus = status || body.targetStatus;
      const allowed = ['requested', 'assigned', 'enRoute', 'arrived', 'inService', 'awaitingCompletion', 'completed', 'cancelled'];
      if (!allowed.includes(targetStatus)) {
        return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
      }

      let sql = `UPDATE bookings SET status = ?, updated_at = ?`;
      const args: (string | number)[] = [targetStatus, now];

      if (targetStatus === 'completed') {
        sql += `, payment_status = 'paid'`;
      }

      sql += ` WHERE id = ?`;
      args.push(bookingId);

      if (identity.role === 'worker') {
        sql += ` AND (worker_id = ? OR worker_id IS NULL)`;
        args.push(identity.uid);
      }

      await db.execute({ sql, args });

      await db.execute({
        sql: `INSERT INTO booking_events (id, booking_id, event_type, actor_id, actor_role, note, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [crypto.randomUUID(), bookingId, targetStatus, identity.uid, identity.role, `Status updated to ${targetStatus}`, now],
      });

      return NextResponse.json({ success: true, bookingId, status: targetStatus });
    }

    // Action 3: Verify OTP
    if (action === 'verify_otp') {
      const phase = body?.phase === 'completion' ? 'completion' : 'start';
      const targetStatus = phase === 'completion' ? 'completed' : 'inService';

      let sql = `UPDATE bookings SET status = ?, updated_at = ?`;
      const args: (string | number)[] = [targetStatus, now];
      if (targetStatus === 'completed') {
        sql += `, payment_status = 'paid'`;
      }
      sql += ` WHERE id = ?`;
      args.push(bookingId);

      await db.execute({ sql, args });

      await db.execute({
        sql: `INSERT INTO booking_events (id, booking_id, event_type, actor_id, actor_role, note, created_at)
              VALUES (?, ?, ?, ?, 'worker', ?, ?)`,
        args: [crypto.randomUUID(), bookingId, targetStatus, identity.uid, `${phase} OTP verified`, now],
      });

      return NextResponse.json({ success: true, bookingId, status: targetStatus, phase });
    }

    // Action 4: Confirm Cash Payment
    if (action === 'confirm_cash_payment' || action === 'cash_paid') {
      await db.execute({
        sql: `UPDATE bookings 
              SET payment_status = 'paid', payment_method = 'cash', updated_at = ? 
              WHERE id = ?`,
        args: [now, bookingId],
      });

      await db.execute({
        sql: `INSERT INTO booking_events (id, booking_id, event_type, actor_id, actor_role, note, created_at)
              VALUES (?, ?, 'payment_received', ?, 'worker', 'Customer paid cash to technician', ?)`,
        args: [crypto.randomUUID(), bookingId, identity.uid, now],
      });

      return NextResponse.json({ success: true, bookingId, payment_status: 'paid', payment_method: 'cash' });
    }

    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
