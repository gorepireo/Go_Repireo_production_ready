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
    <div className="min-h-screen bg-[#F1F5F9] w-full flex justify-center selection:bg-[#007AFF] selection:text-white">
      {/* Sleek App Frame for PC & Large Screens while preserving 100% Mobile View */}
      <div 
        id="root-container" 
        className="w-full max-w-4xl lg:max-w-5xl bg-[#F8FAFC] min-h-screen flex flex-col pb-[84px] shadow-2xl shadow-slate-300/30 relative border-x border-slate-200/50"
      >
        <main className="flex-1 w-full">
          {children}
        </main>
        <Suspense fallback={<BottomNav />}>
          <ConditionalBottomNav />
        </Suspense>
      </div>
    </div>
  );
}
