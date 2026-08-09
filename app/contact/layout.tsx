import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Go_Repireo',
  description: 'Contact Go_Repireo customer support for home repair bookings and service assistance in Etawah.',
  alternates: { canonical: '/contact' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
