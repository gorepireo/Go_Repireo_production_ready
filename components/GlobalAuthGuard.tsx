'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Wrench } from 'lucide-react';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];

export default function GlobalAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname?.startsWith('/login') || pathname?.startsWith('/register') || pathname?.startsWith('/forgot-password'));
    
    let isAuthenticated = !!user || !!profile;
    
    if (typeof window !== 'undefined') {
      const storedEmail = localStorage.getItem('repireo_user_email');
      const storedToken = localStorage.getItem('repireo_auth_token') || sessionStorage.getItem('repireo_auth_token');
      if (storedEmail || storedToken) {
        isAuthenticated = true;
      }
    }

    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login');
    } else if (isAuthenticated && isPublicRoute) {
      router.replace('/');
    } else {
      setChecking(false);
    }
  }, [pathname, user, profile, authLoading, router]);

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname?.startsWith('/login') || pathname?.startsWith('/register') || pathname?.startsWith('/forgot-password'));

  if ((authLoading || checking) && !isPublicRoute) {
    return (
      <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-[#007AFF] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse mb-4">
          <Wrench className="w-8 h-8 animate-spin" />
        </div>
        <h2 className="text-sm font-black text-slate-800 tracking-tight uppercase">GO_REPIREO SECURITY</h2>
        <p className="text-[11px] font-semibold text-slate-400 mt-1">Verifying secure authentication...</p>
      </div>
    );
  }

  return <>{children}</>;
}
