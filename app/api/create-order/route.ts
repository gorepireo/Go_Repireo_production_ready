import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: Request) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Razorpay credentials missing' }, { status: 401 });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const body = await req.json();
    let amountInPaise = Number(body.amount);

    // If amount passed is in Rupees (e.g. 1 or 499), convert to paise (min 100 paise = ₹1)
    if (amountInPaise < 100) {
      amountInPaise = amountInPaise * 100;
    }

    if (!amountInPaise || amountInPaise < 100) {
      return NextResponse.json({ error: 'Minimum order amount is 100 paise (₹1)' }, { status: 400 });
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
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
