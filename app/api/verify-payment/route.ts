import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const keySecret = '2b4IiOHLfBo4S0UUK7iB4k6r';

    const body = await req.json();
    const orderId = body.razorpay_order_id || body.order_id;
    const paymentId = body.razorpay_payment_id || body.payment_id;
    const signature = body.razorpay_signature || body.signature;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields (order_id, payment_id, or signature)' 
      }, { status: 400 });
    }

    // HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (generatedSignature === signature) {
      return NextResponse.json({ 
        success: true, 
        message: 'Payment verified successfully',
        order_id: orderId,
        payment_id: paymentId
      }, { status: 200 });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Signature verification failed' 
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error verifying Razorpay signature:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
