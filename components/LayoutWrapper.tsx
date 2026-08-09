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
    <div id="root-container" className="min-h-screen bg-[#F8FAFC] w-full flex flex-col pb-[84px] selection:bg-[#007AFF] selection:text-white">
      <main className="flex-1 w-full">
        {children}
      </main>
      <Suspense fallback={<BottomNav />}>
        <ConditionalBottomNav />
      </Suspense>
    </div>
  );
}
