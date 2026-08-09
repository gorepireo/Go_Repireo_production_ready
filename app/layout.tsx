import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
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
    // ─── Brand: Correct & Primary ───
    "Go Repireo", "Go_Repireo", "GoRepireo", "Repireo", "GoRepireo.in",
    "Go-Repireo", "go repireo", "go_repireo", "gorepireo",

    // ─── Brand: Phonetic & Pronunciation Misspellings ───
    "Go Repiero", "Go Repiro", "Go Reperio", "Go Repario", "Go Repairio",
    "Go Repairo", "Go Repareo", "Go Repereo", "Go Repaireo", "Go Repair EO",
    "Go Repair O", "Go Reparyo", "Go Repairyo",
    "Repiero", "Repiro", "Reperio", "Repario", "Repaireo", "Repairio",
    "Repairo", "Repareo", "Repereo",
    "GoRepiero", "GoRepiro", "GoReperio", "GoRepario", "GoRepairio",
    "GoRepairo", "GoRepareo", "GoRepereo", "GoRepaireo",

    // ─── Brand: Mobile Typing / Fat-Finger Mistakes ───
    "Go Tepireo", "Go Eepireo", "Go Repiteo", "Go Repirro", "Go Repirwo",
    "Go Repirep", "Go Repirei", "Gp Repireo", "Go Reporeo", "Go Repureo",
    "Go Repirew", "Gi Repireo", "Gu Repireo", "Fo Repireo", "Ho Repireo",
    "gorepire", "gorepiro", "gorpeireo", "gorepeiro", "gorpiero",
    "gorepari", "gorepraio", "groepireo", "gprepireo", "gorepirep",
    "gotepireo", "gorepirew", "girepireo", "gurepireo", "gorepirei",
    "gorepireu", "ogrepireo",

    // ─── Brand: OCR & Visual Confusion ───
    "Co Repireo", "G0 Repireo", "Go Rep1reo", "Go Replreo", "Go Repire0",

    // ─── Brand: Double Misspellings & Extreme Typos ───
    "GoReapiero", "GoRapireo", "GoRapeiro", "GoRepari", "GoRepire",
    "Goripireo", "Goreperio", "Goripereo", "Gorepereo", "Gorapero",
    "Goropireo", "Gopireo", "Go riperio", "Go ripario", "Go ripireo",
    "Goo repireo", "Go rpeireo", "Grepireo",

    // ─── Brand: Domain & URL Variations ───
    "gorepireo.in", "gorepireo.com", "gorepireo.co.in",
    "www.gorepireo.in", "go-repireo.in", "go_repireo.in", "repireo.in",
    "go repireo in", "go repireo website",

    // ─── Brand: Regional / Hinglish ───
    "Go repireo wala", "Go repair wala", "Go repireo mistri",
    "Go repair mistri", "Repireo mistri", "Go repari service",
    "Etawah go repireo", "Go repireo etawah app",

    // ─── Brand: With Service Intent ───
    "Go Repireo app", "Go Repireo app download", "Go Repireo customer care",
    "Go Repireo Etawah", "Go Repireo number", "Go Repireo contact",
    "Go Repireo booking", "Go Repireo login", "Go Repireo online",
    "Go Repireo service", "Go Repireo services", "Go Repireo home service",
    "Go Repireo home repair", "Go Repireo plumber", "Go Repireo electrician",
    "Go Repireo AC repair", "Go Repireo near me",
    "Repireo home service", "Repireo app", "Repireo booking",
    "GoRepireo India", "Go Repireo India", "Repireo India",
    "GoRepireo Home Services", "GoRepireo Home Repair",

    // ─── Services: Core ───
    "Home Services", "Home Repair", "Home Maintenance", "Professional Home Services",
    "Doorstep Services", "Book Home Services", "Online Home Services", "Verified Professionals",
    "Verified Workers", "Verified Technicians", "Trusted Home Services", "Home Service Marketplace",
    "Home Repair Marketplace", "Emergency Home Services", "Emergency Repair", "Instant Home Service",
    "Same Day Home Service", "House Repair", "Residential Repair", "Commercial Repair",

    // ─── Services: Plumbing ───
    "Plumber", "Plumber Near Me", "Best Plumber", "Emergency Plumber", "24 Hour Plumber",
    "Plumbing Services", "Pipe Repair", "Leak Repair", "Tap Repair", "Bathroom Repair",
    "Kitchen Plumbing", "Drain Cleaning", "Water Tank Cleaning", "Motor Repair",
    "Water Pump Repair", "Toilet Repair", "Wash Basin Repair", "Bathroom Installation",

    // ─── Services: Electrical ───
    "Electrician", "Electrician Near Me", "Best Electrician", "Electrical Repair",
    "House Wiring", "Switch Repair", "MCB Repair", "Power Failure", "Fan Installation",
    "Light Installation", "LED Installation", "Ceiling Fan Repair",

    // ─── Services: AC & HVAC ───
    "AC Repair", "AC Service", "AC Installation", "AC Gas Filling",
    "Split AC Repair", "Window AC Repair", "AC Cleaning", "HVAC Service", "Air Conditioner Repair",

    // ─── Services: Appliance Repair ───
    "Appliance Repair", "Refrigerator Repair", "Fridge Repair", "Washing Machine Repair",
    "Microwave Repair", "TV Repair", "RO Repair", "Water Purifier Repair", "Geyser Repair",
    "Mixer Repair", "Induction Repair", "Chimney Repair",

    // ─── Services: Cleaning ───
    "Deep Cleaning", "House Cleaning", "Bathroom Cleaning", "Kitchen Cleaning", "Sofa Cleaning",
    "Carpet Cleaning", "Office Cleaning", "Move Out Cleaning", "Move In Cleaning",

    // ─── Services: Carpentry & Painting ───
    "Carpenter", "Furniture Repair", "Furniture Assembly", "Door Repair", "Window Repair",
    "Modular Furniture", "Painter", "House Painting", "Wall Painting", "Interior Painting",
    "Exterior Painting", "False Ceiling", "POP Work", "Waterproofing",

    // ─── Services: Pest Control & Security ───
    "Pest Control", "Termite Treatment", "Mosquito Control", "Cockroach Control",
    "CCTV Installation", "Security Camera", "Door Lock Installation", "Smart Home",
    "WiFi Installation", "Router Setup", "Internet Technician",

    // ─── Services: Tech & Others ───
    "Computer Repair", "Laptop Repair", "Mobile Repair", "Solar Installation",
    "EV Charger Installation", "Handyman", "Home Improvement", "Home Renovation",
    "Maintenance Services", "Repair Services", "Installation Services", "Home Inspection",

    // ─── Location: Etawah ───
    "Best Home Services in Etawah", "Plumber in Etawah", "Electrician in Etawah",
    "AC Repair in Etawah", "Appliance Repair in Etawah", "Cleaning Services in Etawah",
    "Carpenter in Etawah", "Painter in Etawah", "Home Repair in Etawah",
    "Emergency Plumber Etawah", "Emergency Electrician Etawah", "Best AC Service Etawah",
    "Best Home Repair Etawah",

    // ─── Location: Near Me ───
    "Home Services Near Me", "Plumber Near Me", "Electrician Near Me", "AC Repair Near Me",
    "Cleaning Near Me", "Appliance Repair Near Me", "Emergency Home Repair Near Me",

    // ─── Booking & Platform ───
    "Book Plumber Online", "Book Electrician Online", "Book AC Service Online",
    "Book Home Repair Online", "Affordable Home Repair", "Trusted Home Service Provider",
    "Local Home Services", "Nearby Home Services", "Affordable Home Services",
    "Trusted Repair Service", "Verified Service Provider", "Professional Technician",
    "Book Technician", "Online Booking", "Live Tracking", "Live Technician Tracking",
    "Real Time Tracking", "Secure Payments", "UPI Payment", "Razorpay", "Stripe",
    "Cash On Delivery", "Doorstep Repair", "Instant Booking", "Fast Service",
    "Reliable Service", "Quality Service", "Customer Support", "24x7 Support",
    "India Home Services", "Indian Home Repair", "Best Home Service App",
    "Home Service Website", "Uber for Home Repairs", "Urban Company Alternative",
    "Local Technician Booking", "Nearby Verified Workers"
  ],
  authors: [{ name: "Go_Repireo" }],
  creator: "Go_Repireo",
  publisher: "Go_Repireo Technologies",
  category: "Home Services",
  classification: "Home Services Marketplace",
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
    <html lang="en" data-theme="light" style={{ colorScheme: 'light' }}>
      <head>
        <link rel="icon" type="image/png" href="/logo.png?v=2" />
        <link rel="shortcut icon" href="/logo.png?v=2" />
        <link rel="apple-touch-icon" href="/logo.png?v=2" />
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#FFFFFF" />
        <style dangerouslySetInnerHTML={{
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
        {/* Organization Schema - Teaches Google our brand identity */}
        <script
          type="application/ld+json"
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
              'contactPoint': {
                '@type': 'ContactPoint',
                'telephone': '+91-8679245568',
                'contactType': 'customer service',
                'availableLanguage': ['English', 'Hindi']
              },
              'sameAs': []
            })
          }}
        />
        {/* WebSite Schema - Enables Google Sitelinks Search Box */}
        <script
          type="application/ld+json"
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
        {/* LocalBusiness Schema - Boosts local search relevance */}
        <script
          type="application/ld+json"
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
      <body className={`${inter.className} bg-white text-slate-950`} data-deploy-v="REPIREO-ALPHA-1.2">
        <AuthProvider>
          <CartProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
