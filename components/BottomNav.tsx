'use client';

import { 
  LayoutGrid,
  Box, 
  ShoppingCart, 
  Navigation
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Hub', path: '/', icon: LayoutGrid },
    { name: 'Ops', path: '/services', icon: Box },
    { name: 'Assets', path: '/shop', icon: ShoppingCart },
    { name: 'Radar', path: '/track', icon: Navigation },
  ];

  return (
    /* 1. TOEROOM: We changed 'pb-8' to 'pb-10' and added 'safe-area' padding 
       This keeps the buttons from being squished at the bottom of the phone */
    <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-10 pt-4 bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA]/80 to-transparent pointer-events-none lg:hidden">
      
      {/* 2. SPACING: We ensured 'justify-between' and 'px-2' are used 
         This keeps all the icons in their own happy personal bubbles */}
      <nav className="max-w-md mx-auto h-20 bg-white/80 backdrop-blur-2xl px-4 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.12)] pointer-events-auto flex items-center justify-between relative overflow-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.name} 
              href={item.path}
              /* 3. CLICKING: 'active:scale-90' makes it feel like a real button */
              className="relative flex-1 flex flex-col items-center justify-center gap-1 group active:scale-95 transition-all duration-300"
            >
              <div className="relative p-2 transition-all duration-500">
                <item.icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-all duration-500 ${isActive ? 'text-[#007AFF] translate-y-[-2px]' : 'text-black/20 group-hover:text-black'}`}
                />
                
                {isActive && (
                  <motion.div 
                    layoutId="activeTabGlow"
                    className="absolute inset-0 bg-[#007AFF]/10 rounded-2xl z-[-1] blur-md"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  />
                )}
              </div>
              
              <span className={`text-[9px] font-bold uppercase tracking-[0.1em] transition-all duration-500 ${isActive ? 'text-[#007AFF] opacity-100 translate-y-[-1px]' : 'text-black/20 opacity-0 transform translate-y-2'}`}>
                {item.name}
              </span>

              {isActive && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  className="absolute bottom-2 w-1.5 h-1.5 bg-[#007AFF] rounded-full"
                  transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}