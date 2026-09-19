import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Appliance Installation Services',
  description: 'Go_Repireo appliance installation services are coming soon.',
  alternates: { canonical: '/services/installation' },
  robots: { index: false, follow: true },
};

export default function InstallationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
