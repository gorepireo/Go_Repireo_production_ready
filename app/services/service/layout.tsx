import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book a Repair Service in Etawah',
  description: 'Describe your repair problem, get an estimated price and book a local technician in Etawah.',
  alternates: { canonical: '/services/service' },
  openGraph: {
    title: 'Book a Repair Service in Etawah | Go_Repireo',
    description: 'Get an estimate and book a doorstep repair professional in Etawah.',
    url: '/services/service',
  },
};

export default function ServiceBookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
