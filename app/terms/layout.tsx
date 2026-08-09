import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description: 'Read the terms and conditions for using Go_Repireo.',
  alternates: { canonical: '/terms' },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
