import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    error: 'OTPs are generated and verified only by the createBooking and verifyBookingOtp Cloud Functions.',
  }, { status: 410 });
}
