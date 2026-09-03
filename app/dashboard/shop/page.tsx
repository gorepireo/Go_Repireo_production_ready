'use client';

import { useState, useEffect, Suspense } from 'react';
import { db } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Package, DollarSign, ShoppingBag, X, Tag, Info, ArrowUpRight } from 'lucide-react';

function ShopkeeperDashboardContent() {
  const { user, profile, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'equipment' });

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await db.database
          .from('products')
          .select('*')
          .eq('shop_id', user.id);
        if (data) setProducts(data);
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading) fetchProducts();
  }, [user, authLoading]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await db.database
      .from('products')
      .insert({ ...newProduct, shop_id: user.id });
    if (!error) {
      setIsAdding(false);
      const { data } = await db.database.from('products').select('*').eq('shop_id', user.id);
      if (data) setProducts(data);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const { error } = await db.database.from('products').delete().eq('id', id);
    if (!error) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] noise-overlay pb-32">
      <div className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        
        {/* Cinematic Alabaster Shop Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 mb-20 relative">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#007AFF] opacity-[0.03] rounded-full blur-[120px] pointer-events-none" />
          
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3 text-[#007AFF]">
               <div className="w-8 h-[2px] bg-current" />
               <span className="text-[10px] font-black uppercase tracking-[0.6em] italic">Merchant Hub: Inventory</span>
            </div>
            <h1 className="text-6xl md:text-9xl skew-title text-black leading-[0.8] uppercase">
              INVENTORY <br />
              <span className="text-[#007AFF]">MANAGEMENT.</span>
            </h1>
            <div className="flex items-center gap-4">
               <div className="px-5 py-2 bg-black/5 text-black/60 text-[10px] font-black uppercase tracking-[0.4em] italic rounded-full shadow-inner">Verified Merchant</div>
               <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.3em]">Partner Merchant Portal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 relative z-10">
             <div className="king-card bg-white p-8 md:p-10 !rounded-[2.5rem] flex flex-col items-center md:items-end shadow-xl">
                <p className="text-[10px] text-black/40 font-black uppercase tracking-[0.4em] mb-3 italic">Total Revenue</p>
                <div className="text-right">
                  <span className="text-5xl md:text-6xl font-black text-black italic tracking-tighter leading-none"><span className="text-xl text-[#007AFF] font-bold mr-1">₹</span>{profile?.earnings || 0}</span>
                </div>
             </div>
             
             <button 
              onClick={() => setIsAdding(true)}
              className="w-20 h-20 md:w-24 md:h-24 bg-black text-white rounded-[2rem] flex items-center justify-center hover:bg-[#007AFF] transition-all shadow-2xl group active:scale-95"
             >
               <Plus className="w-10 h-10 group-hover:rotate-90 transition-transform duration-500" />
             </button>
          </div>
        </div>

        {/* Global Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <AnimatePresence>
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group"
              >
                <div className="king-card bg-white group-hover:shadow-[0_45px_90px_-25px_rgba(0,0,0,0.1)] flex flex-col h-full transition-all duration-700">
                  <div className="aspect-square bg-[#F8FAFC] rounded-[2rem] mb-8 flex items-center justify-center relative shadow-inner overflow-hidden">
                    <ShoppingBag className="w-16 h-16 text-black/5 group-hover:text-[#007AFF]/10 transition-colors" />
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl text-[8px] font-black uppercase tracking-widest italic shadow-sm">
                      <Tag className="w-3 h-3 text-[#007AFF]" /> {p.category}
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-6">
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-black leading-tight group-hover:text-[#007AFF] transition-colors">{p.name}</h3>
                    <div className="flex justify-between items-end shadow-[0_-1px_0_rgba(0,0,0,0.03)] pt-6">
                      <div className="space-y-1">
                        <p className="text-[10px] text-black/20 font-black uppercase tracking-widest leading-none italic">Unit Market Price</p>
                        <p className="text-3xl font-black text-black leading-none italic tracking-tighter"><span className="text-sm text-black/20 mr-1 font-bold">₹</span>{p.price}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="w-10 h-10 bg-black/[0.01] rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-xs">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(p.id)}
                          className="w-10 h-10 bg-black/[0.01] rounded-xl flex items-center justify-center hover:bg-[#FF3B30] hover:text-white transition-all group/del shadow-xs"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {products.length === 0 && (
            <div className="lg:col-span-4 king-card py-40 text-center bg-transparent flex flex-col items-center justify-center group">
               <div className="w-24 h-24 bg-black/[0.01] rounded-full flex items-center justify-center mb-8 shadow-inner">
                 <Package className="w-12 h-12 text-black/5 group-hover:text-black/10 transition-all scale-110" />
               </div>
               <h3 className="text-3xl font-black uppercase tracking-tighter text-black/20">No Products Found.</h3>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black/10 mt-4 max-w-xs mx-auto italic leading-relaxed">Add new products to populate your catalog.</p>
            </div>
          )}
        </div>

        {/* New Product Modal */}
        <AnimatePresence>
          {isAdding && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/80 backdrop-blur-3xl" 
                onClick={() => setIsAdding(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="king-card bg-white w-full max-w-2xl mx-4 overflow-hidden !rounded-[3rem] shadow-2xl relative z-10"
              >
                 <div className="p-12 md:p-16 space-y-12">
                   <button onClick={() => setIsAdding(false)} className="absolute top-10 right-10 w-12 h-12 bg-black text-white hover:bg-[#FF3B30] rounded-2xl flex items-center justify-center transition-all active:scale-95">
                     <X size={24} />
                   </button>

                   <div className="space-y-4">
                     <div className="flex items-center gap-3 text-[#007AFF]">
                        <div className="w-6 h-[2px] bg-current" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] italic">New Product Entry</span>
                     </div>
                     <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-black leading-[0.9] skew-title">
                       ADD <br />
                       PRODUCT.
                     </h2>
                   </div>

                   <form onSubmit={handleAddProduct} className="space-y-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-black/40 italic ml-4">Product Name</label>
                         <input
                           type="text"
                           placeholder="Enter product name"
                           className="input-field w-full h-16"
                           value={newProduct.name}
                           onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                           required
                         />
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-widest text-black/40 italic ml-4">Unit Price (₹)</label>
                           <input
                             type="number"
                             placeholder="0.00"
                             className="input-field w-full h-16"
                             value={newProduct.price}
                             onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                             required
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-widest text-black/40 italic ml-4">Classification</label>
                           <select
                             className="input-field w-full h-16"
                             value={newProduct.category}
                             onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                           >
                              <option value="equipment">Reliable Gear</option>
                              <option value="part">Spare Part</option>
                              <option value="tool">Utility Tool</option>
                           </select>
                        </div>
                      </div>

                      <button type="submit" className="btn-primary w-full h-20 text-[11px] group">
                        Authorize Submission
                        <Plus className="ml-3 group-hover:rotate-90 transition-transform" />
                      </button>
                   </form>
                 </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default function ShopkeeperDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ShopkeeperDashboardContent />
    </Suspense>
  );
}
