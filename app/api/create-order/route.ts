import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: Request) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_TMXeXqbhAyurNL';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '2b4IiOHLfBo4S0UUK7iB4k6r';

    // Ensure matched credentials for rzp_test_TMXeXqbhAyurNL
    const activeKeyId = (keyId && keyId.includes('TMXeXqbhAyurNL')) ? keyId : 'rzp_test_TMXeXqbhAyurNL';
    const activeKeySecret = (keySecret && keySecret.includes('2b4IiOHLfBo4S0UUK7iB4k6r')) ? keySecret : '2b4IiOHLfBo4S0UUK7iB4k6r';

    const razorpay = new Razorpay({
      key_id: activeKeyId,
      key_secret: activeKeySecret,
    });

    let body = { amount: 100, currency: 'INR', receipt: `receipt_${Date.now()}` };
    try {
      const parsed = await req.json();
      if (parsed && parsed.amount) {
        body = { ...body, ...parsed };
      }
    } catch (e) {
      // Default to 100 paise (₹1) if body empty
    }

    let amountInPaise = Number(body.amount);
    if (amountInPaise < 100) {
      amountInPaise = amountInPaise * 100;
    }

    if (!amountInPaise || amountInPaise < 100) {
      amountInPaise = 100;
    }

    const options = {
      amount: amountInPaise,
      currency: body.currency || 'INR',
      receipt: body.receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({ 
      order_id: order.id, 
      id: order.id,
      amount: order.amount, 
      currency: order.currency 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    const errMsg = error.error?.description || error.message || 'Failed to create order';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
