import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home Repair Shop & Spare Parts in Etawah',
  description: 'Shop genuine spare parts, electrical fittings, plumbing materials, and home repair tools from Go_Repireo in Etawah.',
  alternates: { canonical: 'https://gorepireo.in/shop' },
  openGraph: {
    title: 'Home Repair Shop & Spare Parts in Etawah | Go_Repireo',
    description: 'Genuine spare parts and home repair equipment delivered to your doorstep in Etawah.',
    url: 'https://gorepireo.in/shop',
    siteName: 'Go_Repireo',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
