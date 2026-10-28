'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NotServiceableYet from '@/components/NotServiceableYet';
import LocationMapSelector from '@/components/LocationMapSelector';

export default function NotThereYetPreviewPage() {
  const [isMapOpen, setIsMapOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <Header />
      <div className="flex-1 flex flex-col justify-center py-4 sm:py-8">
        <NotServiceableYet
          currentLocationName="Mumbai, Maharashtra"
          onOpenLocationPicker={() => setIsMapOpen(true)}
          onRefresh={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('repireo_location_source');
              window.location.href = '/';
            }
          }}
          isChecking={false}
        />
      </div>
      <Footer />

      {isMapOpen && (
        <LocationMapSelector
          initialLat={22.5697}
          initialLng={88.3697}
          onClose={() => setIsMapOpen(false)}
          onConfirm={(loc) => {
            if (typeof window !== 'undefined') {
              localStorage.setItem('repireo_detected_location', loc.address);
              localStorage.setItem('repireo_customer_lat', String(loc.lat));
              localStorage.setItem('repireo_customer_lng', String(loc.lng));
              localStorage.setItem('repireo_location_source', 'manual');
            }
            setIsMapOpen(false);
            window.location.href = '/';
          }}
        />
      )}
    </div>
  );
}
