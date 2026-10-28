'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const PUBLIC_ROUTES = [
  '/services',
  '/about',
  '/contact',
  '/login',
  '/register',
  '/forgot-password',
  '/maintenance',
  '/privacy',
  '/terms',
  '/refund-policy',
  '/not-there-yet'
];

function isPublicRoute(pathname: string) {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (pathname.startsWith('/services/')) return true;
  if (pathname.startsWith('/near-me/')) return true;
  if (pathname.startsWith('/verify/certificate')) return true;
  return false;
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
      if (role === 'admin') {
        router.replace('/admin');
        return;
      }
      if (role === 'worker') {
        router.replace('/dashboard/worker');
        return;
      }
      const requested = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('next');
      const safeNext = requested?.startsWith('/') && !requested.startsWith('//') && !requested.startsWith('/dashboard/worker') ? requested : null;
      router.replace(safeNext || '/dashboard/user');
    }
  }, [authRoute, loading, pathname, publicRoute, role, router, user]);

  if (!publicRoute && (loading || !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6" role="status">
        <p className="text-sm font-semibold text-slate-600">Checking your account…</p>
      </div>
    );
  }

  if (authRoute && user && role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6" role="status">
        <p className="text-sm font-semibold text-slate-600">Checking your account…</p>
      </div>
    );
  }

  return <>{children}</>;
}
