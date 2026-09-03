'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Wrench } from 'lucide-react';

const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

export default function GlobalAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    const isAuthPage = AUTH_ROUTES.some(route => pathname === route || pathname?.startsWith(route));

    let isAuthenticated = !!user || !!profile;

    if (typeof window !== 'undefined') {
      const storedEmail = localStorage.getItem('repireo_user_email');
      const storedToken = localStorage.getItem('repireo_auth_token') || sessionStorage.getItem('repireo_auth_token');
      if (storedEmail || storedToken) {
        isAuthenticated = true;
      }
    }

    if (!isAuthenticated && !isAuthPage) {
      router.replace('/login');
    } else if (isAuthenticated && isAuthPage) {
      router.replace('/');
    } else {
      setChecking(false);
    }
  }, [pathname, user, profile, authLoading, router]);

  const isAuthPage = AUTH_ROUTES.some(route => pathname === route || pathname?.startsWith(route));

  // Render children directly during initial SSR to avoid DarkReader/Extension SVG hydration mismatch
  if (!mounted) {
    return <div suppressHydrationWarning>{children}</div>;
  }

  if ((authLoading || checking) && !isAuthPage) {
    return (
      <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center" suppressHydrationWarning>
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden shadow-xl shadow-blue-500/20 bg-white flex items-center justify-center mb-4 border border-blue-100/80" suppressHydrationWarning>
          <video 
            src="/logeing.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover" 
          />
        </div>
        <h2 className="text-xs font-black text-slate-800 tracking-tight uppercase" suppressHydrationWarning>GO_REPIREO SECURITY</h2>
        <p className="text-[11px] font-semibold text-slate-400 mt-1" suppressHydrationWarning>Verifying secure authentication...</p>
      </div>
    );
  }

  return <>{children}</>;
}
