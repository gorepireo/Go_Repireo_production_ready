'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  ChevronLeft,
  Star,
  Clock,
  LayoutGrid
} from 'lucide-react';
import Link from 'next/link';

export default function ProductPage() {
  const [selectedSpec, setSelectedSpec] = useState('PRO');

  // Hardcoded for Alabaster Tactical demo
  const product = {
    name: 'Industrial PVC Pipe 4"',
    price: '1,250',
    category: 'PLUMBING HARDWARE',
    description: 'High-durability, lead-free PVC pipe designed for primary hydration networks and tactical irrigation setups.',
    specs: ['PRO', 'ELITE', 'SURVIVAL'],
    features: [
      { name: 'DIAMETER', value: '4.0 INCH' },
      { name: 'PRESSURE', value: '150 PSI' },
      { name: 'MATERIAL', value: 'HI-DENSITY' },
    ],
    profiles: { display_name: 'Mandi Sector' }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-12 space-y-12">
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/shop" className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm hover:shadow-xl transition-all">
             <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-black tracking-[0.4em] text-black/20 uppercase">In Stock</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Visual Presentation */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square bg-white rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] flex items-center justify-center p-20"
            >
               <Package className="w-full h-full text-black/5" />
            </motion.div>
            
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="aspect-square bg-white rounded-2xl shadow-sm flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity">
                   <Package className="w-6 h-6 text-black/20" />
                </div>
              ))}
            </div>
          </div>

          {/* Product Data */}
          <div className="space-y-10">
            <div className="space-y-4">
              <span className="tactile-label !text-[#007AFF] font-bold">{product.category}</span>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none italic">{product.name}</h1>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">{product.description}</p>
            </div>

            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <span className="tactile-label">Select Package Variant</span>
                  <span className="text-[10px] font-bold text-slate-300 uppercase">3 available</span>
               </div>
               <div className="flex gap-3">
                  {product.specs.map(spec => (
                    <button 
                      key={spec}
                      onClick={() => setSelectedSpec(spec)}
                      className={`flex-1 py-4 rounded-2xl tactile-label font-black transition-all ${selectedSpec === spec ? 'bg-black text-white' : 'bg-black/[0.02] text-slate-400 hover:bg-black/[0.05]'}`}
                    >
                      {spec}
                    </button>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6 shadow-[0_-1px_0_rgba(0,0,0,0.03)]">
               {product.features.map(f => (
                 <div key={f.name}>
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">{f.name}</p>
                    <p className="text-sm font-bold uppercase">{f.value}</p>
                 </div>
               ))}
            </div>

            <div className="pt-10 flex items-center gap-6">
               <div className="flex-1">
                  <p className="text-[10px] font-black text-black/20 uppercase tracking-widest leading-none mb-2">Protocol Cost</p>
                  <p className="text-5xl font-black italic tracking-tighter leading-none">₹{product.price}</p>
               </div>
               <Link href="/cart" className="btn-primary flex-1 h-20 !rounded-[2.5rem]">
                  PROVISION <ArrowRight size={20} />
               </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
