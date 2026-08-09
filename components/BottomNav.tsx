'use client';

import { useState, useEffect } from 'react';
import { 
  Home,
  Calendar,
  ShoppingBag,
  MapPin, 
  User,
  MessageCircle,
  LayoutGrid
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Avatar from '@/components/Avatar';

export default function BottomNav() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const [cachedRole, setCachedRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCachedRole(localStorage.getItem('repireo_cached_role'));
    }
  }, []);

  const activeRole = profile?.role || cachedRole || 'user';
  const isSpecialUser = ['shopkeeper', 'admin'].includes(activeRole);
  const isWorker = activeRole === 'worker';

  if (isSpecialUser) return null;

  const navItems = isWorker ? [
    { name: 'Dashboard', path: '/dashboard/worker', icon: LayoutGrid },
    { name: 'Chats', path: '/chat', icon: MessageCircle },
    { name: 'Profile', path: '/dashboard/worker/settings', icon: User },
  ] : [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Bookings', path: '/services', icon: Calendar },
    { name: 'Shop', path: '/shop', icon: ShoppingBag },
    { name: 'Track', path: '/track', icon: MapPin },
    { name: 'Profile', path: '/dashboard/user', icon: User },
  ];

  return (
    <>
      {/* Floating WhatsApp button over bottom navigation bar */}
      {pathname !== '/whatsapp' && (
        <div className="fixed bottom-[92px] left-0 right-0 z-[60] pointer-events-none">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end">
            <Link 
              href="/whatsapp"
              className="pointer-events-auto bg-[#25D366] text-white w-12 h-12 rounded-full shadow-xl shadow-emerald-500/40 flex items-center justify-center active:scale-90 transition-all border-2 border-white hover:bg-[#20ba5a]"
              aria-label="Book on WhatsApp"
            >
              <MessageCircle size={24} className="fill-white stroke-none" />
            </Link>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar Centered for Desktop & Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 pb-safe pt-2 shadow-[0_-10px_25px_rgba(0,0,0,0.05)]">
        <nav className="w-full max-w-2xl lg:max-w-3xl mx-auto px-4 flex items-center justify-between pb-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
            return (
              <Link 
                key={item.name} 
                href={item.path}
                className="flex-1 flex items-center justify-center py-1.5"
              >
                <div className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 w-full max-w-[120px] mx-1 py-1.5 rounded-2xl ${isActive ? 'bg-[#F0F5FF]' : 'hover:bg-slate-50'}`}>
                  <div className="relative z-10 flex items-center justify-center min-h-[22px]">
                    {item.name === 'Profile' ? (
                      <Avatar 
                        src={profile?.avatar_url} 
                        name={profile?.display_name || profile?.email || 'User'} 
                        size={22} 
                        className={isActive ? 'ring-2 ring-offset-1 ring-[#007AFF]' : 'opacity-80 grayscale-[20%] hover:grayscale-0 transition-all duration-300'}
                      />
                    ) : (
                      <item.icon 
                        size={19} 
                        strokeWidth={isActive ? 2.5 : 2}
                        className={`transition-colors duration-300 ${isActive ? 'text-[#007AFF]' : 'text-slate-400 group-hover:text-slate-600'}`}
                      />
                    )}
                  </div>
                  
                  <span className={`text-[10px] font-bold z-10 transition-colors duration-300 ${isActive ? 'text-[#007AFF]' : 'text-slate-400'}`}>
                    {item.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}