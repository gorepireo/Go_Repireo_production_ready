import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: Request) {
  try {
    const keyId = 'rzp_live_TNcvyWzcZlRsQY';
    const keySecret = 'gZ2BdLNOKFyumV4ezxND2V3W';

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const body = await req.json();
    const amount = body.amount;

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    const rawAmount = Number(amount);
    // Convert Rupees to Paise (e.g., ₹306 -> 30600 paise). If already in paise (> 5000), keep as is.
    const amountInPaise = rawAmount > 5000 ? Math.round(rawAmount) : Math.round(rawAmount * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return NextResponse.json({ orderId: order.id, amount: order.amount }, { status: 200 });
  } catch (error: any) {
    console.error('Error creating Live Razorpay order:', error);
    const errMsg = error.error?.description || error.message || 'Failed to create Razorpay order';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
