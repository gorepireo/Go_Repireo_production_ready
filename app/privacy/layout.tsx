import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read the Go_Repireo privacy policy and learn how we protect your personal and location data.',
  alternates: { canonical: 'https://gorepireo.in/privacy' },
  robots: { index: true, follow: true },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
