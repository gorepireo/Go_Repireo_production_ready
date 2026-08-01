'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { insforge } from '@/lib/insforge';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ShoppingCart, ArrowRight, ShieldCheck, Truck, MapPin, Search, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SkeletonLoader from '@/components/SkeletonLoader';
import Script from 'next/script';

export default function InstallationFlow() {
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/services/installation');
    }
  }, [user, loading, router]);

  const handleBookInstallation = async () => {
    if (!user) {
      router.push('/login?redirect=/services/installation');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: total + 1500 })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to create order');

      // 2. Initialize Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: (total + 1500) * 100,
        currency: 'INR',
        name: 'Go_Repireo',
        description: 'Installation & Parts',
        order_id: data.orderId,
        handler: async function (response: any) {
          // 3. Save order on success
          try {
            const { data: orderData, error } = await insforge.database
              .from('orders')
              .insert([{
                user_email: user.email,
                service_name: 'Installation',
                status: 'pending',
                payment_status: 'paid',
                payment_id: response.razorpay_payment_id,
                total_price: total + 1500,
                details: { address, items: cart },
                lat: 12.9492,
                lng: 77.6412,
                order_type: 'installation'
              }])
              .select();

            if (orderData) {
              await insforge.database
                .from('order_tracking')
                .insert([{
                  order_id: orderData[0].id,
                  status: 'pending',
                  lat: orderData[0].lat - (Math.random() * 0.1),
                  lng: orderData[0].lng - (Math.random() * 0.1),
                  note: 'Logistic unit assigned. Initialising signal...'
                }]);

              clearCart();
              router.push(`/track?id=${orderData[0].id}`);
            }
          } catch (err) {
            console.error('Database save error:', err);
            alert("Payment successful, but failed to save order details.");
          }
        },
        prefill: {
          name: user.email?.split('@')[0] || 'User',
          email: user.email || '',
        },
        theme: {
          color: '#007AFF'
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
      
      paymentObject.on('payment.failed', function (response: any) {
        console.error(response.error);
        alert("Payment failed: " + response.error.description);
      });

    } catch (err) {
      console.error('Installation error:', err);
      alert("Something went wrong during checkout.");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
    return <SkeletonLoader />;
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
        {/* Left: Selected Items */}
        <div className="flex-1 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-extrabold italic">Product Installation</h1>
            <Link href="/shop" className="glass px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-white/10 transition-all">
              <Plus className="w-4 h-4" /> Add Product
            </Link>
          </div>

          <AnimatePresence mode="popLayout">
            {cart.length > 0 ? (
              <div className="space-y-4">
                {cart.map((item) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    key={item.id} 
                    className="glass-card flex items-center gap-4 py-4"
                  >
                    <div className="w-16 h-16 glass rounded-lg flex items-center justify-center relative overflow-hidden">
                       <ShoppingCart className="w-6 h-6 text-white/10" />
                       {item.image_url && <img src={item.image_url} className="absolute inset-0 object-cover w-full h-full" alt="" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{item.name}</h3>
                      <p className="text-sm text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-black text-[hsl(var(--accent))]">₹{item.price}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="glass-card text-center py-20 border-dashed border-2 border-white/10 group">
                <div className="w-20 h-20 bg-black/[0.02] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner group-hover:scale-110 transition-transform">
                   <ShoppingCart className="w-10 h-10 text-black/5" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter italic mb-2">No Items Staged.</h3>
                <p className="text-xs text-gray-400 max-w-[200px] mx-auto leading-relaxed">Please select products from the shop to initialize specialized installation.</p>
                <Link href="/shop" className="btn-primary mt-8">Sourcing Terminal <ArrowRight size={14} /></Link>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Booking Form */}
        <div className="w-full lg:w-[400px] space-y-6">
          <div className="glass-card space-y-8 sticky top-32">
            <h2 className="text-2xl font-bold italic border-b border-white/10 pb-4">Booking Details</h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Installation Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    required 
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="input-field w-full pl-12" 
                    placeholder="Where should we come?" 
                  />
                </div>
              </div>

              <div className="space-y-3 bg-white/5 p-4 rounded-2xl">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Products ({cart.length})</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Installation Fee</span>
                  <span className="text-[hsl(var(--accent))] font-bold">₹1,500.00</span>
                </div>
                <div className="pt-3 border-t border-white/10 flex justify-between items-end">
                  <span className="font-bold">Estimated Total</span>
                  <span className="text-2xl font-black text-[hsl(var(--primary))]">₹{(total + 1500).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <button 
              disabled={loading || cart.length === 0 || !address}
              onClick={handleBookInstallation}
              className="btn-primary w-full py-5 text-xl font-bold flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (
                <>
                  Book & Pay <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
            
            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 text-center">
              <ShieldCheck className="w-4 h-4" />
              Includes product delivery & expert setup
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
