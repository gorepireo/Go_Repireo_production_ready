'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight,
  ShieldCheck,
  Package
} from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const [cart, setCart] = useState([
    { id: 1, name: 'High-Grip PVC Pipe', price: 1250, quantity: 4, image_url: null, category: 'Plumbing' },
    { id: 2, name: 'Insulated Copper Wire', price: 4800, quantity: 1, image_url: null, category: 'Electrical' },
  ]);

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-6 py-32 text-center space-y-10 group">
        <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center mx-auto shadow-inner scale-110 group-hover:scale-100 transition-all duration-700">
           <ShoppingBag className="w-16 h-16 text-black/5" />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic">Provision Log Empty.</h2>
          <p className="tactile-label !text-slate-400">No tactical assets currently staged for deployment.</p>
        </div>
        <Link href="/shop" className="btn-primary">
          Initialize Sourcing <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-12 space-y-12">
        
        {/* Header */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] skew-title">
            PROVISION <br />
            <span className="text-[#007AFF]">STAGING.</span>
          </h1>
          <p className="tactile-label !text-slate-400 tracking-[0.2em]">Deployment Readiness Verification</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="md:col-span-2 space-y-4">
            <AnimatePresence>
              {cart.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="king-card !p-4 flex items-center gap-4 group"
                >
                  <div className="w-20 h-20 bg-black/[0.02] rounded-2xl flex items-center justify-center shadow-inner shrink-0 scale-95 group-hover:scale-100 transition-transform">
                     <Package className="w-8 h-8 text-black/5 group-hover:text-[#007AFF]/20 transition-colors" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-base font-black uppercase tracking-tight">{item.name}</h4>
                        <p className="tactile-label !text-[9px] !text-slate-400">{item.category}</p>
                      </div>
                      <span className="text-lg font-black italic">₹{item.price}</span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1 bg-black/[0.02] p-1 rounded-xl shadow-inner">
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white transition-all shadow-xs"><Minus size={14} /></button>
                        <span className="w-10 text-center text-xs font-bold">{item.quantity}</span>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white transition-all shadow-xs"><Plus size={14} /></button>
                      </div>
                      <button className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div className="space-y-6">
            <div className="king-card !bg-black text-white !p-8">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-10 block">System Summary</span>
                <div className="space-y-4 mb-10">
                  <div className="flex justify-between items-center opacity-50">
                    <span className="tactile-label !text-white">Subtotal</span>
                    <span className="text-sm font-bold">₹{total}</span>
                  </div>
                  <div className="flex justify-between items-center opacity-50">
                    <span className="tactile-label !text-white">Logistics</span>
                    <span className="text-sm font-bold">STAGINGED</span>
                  </div>
                </div>
                
                <div className="pt-8 shadow-[0_-1px_0_rgba(255,255,255,0.1)] flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="tactile-label !text-white/40">Total Billed</span>
                    <h3 className="text-4xl font-black italic tracking-tighter leading-none">₹{total}</h3>
                  </div>
                </div>
            </div>
            
            <button className="btn-primary w-full py-8 !rounded-[2.5rem] shadow-2xl shadow-[#007AFF]/30">
               CONFIRM DEPLOY <ShieldCheck size={24} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
