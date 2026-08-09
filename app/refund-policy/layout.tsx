import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund and Cancellation Policy',
  description: 'Read the Go_Repireo refund and cancellation policy.',
  alternates: { canonical: '/refund-policy' },
};

export default function RefundPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
