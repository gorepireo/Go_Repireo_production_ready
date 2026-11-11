import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book a Repair Service Online in Etawah',
  description: 'Describe your repair problem, get an instant estimated price and book a verified local technician in Etawah within 15 minutes.',
  alternates: { canonical: 'https://gorepireo.in/services/service' },
  openGraph: {
    title: 'Book a Repair Service Online in Etawah | Go_Repireo',
    description: 'Get an instant estimate and book a doorstep repair professional in Etawah.',
    url: 'https://gorepireo.in/services/service',
    siteName: 'Go_Repireo',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Book Doorstep Repair Services in Etawah | Go_Repireo',
    description: 'Instant booking for local plumbers, electricians & technicians in Etawah.',
  },
};

export default function ServiceBookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
