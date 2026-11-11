import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description: 'Read the terms and conditions for using Go_Repireo on-demand doorstep home repair and appliance services.',
  alternates: { canonical: 'https://gorepireo.in/terms' },
  robots: { index: true, follow: true },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
