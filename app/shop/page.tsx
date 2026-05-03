'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  ShoppingBag, 
  Plus, 
  ShieldCheck, 
  Zap, 
  Package, 
  LayoutGrid, 
  Tag, 
  Activity,
  Wrench
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { insforge } from '@/lib/insforge';

const categoryIcons: Record<string, any> = {
  equipment: Package,
  part: Wrench,
  tool: Activity,
  default: ShoppingBag,
};

const categories = ['All', 'Equipment', 'Part', 'Tool'];

function LongPressButton({ product }: { product: any }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [isHolding, setIsHolding] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const controls = useAnimation();

  const handleStart = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsHolding(true);
    controls.start({ scale: 0.85, transition: { duration: 1 } });
    timerRef.current = setTimeout(() => {
      addItem(product);
      setIsHolding(false);
      router.push('/services/installation');
    }, 1000);
  };

  const handleEnd = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setIsHolding(false);
    controls.start({ scale: 1 });
  };

  const handleClick = () => { addItem(product); };

  useEffect(() => { return () => { if (timerRef.current) clearTimeout(timerRef.current); }; }, []);

  return (
    <div className="relative">
      {isHolding && (
        <svg className="absolute inset-0 w-10 h-10 -rotate-90 pointer-events-none">
          <circle cx="20" cy="20" r="18" fill="none" stroke="#007AFF" strokeWidth="3"
            strokeDasharray="113.1" className="animate-progress-ring" />
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
        .animate-progress-ring { animation: progress-ring 1s linear forwards; }
      `}</style>
    </div>
  );
}

export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await insforge.database.from('products').select('*');
        if (!error && data) setProducts(data);
        else if (error) console.error('Fetch error:', error);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filtered = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category?.toLowerCase() === selectedCategory.toLowerCase());

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
    </div>
  );

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
                onClick={() => setSelectedCategory(cat)}
                className={`tactile-label whitespace-nowrap px-6 py-3 rounded-full transition-all ${
                  selectedCategory === cat ? 'bg-black text-white' : 'bg-black/[0.03] text-slate-400 hover:bg-black/[0.06]'
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

          {filtered.length === 0 ? (
            <div className="king-card py-32 text-center bg-transparent flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-black/[0.02] rounded-full flex items-center justify-center mb-6">
                <Package className="w-10 h-10 text-black/10" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter text-black/20">No Products Yet.</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black/10 mt-3 italic">Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              <AnimatePresence>
                {filtered.map((prod, i) => {
                  const Icon = categoryIcons[prod.category?.toLowerCase()] || categoryIcons.default;
                  return (
                    <motion.div
                      key={prod.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: i * 0.04 }}
                      whileTap={{ scale: 0.99 }}
                      className="king-card flex items-center gap-4 !p-4 group"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-white shadow-xs flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 relative overflow-hidden">
                        <Icon size={20} className="text-black/10 group-hover:text-[#007AFF] transition-colors relative z-10" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-bold uppercase tracking-tight truncate mr-2">{prod.name}</h4>
                          <span className="text-sm font-bold">₹{Number(prod.price).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="tactile-label !text-[8px]">{prod.category}</span>
                          <span className="tactile-label !text-[8px] text-[#007AFF]">IN STOCK</span>
                        </div>
                      </div>

                      <LongPressButton product={prod} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
