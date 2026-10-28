import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { CartProvider } from "@/context/CartContext";
import { CallProvider } from "@/context/CallContext";
import WebRTCCallModal from "@/components/WebRTCCallModal";
import LayoutWrapper from "@/components/LayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://gorepireo.in"),
  title: {
    default: "Go_Repireo (GoRepireo) | Home Repair Services in Etawah",
    template: "%s | Go_Repireo"
  },
  description: "Go_Repireo (GoRepireo / gorepireo.in) is Etawah's #1 on-demand home repair and appliance services platform. Book verified plumbers, electricians, AC technicians, appliance repair, and cleaning experts with live technician tracking, upfront pricing, and 30-day warranty.",
  keywords: [
    "gorepireo", "GoRepireo", "Go_Repireo", "Go Repireo", "Repireo", "gorepireo.in",
    "GoRepireo.in", "Go-Repireo", "go repireo", "go_repireo",
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
    title: "Go_Repireo (GoRepireo) | Home Repair & Appliance Services in Etawah",
    description: "Go_Repireo (gorepireo.in / gorepireo) is Etawah's on-demand home services platform. Book verified plumbers, electricians, AC technicians, and appliance repair experts with live tracking and secure UPI payments.",
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
              'alternateName': ['GoRepireo', 'gorepireo', 'Go Repireo', 'Repireo', 'gorepireo.in', 'Go_Repireo Technologies'],
              'url': 'https://gorepireo.in',
              'logo': {
                '@type': 'ImageObject',
                'url': 'https://gorepireo.in/icon.png',
                'width': 512,
                'height': 512
              },
              'image': 'https://gorepireo.in/icon.png',
              'description': 'Go_Repireo (GoRepireo / gorepireo.in) is Etawah\'s trusted on-demand home services marketplace. We connect customers with verified plumbers, electricians, AC technicians, and appliance repair experts with live tracking and secure payments.',
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
              'alternateName': ['GoRepireo', 'gorepireo', 'Go Repireo', 'Repireo', 'gorepireo.in'],
              'url': 'https://gorepireo.in',
              'description': 'Go_Repireo (GoRepireo / gorepireo.in) - Verified home services, plumber, electrician, AC repair, appliance repair, and cleaning in Etawah',
              'publisher': {
                '@id': 'https://gorepireo.in/#organization'
              },
              'potentialAction': {
                '@type': 'SearchAction',
                'target': {
                  '@type': 'EntryPoint',
                  'urlTemplate': 'https://gorepireo.in/services?q={search_term_string}'
                },
                'query-input': 'required name=search_term_string'
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
              'alternateName': ['GoRepireo', 'gorepireo', 'Go Repireo', 'Repireo', 'gorepireo.in'],
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
        {/* SiteNavigationElement Schema for Urban Company style Sitelinks */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'SiteNavigationElement',
                  'name': 'AC Service & Repair',
                  'url': 'https://gorepireo.in/near-me/ac-service-near-me',
                  'description': 'Doorstep AC repair, gas filling & filter cleaning'
                },
                {
                  '@type': 'SiteNavigationElement',
                  'name': 'Electrician Services',
                  'url': 'https://gorepireo.in/near-me/electrician-near-me',
                  'description': 'Verified doorstep electricians in Etawah'
                },
                {
                  '@type': 'SiteNavigationElement',
                  'name': 'Plumbing Services',
                  'url': 'https://gorepireo.in/near-me/plumber-near-me',
                  'description': 'Fast pipe, tap, leakage & bathroom plumbing fixes'
                },
                {
                  '@type': 'SiteNavigationElement',
                  'name': 'Appliance Repair',
                  'url': 'https://gorepireo.in/near-me/washing-machine-repair-near-me',
                  'description': 'Washing machine, refrigerator & microwave repair'
                },
                {
                  '@type': 'SiteNavigationElement',
                  'name': 'Deep Cleaning Services',
                  'url': 'https://gorepireo.in/near-me/deep-cleaning-near-me',
                  'description': 'Full house, kitchen & bathroom deep sanitization'
                },
                {
                  '@type': 'SiteNavigationElement',
                  'name': 'Live Technician Tracking',
                  'url': 'https://gorepireo.in/track',
                  'description': 'Track your assigned professional arrival on map'
                }
              ]
            })
          }}
        />
        {/* Brand FAQPage Schema for Rich Search Accordions */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              'mainEntity': [
                {
                  '@type': 'Question',
                  'name': 'What is Go_Repireo and how does it work?',
                  'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': 'Go_Repireo is an on-demand doorstep home services platform in Etawah. You can select your required service (plumbing, electrical, AC, cleaning, appliance repair), get an instant price estimate, and have a background-verified technician dispatched to your home with real-time map tracking.'
                  }
                },
                {
                  '@type': 'Question',
                  'name': 'How fast can a technician arrive at my doorstep?',
                  'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': 'For emergency immediate bookings, a verified technician typically arrives in 30 to 45 minutes across Etawah. You can also schedule bookings for your preferred date and time slot.'
                  }
                },
                {
                  '@type': 'Question',
                  'name': 'Are Go_Repireo technicians verified and trusted?',
                  'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': 'Yes, all technicians on Go_Repireo undergo strict identity verification, background checks, and professional skills vetting before taking service orders.'
                  }
                },
                {
                  '@type': 'Question',
                  'name': 'Is there a warranty on services provided?',
                  'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': 'Yes, Go_Repireo provides a 30-day post-service warranty on all repair and installation services. If any issue reoccurs within 30 days, we revisit and resolve it at no extra charge.'
                  }
                },
                {
                  '@type': 'Question',
                  'name': 'What payment options are supported?',
                  'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': 'We support Cash on Delivery (pay after service completion) as well as secure online payments via UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, and Net Banking.'
                  }
                }
              ]
            })
          }}
        />
      </head>
      <body className={`${inter.className} bg-white text-slate-950`} data-deploy-v="REPIREO-ALPHA-1.2" suppressHydrationWarning>
        <ToastProvider>
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
        </ToastProvider>
      </body>
    </html>
  );
}
