import { Coordinate } from '../types';

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates high-precision great-circle distance between two coordinates in meters (Haversine formula).
 */
export function calculateDistanceMeters(p1: Coordinate, p2: Coordinate): number {
  const [lat1, lng1] = p1;
  const [lat2, lng2] = p2;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculates compass heading / bearing from p1 to p2 in degrees (0 - 360).
 */
export function calculateBearing(p1: Coordinate, p2: Coordinate): number {
  const [lat1, lng1] = p1;
  const [lat2, lng2] = p2;

  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  return (theta * (180 / Math.PI) + 360) % 360;
}

/**
 * Computes shortest distance from point P to line segment AB in meters.
 */
function distancePointToSegmentMeters(
  point: Coordinate,
  segA: Coordinate,
  segB: Coordinate
): { distanceMeters: number; closestPoint: Coordinate } {
  const [px, py] = point;
  const [ax, ay] = segA;
  const [bx, by] = segB;

  const dx = bx - ax;
  const dy = by - ay;

  if (dx === 0 && dy === 0) {
    return {
      distanceMeters: calculateDistanceMeters(point, segA),
      closestPoint: segA,
    };
  }

  // Parameter t of projection on segment
  let t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));

  const closestPoint: Coordinate = [ax + t * dx, ay + t * dy];
  const distanceMeters = calculateDistanceMeters(point, closestPoint);

  return { distanceMeters, closestPoint };
}

/**
 * Determines whether worker has deviated from the planned polyline route,
 * returning the shortest distance to the route and nearest segment index.
 */
export function checkRouteDeviation(
  workerPos: Coordinate,
  routeCoordinates: Coordinate[],
  deviationThresholdMeters = 35
): {
  isDeviated: boolean;
  minDistanceMeters: number;
  nearestSegmentIndex: number;
  closestPointOnRoute: Coordinate;
} {
  if (routeCoordinates.length < 2) {
    const d = routeCoordinates.length === 1 ? calculateDistanceMeters(workerPos, routeCoordinates[0]) : 0;
    return {
      isDeviated: d > deviationThresholdMeters,
      minDistanceMeters: d,
      nearestSegmentIndex: 0,
      closestPointOnRoute: routeCoordinates[0] || workerPos,
    };
  }

  let minDistanceMeters = Infinity;
  let nearestSegmentIndex = 0;
  let closestPointOnRoute: Coordinate = routeCoordinates[0];

  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const { distanceMeters, closestPoint } = distancePointToSegmentMeters(
      workerPos,
      routeCoordinates[i],
      routeCoordinates[i + 1]
    );

    if (distanceMeters < minDistanceMeters) {
      minDistanceMeters = distanceMeters;
      nearestSegmentIndex = i;
      closestPointOnRoute = closestPoint;
    }
  }

  const isDeviated = minDistanceMeters > deviationThresholdMeters;

  return {
    isDeviated,
    minDistanceMeters,
    nearestSegmentIndex,
    closestPointOnRoute,
  };
}

/**
 * Calculates remaining route distance along polyline from current segment index.
 */
export function calculateRemainingRouteDistance(
  currentPos: Coordinate,
  routeCoordinates: Coordinate[],
  nearestSegmentIndex: number
): number {
  if (routeCoordinates.length === 0) return 0;
  if (nearestSegmentIndex >= routeCoordinates.length - 1) {
    return calculateDistanceMeters(currentPos, routeCoordinates[routeCoordinates.length - 1]);
  }

  // Distance from current position to the start of the next segment node
  let remaining = calculateDistanceMeters(currentPos, routeCoordinates[nearestSegmentIndex + 1]);

  // Plus all subsequent segments along the route
  for (let i = nearestSegmentIndex + 1; i < routeCoordinates.length - 1; i++) {
    remaining += calculateDistanceMeters(routeCoordinates[i], routeCoordinates[i + 1]);
  }

  return remaining;
}

/**
 * Linear interpolation (LERP) between two coordinates for smooth 60 FPS marker translation.
 */
export function interpolateCoordinate(start: Coordinate, target: Coordinate, factor: number): Coordinate {
  const f = Math.max(0, Math.min(1, factor));
  return [
    start[0] + (target[0] - start[0]) * f,
    start[1] + (target[1] - start[1]) * f,
  ];
}

/**
 * Formats distance for clean UI display (e.g. "4.0 km", "350 m").
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Formats duration for clean UI display (e.g. "6 min", "1 hr 12 min").
 */
export function formatDuration(seconds: number): string {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
}

/**
 * Formats speed in km/h.
 */
export function formatSpeedKmh(mps: number | null): number {
  if (!mps || mps <= 0) return 0;
  return Math.round(mps * 3.6);
}
