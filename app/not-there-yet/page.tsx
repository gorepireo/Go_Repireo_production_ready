'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NotServiceableYet from '@/components/NotServiceableYet';

export default function NotThereYetPreviewPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <Header />
      <div className="flex-1 flex flex-col justify-center py-4 sm:py-8">
        <NotServiceableYet
          currentLocationName="Mumbai, Maharashtra"
          onOpenLocationPicker={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('repireo_open_location_modal'));
            }
          }}
          onRefresh={() => {}}
          isChecking={false}
        />
      </div>
      <Footer />
    </div>
  );
}
