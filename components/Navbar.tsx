'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  User, 
  LayoutGrid,
  Zap,
  Activity,
  MapPin,
  ChevronRight,
  ShoppingCart,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentSector, setCurrentSector] = useState(profile?.address?.district || 'Universal Sector');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleUpdateSignal = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setIsSyncing(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`Signal Synchronised: ${latitude}, ${longitude}`);
        setCurrentSector(`${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`);
        setIsSyncing(false);
        // Optionally redirect to track
        // window.location.href = '/track';
      },
      (error) => {
        console.error("Signal Sync Error:", error);
        setIsSyncing(false);
        alert("Unable to establish signal lock.");
      }
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none p-4 md:p-6 transition-all duration-500">
      {/* Alabaster Floating Header */}
      <div className={`w-full max-w-[1400px] pointer-events-auto h-16 md:h-20 transition-all duration-700 ${scrolled ? 'translate-y-0' : 'md:translate-y-2'}`}>
        <div className={`h-full rounded-[2.5rem] flex items-center justify-between px-6 md:px-8 transition-all duration-700 ${scrolled ? 'bg-white/90 backdrop-blur-2xl shadow-[0_30px_60px_-20px_rgba(0,0,0,0.08)]' : 'bg-white/40 backdrop-blur-md shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)]'}`}>
          
          {/* Logo Section */}
          <Link href="/" data-deploy="ALABASTER-FINAL-2026" className="flex items-center gap-4 shrink-0 group">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white flex items-center justify-center p-1 transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-5deg] active:scale-95 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.05)] border border-black/[0.03]">
               <img src="/logo.png" alt="Repireo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-xl md:text-2xl font-black tracking-tighter uppercase text-black leading-none">
                Repireo
              </span>
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-black/30">Tactile Hub</span>
            </div>
          </Link>

          {/* Desktop Navigation (Editorial) */}
          <div className="hidden lg:flex items-center gap-12 ml-12">
            {[
              { name: 'Supply', path: '/shop' },
              { name: 'Services', path: '/services' },
              { name: 'Radar', path: '/track' }
            ].map(item => (
              <Link 
                key={item.name} 
                href={item.path}
                className="text-[10px] font-black uppercase tracking-[0.4em] text-black/30 hover:text-black transition-all hover:translate-y-[-1px] relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-black rounded-full transition-all duration-500 group-hover:w-full opacity-0 group-hover:opacity-100" />
              </Link>
            ))}
          </div>

          {/* User & Menu Actions */}
          <div className="flex items-center gap-3 md:gap-4 ml-auto lg:ml-0 shrink-0">
            {/* Status Pulse */}
            <div className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-black/[0.02] rounded-full mr-4">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-black/40">Hub Active</span>
            </div>

            <Link 
              href={user ? `/dashboard/${profile?.role || 'user'}` : '/login'} 
              className="w-10 h-10 md:w-12 md:h-12 bg-black/[0.02] rounded-2xl flex items-center justify-center hover:bg-black hover:shadow-2xl hover:shadow-black/20 transition-all group active:scale-95"
            >
              <User className="w-4 h-4 md:w-5 md:h-5 text-black transition-colors group-hover:text-white" />
            </Link>

            <button 
              onClick={() => setIsMenuOpen(true)}
              className="w-10 h-10 md:w-12 md:h-12 bg-[#007AFF] rounded-2xl flex items-center justify-center hover:shadow-2xl hover:shadow-[#007AFF]/30 transition-all group active:scale-95 shadow-lg shadow-[#007AFF]/10"
            >
              <LayoutGrid className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Alabaster Tactical Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               onClick={() => setIsMenuOpen(false)}
               className="fixed inset-0 bg-black/20 z-[60] backdrop-blur-xl pointer-events-auto transition-all"
            />
            <motion.div 
               initial={{ x: '100%' }} 
               animate={{ x: 0 }} 
               exit={{ x: '100%' }}
               transition={{ type: 'spring', damping: 30, stiffness: 200 }}
               className="fixed top-0 right-0 bottom-0 w-[90vw] max-w-[400px] bg-[#F8F9FA] z-[70] shadow-2xl overflow-y-auto pointer-events-auto flex flex-col"
            >
               {/* User Context */}
               <div className="p-8 pt-16 md:p-12 md:pt-20 space-y-8 relative overflow-hidden bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] rounded-b-[3rem]">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#007AFF] opacity-[0.03] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                  
                  <div className="flex items-center gap-6 relative z-10">
                     <div className="w-16 h-16 bg-black rounded-[1.75rem] flex items-center justify-center shadow-xl shadow-black/10">
                        <User className="w-8 h-8 text-white/40" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black text-black/20 uppercase tracking-[0.4em] mb-1">Authenticated Unit</p>
                        <h2 className="text-2xl font-black tracking-tighter uppercase truncate text-black leading-none">
                          {user ? profile?.display_name : 'Guest Session'}
                        </h2>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 relative z-10">
                     <div className="bg-[#007AFF]/5 p-4 md:p-5 rounded-[2rem]">
                        <Activity className="w-4 h-4 text-[#007AFF] mb-3" />
                        <p className="text-[8px] font-black uppercase tracking-widest text-[#007AFF]/40">System</p>
                        <p className="text-xs font-black text-[#007AFF]">NOMINAL</p>
                     </div>
                     <div className="bg-[#FF3B30]/5 p-4 md:p-5 rounded-[2rem]">
                        <Zap className="w-4 h-4 text-[#FF3B30] mb-3" />
                        <p className="text-[8px] font-black uppercase tracking-widest text-[#FF3B30]/40">Alerts</p>
                        <p className="text-xs font-black text-[#FF3B30]">LOW PRIO</p>
                     </div>
                  </div>
               </div>
               
               <div className="p-8 md:p-12 space-y-10 flex-1">
                  {/* Navigator */}
                  <div className="space-y-4">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.5em] text-black/10 pb-2 ml-4">Deployments</h3>
                    {[
                      { name: 'Asset Marketplace', path: '/shop', icon: ShoppingCart, color: '#007AFF' },
                      { name: 'Operation Hub', path: '/services', icon: LayoutGrid, color: '#34C759' },
                      { name: 'Signal Radar', path: '/track', icon: Navigation, color: '#FF3B30' },
                    ].map(item => (
                       <Link 
                          key={item.name} 
                          href={item.path} 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between group p-6 bg-white hover:bg-black transition-all active:scale-[0.98] rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-black/20"
                        >
                          <div className="flex items-center gap-5">
                             <div className="w-10 h-10 bg-black/[0.02] group-hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors">
                                <item.icon className="w-4 h-4 text-black group-hover:text-white transition-colors" />
                             </div>
                             <h4 className="text-[13px] font-black uppercase tracking-tight text-black group-hover:text-white">
                                {item.name}
                             </h4>
                          </div>
                          <ChevronRight className="w-5 h-5 text-black/10 group-hover:text-white/40 group-hover:translate-x-1 transition-all" />
                       </Link>
                    ))}
                  </div>

                  {/* Operational Status Section */}
                  <div className="bg-black/[0.02] p-8 rounded-[2.5rem] relative overflow-hidden group">
                     <div className="flex items-center justify-between mb-4">
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-black/20">Active Sector</span>
                        <MapPin className="w-4 h-4 text-[#FF3B30] animate-bounce" />
                     </div>
                     <p className="text-xl font-black uppercase tracking-tighter text-black mb-1 group-hover:text-[#007AFF] transition-colors">
                        {isSyncing ? 'Establish Signal...' : currentSector}
                     </p>
                     <p className="text-[10px] font-black uppercase tracking-widest text-black/20 mb-6">
                        {isSyncing ? 'Handshaking...' : 'Coordinate Sync Active'}
                     </p>
                     <button 
                       onClick={handleUpdateSignal}
                       disabled={isSyncing}
                       className="w-full bg-white text-black py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-sm hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                     >
                        {isSyncing ? 'Synchronising...' : 'Update Signal'}
                     </button>
                  </div>
               </div>

               {/* Auth Exit Protocols */}
               <div className="p-8 md:p-12 pb-16 bg-white rounded-t-[3rem] shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.03)]">
                  {user ? (
                    <button 
                      onClick={signOut} 
                      className="w-full bg-red-50 text-[#FF3B30] py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#FF3B30] hover:text-white transition-all active:scale-95 shadow-sm"
                    >
                      Initialize Exit Protocol
                    </button>
                  ) : (
                    <Link 
                      href="/login" 
                      onClick={() => setIsMenuOpen(false)} 
                      className="flex items-center justify-center w-full bg-[#007AFF] text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:shadow-2xl hover:shadow-[#007AFF]/30 transition-all active:scale-95"
                    >
                      Authenticate Unit
                    </Link>
                  )}
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
