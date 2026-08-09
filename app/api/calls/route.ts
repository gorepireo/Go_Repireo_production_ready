import { NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order_id, caller_id, caller_role, sdp_offer } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Fetch Order from Database
    const { data: order, error: orderErr } = await insforge.database
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Active order not found' }, { status: 404 });
    }

    // 2. Check Order Status Permissibility
    const forbiddenStatuses = ['completed', 'cancelled', 'expired'];
    if (forbiddenStatuses.includes((order.status || '').toLowerCase())) {
      return NextResponse.json({ 
        error: 'Communication closed because this order has been completed or cancelled.' 
      }, { status: 400 });
    }

    // 3. Determine Participants
    const customerId = order.user_id || order.user_email || 'customer';
    const workerId = order.assigned_worker_id || order.worker_id || order.worker_email || 'worker';

    const initiatedBy = caller_role || (caller_id === workerId ? 'worker' : 'customer');

    // 4. Generate Random Room ID and Session ID (NO PHONE NUMBERS)
    const sessionId = `CALL_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const roomId = `ROOM_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;

    // 5. Insert Call Session Record
    const callSession: any = {
      id: sessionId,
      order_id: order.id,
      customer_id: customerId,
      worker_id: workerId,
      room_id: roomId,
      initiated_by: initiatedBy,
      status: 'ringing',
      created_at: new Date().toISOString(),
      ringing_at: new Date().toISOString()
    };

    if (sdp_offer) {
      callSession.sdp_offer = sdp_offer;
    }

    const { error: insertErr } = await insforge.database
      .from('call_sessions')
      .insert([callSession]);

    if (insertErr) {
      console.warn('Call session insert warning:', insertErr);
    }

    // 6. Return Safe Participant Profile Info (ZERO PHONE NUMBERS)
    const opponentParticipant = initiatedBy === 'customer' ? {
      id: workerId,
      name: order.worker_name || 'Assigned Expert',
      avatar: order.worker_avatar || '/technician_hero.jpg',
      role: 'Assigned Expert',
      service: order.service_name || 'Service Specialist'
    } : {
      id: customerId,
      name: order.user_name || order.user_email?.split('@')[0] || 'Customer',
      avatar: '/customer_3d.png',
      role: 'Customer',
      service: order.service_name || 'Customer Booking'
    };

    // Send Native Mobile WebPush Notification to Target Participant
    try {
      const targetUserId = opponentParticipant.id;
      const notificationTitle = '📞 Incoming Voice Call';
      const notificationBody = `${initiatedBy === 'customer' ? 'Customer' : 'Your Assigned Expert'} is calling about Order #${(order.id || '').slice(0, 8)}. Tap to answer!`;
      const redirectUrl = initiatedBy === 'customer' ? '/dashboard/worker' : `/track?id=${order.id}`;

      const origin = req.headers.get('origin') || 'https://gorepireo.in';
      fetch(`${origin}/api/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          title: notificationTitle,
          message: notificationBody,
          url: redirectUrl,
          orderId: order.id
        })
      }).catch(err => console.warn('Native call push send warning:', err));
    } catch (e) {
      console.warn('Native call push trigger error:', e);
    }

    return NextResponse.json({
      success: true,
      callSession: {
        id: sessionId,
        order_id: order.id,
        room_id: roomId,
        initiated_by: initiatedBy,
        status: 'ringing',
        created_at: callSession.created_at,
        participant: opponentParticipant
      }
    }, { status: 200 });

  } catch (err: any) {
    console.error('Call initiation error:', err);
    return NextResponse.json({ error: err.message || 'Failed to initiate call' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { call_id, status, ended_by, sdp_offer, sdp_answer } = body;

    if (!call_id || !status) {
      return NextResponse.json({ error: 'call_id and status are required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const updateData: any = { status };
    if (sdp_offer) updateData.sdp_offer = sdp_offer;
    if (sdp_answer) updateData.sdp_answer = sdp_answer;

    if (status === 'accepted') {
      updateData.accepted_at = now;
    } else if (['ended', 'declined', 'missed', 'cancelled'].includes(status)) {
      updateData.ended_at = now;
      if (ended_by) updateData.ended_by = ended_by;

      // Calculate Duration
      const { data: existing } = await insforge.database
        .from('call_sessions')
        .select('accepted_at')
        .eq('id', call_id)
        .single();

      if (existing?.accepted_at) {
        const start = new Date(existing.accepted_at).getTime();
        const durationSec = Math.max(0, Math.floor((Date.now() - start) / 1000));
        updateData.duration_seconds = durationSec;
      }
    }

    const { error: updateErr } = await insforge.database
      .from('call_sessions')
      .update(updateData)
      .eq('id', call_id);

    if (updateErr) {
      console.warn('Call session update warning:', updateErr);
    }

    return NextResponse.json({ success: true, status }, { status: 200 });
  } catch (err: any) {
    console.error('Call patch error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update call session' }, { status: 500 });
  }
}
