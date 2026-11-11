import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Customer Support & Helpline in Etawah',
  description: 'Need help with home repair booking in Etawah? Contact Go_Repireo customer support at +91 8679245568 or email support@gorepireo.com for fast assistance.',
  alternates: { canonical: 'https://gorepireo.in/contact' },
  openGraph: {
    title: 'Contact Go_Repireo | Etawah Customer Support & Helpline',
    description: 'Get in touch with Go_Repireo support team for booking status, technician queries, or service guarantees in Etawah.',
    url: 'https://gorepireo.in/contact',
    siteName: 'Go_Repireo',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Contact Go_Repireo Customer Support',
    description: 'Call +91 8679245568 or email support@gorepireo.com for doorstep service assistance in Etawah.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
