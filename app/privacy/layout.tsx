import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read the Go_Repireo privacy policy.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
