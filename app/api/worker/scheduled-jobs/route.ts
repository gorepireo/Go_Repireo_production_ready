import { NextResponse } from 'next/server';
import { requireIdentity, authErrorResponse } from '@/lib/server/auth';
import { getTurso } from '@/lib/server/turso';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const identity = await requireIdentity(request, ['worker', 'admin']);
    const workerId = identity.uid;

    const db = getTurso();
    const todayDateStr = new Date().toISOString().slice(0, 10);

    // Fetch stats and scheduled bookings
    const [statsRes, bookingsRes] = await Promise.all([
      db.execute({
        sql: `
          SELECT 
            SUM(CASE WHEN schedule_type = 'scheduled' AND status IN ('requested', 'assigned') THEN 1 ELSE 0 END) as upcoming_count,
            SUM(CASE WHEN schedule_type = 'scheduled' AND status IN ('requested', 'assigned') AND scheduled_at LIKE ? THEN 1 ELSE 0 END) as today_count,
            SUM(CASE WHEN worker_id = ? AND status IN ('assigned', 'enRoute', 'arrived', 'inService') THEN 1 ELSE 0 END) as accepted_count,
            SUM(CASE WHEN worker_id = ? AND status = 'completed' THEN 1 ELSE 0 END) as completed_count
          FROM bookings
        `,
        args: [`${todayDateStr}%`, workerId, workerId],
      }),
      db.execute({
        sql: `
          SELECT b.id, b.service_name, b.problem_description, b.formatted_address,
                 b.schedule_type, b.scheduled_at, b.status, b.quoted_amount_paise,
                 b.payment_status, b.payment_method, b.created_at, b.worker_id,
                 u.display_name as customer_name, u.phone as customer_phone
          FROM bookings b
          LEFT JOIN users u ON b.customer_id = u.id
          WHERE b.schedule_type = 'scheduled'
            AND (b.worker_id IS NULL OR b.worker_id = ? OR b.status = 'requested')
            AND b.status NOT IN ('cancelled')
          ORDER BY 
            CASE WHEN b.scheduled_at IS NOT NULL THEN b.scheduled_at ELSE b.created_at END ASC
          LIMIT 100
        `,
        args: [workerId],
      }),
    ]);

    const statRow = statsRes.rows[0];
    const stats = {
      upcomingJobs: Number(statRow?.upcoming_count || 0),
      todayAppointments: Number(statRow?.today_count || 0),
      acceptedJobs: Number(statRow?.accepted_count || 0),
      completedJobs: Number(statRow?.completed_count || 0),
    };

    const jobs = bookingsRes.rows.map((r) => {
      const isAssignedToMe = r.worker_id === workerId;
      const isAwaitingAcceptance = !r.worker_id || r.status === 'requested';

      return {
        id: String(r.id),
        serviceName: String(r.service_name || 'General Service'),
        problemTitle: String(r.problem_description || r.service_name || 'Scheduled Service Inspection'),
        address: String(r.formatted_address || 'Address on file'),
        scheduleType: String(r.schedule_type || 'scheduled'),
        scheduledAt: r.scheduled_at ? String(r.scheduled_at) : String(r.created_at || ''),
        status: String(r.status || 'requested'),
        amount: Math.round(Number(r.quoted_amount_paise || 50000) / 100),
        paymentStatus: String(r.payment_status || 'pending'),
        paymentMethod: String(r.payment_method || 'cash'),
        isAssignedToMe,
        isAwaitingAcceptance,
        customer: {
          name: String(r.customer_name || 'Customer'),
          phone: String(r.customer_phone || ''),
        },
      };
    });

    return NextResponse.json({ stats, jobs });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const identity = await requireIdentity(request, ['worker', 'admin']);
    const workerId = identity.uid;

    const body = await request.json().catch(() => ({}));
    const bookingId = typeof body?.bookingId === 'string' ? body.bookingId.trim() : '';
    const action = typeof body?.action === 'string' ? body.action.trim() : 'accept';

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required.' }, { status: 400 });
    }

    const db = getTurso();
    const now = new Date().toISOString();

    if (action === 'accept') {
      const updateResult = await db.execute({
        sql: `
          UPDATE bookings 
          SET worker_id = ?, status = 'assigned', updated_at = ?
          WHERE id = ? AND (worker_id IS NULL OR worker_id = ? OR status = 'requested')
        `,
        args: [workerId, now, bookingId, workerId],
      });

      if (updateResult.rowsAffected === 0) {
        return NextResponse.json({ error: 'This job has already been claimed by another service partner.' }, { status: 409 });
      }

      return NextResponse.json({ success: true, bookingId, status: 'assigned' });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
