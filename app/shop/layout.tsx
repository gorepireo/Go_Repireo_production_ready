import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home Repair Shop',
  description: 'Browse home repair and maintenance products from Go_Repireo.',
  alternates: { canonical: '/shop' },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
