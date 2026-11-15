/**
 * Standalone Live Navigation Module - Types
 * Production-ready definitions for GPS, Routing, Turn-by-Turn, and Custom Map Rendering.
 * Zero Firebase or Cloud DB dependencies.
 */

export type Coordinate = [number, number]; // [lat, lng]
export type LngLat = [number, number]; // [lng, lat] for GeoJSON

export interface RouteManeuver {
  type: string;
  modifier?: string;
  location: Coordinate;
  bearingAfter?: number;
  bearingBefore?: number;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  name: string;
  maneuver: RouteManeuver;
}

export interface RouteResult {
  coordinates: Coordinate[]; // [lat, lng][] path points
  distanceMeters: number;
  durationSeconds: number;
  steps: RouteStep[];
  provider: 'osrm' | 'valhalla';
  summary?: string;
  geometryGeoJSON?: {
    type: 'LineString';
    coordinates: LngLat[];
  };
}

export interface GPSPosition {
  lat: number;
  lng: number;
  accuracy: number; // in meters
  heading: number | null; // in degrees (0-360)
  speed: number | null; // in meters/second
  timestamp: number;
}

export type GPSStatus =
  | 'idle'
  | 'prompt'
  | 'granted'
  | 'denied'
  | 'searching'
  | 'locked'
  | 'unsupported';

export type NavigationStatus =
  | 'idle'
  | 'navigating'
  | 'paused'
  | 'rerouting'
  | 'arrived'
  | 'failed';

export interface NavigationProgress {
  distanceRemainingMeters: number;
  durationRemainingSeconds: number;
  distanceTraveledMeters: number;
  percentCompleted: number;
  currentStepIndex: number;
  currentInstruction: string;
  nextInstruction: string | null;
  isOffRoute: boolean;
  offRouteDistanceMeters: number;
  currentSpeedKmh: number;
  headingDegrees: number | null;
}

export interface IRoutingProvider {
  readonly providerName: 'osrm' | 'valhalla';
  getRoute(origin: Coordinate, destination: Coordinate): Promise<RouteResult>;
}

export interface MapRendererAdapter {
  setRoute(coordinates: [number, number][], distanceMeters: number, durationSeconds: number): void;
  setWorkerPosition(position: { lat: number; lng: number; heading?: number | null; accuracy?: number }): void;
  setDestination(destination: { lat: number; lng: number; label?: string }): void;
  fitBounds(options?: { padding?: [number, number]; maxZoom?: number }): void;
  clearRoute(): void;
  setStatus(status: string): void;
}

export interface NavigationOrderDetails {
  orderId: string;
  serviceName: string;
  scheduleTime: string;
  phaseText?: string;
  startWorkOtp?: string;
  technicianName: string;
  technicianRating: number;
  technicianReviewsCount: number;
  technicianPhone?: string;
  customerName?: string;
  customerAddress?: string;
}
