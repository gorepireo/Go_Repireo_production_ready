'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/maintenance', '/privacy', '/terms', '/refund-policy'];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/verify/certificate');
}

export default function GlobalAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const pathname = usePathname() || '/';
  const router = useRouter();
  const publicRoute = isPublicRoute(pathname);
  const authRoute = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    if (loading) return;
    if (!user && !publicRoute) {
      const query = typeof window === 'undefined' ? '' : window.location.search.slice(1);
      const target = `${pathname}${query ? `?${query}` : ''}`;
      router.replace(`/login?next=${encodeURIComponent(target)}`);
      return;
    }
    if (user && role && authRoute) {
      const requested = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('next');
      const safeNext = requested?.startsWith('/') && !requested.startsWith('//') ? requested : null;
      router.replace(safeNext || (role === 'admin' ? '/admin' : role === 'worker' ? '/dashboard/worker' : '/dashboard/user'));
    }
  }, [authRoute, loading, pathname, publicRoute, role, router, user]);

  if (loading || (!user && !publicRoute) || (user && role && authRoute)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6" role="status">
        <p className="text-sm font-semibold text-slate-600">Checking your account…</p>
      </div>
    );
  }

  return <>{children}</>;
}
