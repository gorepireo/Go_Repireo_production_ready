'use client';

import React, { useEffect, useRef, useState } from 'react';
import { RouteStatsPill } from './RouteStatsPill';
import { Coordinate } from '../../lib/navigation/types';

export interface NavigationMapProps {
  customerDestination?: Coordinate; // [lat, lng]
  workerPosition?: Coordinate; // [lat, lng]
  distanceRemainingMeters?: number;
  durationRemainingSeconds?: number;
  isRecalculating?: boolean;
  className?: string;
  olaApiKey?: string;
}

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

  useEffect(() => {
    let isMounted = true;
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    const apiKey =
      olaApiKey ||
      process.env.NEXT_PUBLIC_OLA_MAPS_API_KEY ||
      '';

    // Dynamically import MapLibre GL to prevent SSR window errors
    Promise.all([
      import('maplibre-gl'),
      import('maplibre-gl/dist/maplibre-gl.css' as any),
    ]).then(([maplibreModule]) => {
      if (!isMounted || !mapContainerRef.current || mapInstanceRef.current) return;
      const { Map, Marker, LngLatBounds } = maplibreModule;

      const custLngLat: [number, number] = [customerDestination[1], customerDestination[0]];
      const workLngLat: [number, number] = [workerPosition[1], workerPosition[0]];
      const centerLngLat: [number, number] = [
        (custLngLat[0] + workLngLat[0]) / 2,
        (custLngLat[1] + workLngLat[1]) / 2,
      ];

      // Primary style: Ola Maps light standard (from monizb/ola-maps-demo)
      // Fallback style: OpenStreetMap vector style if Ola API key is unconfigured or unreachable
      const olaStyleUrl = 'https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json';
      const fallbackStyleUrl = {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      };

      const map = new Map({
        container: mapContainerRef.current,
        center: centerLngLat,
        zoom: 13,
        style: apiKey ? (olaStyleUrl as any) : (fallbackStyleUrl as any),
        attributionControl: false,
        transformRequest: (url, resourceType) => {
          // monizb/ola-maps-demo: Replace faulty app.olamaps.io domain with api.olamaps.io
          let modifiedUrl = url.replace('app.olamaps.io', 'api.olamaps.io');

          if (apiKey && modifiedUrl.includes('api.olamaps.io')) {
            const separator = modifiedUrl.includes('?') ? '&' : '?';
            if (!modifiedUrl.includes('api_key=')) {
              modifiedUrl = `${modifiedUrl}${separator}api_key=${apiKey}`;
            }
          }
          return { url: modifiedUrl, resourceType };
        },
      });

      // Graceful fallback: If Ola Maps style errors out (e.g., unauthorized or missing quota), fall back to OSM tiles
      map.on('error', (e) => {
        if (e && e.error && (e.error as any).status === 401) {
          console.warn('[OlaMaps] 401 on vector tiles, switching to fallback tiles:', e.error);
          try {
            map.setStyle(fallbackStyleUrl as any);
          } catch {}
        }
      });

      map.on('load', () => {
        if (!isMounted) return;

        // 1. Worker Marker (Orange Delivery Partner Icon with Pulsing Halo)
        const workerEl = document.createElement('div');
        workerEl.className = 'ola-worker-marker';
        workerEl.innerHTML = `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: 0; background: rgba(59, 130, 246, 0.3); border-radius: 50%; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
            <div style="position: relative; width: 32px; height: 32px; background: #F97316; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; z-index: 10;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
          </div>
        `;
        const workerMarker = new Marker({ element: workerEl, anchor: 'center' })
          .setLngLat(workLngLat)
          .addTo(map);
        workerMarkerRef.current = workerMarker;

        // 2. Customer Destination Marker (Red teardrop with white house icon)
        const destEl = document.createElement('div');
        destEl.className = 'ola-destination-marker';
        destEl.innerHTML = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="background-color: #EF4444; color: white; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.45);">
              <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
              </div>
            </div>
            <div style="width: 8px; height: 8px; background: rgba(0,0,0,0.25); border-radius: 50%; filter: blur(1px); margin-top: -1px;"></div>
          </div>
        `;
        const destMarker = new Marker({ element: destEl, anchor: 'bottom' })
          .setLngLat(custLngLat)
          .addTo(map);
        destMarkerRef.current = destMarker;

        // 3. Draw Blue Road Path
        const midPoint: [number, number] = [
          (workLngLat[0] + custLngLat[0]) / 2 + 0.003,
          (workLngLat[1] + custLngLat[1]) / 2 - 0.002,
        ];
        const routeCoords: [number, number][] = [workLngLat, midPoint, custLngLat];

        map.addSource('delivery-route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: routeCoords,
            },
          },
        });

        // Glow line underlay
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

        // Sharp main blue line
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

        // Fit bounds to fit route
        const bounds = new LngLatBounds(workLngLat, custLngLat);
        map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
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
  }, [customerDestination, workerPosition, olaApiKey]);

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {/* 1. Ola Maps / MapLibre Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0" />

      {/* 2. Floating Top Route Stats Pill (e.g. 3.7 km • 8 min) */}
      <RouteStatsPill
        distanceRemainingMeters={distanceRemainingMeters}
        durationRemainingSeconds={durationRemainingSeconds}
        isRecalculating={isRecalculating}
      />
    </div>
  );
}

export default NavigationMap;
