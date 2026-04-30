'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Zap, 
  Package, 
  Search, 
  LayoutGrid, 
  Tag, 
  Edit,
  ChevronRight,
  Activity,
  Wrench
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';

const PRODUCTS = [
  { id: 'p1', name: 'High-Grip PVC Pipe', price: 1250, category: 'Plumbing', status: 'ACTIVE', icon: Package, image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400' },
  { id: 'p2', name: 'Insulated Copper Wire', price: 4800, category: 'Electrical', status: 'ACTIVE', icon: Zap, image_url: 'https://images.unsplash.com/photo-1621905252507-b3523c44dbf4?auto=format&fit=crop&q=80&w=400' },
  { id: 'p3', name: 'Main Circuit Breaker', price: 2150, category: 'Electrical', status: 'ACTIVE', icon: ShieldCheck, image_url: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&q=80&w=400' },
  { id: 'p4', name: 'Professional Wrench Set', price: 3400, category: 'Hardware', status: 'ACTIVE', icon: Wrench, image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400' },
  { id: 'p5', name: 'Water Meter Node', price: 5500, category: 'Plumbing', status: 'ACTIVE', icon: Activity, image_url: 'https://images.unsplash.com/photo-1621905252507-b3523c44dbf4?auto=format&fit=crop&q=80&w=400' },
];

const categories = ['All Assets', 'Plumbing', 'Electrical', 'Hardware'];

function LongPressButton({ product }: { product: any }) {
  const { addItem } = useCart(); // Fixed: Using addItem instead of addToCart
  const router = useRouter();
  const [isHolding, setIsHolding] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const controls = useAnimation();

  const handleStart = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsHolding(true);
    controls.start({
      scale: 0.85,
      transition: { duration: 1 }
    });
    
    timerRef.current = setTimeout(() => {
      addItem(product);
      setIsHolding(false);
      router.push('/services/installation');
    }, 1000); // 1-second hold
  };

  const handleEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsHolding(false);
    controls.start({ scale: 1 });
  };

  const handleClick = (e: React.MouseEvent) => {
    // Normal click just adds to cart without redirecting
    addItem(product);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="relative">
      {/* Progress Ring Background */}
      {isHolding && (
        <svg className="absolute inset-0 w-10 h-10 -rotate-90 pointer-events-none">
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="#007AFF"
            strokeWidth="3"
            strokeDasharray="113.1"
            className="animate-progress-ring"
          />
        </svg>
      )}
      
      <motion.button 
        animate={controls}
        onPointerDown={handleStart}
        onPointerUp={handleEnd}
        onPointerLeave={handleEnd}
        onClick={handleClick}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 shadow-lg ${isHolding ? 'bg-[#007AFF] text-white' : 'bg-black text-white hover:bg-[#007AFF]'}`}
      >
        <Plus size={18} className={isHolding ? 'animate-spin' : ''} />
      </motion.button>

      <style jsx>{`
        @keyframes progress-ring {
          from { stroke-dashoffset: 113.1; }
          to { stroke-dashoffset: 0; }
        }
        .animate-progress-ring {
          animation: progress-ring 1s linear forwards;
        }
      `}</style>
    </div>
  );
}

export default function ShopDashboard() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      <main className="max-w-4xl mx-auto px-4 md:px-6 pt-12 space-y-12">
        
        {/* Editorial Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] skew-title">
              ASSET <br />
              <span className="text-[#007AFF]">SUPPLY.</span>
            </h1>
            <div className="flex items-center gap-4">
               <div className="px-5 py-2 bg-black/5 text-black/60 text-[10px] font-black uppercase tracking-[0.4em] italic rounded-full shadow-inner">Verified Merchant</div>
               <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.3em] hidden md:block">Alpha Provision Hub</p>
            </div>
          </div>
          <p className="tactile-label !text-slate-400 max-w-sm tracking-[0.2em]">
            Deployment-ready hardware and digital nodes for tactical operations.
          </p>
        </div>

        {/* Categories Bar */}
        <section className="space-y-4">
             <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat.split(' ')[0].toUpperCase())}
                    className={`tactile-label whitespace-nowrap px-6 py-3 rounded-full transition-all ${
                      selectedCategory === cat.split(' ')[0].toUpperCase() || (selectedCategory === 'ALL' && cat === 'All Assets') ? 'bg-black text-white' : 'bg-black/[0.03] text-slate-400 hover:bg-black/[0.06]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
            </div>
        </section>

        {/* Asset Matrix */}
        <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
               <span className="tactile-label !text-slate-400 font-bold">ASSET MATRIX</span>
               <LayoutGrid size={16} className="text-slate-200" />
            </div>
            
            <div className="grid grid-cols-1 gap-2">
               {PRODUCTS.filter(p => selectedCategory === 'ALL' || p.category.toUpperCase().includes(selectedCategory)).map(prod => (
                 <motion.div 
                   key={prod.id} 
                   whileTap={{ scale: 0.99 }}
                   className="king-card flex items-center gap-4 !p-4 group"
                 >
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-xs flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 relative overflow-hidden">
                       <prod.icon size={20} className="text-black/10 group-hover:text-[#007AFF] transition-colors relative z-10" />
                       {prod.image_url && <img src={prod.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-center">
                          <h4 className="text-sm font-bold uppercase tracking-tight truncate mr-2">{prod.name}</h4>
                          <span className="text-sm font-bold">₹{prod.price.toLocaleString()}</span>
                       </div>
                       <div className="flex items-center gap-3 mt-1">
                          <span className="tactile-label !text-[8px]">{prod.category}</span>
                          <span className={`tactile-label !text-[8px] ${prod.status === 'ACTIVE' ? 'text-[#007AFF]' : 'text-slate-300'}`}>{prod.status}</span>
                       </div>
                    </div>
                    
                    <LongPressButton product={prod} />
                 </motion.div>
               ))}
            </div>
        </section>
      </main>
    </div>
  );
}
