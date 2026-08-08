'use client';

import React, { useEffect, useRef } from 'react';

interface LiveTrackingGoogleMapProps {
  technicianLat?: number;
  technicianLng?: number;
  userLat?: number;
  userLng?: number;
  technicianName?: string;
  distanceKm?: string;
}

export default function LiveTrackingGoogleMap({
  technicianLat = 26.7620,
  technicianLng = 79.0320,
  userLat = 26.7810,
  userLng = 79.0120,
  technicianName = "Rohit Sharma",
  distanceKm = "2.4"
}: LiveTrackingGoogleMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous instance if exists
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      // Calculate mid point to center map
      const midLat = (technicianLat + userLat) / 2;
      const midLng = (technicianLng + userLng) / 2;

      // Initialize Leaflet Map
      const map = L.map(mapContainerRef.current, {
        center: [midLat, midLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      // Add Official Google Maps Roadmap Tiles
      L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps'
      }).addTo(map);

      // Create Route Waypoints for realistic road path direction
      const waypoints: [number, number][] = [
        [technicianLat, technicianLng],
        [technicianLat + 0.005, technicianLng - 0.008],
        [technicianLat + 0.012, technicianLng - 0.014],
        [userLat, userLng]
      ];

      // Draw Main Route Line (Bright Blue with direction stroke)
      const routePolyline = L.polyline(waypoints, {
        color: '#007AFF',
        weight: 5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Draw Outer Glow / Background Line
      L.polyline(waypoints, {
        color: '#3B82F6',
        weight: 10,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // 1. Destination Marker (User's House Pin)
      const houseIcon = L.divIcon({
        className: 'custom-house-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="background-color: #10B981; color: white; width: 36px; height: 36px; rounded-radius: 50%; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">
              🏠
            </div>
            <div style="background: rgba(15, 23, 42, 0.9); color: white; font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: 10px; margin-top: 3px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
              DESTINATION (HOME)
            </div>
          </div>
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 25]
      });
      L.marker([userLat, userLng], { icon: houseIcon }).addTo(map);

      // 2. Technician Live Marker (Moving Expert Icon)
      const techIcon = L.divIcon({
        className: 'custom-tech-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="position: absolute; inset: -4px; background: rgba(0, 122, 255, 0.3); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="background-color: #007AFF; width: 42px; height: 42px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 14px rgba(0,122,255,0.4); overflow: hidden; display: flex; items-center; justify-center; z-index: 10;">
              <img src="/hero_technician_banner.jpg" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <div style="background: #007AFF; color: white; font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: 10px; margin-top: 3px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,122,255,0.4); display: flex; align-items: center; gap: 4px;">
              <span>🛵 ${technicianName.split(' ')[0]}</span>
              <span style="opacity: 0.8; font-weight: 600;">• ${distanceKm} km away</span>
            </div>
          </div>
        `,
        iconSize: [50, 60],
        iconAnchor: [25, 30]
      });
      L.marker([technicianLat, technicianLng], { icon: techIcon }).addTo(map);

      // Fit map bounds to show full route
      map.fitBounds(routePolyline.getBounds(), { padding: [40, 40] });

      leafletMapRef.current = map;
    });

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [technicianLat, technicianLng, userLat, userLng, technicianName, distanceKm]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner">
      {/* Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Direction Pill Badge (Top Left of Map) */}
      <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-white text-slate-900 text-[10px] font-bold shadow-md flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        <span>Route Direction: South to North-West</span>
      </div>
    </div>
  );
}
