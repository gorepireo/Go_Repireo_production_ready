import { NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

// Save a user's push subscription to the database
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subscription, userId, role } = body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
    }

    // Upsert push subscription keyed by endpoint
    const { error } = await insforge.database
      .from('push_subscriptions')
      .upsert([{
        user_id: userId || null,
        role: role || 'user',
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        created_at: new Date().toISOString()
      }], { onConflict: 'endpoint' });

    if (error) {
      console.error('Push subscribe DB error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Push subscribe error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Remove a push subscription on unsubscribe
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint is required' }, { status: 400 });
    }

    await insforge.database
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
