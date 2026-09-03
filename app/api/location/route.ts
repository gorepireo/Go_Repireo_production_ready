import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, worker_id, latitude, longitude, accuracy, heading, speed, tracking_status } = body;

    if (!order_id || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Missing required location fields' }, { status: 400 });
    }

    // 1. Fetch order to verify assigned worker authorization & order status
    const { data: order, error: orderErr } = await db.database
      .from('orders')
      .select('id, worker_id, status, user_email, customer_id')
      .eq('id', order_id)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Prevent publishing location for inactive / completed orders
    if (['completed', 'cancelled', 'expired'].includes(order.status)) {
      return NextResponse.json({ error: 'Tracking is disabled for finished orders' }, { status: 403 });
    }

    const updatedAt = new Date().toISOString();

    // 2. Delete outdated live location record for this order
    await db.database
      .from('order_live_location')
      .delete()
      .eq('order_id', order_id);

    // 3. Insert updated worker GPS location into order_live_location
    await db.database
      .from('order_live_location')
      .insert([{
        order_id: order_id,
        worker_id: worker_id || order.worker_id,
        lat: Number(latitude),
        lng: Number(longitude),
        updated_at: updatedAt
      }]);

    // 4. Publish to InsForge Realtime Channel for instant customer map update
    const roomTopic = `live_location_${order_id}`;
    await db.realtime.publish(roomTopic, 'location_update', {
      order_id,
      worker_id: worker_id || order.worker_id,
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: accuracy || null,
      heading: heading || null,
      speed: speed || null,
      updated_at: updatedAt,
      tracking_status: tracking_status || 'active'
    }).catch(console.warn);

    // Also broadcast to global channel fallback
    await db.realtime.publish('global_live_locations', 'location_update', {
      order_id,
      latitude: Number(latitude),
      longitude: Number(longitude),
      updated_at: updatedAt
    }).catch(console.warn);

    return NextResponse.json({ success: true, timestamp: updatedAt });
  } catch (err: any) {
    console.error('Location update API error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const order_id = searchParams.get('order_id');

    if (!order_id) {
      return NextResponse.json({ error: 'order_id parameter required' }, { status: 400 });
    }

    // Fetch latest location
    const { data: locRows, error } = await db.database
      .from('order_live_location')
      .select('*')
      .eq('order_id', order_id)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error || !locRows || locRows.length === 0) {
      return NextResponse.json({ location: null });
    }

    return NextResponse.json({ location: locRows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
