'use client';

import Navbar from '@/components/whatsapp/Navbar';
import Hero from '@/components/whatsapp/Hero';
import Services from '@/components/whatsapp/Services';
import HowItWorks from '@/components/whatsapp/HowItWorks';
import WhyUs from '@/components/whatsapp/WhyUs';
import Footer from '@/components/whatsapp/Footer';
import WhatsAppFloat from '@/components/whatsapp/WhatsAppFloat';
import { LanguageProvider } from '@/components/whatsapp/LanguageContext';

export default function WhatsAppPage() {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-[#ece9e2] text-[#201c18] font-sans antialiased pb-20 lg:pb-0">
        <Navbar />
        <Hero />
        <Services />
        <HowItWorks />
        <WhyUs />
        <Footer />
        <WhatsAppFloat />
      </div>
    </LanguageProvider>
  );
}
