import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { CallProvider } from "@/context/CallContext";
import WebRTCCallModal from "@/components/WebRTCCallModal";
import LayoutWrapper from "@/components/LayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://gorepireo.in"),
  title: {
    default: "Home Repair Services in Etawah | Go_Repireo",
    template: "%s | Go_Repireo"
  },
  description: "Book plumbers, electricians, AC technicians and appliance repair professionals in Etawah. Get transparent pricing, doorstep service and live tracking.",
  keywords: [
    "Go Repireo", "Go_Repireo", "GoRepireo", "Repireo", "GoRepireo.in",
    "Go-Repireo", "go repireo", "go_repireo", "gorepireo",
    "Go Repiero", "Go Repiro", "Go Reperio", "Go Repario", "Go Repairio",
    "Plumber in Etawah", "Electrician in Etawah", "AC Repair in Etawah",
    "Appliance Repair in Etawah", "Cleaning Services in Etawah",
    "Home Services Near Me", "Plumber Near Me", "Electrician Near Me"
  ],
  authors: [{ name: "Go_Repireo" }],
  creator: "Go_Repireo",
  publisher: "Go_Repireo Technologies",
  category: "Home Services",
  applicationName: "Go_Repireo",
  openGraph: {
    title: "Home Repair Services in Etawah | Go_Repireo",
    description: "Go_Repireo is Etawah's on-demand home services platform. Book verified plumbers, electricians, AC technicians, and appliance repair experts with live tracking and secure UPI payments.",
    url: "https://gorepireo.in",
    siteName: "Go_Repireo",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://gorepireo.in/icon.png",
        width: 512,
        height: 512,
        alt: "Go_Repireo - Verified Home Services",
      }
    ],
  },
  twitter: {
    card: "summary",
    title: "Go_Repireo - Etawah's Trusted Home Services",
    description: "Book verified plumbers, electricians, AC technicians, and appliance repair experts in Etawah with live technician tracking and secure UPI payments.",
    images: ["https://gorepireo.in/icon.png"],
  },
  alternates: {
    canonical: "https://gorepireo.in",
  },
  icons: {
    icon: [
      { url: "/logo.png?v=2", type: "image/png" },
      { url: "/favicon.ico?v=2" }
    ],
    shortcut: "/logo.png?v=2",
    apple: "/logo.png?v=2",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" style={{ colorScheme: 'light' }} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/logo.png?v=2" />
        <link rel="shortcut icon" href="/logo.png?v=2" />
        <link rel="apple-touch-icon" href="/logo.png?v=2" />
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#FFFFFF" />
        <style suppressHydrationWarning dangerouslySetInnerHTML={{
          __html: `
          :root { color-scheme: light !important; }
          html, body { 
            background-color: #FFFFFF !important; 
            color: #0F172A !important;
            margin: 0;
            padding: 0;
          }
          #root-container { background-color: #FFFFFF !important; }
        ` }} />
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              '@id': 'https://gorepireo.in/#organization',
              'name': 'Go_Repireo',
              'alternateName': ['GoRepireo', 'Go Repireo', 'Repireo', 'Go_Repireo Technologies', 'gorepireo'],
              'url': 'https://gorepireo.in',
              'logo': {
                '@type': 'ImageObject',
                'url': 'https://gorepireo.in/icon.png',
                'width': 512,
                'height': 512
              },
              'image': 'https://gorepireo.in/icon.png',
              'description': 'Go_Repireo is Etawah\'s trusted on-demand home services marketplace. We connect customers with verified plumbers, electricians, AC technicians, and appliance repair experts with live tracking and secure payments.',
              'telephone': '+91-8679245568',
              'email': 'support@gorepireo.com',
              'foundingDate': '2025',
              'areaServed': {
                '@type': 'City',
                'name': 'Etawah',
                'addressRegion': 'Uttar Pradesh',
                'addressCountry': 'IN'
              },
              'sameAs': []
            })
          }}
        />
        {/* WebSite Schema */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              '@id': 'https://gorepireo.in/#website',
              'name': 'Go_Repireo',
              'alternateName': ['GoRepireo', 'Go Repireo', 'Repireo'],
              'url': 'https://gorepireo.in',
              'description': 'Book verified home services - plumber, electrician, AC repair, appliance repair, cleaning in Etawah',
              'publisher': {
                '@id': 'https://gorepireo.in/#organization'
              },
              'inLanguage': ['en-IN', 'hi-IN']
            })
          }}
        />
        {/* LocalBusiness Schema */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              '@id': 'https://gorepireo.in/#localbusiness',
              'name': 'Go_Repireo',
              'image': 'https://gorepireo.in/icon.png',
              'telephone': '+91-8679245568',
              'email': 'support@gorepireo.com',
              'url': 'https://gorepireo.in',
              'priceRange': '₹99 - ₹4999',
              'currenciesAccepted': 'INR',
              'paymentAccepted': 'Cash, UPI, Credit Card, Debit Card, Net Banking',
              'address': {
                '@type': 'PostalAddress',
                'streetAddress': 'Etawah',
                'addressLocality': 'Etawah',
                'addressRegion': 'Uttar Pradesh',
                'postalCode': '206001',
                'addressCountry': 'IN'
              },
              'geo': {
                '@type': 'GeoCoordinates',
                'latitude': 26.7773,
                'longitude': 79.0208
              },
              'openingHoursSpecification': {
                '@type': 'OpeningHoursSpecification',
                'dayOfWeek': ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
                'opens': '07:00',
                'closes': '21:00'
              },
              'serviceArea': {
                '@type': 'City',
                'name': 'Etawah'
              },
              'hasOfferCatalog': {
                '@type': 'OfferCatalog',
                'name': 'Go_Repireo Home Services',
                'itemListElement': [
                  { '@type': 'Offer', 'itemOffered': { '@type': 'Service', 'name': 'Plumbing Services' } },
                  { '@type': 'Offer', 'itemOffered': { '@type': 'Service', 'name': 'Electrical Services' } },
                  { '@type': 'Offer', 'itemOffered': { '@type': 'Service', 'name': 'AC Repair & Service' } },
                  { '@type': 'Offer', 'itemOffered': { '@type': 'Service', 'name': 'Appliance Repair' } },
                  { '@type': 'Offer', 'itemOffered': { '@type': 'Service', 'name': 'Deep Cleaning' } },
                  { '@type': 'Offer', 'itemOffered': { '@type': 'Service', 'name': 'Carpentry & Painting' } }
                ]
              }
            })
          }}
        />
      </head>
      <body className={`${inter.className} bg-white text-slate-950`} data-deploy-v="REPIREO-ALPHA-1.2" suppressHydrationWarning>
        <AuthProvider>
          <CartProvider>
            <CallProvider>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
              <WebRTCCallModal />
            </CallProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
