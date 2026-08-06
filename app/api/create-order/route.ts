import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: Request) {
  try {
    const keyId = 'rzp_live_TMY7lcMkI2vpQ1';
    const keySecret = 'g4ty13wsRTflfdVa2pVB061T';

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    let body = { amount: 49900, currency: 'INR', receipt: `receipt_${Date.now()}` };
    try {
      const parsed = await req.json();
      if (parsed && parsed.amount) {
        body = { ...body, ...parsed };
      }
    } catch (e) {
      // Default amount
    }

    let amountInPaise = Number(body.amount);
    if (amountInPaise < 100) {
      amountInPaise = amountInPaise * 100;
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
    console.error('Error creating Live Razorpay order:', error);
    const errMsg = error.error?.description || error.message || 'Failed to create Razorpay order';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
