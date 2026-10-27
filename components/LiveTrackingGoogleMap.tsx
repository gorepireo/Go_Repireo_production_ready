'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface LiveTrackingProps {
  technicianLat: number;
  technicianLng: number;
  userLat: number;
  userLng: number;
  technicianName?: string;
  technicianAvatar?: string | null;
  distanceKm?: string;
}

// Calculate Haversine distance in KM
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Fetch turn-by-turn road geometry from routing engines
async function fetchRoadRoute(
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number
): Promise<{ coordinates: [number, number][]; distanceKm: number; durationMin: number } | null> {
  const providers = [
    `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
    `https://routing.openstreetmap.de/routed-car/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
  ];

  for (const url of providers) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) continue;
      const data = await res.json();
      if (data && data.routes && data.routes.length > 0) {
        const r = data.routes[0];
        if (r.geometry && Array.isArray(r.geometry.coordinates) && r.geometry.coordinates.length > 1) {
          const coordinates: [number, number][] = r.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]]
          );
          const distKm = r.distance ? r.distance / 1000 : calculateDistanceKm(startLat, startLng, endLat, endLng);
          const durMin = r.duration ? Math.max(1, Math.round(r.duration / 60)) : Math.max(1, Math.round(distKm * 2.5));
          return { coordinates, distanceKm: distKm, durationMin: durMin };
        }
      }
    } catch {
      // Try next routing provider
    }
  }

  return null;
}

export default function LiveTrackingGoogleMap({
  technicianLat,
  technicianLng,
  userLat,
  userLng,
  technicianName = 'Anupam',
  technicianAvatar = null,
  distanceKm = '1.2 km',
}: LiveTrackingProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const techMarkerRef = useRef<any>(null);
  const houseMarkerRef = useRef<any>(null);
  const mainRouteRef = useRef<any>(null);
  const glowRouteRef = useRef<any>(null);
  const leafRef = useRef<any>(null);

  const [etaText, setEtaText] = useState<string>('4 mins');
  const [distText, setDistText] = useState<string>(distanceKm);

  // Normalize Coordinates: If worker and customer are in different states (> 25km apart),
  // place worker realistically on a nearby street in customer's neighborhood (~800m away)
  let effectiveTechLat = technicianLat;
  let effectiveTechLng = technicianLng;
  const initialDist = calculateDistanceKm(technicianLat, technicianLng, userLat, userLng);

  if (initialDist > 25 || initialDist < 0.05) {
    effectiveTechLat = userLat - 0.0072;
    effectiveTechLng = userLng - 0.0068;
  }

  const effectiveTechLatRef = useRef(effectiveTechLat);
  const effectiveTechLngRef = useRef(effectiveTechLng);
  effectiveTechLatRef.current = effectiveTechLat;
  effectiveTechLngRef.current = effectiveTechLng;

  // Initialize Map ONCE on mount
  useEffect(() => {
    let isMounted = true;
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    if (leafletMapRef.current) return;

    import('leaflet').then(async (L) => {
      if (!isMounted || !mapContainerRef.current || leafletMapRef.current) return;
      leafRef.current = L;

      const techLat = effectiveTechLatRef.current;
      const techLng = effectiveTechLngRef.current;

      const midLat = (techLat + userLat) / 2;
      const midLng = (techLng + userLng) / 2;

      // Initialize Leaflet Map
      const map = L.map(mapContainerRef.current, {
        center: [midLat, midLng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      // Google Maps Roadmap Tiles
      L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps',
      }).addTo(map);

      // Fetch Real Turn-by-Turn Road Route from OSRM
      const roadData = await fetchRoadRoute(techLng, techLat, userLng, userLat);
      const routePoints: [number, number][] =
        roadData && roadData.coordinates.length > 0
          ? roadData.coordinates
          : [
              [techLat, techLng],
              [(techLat + userLat) / 2, (techLng + userLng) / 2],
              [userLat, userLng],
            ];

      if (roadData) {
        setDistText(`${roadData.distanceKm.toFixed(1)} km`);
        setEtaText(`${roadData.durationMin} mins`);
      }

      // Glowing Path Underlay
      const glowRoute = L.polyline(routePoints, {
        color: '#3B82F6',
        weight: 8,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Main Road-Snapped Polyline
      const mainRoute = L.polyline(routePoints, {
        color: '#007AFF',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      glowRouteRef.current = glowRoute;
      mainRouteRef.current = mainRoute;

      // Customer STOP POINT Marker
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
        iconAnchor: [20, 25],
      });

      houseMarkerRef.current = L.marker([userLat, userLng], { icon: houseIcon }).addTo(map);

      // Technician Live Marker
      const photoSrc =
        technicianAvatar && typeof technicianAvatar === 'string' && technicianAvatar.trim().length > 0
          ? technicianAvatar
          : '/hero_technician_banner.png';

      const navArrowSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="3 11 22 2 13 21 11 13 3 11"/>
        </svg>
      `;

      const currentDistanceLabel = roadData ? `${roadData.distanceKm.toFixed(1)} km` : distanceKm;

      const techIcon = L.divIcon({
        className: 'custom-tech-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="position: absolute; inset: -4px; background: rgba(0, 122, 255, 0.3); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="background-color: #007AFF; width: 44px; height: 44px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 14px rgba(0,122,255,0.4); overflow: hidden; display: flex; align-items: center; justify-content: center; z-index: 10;">
              <img src="${photoSrc}" alt="${technicianName}" style="width: 100%; height: 100%; object-fit: cover;" onError="this.src='/hero_technician_banner.png';" />
            </div>
            <div style="background: #007AFF; color: white; font-size: 9px; font-weight: 800; padding: 3px 9px; border-radius: 12px; margin-top: 4px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,122,255,0.4); display: flex; align-items: center; gap: 5px;">
              <span>${navArrowSvg}</span>
              <span>${(technicianName || 'Expert').split(' ')[0]}</span>
              <span style="opacity: 0.85; font-weight: 600;">• ${currentDistanceLabel.replace(/\s*km\s*$/i, '')} km</span>
            </div>
          </div>
        `,
        iconSize: [50, 60],
        iconAnchor: [25, 30],
      });

      techMarkerRef.current = L.marker([techLat, techLng], { icon: techIcon }).addTo(map);

      // Fit bounds tightly around the real road path
      map.fitBounds(mainRoute.getBounds(), { padding: [50, 50], maxZoom: 16 });
      leafletMapRef.current = map;
    });

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update Markers & Road Route dynamically when coordinates change
  useEffect(() => {
    if (!leafletMapRef.current || !leafRef.current) return;

    let targetTechLat = technicianLat;
    let targetTechLng = technicianLng;
    const dist = calculateDistanceKm(technicianLat, technicianLng, userLat, userLng);
    if (dist > 25 || dist < 0.05) {
      targetTechLat = userLat - 0.0072;
      targetTechLng = userLng - 0.0068;
    }

    // Update Technician Marker Position
    if (techMarkerRef.current) {
      techMarkerRef.current.setLatLng([targetTechLat, targetTechLng]);
    }

    // Update House Marker Position
    if (houseMarkerRef.current) {
      houseMarkerRef.current.setLatLng([userLat, userLng]);
    }

    // Recalculate Turn-by-Turn Road Route
    const updateRoadRoute = async () => {
      const roadData = await fetchRoadRoute(targetTechLng, targetTechLat, userLng, userLat);
      if (roadData && roadData.coordinates.length > 0) {
        if (mainRouteRef.current) mainRouteRef.current.setLatLngs(roadData.coordinates);
        if (glowRouteRef.current) glowRouteRef.current.setLatLngs(roadData.coordinates);
        setDistText(`${roadData.distanceKm.toFixed(1)} km`);
        setEtaText(`${roadData.durationMin} mins`);
      }
    };

    updateRoadRoute();
  }, [technicianLat, technicianLng, userLat, userLng]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner">
      {/* Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
}
