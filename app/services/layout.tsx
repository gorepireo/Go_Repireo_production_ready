import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home Repair Services in Etawah',
  description: 'Browse appliance repair, plumbing, electrical and cleaning services from local professionals in Etawah, Uttar Pradesh.',
  alternates: { canonical: '/services' },
  openGraph: {
    title: 'Home Repair Services in Etawah | Go_Repireo',
    description: 'Browse local repair and maintenance services available in Etawah.',
    url: '/services',
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
