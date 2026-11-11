import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Doorstep Home Repair & Appliance Services in Etawah',
  description: 'Explore on-demand plumbing, electrician, AC repair, appliance maintenance, and cleaning services in Etawah. Verified local pros, live tracking & 30-day warranty.',
  alternates: { canonical: 'https://gorepireo.in/services' },
  openGraph: {
    title: 'Doorstep Home Repair & Appliance Services in Etawah | Go_Repireo',
    description: 'Browse local repair and maintenance services available in Etawah with upfront pricing and verified professionals.',
    url: 'https://gorepireo.in/services',
    siteName: 'Go_Repireo',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Doorstep Home Repair Services in Etawah | Go_Repireo',
    description: 'Book verified plumbers, electricians, AC technicians and carpenters in Etawah.',
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
