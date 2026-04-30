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
  Navigation,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentSector, setCurrentSector] = useState(profile?.address?.district || 'Universal Sector');

  // Handle scroll state for navbar styling
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen]);

  const handleUpdateSignal = () => {
    if (!navigator.geolocation) return;
    setIsSyncing(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCurrentSector(`${p.coords.latitude.toFixed(2)}°N, ${p.coords.longitude.toFixed(2)}°E`);
        setIsSyncing(false);
      },
      () => setIsSyncing(false)
    );
  };

  return (
    <>
      {/* 
          Outer Header Wrapper 
          CRITICAL: pointer-events-none ensures the "invisible" parts of the header 
          don't block the main page scroll.
      */}
      <header className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none p-4 md:p-6 transition-all duration-500">

        {/* Main Floating Header Bar */}
        <div className={`w-full max-w-[1400px] pointer-events-auto h-16 md:h-20 transition-all duration-700 ${scrolled ? 'translate-y-0' : 'md:translate-y-2'}`}>
          <div className={`h-full rounded-[2.5rem] flex items-center justify-between px-6 md:px-8 transition-all duration-700 ${scrolled ? 'bg-white/90 backdrop-blur-2xl shadow-[0_30px_60px_-20px_rgba(0,0,0,0.08)]' : 'bg-white/40 backdrop-blur-md shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)]'}`}>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-4 shrink-0 group">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white flex items-center justify-center p-1 transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-5deg] shadow-[0_15px_30px_-10px_rgba(0,0,0,0.05)] border border-black/[0.03]">
                <img src="/logo.png" alt="Repireo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="text-xl md:text-2xl font-black tracking-tighter uppercase text-black leading-none">Repireo</span>
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-black/30">Tactile Hub</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-12 ml-12">
              {[
                { name: 'Supply', path: '/shop' },
                { name: 'Services', path: '/services' },
                { name: 'Radar', path: '/track' }
              ].map(item => (
                <Link key={item.name} href={item.path} className="text-[10px] font-black uppercase tracking-[0.4em] text-black/30 hover:text-black transition-all relative group">
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-black rounded-full transition-all duration-500 group-hover:w-full opacity-0 group-hover:opacity-100" />
                </Link>
              ))}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3 md:gap-4 ml-auto lg:ml-0 shrink-0">
              <Link href={user ? `/dashboard/${profile?.role || 'user'}` : '/login'} className="w-10 h-10 md:w-12 md:h-12 bg-black/[0.02] rounded-2xl flex items-center justify-center hover:bg-black group transition-all">
                <User className="w-4 h-4 md:w-5 md:h-5 text-black group-hover:text-white" />
              </Link>

              <button onClick={() => setIsMenuOpen(true)} className="w-10 h-10 md:w-12 md:h-12 bg-[#007AFF] rounded-2xl flex items-center justify-center shadow-lg shadow-[#007AFF]/20 active:scale-95 transition-all">
                <LayoutGrid className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Drawer Overlay and Content */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop: Only captures clicks when open */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-md pointer-events-auto"
            />

            {/* The Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="fixed top-0 right-0 bottom-0 w-[90vw] max-w-[400px] bg-[#F8F9FA] z-[70] shadow-2xl overflow-y-auto scrollbar-hide pointer-events-auto flex flex-col"
            >
              {/* Header Buffer / Close Button Area */}
              <div className="sticky top-0 left-0 right-0 h-28 flex items-end justify-end px-8 pb-4 z-[90] pointer-events-none bg-[#F8F9FA]/80 backdrop-blur-sm">
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-12 h-12 bg-white shadow-xl rounded-full flex items-center justify-center hover:bg-black group transition-all pointer-events-auto active:scale-90"
                >
                  <X className="w-6 h-6 text-black group-hover:text-white" />
                </button>
              </div>

              {/* Profile Section */}
              <div className="px-6 mt-4">
                <div className="p-8 space-y-8 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[3rem] border border-black/[0.02]">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-black rounded-[1.75rem] flex items-center justify-center shadow-xl shadow-black/20 shrink-0">
                      <User className="w-8 h-8 text-white/40" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[9px] font-black text-black/20 uppercase tracking-[0.4em] mb-1">Authenticated Unit</p>
                      <h2 className="text-2xl font-black tracking-tighter uppercase truncate text-black leading-none">
                        {user ? profile?.display_name : 'Guest Session'}
                      </h2>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="p-8 md:p-10 space-y-10">
                <div className="space-y-4">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.5em] text-black/10 pb-2 ml-4 text-left">Deployments</h3>
                  {[
                    { name: 'Supply (Marketplace)', path: '/shop', icon: ShoppingCart },
                    { name: 'Services (Ops Hub)', path: '/services', icon: LayoutGrid },
                    { name: 'Radar (Tracking)', path: '/track', icon: Navigation },
                  ].map(item => (
                    <Link
                      key={item.name}
                      href={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between group p-6 bg-white hover:bg-black transition-all rounded-[2.2rem] shadow-sm hover:shadow-xl"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 bg-black/[0.03] group-hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors">
                          <item.icon className="w-4 h-4 text-black group-hover:text-white" />
                        </div>
                        <h4 className="text-[13px] font-black uppercase tracking-tight text-black group-hover:text-white">{item.name}</h4>
                      </div>
                      <ChevronRight className="w-5 h-5 text-black/10 group-hover:text-white/40" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Auth Protocol Footer */}
              <div className="mt-auto p-8 bg-white rounded-t-[3.5rem] border-t border-black/[0.02]">
                {user ? (
                  <button onClick={() => { signOut(); setIsMenuOpen(false); }} className="w-full bg-red-50 text-[#FF3B30] py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#FF3B30] hover:text-white transition-all">
                    Initialize Exit Protocol
                  </button>
                ) : (
                  <Link href="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center w-full bg-[#007AFF] text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-[#007AFF]/20">
                    Authenticate Unit
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}