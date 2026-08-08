'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock, Navigation } from 'lucide-react';

interface LiveTrackingProps {
  technicianLat: number;
  technicianLng: number;
  userLat: number;
  userLng: number;
  technicianName?: string;
  technicianAvatar?: string | null;
  distanceKm?: string;
}

export default function LiveTrackingGoogleMap({
  technicianLat,
  technicianLng,
  userLat,
  userLng,
  technicianName = 'Rohit Sharma',
  technicianAvatar = null,
  distanceKm = '2.4 km'
}: LiveTrackingProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const [etaText, setEtaText] = useState<string>('');
  const [distText, setDistText] = useState<string>(distanceKm);

  useEffect(() => {
    let isMounted = true;
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    import('leaflet').then(async (L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous map instance if it exists
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      // Calculate mid point for map center
      const midLat = (technicianLat + userLat) / 2;
      const midLng = (technicianLng + userLng) / 2;

      // Initialize Leaflet Map
      const map = L.map(mapContainerRef.current, {
        center: [midLat, midLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      // Official Google Maps Roadmap Tiles
      L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps'
      }).addTo(map);

      // Fetch Real Road Geometry & ETA via OSRM Routing API
      let routePoints: [number, number][] = [];
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${technicianLng},${technicianLat};${userLng},${userLat}?overview=full&geometries=geojson`;
        const res = await fetch(osrmUrl);
        const data = await res.json();
        
        if (data && data.routes && data.routes.length > 0) {
          const r = data.routes[0];
          if (r.geometry) {
            routePoints = r.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
          }
          if (r.distance) {
            const calculatedDist = (r.distance / 1000).toFixed(1) + ' km';
            setDistText(calculatedDist);
          }
          if (r.duration) {
            const mins = Math.max(1, Math.round(r.duration / 60));
            setEtaText(`${mins} mins`);
          }
        }
      } catch (err) {
        console.warn("OSRM road route fetch fallback:", err);
      }

      // Fallback straight-line waypoints if OSRM fails
      if (routePoints.length === 0) {
        routePoints = [
          [technicianLat, technicianLng],
          [userLat, userLng]
        ];
      }

      // Outer Polyline Glow
      L.polyline(routePoints, {
        color: '#3B82F6',
        weight: 10,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Main Road Polyline
      const mainRoute = L.polyline(routePoints, {
        color: '#007AFF',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // 1. Clean SVG Destination Home Marker
      const homeSvgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      `;

      const houseIcon = L.divIcon({
        className: 'custom-house-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="background-color: #10B981; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">
              ${homeSvgIcon}
            </div>
            <div style="background: rgba(15, 23, 42, 0.95); color: white; font-size: 9px; font-weight: 800; padding: 2.5px 8px; border-radius: 10px; margin-top: 4px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.2); letter-spacing: 0.5px;">
              STOP POINT
            </div>
          </div>
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 25]
      });
      L.marker([userLat, userLng], { icon: houseIcon }).addTo(map);

      // 2. Clean Live Technician Marker (Avatar photo or Initial Badge fallback)
      const initialChar = (technicianName || 'Expert').charAt(0).toUpperCase();
      const hasValidAvatarUrl = technicianAvatar && typeof technicianAvatar === 'string' && technicianAvatar.trim().length > 0 && !technicianAvatar.includes('hero_technician');

      const avatarHtml = hasValidAvatarUrl ? `
        <img src="${technicianAvatar}" alt="${technicianName}" style="width: 100%; height: 100%; object-fit: cover;" onError="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
        <div style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, #007AFF, #3B82F6); color: white; font-weight: 900; font-size: 16px; align-items: center; justify-content: center;">${initialChar}</div>
      ` : `
        <div style="display: flex; width: 100%; height: 100%; background: linear-gradient(135deg, #007AFF, #3B82F6); color: white; font-weight: 900; font-size: 16px; align-items: center; justify-content: center;">${initialChar}</div>
      `;

      const navArrowSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="3 11 22 2 13 21 11 13 3 11"/>
        </svg>
      `;

      const techIcon = L.divIcon({
        className: 'custom-tech-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="position: absolute; inset: -4px; background: rgba(0, 122, 255, 0.3); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="background-color: #007AFF; width: 44px; height: 44px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 14px rgba(0,122,255,0.4); overflow: hidden; display: flex; align-items: center; justify-content: center; z-index: 10;">
              ${avatarHtml}
            </div>
            <div style="background: #007AFF; color: white; font-size: 9px; font-weight: 800; padding: 3px 9px; border-radius: 12px; margin-top: 4px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,122,255,0.4); display: flex; align-items: center; gap: 5px;">
              <span>${navArrowSvg}</span>
              <span>${(technicianName || 'Expert').split(' ')[0]}</span>
              <span style="opacity: 0.85; font-weight: 600;">• ${(distText || distanceKm || '').replace(/\s*km\s*$/i, '')} km</span>
            </div>
          </div>
        `,
        iconSize: [50, 60],
        iconAnchor: [25, 30]
      });
      L.marker([technicianLat, technicianLng], { icon: techIcon }).addTo(map);

      // Fit map bounds to show full route
      map.fitBounds(mainRoute.getBounds(), { padding: [40, 40] });

      leafletMapRef.current = map;
    });

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [technicianLat, technicianLng, userLat, userLng, technicianName, technicianAvatar, distanceKm]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner">
      {/* Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Direction Pill Badge */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-100 text-slate-900 text-[10px] font-extrabold shadow-md flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#007AFF] animate-pulse"></span>
        <span>Real-Time Navigation</span>
      </div>

      {/* ETA & Distance Pill Badge */}
      <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-100 text-slate-900 shadow-md flex items-center gap-2">
        <Clock size={14} className="text-[#007AFF]" />
        <div>
          <span className="text-xs font-black text-slate-900 block leading-tight">
            {etaText || '12 mins'}
          </span>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
            {distText || distanceKm || '2.4 km'}
          </span>
        </div>
      </div>
    </div>
  );
}
