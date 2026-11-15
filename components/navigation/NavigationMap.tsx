'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Crosshair, Maximize2, Volume2, VolumeX } from 'lucide-react';
import type L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Coordinate, RouteResult, GPSPosition, MapRendererAdapter } from '../../lib/navigation/types';
import { LeafletMapRendererAdapter } from '../../lib/navigation/adapters/MapRendererAdapter';
import { RouteStatsPill } from './RouteStatsPill';

export interface NavigationMapProps {
  workerPosition: Coordinate | null;
  destination: Coordinate;
  route: RouteResult | null;
  gpsAccuracy?: number;
  workerHeading?: number | null;
  isRecalculating?: boolean;
  distanceRemainingMeters?: number;
  durationRemainingSeconds?: number;
  workerName?: string;
  workerAvatar?: string;
  isVoiceMuted?: boolean;
  onToggleVoice?: () => void;
  onAdapterReady?: (adapter: MapRendererAdapter) => void;
  className?: string;
}

export function NavigationMap({
  workerPosition,
  destination,
  route,
  gpsAccuracy,
  workerHeading,
  isRecalculating = false,
  distanceRemainingMeters,
  durationRemainingSeconds,
  workerName = 'Anupam',
  workerAvatar,
  isVoiceMuted = false,
  onToggleVoice,
  onAdapterReady,
  className = 'h-[360px] sm:h-[420px] w-full',
}: NavigationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const adapterRef = useRef<LeafletMapRendererAdapter | null>(null);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);

  // Initialize Map
  useEffect(() => {
    let isMounted = true;
    if (typeof window === 'undefined' || !containerRef.current || leafletMapRef.current) return;

    import('leaflet').then((LModule) => {
      if (!isMounted || !containerRef.current || leafletMapRef.current) return;
      const L = LModule.default || LModule;

      const initialCenter: [number, number] = workerPosition
        ? workerPosition
        : [destination[0] - 0.007, destination[1] - 0.007];

      const map = L.map(containerRef.current, {
        center: initialCenter,
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      // Google Maps Roadmap Tiles - exactly matching existing LiveTrackingGoogleMap
      L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps',
      }).addTo(map);

      // Create Adapter
      const adapter = new LeafletMapRendererAdapter({
        map,
        L,
        workerName,
        workerAvatar,
      });

      // Set destination
      adapter.setDestination({
        lat: destination[0],
        lng: destination[1],
        label: 'Destination',
      });

      // Set worker if available
      if (workerPosition) {
        adapter.setWorkerPosition({
          lat: workerPosition[0],
          lng: workerPosition[1],
          heading: workerHeading,
          accuracy: gpsAccuracy,
        });
      }

      leafletMapRef.current = map;
      adapterRef.current = adapter;
      setIsMapReady(true);

      if (onAdapterReady) {
        onAdapterReady(adapter);
      }
    });

    return () => {
      isMounted = false;
      if (adapterRef.current) {
        adapterRef.current.destroy();
        adapterRef.current = null;
      }
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [destination, onAdapterReady, workerName, workerAvatar]);

  // Update Worker Marker when GPS position updates
  useEffect(() => {
    if (!adapterRef.current || !workerPosition) return;
    adapterRef.current.setWorkerPosition({
      lat: workerPosition[0],
      lng: workerPosition[1],
      heading: workerHeading,
      accuracy: gpsAccuracy,
    });
  }, [workerPosition, workerHeading, gpsAccuracy]);

  // Update Route Polyline when route updates
  useEffect(() => {
    if (!adapterRef.current) return;
    if (route && route.coordinates.length > 1) {
      adapterRef.current.setRoute(
        route.coordinates,
        route.distanceMeters,
        route.durationSeconds
      );
      adapterRef.current.fitBounds({ padding: [40, 40], maxZoom: 16 });
    } else {
      adapterRef.current.clearRoute();
    }
  }, [route]);

  // Recenter camera on worker
  const handleRecenterWorker = useCallback(() => {
    if (!leafletMapRef.current || !workerPosition) return;
    leafletMapRef.current.flyTo(workerPosition, 16, { animate: true, duration: 0.8 });
  }, [workerPosition]);

  // Fit camera to whole route
  const handleFitRoute = useCallback(() => {
    if (!adapterRef.current) return;
    adapterRef.current.fitBounds({ padding: [40, 40], maxZoom: 16 });
  }, []);

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {/* Map Canvas */}
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Floating Top Route Stats Pill (e.g. 4.0 km • 6 min) */}
      <RouteStatsPill
        distanceRemainingMeters={distanceRemainingMeters}
        durationRemainingSeconds={durationRemainingSeconds}
        isRecalculating={isRecalculating}
      />

      {/* Floating Map Floating Action Controls */}
      <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2">
        {/* Recenter Worker Button */}
        <button
          type="button"
          onClick={handleRecenterWorker}
          aria-label="Center on worker"
          title="Center on my location"
          className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-slate-100 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-white active:scale-95 transition-all"
        >
          <Crosshair className="w-5 h-5" />
        </button>

        {/* Fit Route Bounds Button */}
        <button
          type="button"
          onClick={handleFitRoute}
          aria-label="Fit route"
          title="Fit route in view"
          className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-slate-100 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-white active:scale-95 transition-all"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Voice Toggle Button */}
        {onToggleVoice && (
          <button
            type="button"
            onClick={onToggleVoice}
            aria-label={isVoiceMuted ? 'Unmute voice guidance' : 'Mute voice guidance'}
            title={isVoiceMuted ? 'Unmute voice' : 'Mute voice'}
            className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-slate-100 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-white active:scale-95 transition-all"
          >
            {isVoiceMuted ? (
              <VolumeX className="w-4 h-4 text-slate-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-blue-600" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
