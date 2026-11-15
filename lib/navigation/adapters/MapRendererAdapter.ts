import type L from 'leaflet';
import { MapRendererAdapter } from '../types';

export interface LeafletAdapterOptions {
  map: L.Map;
  L: typeof L;
  workerName?: string;
  workerAvatar?: string;
  destinationLabel?: string;
}

/**
 * Concrete implementation of MapRendererAdapter connecting to the Leaflet Google Maps renderer.
 * Manages route polylines, worker marker with smooth heading and pulse halo,
 * and customer destination pin.
 */
export class LeafletMapRendererAdapter implements MapRendererAdapter {
  private map: L.Map;
  private L: typeof L;
  private workerName: string;
  private workerAvatar?: string;

  private mainRoutePolyline: L.Polyline | null = null;
  private glowRoutePolyline: L.Polyline | null = null;
  private workerMarker: L.Marker | null = null;
  private destinationMarker: L.Marker | null = null;
  private accuracyCircle: L.Circle | null = null;
  private currentStatus: string = 'idle';

  constructor(options: LeafletAdapterOptions) {
    this.map = options.map;
    this.L = options.L;
    this.workerName = options.workerName || 'Worker';
    this.workerAvatar = options.workerAvatar;
  }

  /**
   * Sets or replaces the active route on the map
   */
  public setRoute(
    coordinates: [number, number][],
    distanceMeters: number,
    durationSeconds: number
  ): void {
    const L = this.L;

    // Clear any prior polylines
    if (this.glowRoutePolyline) {
      this.map.removeLayer(this.glowRoutePolyline);
      this.glowRoutePolyline = null;
    }
    if (this.mainRoutePolyline) {
      this.map.removeLayer(this.mainRoutePolyline);
      this.mainRoutePolyline = null;
    }

    if (!coordinates || coordinates.length < 2) return;

    // Outer glow for route line
    this.glowRoutePolyline = L.polyline(coordinates, {
      color: '#3B82F6',
      weight: 8,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(this.map);

    // Main sharp blue route polyline (matching Swiggy/Zomato live delivery styling)
    this.mainRoutePolyline = L.polyline(coordinates, {
      color: '#007AFF',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(this.map);
  }

  /**
   * Updates worker marker position, accuracy halo, and bearing heading
   */
  public setWorkerPosition(position: {
    lat: number;
    lng: number;
    heading?: number | null;
    accuracy?: number;
  }): void {
    const L = this.L;
    const latLng: [number, number] = [position.lat, position.lng];

    // Optional GPS accuracy circle
    if (position.accuracy && position.accuracy > 5) {
      if (!this.accuracyCircle) {
        this.accuracyCircle = L.circle(latLng, {
          radius: Math.min(position.accuracy, 60),
          color: '#3B82F6',
          weight: 1,
          opacity: 0.3,
          fillColor: '#93C5FD',
          fillOpacity: 0.15,
        }).addTo(this.map);
      } else {
        this.accuracyCircle.setLatLng(latLng);
        this.accuracyCircle.setRadius(Math.min(position.accuracy, 60));
      }
    } else if (this.accuracyCircle) {
      this.map.removeLayer(this.accuracyCircle);
      this.accuracyCircle = null;
    }

    const headingDeg = position.heading ?? 0;
    const workerIconHtml = this.createWorkerIconHtml(headingDeg);

    if (!this.workerMarker) {
      const icon = L.divIcon({
        className: 'custom-worker-nav-marker',
        html: workerIconHtml,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });
      this.workerMarker = L.marker(latLng, { icon, zIndexOffset: 1000 }).addTo(this.map);
    } else {
      this.workerMarker.setLatLng(latLng);
      const icon = L.divIcon({
        className: 'custom-worker-nav-marker',
        html: workerIconHtml,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });
      this.workerMarker.setIcon(icon);
    }
  }

  /**
   * Sets customer destination pin (Red pin with white house icon)
   */
  public setDestination(destination: { lat: number; lng: number; label?: string }): void {
    const L = this.L;
    const latLng: [number, number] = [destination.lat, destination.lng];

    const homeSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
      </svg>
    `;

    const destIconHtml = `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="background-color: #EF4444; color: white; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.45);">
          <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
            ${homeSvg}
          </div>
        </div>
        <div style="width: 8px; height: 8px; background: rgba(0,0,0,0.25); border-radius: 50%; filter: blur(1px); margin-top: -1px;"></div>
      </div>
    `;

    if (!this.destinationMarker) {
      const icon = L.divIcon({
        className: 'custom-destination-marker',
        html: destIconHtml,
        iconSize: [36, 44],
        iconAnchor: [18, 40],
      });
      this.destinationMarker = L.marker(latLng, { icon, zIndexOffset: 900 }).addTo(this.map);
    } else {
      this.destinationMarker.setLatLng(latLng);
    }
  }

  /**
   * Smoothly fits map camera around active route or points
   */
  public fitBounds(options?: { padding?: [number, number]; maxZoom?: number }): void {
    const pad = options?.padding || [50, 50];
    const maxZ = options?.maxZoom || 16;

    if (this.mainRoutePolyline) {
      this.map.fitBounds(this.mainRoutePolyline.getBounds(), { padding: pad, maxZoom: maxZ });
    } else if (this.workerMarker && this.destinationMarker) {
      const bounds = this.L.latLngBounds([
        this.workerMarker.getLatLng(),
        this.destinationMarker.getLatLng(),
      ]);
      this.map.fitBounds(bounds, { padding: pad, maxZoom: maxZ });
    }
  }

  /**
   * Clears route line from map
   */
  public clearRoute(): void {
    if (this.glowRoutePolyline) {
      this.map.removeLayer(this.glowRoutePolyline);
      this.glowRoutePolyline = null;
    }
    if (this.mainRoutePolyline) {
      this.map.removeLayer(this.mainRoutePolyline);
      this.mainRoutePolyline = null;
    }
  }

  /**
   * Sets navigation status description
   */
  public setStatus(status: string): void {
    this.currentStatus = status;
  }

  public destroy(): void {
    this.clearRoute();
    if (this.workerMarker) {
      this.map.removeLayer(this.workerMarker);
      this.workerMarker = null;
    }
    if (this.destinationMarker) {
      this.map.removeLayer(this.destinationMarker);
      this.destinationMarker = null;
    }
    if (this.accuracyCircle) {
      this.map.removeLayer(this.accuracyCircle);
      this.accuracyCircle = null;
    }
  }

  private createWorkerIconHtml(headingDeg: number): string {
    // Delivery partner / technician avatar with halo (matching screenshot orange center + blue wave)
    return `
      <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
        <!-- Pulsing radar wave -->
        <div style="position: absolute; inset: 0; background: rgba(59, 130, 246, 0.25); border-radius: 50%; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
        <!-- Directional indicator dot if heading exists -->
        <div style="position: absolute; width: 6px; height: 6px; background: #2563EB; border-radius: 50%; bottom: 2px;"></div>
        <!-- Worker circular icon -->
        <div style="position: relative; width: 34px; height: 34px; background: #F97316; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25); display: flex; align-items: center; justify-content: center; z-index: 10;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
      </div>
    `;
  }
}
