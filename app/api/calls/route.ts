import { NextResponse } from 'next/server';
import { requireIdentity, authErrorResponse } from '@/lib/server/auth';
import { getTurso } from '@/lib/server/turso';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const identity = await requireIdentity(req);
    const body = await req.json().catch(() => ({}));
    const { order_id, caller_role, sdp_offer } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const db = getTurso();

    // 1. Fetch Order from Turso database
    const orderResult = await db.execute({
      sql: `SELECT b.*, 
                   cu.display_name as customer_name,
                   wu.display_name as worker_name,
                   wp.avatar_url as worker_avatar
            FROM bookings b
            LEFT JOIN users cu ON cu.id = b.customer_id
            LEFT JOIN users wu ON wu.id = b.worker_id
            LEFT JOIN worker_profiles wp ON wp.user_id = b.worker_id
            WHERE b.id = ? LIMIT 1`,
      args: [order_id],
    });

    const order = orderResult.rows[0];
    if (!order) {
      return NextResponse.json({ error: 'Active booking not found.' }, { status: 404 });
    }

    // 2. Check Order Status
    const status = String(order.status || '').toLowerCase();
    if (['completed', 'cancelled'].includes(status)) {
      return NextResponse.json({
        error: 'In-app calling is unavailable because this order has ended.',
      }, { status: 400 });
    }

    const customerId = String(order.customer_id);
    const workerId = order.worker_id ? String(order.worker_id) : 'unassigned';
    const initiatedBy: 'customer' | 'worker' = caller_role === 'worker' ? 'worker' : 'customer';

    const now = new Date().toISOString();
    const sessionId = `CALL_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const roomId = `ROOM_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Cancel any previous ringing sessions for this order
    await db.execute({
      sql: `UPDATE call_sessions SET status = 'cancelled', ended_at = ? 
            WHERE order_id = ? AND status = 'ringing'`,
      args: [now, order_id],
    });

    // Insert Call Session
    await db.execute({
      sql: `INSERT INTO call_sessions (
        id, order_id, customer_id, worker_id, room_id, initiated_by,
        status, sdp_offer, ice_candidates_json, created_at, ringing_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'ringing', ?, '[]', ?, ?)`,
      args: [
        sessionId,
        order_id,
        customerId,
        workerId,
        roomId,
        initiatedBy,
        sdp_offer ? JSON.stringify(sdp_offer) : null,
        now,
        now,
      ],
    });

    // Safe participant info (NO PHONE NUMBERS DISPLAYED OR EXCHANGED)
    const opponentParticipant = initiatedBy === 'customer'
      ? {
          id: workerId,
          name: String(order.worker_name || 'Assigned Expert'),
          avatar: order.worker_avatar ? String(order.worker_avatar) : '/hero_technician_banner.png',
          role: 'Assigned Expert',
          service: String(order.service_name || 'Service Specialist'),
        }
      : {
          id: customerId,
          name: String(order.customer_name || 'Customer'),
          avatar: '/customer_3d.png',
          role: 'Customer',
          service: String(order.service_name || 'Customer Booking'),
        };

    return NextResponse.json({
      success: true,
      callSession: {
        id: sessionId,
        order_id: String(order.id),
        room_id: roomId,
        initiated_by: initiatedBy,
        status: 'ringing',
        created_at: now,
        participant: opponentParticipant,
      },
    });
  } catch (err: unknown) {
    return authErrorResponse(err);
  }
}

export async function GET(req: Request) {
  try {
    const identity = await requireIdentity(req);
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const checkIncoming = searchParams.get('checkIncoming') === 'true';

    const db = getTurso();

    // 1. Fetch specific call session (for active polling/ICE exchange)
    if (sessionId) {
      const res = await db.execute({
        sql: `SELECT * FROM call_sessions WHERE id = ? LIMIT 1`,
        args: [sessionId],
      });
      const row = res.rows[0];
      if (!row) {
        return NextResponse.json({ error: 'Call session not found' }, { status: 404 });
      }

      let sdpOffer = null;
      let sdpAnswer = null;
      let iceCandidates = [];

      try { if (row.sdp_offer) sdpOffer = JSON.parse(String(row.sdp_offer)); } catch {}
      try { if (row.sdp_answer) sdpAnswer = JSON.parse(String(row.sdp_answer)); } catch {}
      try { if (row.ice_candidates_json) iceCandidates = JSON.parse(String(row.ice_candidates_json)); } catch {}

      return NextResponse.json({
        session: {
          id: String(row.id),
          orderId: String(row.order_id),
          roomId: String(row.room_id),
          status: String(row.status),
          initiatedBy: String(row.initiated_by),
          sdpOffer,
          sdpAnswer,
          iceCandidates,
          acceptedAt: row.accepted_at ? String(row.accepted_at) : null,
          endedAt: row.ended_at ? String(row.ended_at) : null,
        },
      });
    }

    // 2. Check for incoming call ringing for this user
    if (checkIncoming) {
      const myId = identity.uid;
      const res = await db.execute({
        sql: `SELECT cs.*, b.service_name,
                     cu.display_name as customer_name,
                     wu.display_name as worker_name,
                     wp.avatar_url as worker_avatar
              FROM call_sessions cs
              JOIN bookings b ON b.id = cs.order_id
              LEFT JOIN users cu ON cu.id = cs.customer_id
              LEFT JOIN users wu ON wu.id = cs.worker_id
              LEFT JOIN worker_profiles wp ON wp.user_id = cs.worker_id
              WHERE cs.status = 'ringing'
                AND ((cs.customer_id = ? AND cs.initiated_by = 'worker')
                     OR (cs.worker_id = ? AND cs.initiated_by = 'customer'))
              ORDER BY cs.created_at DESC LIMIT 1`,
        args: [myId, myId],
      });

      const row = res.rows[0];
      if (!row) {
        return NextResponse.json({ incomingCall: null });
      }

      const isCustomer = row.initiated_by === 'customer';
      const participant = isCustomer
        ? {
            id: String(row.customer_id),
            name: String(row.customer_name || 'Customer'),
            avatar: '/customer_3d.png',
            role: 'Customer',
            service: String(row.service_name || 'Service Booking'),
          }
        : {
            id: String(row.worker_id),
            name: String(row.worker_name || 'Assigned Expert'),
            avatar: row.worker_avatar ? String(row.worker_avatar) : '/hero_technician_banner.png',
            role: 'Assigned Expert',
            service: String(row.service_name || 'Service Specialist'),
          };

      return NextResponse.json({
        incomingCall: {
          sessionId: String(row.id),
          orderId: String(row.order_id),
          roomId: String(row.room_id),
          initiatedBy: String(row.initiated_by),
          participant,
        },
      });
    }

    return NextResponse.json({ error: 'Provide sessionId or checkIncoming' }, { status: 400 });
  } catch (err: unknown) {
    return authErrorResponse(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const identity = await requireIdentity(req);
    const body = await req.json().catch(() => ({}));
    const { call_id, status, ended_by, sdp_answer, candidate, role, userId } = body;

    if (!call_id) {
      return NextResponse.json({ error: 'call_id is required' }, { status: 400 });
    }

    const db = getTurso();
    const now = new Date().toISOString();

    // Candidate addition
    if (candidate) {
      const existingRes = await db.execute({
        sql: `SELECT ice_candidates_json FROM call_sessions WHERE id = ? LIMIT 1`,
        args: [call_id],
      });
      const row = existingRes.rows[0];
      if (row) {
        let list: any[] = [];
        try {
          if (row.ice_candidates_json) list = JSON.parse(String(row.ice_candidates_json));
        } catch {}
        list.push({
          candidate,
          role: role || (identity.role === 'worker' ? 'worker' : 'customer'),
          userId: userId || identity.uid,
        });
        await db.execute({
          sql: `UPDATE call_sessions SET ice_candidates_json = ? WHERE id = ?`,
          args: [JSON.stringify(list), call_id],
        });
      }
      return NextResponse.json({ success: true, candidateAdded: true });
    }

    if (status === 'accepted') {
      await db.execute({
        sql: `UPDATE call_sessions 
              SET status = 'accepted', sdp_answer = ?, accepted_at = ? 
              WHERE id = ?`,
        args: [sdp_answer ? JSON.stringify(sdp_answer) : null, now, call_id],
      });
      return NextResponse.json({ success: true, status: 'accepted' });
    }

    if (['ended', 'declined', 'cancelled', 'missed'].includes(status)) {
      const existingRes = await db.execute({
        sql: `SELECT accepted_at FROM call_sessions WHERE id = ? LIMIT 1`,
        args: [call_id],
      });
      let duration = 0;
      const acceptedAt = existingRes.rows[0]?.accepted_at;
      if (acceptedAt) {
        duration = Math.max(0, Math.floor((Date.now() - new Date(String(acceptedAt)).getTime()) / 1000));
      }

      await db.execute({
        sql: `UPDATE call_sessions 
              SET status = ?, ended_at = ?, ended_by = ?, duration_seconds = ? 
              WHERE id = ?`,
        args: [status, now, ended_by || identity.uid, duration, call_id],
      });
      return NextResponse.json({ success: true, status, duration });
    }

    return NextResponse.json({ error: 'Invalid update' }, { status: 400 });
  } catch (err: unknown) {
    return authErrorResponse(err);
  }
}
