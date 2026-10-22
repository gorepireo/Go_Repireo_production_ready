'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import BottomNav from './BottomNav';
import GlobalAuthGuard from './GlobalAuthGuard';

function ConditionalBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isChatRoute = pathname?.startsWith('/chat');
  const hasOrderId = searchParams?.has('orderId');
  const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
  const isMaintenanceRoute = pathname === '/maintenance' || pathname?.startsWith('/verify/certificate');
  
  if (isAuthRoute || isMaintenanceRoute || (isChatRoute && hasOrderId)) return null;
  return <BottomNav />;
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMaintenanceRoute = pathname === '/maintenance' || pathname?.startsWith('/verify/certificate');
  return (
    <GlobalAuthGuard>
      <div id="root-container" className={`min-h-screen bg-[#F8FAFC] w-full flex flex-col selection:bg-[#007AFF] selection:text-white ${isMaintenanceRoute ? '' : 'pb-[84px]'}`}>
        <main className="flex-1 w-full">
          {children}
        </main>
        <Suspense fallback={<BottomNav />}>
          <ConditionalBottomNav />
        </Suspense>
      </div>
    </GlobalAuthGuard>
  );
}
