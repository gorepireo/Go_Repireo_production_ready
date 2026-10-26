'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function ProductPage() {
  const [selectedSpec, setSelectedSpec] = useState('PRO');

  // Hardcoded for Alabaster Tactical demo
  const product = {
    name: 'Industrial PVC Pipe 4"',
    price: '1,250',
    category: 'PLUMBING SUPPLY',
    description: 'Lead-free PVC pipe built for durable water flow, reliable irrigation, and long-term repairs.',
    specs: ['STANDARD', 'HEAVY DUTY', 'PREMIUM'],
    features: [
      { name: 'DIAMETER', value: '4.0 INCH' },
      { name: 'PRESSURE', value: '150 PSI' },
      { name: 'MATERIAL', value: 'HIGH-DENSITY' },
    ],
    profiles: { display_name: 'Mandi Supplier' }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 sm:pb-32">
      <div className="max-w-4xl mx-auto px-3 min-[375px]:px-4 md:px-6 pt-6 sm:pt-10 md:pt-12 space-y-8 sm:space-y-12">

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/shop" className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm hover:shadow-xl transition-all shrink-0">
             <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
             <span className="text-[9px] sm:text-[10px] font-black tracking-[0.22em] sm:tracking-[0.4em] text-black/20 uppercase whitespace-nowrap">Ready to Ship</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
          {/* Visual Presentation */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square bg-white rounded-[2rem] sm:rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] flex items-center justify-center p-10 min-[375px]:p-14 sm:p-20"
            >
               <Package className="w-full h-full text-black/5" />
            </motion.div>

            <div className="grid grid-cols-3 gap-2 min-[375px]:gap-3 sm:gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="aspect-square bg-white rounded-2xl shadow-sm flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity">
                   <Package className="w-6 h-6 text-black/20" />
                </div>
              ))}
            </div>
          </div>

          {/* Product Data */}
          <div className="space-y-8 sm:space-y-10 min-w-0">
            <div className="space-y-4">
              <span className="tactile-label !text-[#007AFF] font-bold">{product.category}</span>
              <h1 className="text-3xl min-[375px]:text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none italic break-words">{product.name}</h1>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">{product.description}</p>
            </div>

            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <span className="tactile-label">Choose a Variant</span>
                  <span className="text-[10px] font-bold text-slate-300 uppercase">3 options</span>
               </div>
               <div className="grid grid-cols-1 min-[340px]:grid-cols-3 gap-2 sm:gap-3">
                  {product.specs.map(spec => (
                    <button
                      key={spec}
                      onClick={() => setSelectedSpec(spec)}
                      className={`min-w-0 px-2 py-3 sm:py-4 rounded-xl sm:rounded-2xl tactile-label font-black transition-all ${selectedSpec === spec ? 'bg-black text-white' : 'bg-black/[0.02] text-slate-400 hover:bg-black/[0.05]'}`}
                    >
                      {spec}
                    </button>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-1 min-[340px]:grid-cols-3 gap-3 sm:gap-6 pt-6 shadow-[0_-1px_0_rgba(0,0,0,0.03)]">
               {product.features.map(f => (
                 <div key={f.name}>
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">{f.name}</p>
                    <p className="text-xs sm:text-sm font-bold uppercase break-words">{f.value}</p>
                 </div>
               ))}
            </div>

            <div className="pt-6 sm:pt-10 flex flex-col min-[390px]:flex-row min-[390px]:items-center gap-4 sm:gap-6">
               <div className="flex-1">
                  <p className="text-[10px] font-black text-black/20 uppercase tracking-widest leading-none mb-2">Product Price</p>
                  <p className="text-4xl sm:text-5xl font-black italic tracking-tighter leading-none">₹{product.price}</p>
               </div>
               <Link href="/cart" className="btn-primary w-full min-[390px]:flex-1 h-16 sm:h-20 !rounded-[2rem] sm:!rounded-[2.5rem]">
                  ADD TO CART <ArrowRight size={20} />
               </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
