import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund and Cancellation Policy',
  description: 'Read the Go_Repireo 100% money-back guarantee, refund, and cancellation policies for home repair services in Etawah.',
  alternates: { canonical: 'https://gorepireo.in/refund-policy' },
  robots: { index: true, follow: true },
};

export default function RefundPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
