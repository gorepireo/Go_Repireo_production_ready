'use client';

import { 
  ChevronRight, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Wrench,
  Clock,
  Headphones,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { useState } from 'react';
import Script from 'next/script';

const avatars = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150'
];

const features = [
  { title: 'SECURE BOOKING', desc: '100% safe and reliable', icon: ShieldCheck, color: 'text-blue-500' },
  { title: 'VERIFIED EXPERTS', desc: 'Background checked professionals', icon: UserCheck, color: 'text-blue-500' },
  { title: 'LIVE SUPPORT', desc: "We're here to help anytime", icon: Headphones, color: 'text-blue-500' },
  { title: 'SERVICE GUARANTEE', desc: 'Satisfaction guaranteed', icon: ShieldCheck, color: 'text-green-500' },
];

export default function ServicesPage() {
  const [testLoading, setTestLoading] = useState(false);

  const handleOneRupeeTestPayment = async () => {
    setTestLoading(true);
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 100, currency: 'INR', receipt: `test_rcpt_${Date.now()}` })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create test order');

      const options = {
        key: 'rzp_test_TMXeXqbhAyurNL',
        amount: data.amount || 100,
        currency: data.currency || 'INR',
        name: 'Go_Repireo Test',
        description: '₹1 Test Payment (No DB Storage)',
        order_id: data.order_id || data.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              alert(`🎉 ₹1 Test Payment Verified Successfully!\n\nPayment ID: ${response.razorpay_payment_id}\nOrder ID: ${response.razorpay_order_id}\n\n(No database record was created)`);
            } else {
              alert(`❌ Signature Verification Failed: ${verifyData.error}`);
            }
          } catch (vErr: any) {
            alert(`Verification Error: ${vErr.message}`);
          }
        },
        prefill: {
          name: 'Test Customer',
          email: 'support@gorepireo.com',
          contact: '8679245568'
        },
        theme: {
          color: '#007AFF'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

      rzp.on('payment.failed', function (response: any) {
        alert("Payment Failed: " + (response.error?.description || 'Cancelled'));
      });
    } catch (err: any) {
      alert("Error initializing test payment: " + err.message);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="flex flex-col min-h-screen bg-[#F8FAFC] pb-32 pt-6">
      
      {/* Hero Section */}
      <section className="px-4">
        <div className="relative bg-gradient-to-br from-[#e8f0fe] to-[#d6e4ff] rounded-3xl p-6 overflow-hidden min-h-[340px] flex items-center justify-between shadow-sm">
          <div className="relative z-10 space-y-3.5 max-w-[58%] sm:max-w-[62%]">
            <div className="inline-flex items-center gap-1.5 bg-blue-100/50 backdrop-blur-sm px-3 py-1 rounded-full text-[#007AFF] border border-blue-200">
              <ShieldCheck size={12} className="fill-current text-[#007AFF]" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Verified & Trusted</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-[0.95] tracking-tight text-[#0A1629]">
              CHOOSE YOUR<br />
              <span className="text-[#007AFF]">SERVICE.</span>
            </h1>

            <p className="text-[11px] text-slate-600 leading-relaxed max-w-[190px]">
              Tell us what you need and we'll connect you with the right verified expert.
            </p>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <div className="flex -space-x-2">
                {avatars.map((src, idx) => (
                  <div key={idx} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-slate-200">
                    <img src={src} alt="Customer" className="w-full h-full object-cover" />
                  </div>
                ))}
                <div className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-[#007AFF] text-white flex items-center justify-center text-[7px] font-bold">
                  10K+
                </div>
              </div>
              <span className="text-[9px] text-slate-600 font-medium">Happy Customers</span>
            </div>
          </div>

          {/* Hero Image - Properly Positioned */}
          <div className="absolute right-0 bottom-0 w-[42%] max-w-[240px] sm:max-w-[320px] h-[85%] z-0 pointer-events-none flex items-end justify-end">
            <img src="/hero_house_3d.png" alt="House Services" className="w-full h-full object-contain object-bottom" />
          </div>
        </div>
      </section>

      {/* Popular Services Header */}
      <section className="mt-8 px-4">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-tight text-slate-900">Popular Services</h2>
            <p className="text-[10px] text-slate-500">Choose the service you need</p>
          </div>
          <Link href="/services" className="text-[10px] font-bold text-[#007AFF] flex items-center gap-1">
            View all <ChevronRight size={12} />
          </Link>
        </div>

        <div className="space-y-4">
          {/* Repair & Maintenance Card */}
          <Link href="/services/service" className="block">
            <motion.div whileTap={{ scale: 0.98 }} className="bg-white rounded-3xl p-5 flex gap-4 shadow-[0_5px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden group">
              <div className="w-20 h-20 rounded-2xl bg-[#e8f0fe] flex items-center justify-center shrink-0">
                <Wrench className="w-10 h-10 text-[#007AFF] drop-shadow-md" />
              </div>
              
              <div className="flex-1 space-y-1.5 min-w-0 pr-12">
                <span className="text-[8px] font-bold text-[#007AFF] uppercase tracking-widest">Fast Support</span>
                <h3 className="text-sm font-black text-slate-900 uppercase leading-none tracking-tight">Repair & Maintenance</h3>
                <p className="text-[9px] text-slate-500 leading-snug line-clamp-2">
                  Get fast diagnostics, expert repairs and ongoing care for systems you already use.
                </p>
                <div className="flex flex-col gap-0.5 pt-1">
                  <span className="text-[8px] text-slate-400">Starting from</span>
                  <span className="text-sm font-black text-[#007AFF]">₹499</span>
                </div>
              </div>

              <div className="absolute top-5 right-5 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-full">
                 <Clock size={10} className="text-slate-400" />
                 <span className="text-[8px] font-medium text-slate-600">45-90 mins</span>
              </div>

              <div className="absolute bottom-5 right-5 w-8 h-8 bg-[#007AFF] text-white rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30">
                <ArrowRight size={16} />
              </div>
            </motion.div>
          </Link>

          {/* New Installation Card */}
          <div className="block opacity-90">
            <div className="bg-white rounded-3xl p-5 flex gap-4 shadow-[0_5px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden">
              <div className="w-20 h-20 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                <Zap className="w-10 h-10 text-orange-400 drop-shadow-md fill-current" />
              </div>
              
              <div className="flex-1 space-y-1.5 min-w-0 pr-12">
                <span className="text-[8px] font-bold text-[#007AFF] uppercase tracking-widest">Setup</span>
                <h3 className="text-sm font-black text-slate-900 uppercase leading-none tracking-tight">New Installation</h3>
                <p className="text-[9px] text-slate-500 leading-snug line-clamp-2">
                  Plan and install new equipment with trained specialists and end-to-end coordination.
                </p>
                <div className="flex flex-col gap-0.5 pt-1">
                  <span className="text-[8px] text-slate-400">Starting from</span>
                  <span className="text-sm font-black text-[#007AFF]">₹799</span>
                </div>
              </div>

              <div className="absolute top-5 right-5 flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
                 <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Coming Soon</span>
              </div>

              <div className="absolute bottom-5 right-5 w-8 h-8 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
                <ArrowRight size={16} />
              </div>
            </div>
          </div>

          {/* ₹1 Test Payment Card (Razorpay Direct Gateway) */}
          <motion.div 
            whileTap={{ scale: 0.98 }} 
            onClick={handleOneRupeeTestPayment}
            className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-5 flex gap-4 shadow-sm border border-emerald-200/80 relative overflow-hidden cursor-pointer group"
          >
            <div className="w-20 h-20 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
              <span className="text-2xl font-black">₹1</span>
            </div>
            
            <div className="flex-1 space-y-1.5 min-w-0 pr-12">
              <span className="text-[8px] font-extrabold text-emerald-700 uppercase tracking-widest bg-emerald-100/80 px-2 py-0.5 rounded-full inline-block">
                INSTANT TEST GATEWAY • NO DB STORE
              </span>
              <h3 className="text-sm font-black text-slate-900 uppercase leading-none tracking-tight">
                ₹1 Razorpay Test Payment
              </h3>
              <p className="text-[9px] text-slate-600 leading-snug">
                Click to test instant ₹1 payment modal via Razorpay Standard Checkout. No form filling required & no database records saved.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-sm font-black text-emerald-700">₹1.00 Only</span>
                <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">(Test Mode)</span>
              </div>
            </div>

            <div className="absolute top-5 right-5 flex items-center gap-1 bg-emerald-100 px-2.5 py-1 rounded-full text-emerald-800 border border-emerald-200">
               <Zap size={10} className="fill-current" />
               <span className="text-[8px] font-extrabold uppercase tracking-wider">LIVE TEST</span>
            </div>

            <div className="absolute bottom-5 right-5 w-9 h-9 bg-emerald-600 text-white rounded-full flex items-center justify-center group-hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/30">
              <ArrowRight size={16} />
            </div>
          </motion.div>
        </div>
      </section>



      {/* Custom Service Plan CTA */}
      <section className="mt-8 px-4">
        <div className="bg-[#0A1629] rounded-3xl p-6 relative overflow-hidden min-h-[180px] flex items-center shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/50 to-transparent opacity-80 pointer-events-none"></div>
          
          <div className="relative z-10 space-y-3 max-w-[60%]">
            <h2 className="text-xl font-black text-white leading-[1.1] tracking-tight uppercase">
              NEED A CUSTOM<br/>SERVICE PLAN?
            </h2>
            <p className="text-[10px] text-slate-300 leading-relaxed max-w-[150px]">
              Talk to our experts and get a personalized solution.
            </p>
            <button className="bg-white text-slate-900 px-4 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-wider mt-2 flex items-center gap-2 hover:bg-slate-100 active:scale-95 transition-all">
              TALK TO AN EXPERT <ArrowRight size={12} className="text-[#007AFF]" />
            </button>
          </div>

          <div className="absolute -right-6 -bottom-0 w-48 h-56 z-0 pointer-events-none">
             <img src="/custom_service_mechanic_3d.png" alt="Mechanic" className="w-full h-full object-contain object-bottom drop-shadow-2xl" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mt-8 px-4 mb-8">
        <div className="grid grid-cols-4 gap-2">
          {features.map((feature, idx) => (
            <div key={idx} className="flex flex-col items-center text-center gap-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center">
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[7px] font-black uppercase tracking-tight text-slate-900 leading-none">{feature.title}</h4>
                <p className="text-[6px] text-slate-500 leading-tight mx-auto max-w-[60px]">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
    </>
  );
}
