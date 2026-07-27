import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import HowItWorks from './components/HowItWorks';
import WhyUs from './components/WhyUs';
import Footer from './components/Footer';
import WhatsAppFloat from './components/WhatsAppFloat';
import { LanguageProvider } from './LanguageContext';

export default function App() {
  return (
    <LanguageProvider>
      <Navbar />
      <Hero />
      <Services />
      <HowItWorks />
      <WhyUs />
      <Footer />
      <WhatsAppFloat />
    </LanguageProvider>
  );
}
