'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import BottomNav from './BottomNav';

function ConditionalBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isChatRoute = pathname?.startsWith('/chat');
  const hasOrderId = searchParams?.has('orderId');
  
  if (isChatRoute && hasOrderId) return null;
  return <BottomNav />;
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div id="root-container" className="flex flex-col min-h-screen pb-[80px]">
      <main className="flex-1">
        {children}
      </main>
      <Suspense fallback={<BottomNav />}>
        <ConditionalBottomNav />
      </Suspense>
    </div>
  );
}
