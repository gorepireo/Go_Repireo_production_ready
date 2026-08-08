import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { insforge } from '@/lib/insforge';

// Configure VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:support@gorepireo.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, message, url, targetUserId, targetRole, orderId, actions } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'title and message are required' }, { status: 400 });
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/icon.png',
      badge: '/icon.png',
      url: url || '/',
      orderId: orderId || null,
      tag: `repireo-${Date.now()}`,
      requireInteraction: true,
      actions: actions || []
    });

    // Fetch push subscriptions from DB
    let query = insforge.database.from('push_subscriptions').select('*');
    if (targetUserId) {
      query = query.eq('user_id', targetUserId);
    } else if (targetRole) {
      query = query.eq('role', targetRole);
    }

    const { data: subscriptions, error } = await query;

    if (error || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No subscriptions found' });
    }

    const results = await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };
        return webpush.sendNotification(pushSub, payload);
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({ sent, failed, total: subscriptions.length });
  } catch (err: any) {
    console.error('Push send error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
