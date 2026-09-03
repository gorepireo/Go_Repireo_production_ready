import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Generate a unique 4-digit OTP not currently used by any active order
async function generateUniqueOtp(maxTries = 20): Promise<string> {
  for (let i = 0; i < maxTries; i++) {
    const candidate = Math.floor(1000 + Math.random() * 9000).toString();

    // Check if this OTP is already used in an active order's details
    const { data: conflictingOrders } = await db.database
      .from('orders')
      .select('id, details')
      .in('status', ['pending', 'in_progress', 'assigned', 'work_in_progress', 'on_the_way', 'working']);

    let inUse = false;
    if (conflictingOrders && conflictingOrders.length > 0) {
      for (const order of conflictingOrders) {
        const d = order.details || {};
        if (d.start_otp === candidate || d.completion_otp === candidate) {
          inUse = true;
          break;
        }
      }
    }

    if (!inUse) {
      return candidate;
    }
  }

  // Fallback: generate 6-digit OTP if all 4-digit attempts are exhausted
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    // Generate two unique OTPs (start and completion must also differ from each other)
    const startOtp = await generateUniqueOtp();

    // Generate completion OTP, ensuring it differs from startOtp
    let completionOtp = await generateUniqueOtp();
    let attempts = 0;
    while (completionOtp === startOtp && attempts < 10) {
      completionOtp = await generateUniqueOtp();
      attempts++;
    }

    return NextResponse.json({
      start_otp: startOtp,
      completion_otp: completionOtp
    });
  } catch (err: any) {
    console.error('OTP generation error:', err);
    // Fallback: return random OTPs even if DB check fails
    const startOtp = Math.floor(1000 + Math.random() * 9000).toString();
    let completionOtp = Math.floor(1000 + Math.random() * 9000).toString();
    while (completionOtp === startOtp) {
      completionOtp = Math.floor(1000 + Math.random() * 9000).toString();
    }
    return NextResponse.json({ start_otp: startOtp, completion_otp: completionOtp });
  }
}
