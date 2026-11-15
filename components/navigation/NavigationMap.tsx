'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { RouteStatsPill } from './RouteStatsPill';
import { Coordinate } from '../../lib/navigation/types';
import { Crosshair, Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-react';
import { OSRMProvider } from '../../lib/navigation/providers/OSRMProvider';

export interface NavigationMapProps {
  customerDestination?: Coordinate; // [lat, lng]
  workerPosition?: Coordinate; // [lat, lng]
  distanceRemainingMeters?: number;
  durationRemainingSeconds?: number;
  isRecalculating?: boolean;
  className?: string;
  olaApiKey?: string;
}

// In-memory CartoDB Voyager raster style spec:
// Guaranteed 100% reliable zero-auth style with clear road networks,
// town names (Debra, Balichak), greens, and smooth performance.
const CARTO_VOYAGER_STYLE: any = {
  version: 8,
  name: 'CartoDB Voyager',
  sources: {
    'carto-voyager': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '&copy; CartoDB &copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'carto-voyager-tiles',
      type: 'raster',
      source: 'carto-voyager',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

export function NavigationMap({
  customerDestination = [22.3955519, 87.5615995], // Debra [lat, lng]
  workerPosition = [22.3680, 87.5450], // Balichak [lat, lng]
  distanceRemainingMeters = 3700,
  durationRemainingSeconds = 480,
  isRecalculating = false,
  className = 'h-[380px] sm:h-[440px] w-full',
  olaApiKey,
}: NavigationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const workerMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);

  // Floating controls state
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Destructure primitive coordinates to prevent infinite React re-render cycles
  const custLat = customerDestination[0];
  const custLng = customerDestination[1];
  const workLat = workerPosition[0];
  const workLng = workerPosition[1];

  // 1. Ensure MapLibre stylesheet is dynamically injected into head
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const linkId = 'maplibre-gl-cdn-css';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
      document.head.appendChild(link);
    }
  }, []);

  // 2. Initialize MapLibre instance ONCE
  useEffect(() => {
    let isMounted = true;
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    const apiKey =
      olaApiKey ||
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_OLA_MAPS_API_KEY) ||
      '';

    // Style URL for Ola Maps (monizb/ola-maps-demo) vs zero-auth Voyager fallback
    const olaStyleUrl = 'https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json';
    const initialStyle = apiKey ? olaStyleUrl : CARTO_VOYAGER_STYLE;

    import('maplibre-gl').then((maplibreModule) => {
      if (!isMounted || !mapContainerRef.current) return;
      const { Map, Marker, LngLatBounds } = maplibreModule;

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const custLngLat: [number, number] = [custLng, custLat];
      const workLngLat: [number, number] = [workLng, workLat];
      const centerLngLat: [number, number] = [
        (custLngLat[0] + workLngLat[0]) / 2,
        (custLngLat[1] + workLngLat[1]) / 2,
      ];

      const map = new Map({
        container: mapContainerRef.current,
        center: centerLngLat,
        zoom: 13,
        style: initialStyle,
        attributionControl: false,
        transformRequest: (url: string) => {
          // monizb/ola-maps-demo domain rewrite: replace app.olamaps.io with api.olamaps.io
          let modifiedUrl = url.replace('app.olamaps.io', 'api.olamaps.io');

          if (apiKey && modifiedUrl.includes('api.olamaps.io')) {
            const separator = modifiedUrl.includes('?') ? '&' : '?';
            if (!modifiedUrl.includes('api_key=')) {
              modifiedUrl = `${modifiedUrl}${separator}api_key=${apiKey}`;
            }
          }
          return { url: modifiedUrl };
        },
      });

      // Handle 401 / 403 authorization failures on Ola Maps by falling back to CartoDB Voyager
      let hasFallenBack = false;
      map.on('error', (e) => {
        const status = (e?.error as any)?.status;
        if (!hasFallenBack && (status === 401 || status === 403)) {
          hasFallenBack = true;
          console.warn('[OlaMaps] Authorization required. Falling back to CartoDB Voyager style.');
          try {
            map.setStyle(CARTO_VOYAGER_STYLE);
          } catch {}
        }
      });

      // Resize triggers to guarantee canvas expands
      setTimeout(() => {
        if (isMounted && map) map.resize();
      }, 100);
      setTimeout(() => {
        if (isMounted && map) map.resize();
      }, 500);

      map.on('load', async () => {
        if (!isMounted) return;
        map.resize();

        // 1. Worker Marker (Orange Delivery Partner Marker with Radar Pulse Halo)
        const workerEl = document.createElement('div');
        workerEl.className = 'ola-worker-marker cursor-pointer select-none';
        workerEl.innerHTML = `
          <div style="position: relative; width: 46px; height: 46px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: 0; background: rgba(59, 130, 246, 0.35); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; inset: 3px; background: rgba(59, 130, 246, 0.2); border-radius: 50%;"></div>
            <div style="position: relative; width: 34px; height: 34px; background: #F97316; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4); display: flex; align-items: center; justify-content: center; z-index: 10;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
          </div>
        `;
        const workerMarker = new Marker({ element: workerEl, anchor: 'center' })
          .setLngLat(workLngLat)
          .addTo(map);
        workerMarkerRef.current = workerMarker;

        // 2. Customer Destination Marker (Red Teardrop with White House Icon)
        const destEl = document.createElement('div');
        destEl.className = 'ola-destination-marker cursor-pointer select-none';
        destEl.innerHTML = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="background-color: #EF4444; color: white; width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.45);">
              <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
              </div>
            </div>
            <div style="width: 10px; height: 10px; background: rgba(0,0,0,0.3); border-radius: 50%; filter: blur(1.5px); margin-top: -2px;"></div>
          </div>
        `;
        const destMarker = new Marker({ element: destEl, anchor: 'bottom' })
          .setLngLat(custLngLat)
          .addTo(map);
        destMarkerRef.current = destMarker;

        // 3. Road Route Polyline (Delivery Path)
        // Default road waypoints connecting Balichak and Debra
        let polylineCoords: [number, number][] = [
          workLngLat,
          [workLngLat[0] + (custLngLat[0] - workLngLat[0]) * 0.35 + 0.002, workLngLat[1] + (custLngLat[1] - workLngLat[1]) * 0.35 - 0.001],
          [workLngLat[0] + (custLngLat[0] - workLngLat[0]) * 0.65 - 0.001, workLngLat[1] + (custLngLat[1] - workLngLat[1]) * 0.65 + 0.002],
          custLngLat,
        ];

        // Attempt to fetch real driving road route from OSRM
        try {
          const router = new OSRMProvider();
          const routeResult = await router.getRoute([workLat, workLng], [custLat, custLng]);
          if (routeResult?.coordinates && routeResult.coordinates.length > 1) {
            polylineCoords = routeResult.coordinates.map(([lat, lng]) => [lng, lat]);
          }
        } catch {
          // Keep default smooth waypoints if OSRM is unreachable
        }

        if (!map.getSource('delivery-route')) {
          map.addSource('delivery-route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: polylineCoords,
              },
            },
          });

          // Route glow underlay
          map.addLayer({
            id: 'route-glow',
            type: 'line',
            source: 'delivery-route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#3B82F6',
              'line-width': 8,
              'line-opacity': 0.35,
            },
          });

          // Sharp blue delivery line
          map.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'delivery-route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#007AFF',
              'line-width': 5,
              'line-opacity': 0.95,
            },
          });
        }

        // Fit bounds around worker & customer destination
        try {
          const bounds = new LngLatBounds(workLngLat, custLngLat);
          map.fitBounds(bounds, {
            padding: { top: 75, bottom: 50, left: 45, right: 45 },
            maxZoom: 15,
          });
        } catch {}
      });

      mapInstanceRef.current = map;
    });

    return () => {
      isMounted = false;
      if (workerMarkerRef.current) {
        workerMarkerRef.current.remove();
        workerMarkerRef.current = null;
      }
      if (destMarkerRef.current) {
        destMarkerRef.current.remove();
        destMarkerRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [olaApiKey]); // Stable: only re-creates map if API key setting explicitly changes

  // 3. Smoothly update marker coordinates when worker or customer coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const custLngLat: [number, number] = [custLng, custLat];
    const workLngLat: [number, number] = [workLng, workLat];

    if (workerMarkerRef.current) {
      workerMarkerRef.current.setLngLat(workLngLat);
    }
    if (destMarkerRef.current) {
      destMarkerRef.current.setLngLat(custLngLat);
    }

    const routeSource = map.getSource('delivery-route');
    if (routeSource) {
      const midPoint: [number, number] = [
        (workLngLat[0] + custLngLat[0]) / 2 + 0.002,
        (workLngLat[1] + custLngLat[1]) / 2 - 0.001,
      ];
      routeSource.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [workLngLat, midPoint, custLngLat],
        },
      });
    }
  }, [custLat, custLng, workLat, workLng]);

  // Recenter handler for the circular target button
  const handleRecenter = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    import('maplibre-gl').then(({ LngLatBounds }) => {
      const bounds = new LngLatBounds([workLng, workLat], [custLng, custLat]);
      map.fitBounds(bounds, {
        padding: { top: 75, bottom: 50, left: 45, right: 45 },
        maxZoom: 15,
        duration: 800,
      });
    });
  }, [workLng, workLat, custLng, custLat]);

  // Fullscreen toggle handler
  const handleToggleFullscreen = useCallback(() => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
    setTimeout(() => {
      mapInstanceRef.current?.resize();
    }, 200);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`relative overflow-hidden bg-[#e5e9ec] select-none ${className}`}
    >
      {/* 1. MapLibre / Ola Maps Canvas */}
      <div
        ref={mapContainerRef}
        className="w-full h-full absolute inset-0 z-0"
        style={{ minHeight: '380px', width: '100%', height: '100%' }}
      />

      {/* 2. Floating Top Route Stats Pill (e.g. 4.0 km • 6 min) */}
      <RouteStatsPill
        distanceRemainingMeters={distanceRemainingMeters}
        durationRemainingSeconds={durationRemainingSeconds}
        isRecalculating={isRecalculating}
      />

      {/* 3. Floating Right Control Buttons (Recenter, Fullscreen, Mute) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2.5">
        {/* Recenter / Focus Route Button */}
        <button
          type="button"
          onClick={handleRecenter}
          aria-label="Recenter map"
          className="w-10 h-10 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 shadow-md flex items-center justify-center transition-transform active:scale-90 border border-slate-200/60 backdrop-blur-sm cursor-pointer"
        >
          <Crosshair className="w-5 h-5 text-slate-700" />
        </button>

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={handleToggleFullscreen}
          aria-label="Toggle fullscreen"
          className="w-10 h-10 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 shadow-md flex items-center justify-center transition-transform active:scale-90 border border-slate-200/60 backdrop-blur-sm cursor-pointer"
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-slate-700" />
          ) : (
            <Maximize2 className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Audio / Voice Guidance Toggle Button */}
        <button
          type="button"
          onClick={() => setIsMuted((prev) => !prev)}
          aria-label={isMuted ? 'Unmute voice' : 'Mute voice'}
          className="w-10 h-10 rounded-full bg-white/95 hover:bg-white text-blue-600 shadow-md flex items-center justify-center transition-transform active:scale-90 border border-slate-200/60 backdrop-blur-sm cursor-pointer"
        >
          {isMuted ? (
            <VolumeX className="w-4.5 h-4.5 text-slate-600" />
          ) : (
            <Volume2 className="w-4.5 h-4.5 text-blue-600" />
          )}
        </button>
      </div>
    </div>
  );
}

export default NavigationMap;
