'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  ShieldCheck, 
  Package, 
  LayoutGrid, 
  Activity,
  Wrench,
  CheckCircle2,
  Heart,
  Minus,
  Plus,
  ArrowRight,
  Headphones,
  Truck
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { insforge } from '@/lib/insforge';
import Link from 'next/link';

const categories = [
  { name: 'All', icon: LayoutGrid },
  { name: 'Equipment', icon: Package },
  { name: 'Part', icon: Wrench },
  { name: 'Tool', icon: Activity },
];

const fallbackImages = [
  'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=400', // drill
  'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=400', // speaker
  'https://images.unsplash.com/photo-1522338140262-f46f5913618a?auto=format&fit=crop&q=80&w=400', // flashlight
];

export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { addItem } = useCart();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await insforge.database.from('products').select('*');
        if (!error && data) {
          setProducts(data);
          // Initialize quantities to 1
          const initialQ: Record<string, number> = {};
          data.forEach(p => { initialQ[p.id] = 1; });
          setQuantities(initialQ);
        } else if (error) console.error('Fetch error:', error);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleUpdateQuantity = (id: string, delta: number) => {
    setQuantities(prev => {
      const newQ = (prev[id] || 1) + delta;
      return { ...prev, [id]: newQ < 1 ? 1 : newQ };
    });
  };

  const filtered = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category?.toLowerCase() === selectedCategory.toLowerCase());

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] pb-32 pt-6">
      
      {/* Coming Soon Overlay */}
      <div className="fixed top-16 bottom-[72px] left-0 right-0 z-40 bg-white/60 backdrop-blur-sm flex items-center justify-center pointer-events-auto overflow-hidden">
        <div className="bg-[#FF9500] text-white px-8 sm:px-24 py-3 sm:py-4 -rotate-12 shadow-2xl border-y-[4px] sm:border-y-[6px] border-dashed border-[#CC7700] transform scale-110 sm:scale-125 w-[150vw] text-center flex items-center justify-center">
          <span className="text-2xl sm:text-4xl font-black uppercase tracking-widest sm:tracking-[0.3em] drop-shadow-md whitespace-nowrap opacity-90">Coming Soon</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="px-4">
        <div className="relative bg-gradient-to-br from-[#e8f0fe] to-[#d6e4ff] rounded-3xl p-6 overflow-hidden min-h-[340px] flex flex-col justify-between shadow-sm">
          <div className="relative z-10 space-y-4 max-w-[65%]">
            <div className="inline-flex items-center gap-1.5 bg-blue-100/50 backdrop-blur-sm px-3 py-1 rounded-full text-[#007AFF] border border-blue-200">
              <ShieldCheck size={12} className="fill-current text-[#007AFF]" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Verified Merchant</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black leading-[0.95] tracking-tight text-[#0A1629]">
              ASSET<br />
              <span className="text-[#007AFF]">SUPPLY.</span>
            </h1>

            <p className="text-xs text-slate-600 leading-relaxed max-w-[200px]">
              Deployment-ready hardware and digital nodes for tactical operations.
            </p>

            <div className="flex items-center gap-4 pt-2">
               <div className="flex flex-col gap-0.5">
                 <ShieldCheck size={14} className="text-[#007AFF]" />
                 <span className="text-[7px] font-bold text-slate-600 max-w-[40px] leading-tight">Genuine Products</span>
               </div>
               <div className="flex flex-col gap-0.5">
                 <Truck size={14} className="text-[#007AFF]" />
                 <span className="text-[7px] font-bold text-slate-600 max-w-[40px] leading-tight">Fast & Secure Delivery</span>
               </div>
               <div className="flex flex-col gap-0.5">
                 <Activity size={14} className="text-[#007AFF]" />
                 <span className="text-[7px] font-bold text-slate-600 max-w-[40px] leading-tight">Quality Assured</span>
               </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="absolute -right-20 -bottom-8 w-[120%] max-w-[380px] h-80 z-0 pointer-events-none">
            <img src="/shop_hero_3d.png" alt="Hardware Supply" className="w-full h-full object-contain" />
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="mt-6 px-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-4 hide-scrollbar">
          {categories.map(cat => {
            const isActive = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-2 px-5 py-3 rounded-full transition-all active:scale-95 shrink-0 ${
                  isActive 
                    ? 'bg-[#007AFF] text-white shadow-md shadow-blue-500/20' 
                    : 'bg-white text-slate-600 border border-slate-100 shadow-sm hover:bg-slate-50'
                }`}
              >
                <cat.icon size={16} className={isActive ? "text-white" : "text-slate-400"} />
                <span className="text-xs font-bold">{cat.name}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Asset Matrix */}
      <section className="mt-4 px-4 space-y-4">
        <div className="flex items-end justify-between px-1 mb-2">
          <h2 className="text-sm font-black uppercase tracking-tight text-slate-900">ASSET MATRIX</h2>
          <button className="text-[10px] font-bold text-[#007AFF] flex items-center gap-1 active:opacity-70">
             <LayoutGrid size={12} /> Grid view
          </button>
        </div>

        {filtered.length === 0 ? (
           <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 flex flex-col items-center">
             <Package className="w-12 h-12 text-slate-200 mb-4" />
             <h3 className="text-lg font-black text-slate-400 uppercase">No Products Found</h3>
           </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filtered.map((prod, i) => {
                const q = quantities[prod.id] || 1;
                // Use a fallback image based on index if the DB doesn't have an image_url
                const imageUrl = prod.image_url || fallbackImages[i % fallbackImages.length];
                
                return (
                  <motion.div
                    key={prod.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-[2rem] p-4 flex gap-4 shadow-[0_5px_15px_-5px_rgba(0,0,0,0.03)] border border-slate-100"
                  >
                    {/* Image Column */}
                    <div className="w-32 h-36 bg-slate-50 rounded-2xl relative overflow-hidden shrink-0 flex items-center justify-center p-2">
                       <button className="absolute top-2 right-2 w-6 h-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm z-10 active:scale-90 transition-transform">
                          <Heart size={12} className="text-slate-400" />
                       </button>
                       <img src={imageUrl} alt={prod.name} className="w-full h-full object-contain mix-blend-multiply" />
                    </div>

                    {/* Details Column */}
                    <div className="flex-1 min-w-0 flex flex-col py-1">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-xs font-black uppercase text-slate-900 leading-tight tracking-tight mt-1">
                          {prod.name}
                        </h3>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-sm font-black text-slate-900">₹{Number(prod.price).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-0.5">
                         <span className="text-[7px] text-slate-400 leading-none">Inclusive of all taxes</span>
                      </div>

                      <p className="text-[9px] text-slate-500 leading-snug mt-2 line-clamp-2 pr-4">
                        {prod.description || `High performance ${prod.category?.toLowerCase() || 'item'} ready for immediate deployment and rugged use.`}
                      </p>

                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span className="text-[7px] font-bold text-slate-600 tracking-wider">IN STOCK</span>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                          <ShieldCheck size={8} className="text-slate-400" />
                          <span className="text-[7px] font-bold text-slate-600 tracking-wider">1 YEAR WARRANTY</span>
                        </div>
                      </div>

                      <div className="mt-auto pt-4 flex items-center justify-between">
                         <div className="flex items-center bg-slate-50 rounded-full border border-slate-100 p-0.5">
                            <button onClick={() => handleUpdateQuantity(prod.id, -1)} className="w-7 h-7 flex items-center justify-center text-slate-500 active:bg-slate-200 rounded-full transition-colors">
                               <Minus size={12} />
                            </button>
                            <span className="text-[10px] font-bold w-4 text-center">{q}</span>
                            <button onClick={() => handleUpdateQuantity(prod.id, 1)} className="w-7 h-7 flex items-center justify-center text-slate-500 active:bg-slate-200 rounded-full transition-colors">
                               <Plus size={12} />
                            </button>
                         </div>
                         
                         <button 
                            onClick={() => {
                              // Add multiple items if quantity > 1 (mocking logic for context)
                              for(let k=0; k<q; k++) addItem(prod);
                            }}
                            className="w-10 h-10 bg-[#007AFF] text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-90 transition-transform"
                          >
                            <ShoppingCart size={16} className="fill-current" />
                         </button>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Blue Features Strip */}
      <section className="mt-8 px-4">
         <div className="bg-[#007AFF] rounded-2xl p-4 flex justify-between items-center shadow-md shadow-blue-500/20 divide-x divide-blue-400/50 overflow-x-auto hide-scrollbar">
            <div className="flex items-center gap-2 px-3 min-w-fit">
               <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0">
                 <ShieldCheck size={16} className="text-[#007AFF] fill-current opacity-20" />
                 <ShieldCheck size={16} className="text-[#007AFF] absolute" />
               </div>
               <div className="flex flex-col">
                 <span className="text-[8px] font-bold text-white">Secure</span>
                 <span className="text-[8px] text-blue-100">Payments</span>
               </div>
            </div>
            
            <div className="flex items-center gap-2 px-3 min-w-fit">
               <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                 <Package size={16} className="text-white fill-white" />
               </div>
               <div className="flex flex-col">
                 <span className="text-[8px] font-bold text-white">Verified</span>
                 <span className="text-[8px] text-blue-100">Products</span>
               </div>
            </div>

            <div className="flex items-center gap-2 px-3 min-w-fit">
               <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                 <Truck size={16} className="text-white" />
               </div>
               <div className="flex flex-col">
                 <span className="text-[8px] font-bold text-white">Fast</span>
                 <span className="text-[8px] text-blue-100">Delivery</span>
               </div>
            </div>

            <div className="flex items-center gap-2 px-3 min-w-fit">
               <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                 <Headphones size={16} className="text-white" />
               </div>
               <div className="flex flex-col">
                 <span className="text-[8px] font-bold text-white">24/7</span>
                 <span className="text-[8px] text-blue-100">Support</span>
               </div>
            </div>
         </div>
      </section>

      {/* Custom Supply Plan CTA */}
      <section className="mt-8 px-4 mb-8">
        <div className="bg-gradient-to-br from-[#e8f0fe] to-[#d6e4ff] rounded-3xl p-6 relative overflow-hidden min-h-[160px] flex items-center shadow-sm">
          <div className="absolute -left-6 -bottom-0 w-44 h-52 z-10 pointer-events-none">
             <img src="/custom_service_mechanic_3d.png" alt="Expert" className="w-full h-full object-contain object-bottom drop-shadow-xl" />
          </div>

          <div className="relative z-10 space-y-2 max-w-[55%] ml-auto text-right flex flex-col items-end">
            <h2 className="text-lg font-black text-slate-900 leading-[1.1] tracking-tight">
              Need a Custom Supply Plan?
            </h2>
            <p className="text-[9px] text-slate-600 leading-relaxed">
              Talk to our experts and get the right equipment for your mission.
            </p>
            <Link href="/services" className="bg-white text-slate-900 px-4 py-2.5 rounded-full text-[8px] font-bold uppercase tracking-wider mt-2 flex items-center gap-2 hover:bg-slate-50 active:scale-95 transition-all shadow-sm border border-slate-100">
              TALK TO AN EXPERT <ArrowRight size={12} className="text-slate-900" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
