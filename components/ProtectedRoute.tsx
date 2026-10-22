'use client';

import { useAuth, type TrustedRole } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: TrustedRole[];
}) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const permitted = !!user && !!role && (!allowedRoles || allowedRoles.includes(role));

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname || '/')}`);
    else if (!permitted) router.replace('/');
  }, [loading, pathname, permitted, router, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6" role="status">
        <p className="text-sm font-semibold text-slate-600">Verifying your account…</p>
      </div>
    );
  }

  return permitted ? <>{children}</> : null;
}
