import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { 
  ShieldCheck, 
  MapPin, 
  Star, 
  Zap, 
  CheckCircle2, 
  ChevronRight, 
  Clock, 
  Headphones, 
  Wrench, 
  Droplet, 
  Sparkles, 
  Flame,
  ArrowRight
} from 'lucide-react';
import SchemaData from '@/components/SchemaData';
import Footer from '@/components/Footer';

interface ServicePageProps {
  params: Promise<{ service: string }>;
}

const serviceCatalog: Record<string, {
  name: string;
  category: string;
  heroImg: string;
  startingPrice: number;
  avgRating: number;
  reviewsCount: number;
  description: string;
  features: string[];
  faqs: { question: string; answer: string }[];
}> = {
  'electrician-near-me': {
    name: 'Electrician Near Me',
    category: 'electrical',
    heroImg: 'https://images.unsplash.com/photo-1621905252507-b3523c44dbf4?auto=format&fit=crop&q=80&w=600',
    startingPrice: 199,
    avgRating: 4.9,
    reviewsCount: 3420,
    description: 'Book certified doorstep electricians near you within 15 minutes. From switch replacement, MCB repair, short circuit fixes to complete house wiring.',
    features: [
      'Background-verified certified electricians',
      '100% upfront transparent pricing & no hidden charges',
      '30-day post-service warranty',
      'Same-day emergency doorstep repair'
    ],
    faqs: [
      { question: 'How quickly can an electrician arrive at my location?', answer: 'Our verified electricians arrive within 30 to 45 minutes of booking confirmation.' },
      { question: 'What is the basic inspection fee?', answer: 'Basic inspection starts at ₹99, which is waived off if you proceed with the repair service.' },
      { question: 'Are all electrical services covered under warranty?', answer: 'Yes, all electrical repair & installation work comes with a 30-day service guarantee.' }
    ]
  },
  'plumber-near-me': {
    name: 'Plumber Near Me',
    category: 'plumbing',
    heroImg: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600',
    startingPrice: 249,
    avgRating: 4.8,
    reviewsCount: 2980,
    description: 'Find top-rated local plumbers near you. Fast doorstep fixing for pipe leaks, tap repair, water tank cleaning, toilet fitting & drain blockage.',
    features: [
      'Expert plumbers with professional toolkits',
      'Leakage detection & quick fitting solutions',
      'Clean & hygienic post-service clean up',
      'Emergency 24x7 doorstep support'
    ],
    faqs: [
      { question: 'Do plumbers bring their own spare parts?', answer: 'Yes, technicians carry genuine standard spare parts. You are billed transparently for any materials used.' },
      { question: 'How do you handle emergency pipe bursts or leaks?', answer: 'Our instant dispatch assigns the closest plumber within a 15km radius immediately.' }
    ]
  },
  'ac-service-near-me': {
    name: 'AC Service & Repair Near Me',
    category: 'repair',
    heroImg: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600',
    startingPrice: 499,
    avgRating: 4.9,
    reviewsCount: 5120,
    description: 'Book expert AC service, wet jet cleaning, gas refilling, & split/window AC installation near you. Energy efficient cooling guaranteed.',
    features: [
      'High-pressure foam & jet wet cleaning',
      'Genuine gas charging (R22, R32, R410A)',
      'Compressor, PCB & cooling coil diagnostics',
      '30-day AC cooling guarantee'
    ],
    faqs: [
      { question: 'What is included in AC jet servicing?', answer: 'Deep foam jet wash of indoor cooling coils, outdoor condenser unit, filter cleaning, and pressure check.' },
      { question: 'Do you provide gas leak detection and refilling?', answer: 'Yes, complete gas leak testing and eco-friendly gas refilling are included with pressure test.' }
    ]
  },
  'washing-machine-repair-near-me': {
    name: 'Washing Machine Repair Near Me',
    category: 'repair',
    heroImg: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=600',
    startingPrice: 299,
    avgRating: 4.8,
    reviewsCount: 1840,
    description: 'Top-rated washing machine repair for front load, top load & semi-automatic machines near you. Samsung, LG, Whirlpool, Bosch & IFB experts.',
    features: [
      'Drum repair, motor replace & PCB repair',
      'Drain pump & water inlet valve fix',
      'Genuine OEM spare parts with warranty',
      'Doorstep diagnostic within 60 minutes'
    ],
    faqs: [
      { question: 'Which washing machine brands do you service?', answer: 'We service all major brands including LG, Samsung, Whirlpool, Bosch, IFB, Godrej, and Panasonic.' }
    ]
  },
  'bathroom-cleaning-near-me': {
    name: 'Bathroom Cleaning Services Near Me',
    category: 'cleaning',
    heroImg: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600',
    startingPrice: 399,
    avgRating: 4.9,
    reviewsCount: 4210,
    description: 'Deep bathroom cleaning services near you. Hard water stain removal, tile descaling, sanitizer spray, mirror polishing & toilet scrubbing.',
    features: [
      'Hospital-grade eco-friendly disinfectant chemicals',
      'Tile joint scrubbing & hard water stain removal',
      'Tap & chrome fitting polishing',
      'Odour removal & sanitization guarantee'
    ],
    faqs: [
      { question: 'How long does a deep bathroom cleaning take?', answer: 'A single bathroom deep cleaning takes approximately 60 to 90 minutes.' }
    ]
  }
};

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { service } = await params;
  const item = serviceCatalog[service] || {
    name: service.replace(/-/g, ' ').toUpperCase(),
    description: `Book trusted ${service.replace(/-/g, ' ')} home services near you with Go_Repireo.`
  };

  return {
    title: `${item.name} | Book Online at Go_Repireo`,
    description: item.description,
    keywords: [item.name, `${service} online booking`, `${service} cost`, `${service} price list`, `Go_Repireo ${item.name}`],
    alternates: {
      canonical: `https://gorepireo.in/near-me/${service}`
    },
    openGraph: {
      title: `${item.name} | Go_Repireo`,
      description: item.description,
      url: `https://gorepireo.in/near-me/${service}`,
      siteName: 'Go_Repireo',
      type: 'website'
    }
  };
}

export default async function NearMeServicePage({ params }: ServicePageProps) {
  const { service } = await params;
  const item = serviceCatalog[service] || {
    name: service.replace(/-/g, ' ').toUpperCase(),
    category: 'service',
    heroImg: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600',
    startingPrice: 199,
    avgRating: 4.8,
    reviewsCount: 1500,
    description: `Book doorstep ${service.replace(/-/g, ' ')} with verified experts near you. Transparent pricing, fast service, and 30-day warranty.`,
    features: [
      'Background-verified professional technicians',
      'Transparent pricing & zero hidden charges',
      '30-day post-service guarantee',
      'Fast doorstep response within 15km'
    ],
    faqs: [
      { question: `How do I book ${service.replace(/-/g, ' ')}?`, answer: 'Select your service category, describe your issue, select your address, and choose cash or online payment.' }
    ]
  };

  const pageUrl = `https://gorepireo.in/near-me/${service}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-24">
      <SchemaData 
        title={item.name}
        description={item.description}
        url={pageUrl}
        category={item.category}
        minPrice={item.startingPrice}
        maxPrice={item.startingPrice * 5}
        ratingValue={item.avgRating}
        reviewCount={item.reviewsCount}
        faqs={item.faqs}
      />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-[#e8f0fe] to-[#F8FAFC] pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-blue-100 shadow-sm">
            <ShieldCheck size={14} className="text-[#007AFF]" />
            <span className="text-[10px] font-extrabold text-[#007AFF] uppercase tracking-wider">Verified Local Technicians</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {item.name}
          </h1>

          <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 flex-wrap">
            <div className="flex items-center gap-1 text-amber-500">
              <Star size={14} className="fill-current" />
              <span className="font-extrabold text-slate-900">{item.avgRating}</span>
              <span className="text-slate-400">({item.reviewsCount} reviews)</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1 text-[#007AFF]">
              <MapPin size={14} />
              <span>Available in your 15km Radius</span>
            </div>
            <span>•</span>
            <div className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              Starts @ ₹{item.startingPrice}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
            {item.description}
          </p>

          <div className="pt-2 flex gap-3 flex-wrap">
            <Link 
              href="/services/service" 
              className="h-12 px-6 bg-[#007AFF] hover:bg-blue-600 text-white rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              Book Service Now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content & Features */}
      <section className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        
        {/* Features Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Why Choose Go_Repireo for {item.name}?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {item.features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100/60">
                <CheckCircle2 size={16} className="text-[#007AFF] shrink-0 mt-0.5" />
                <span className="text-xs font-semibold text-slate-700">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Frequently Asked Questions</h2>
          <div className="space-y-3 divide-y divide-slate-100">
            {item.faqs.map((faq, idx) => (
              <div key={idx} className="pt-3 first:pt-0 space-y-1">
                <h3 className="text-xs font-bold text-slate-900">{faq.question}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

      </section>

      <Footer />
    </div>
  );
}
