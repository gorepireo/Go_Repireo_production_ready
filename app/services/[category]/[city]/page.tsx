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
  ArrowRight,
  Droplet,
  Wrench,
  Sparkles,
  Flame,
  Hammer
} from 'lucide-react';
import SchemaData from '@/components/SchemaData';
import Footer from '@/components/Footer';

interface CategoryCityPageProps {
  params: Promise<{ category: string; city: string }>;
}

function capitalize(str: string): string {
  return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export async function generateMetadata({ params }: CategoryCityPageProps): Promise<Metadata> {
  const { category, city } = await params;
  const categoryName = capitalize(category);
  const cityName = capitalize(city);

  const title = `Best ${categoryName} Services in ${cityName} | Doorstep ${categoryName} | Go_Repireo`;
  const description = `Book top-rated ${categoryName} professionals in ${cityName}. Verified technicians, transparent pricing, 30-day warranty, and same-day doorstep service.`;

  return {
    title,
    description,
    keywords: [
      `${categoryName} in ${cityName}`,
      `best ${categoryName} ${cityName}`,
      `doorstep ${categoryName} ${cityName}`,
      `emergency ${categoryName} ${cityName}`,
      `Go_Repireo ${cityName}`
    ],
    alternates: {
      canonical: `https://gorepireo.in/services/${category}/${city}`
    },
    openGraph: {
      title,
      description,
      url: `https://gorepireo.in/services/${category}/${city}`,
      siteName: 'Go_Repireo',
      type: 'website'
    }
  };
}

export default async function CategoryCityPage({ params }: CategoryCityPageProps) {
  const { category, city } = await params;
  const categoryName = capitalize(category);
  const cityName = capitalize(city);
  const pageUrl = `https://gorepireo.in/services/${category}/${city}`;

  const faqs = [
    { 
      question: `How fast can I get a ${categoryName} technician in ${cityName}?`, 
      answer: `Our verified technicians in ${cityName} are dispatched within 15 minutes of booking and arrive at your doorstep in 30 to 45 minutes.` 
    },
    { 
      question: `Are your ${categoryName} services in ${cityName} covered by warranty?`, 
      answer: `Yes, all ${categoryName} repair and maintenance work done in ${cityName} comes with a standard 30-day service warranty.` 
    },
    { 
      question: `What payment methods are accepted in ${cityName}?`, 
      answer: `You can choose Cash on Service (pay after completion) or online payments via Razorpay (UPI, Credit/Debit cards, NetBanking).` 
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-24">
      <SchemaData 
        title={`Best ${categoryName} Services in ${cityName}`}
        description={`Book doorstep ${categoryName} in ${cityName} with Go_Repireo.`}
        url={pageUrl}
        category={categoryName}
        city={cityName}
        minPrice={199}
        maxPrice={2499}
        ratingValue={4.9}
        reviewCount={1420}
        faqs={faqs}
      />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-[#e8f0fe] to-[#F8FAFC] pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-blue-100 shadow-sm">
            <ShieldCheck size={14} className="text-[#007AFF]" />
            <span className="text-[10px] font-extrabold text-[#007AFF] uppercase tracking-wider">Top Rated in {cityName}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Best {categoryName} Services in <span className="text-[#007AFF]">{cityName}</span>
          </h1>

          <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 flex-wrap">
            <div className="flex items-center gap-1 text-amber-500">
              <Star size={14} className="fill-current" />
              <span className="font-extrabold text-slate-900">4.9/5</span>
              <span className="text-slate-400">(1,420+ {cityName} customers)</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1 text-[#007AFF]">
              <MapPin size={14} />
              <span>Full {cityName} Coverage</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
            Book verified and background-checked {categoryName.toLowerCase()} experts in {cityName}. Instant online booking, live technician map tracking, transparent pricing, and 30-day service warranty.
          </p>

          <div className="pt-2 flex gap-3 flex-wrap">
            <Link 
              href="/services/service" 
              className="h-12 px-6 bg-[#007AFF] hover:bg-blue-600 text-white rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              Book {categoryName} in {cityName} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content & Features */}
      <section className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        
        {/* Features Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Why Go_Repireo for {categoryName} in {cityName}?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100/60">
              <CheckCircle2 size={16} className="text-[#007AFF] shrink-0 mt-0.5" />
              <span className="text-xs font-semibold text-slate-700">Verified & trained {categoryName.toLowerCase()} experts in {cityName}</span>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100/60">
              <CheckCircle2 size={16} className="text-[#007AFF] shrink-0 mt-0.5" />
              <span className="text-xs font-semibold text-slate-700">Upfront fixed rate pricing with zero hidden charges</span>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100/60">
              <CheckCircle2 size={16} className="text-[#007AFF] shrink-0 mt-0.5" />
              <span className="text-xs font-semibold text-slate-700">Real-time live map tracking of technician arrival</span>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100/60">
              <CheckCircle2 size={16} className="text-[#007AFF] shrink-0 mt-0.5" />
              <span className="text-xs font-semibold text-slate-700">30-day post-service quality & warranty guarantee</span>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Frequently Asked Questions ({cityName})</h2>
          <div className="space-y-3 divide-y divide-slate-100">
            {faqs.map((faq, idx) => (
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
