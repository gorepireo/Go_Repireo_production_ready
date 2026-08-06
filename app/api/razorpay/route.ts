import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: Request) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TMY7lcMkI2vpQ1';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'g4ty13wsRTflfdVa2pVB061T';

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const { amount } = await req.json();

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return NextResponse.json({ orderId: order.id }, { status: 200 });
  } catch (error: any) {
    console.error('Error creating Live Razorpay order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
