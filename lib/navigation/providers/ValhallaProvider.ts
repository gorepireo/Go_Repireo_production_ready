import { Coordinate, IRoutingProvider, RouteResult, RouteStep } from '../types';

/**
 * Decodes Valhalla 6-decimal precision polyline into [lat, lng][] coordinates.
 */
function decodeValhallaPolyline(encoded: string, precision = 6): Coordinate[] {
  const coordinates: Coordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const factor = Math.pow(10, precision);

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push([lat / factor, lng / factor]);
  }

  return coordinates;
}

export class ValhallaProvider implements IRoutingProvider {
  readonly providerName = 'valhalla' as const;

  private baseUrl: string;

  constructor(customUrl?: string) {
    const envUrl =
      typeof process !== 'undefined'
        ? process.env.NEXT_PUBLIC_VALHALLA_URL || process.env.VITE_VALHALLA_URL
        : undefined;

    this.baseUrl = (customUrl || envUrl || 'http://localhost:8002').replace(/\/$/, '');
  }

  async getRoute(origin: Coordinate, destination: Coordinate): Promise<RouteResult> {
    const [startLat, startLng] = origin;
    const [endLat, endLng] = destination;

    const payload = {
      locations: [
        { lat: startLat, lon: startLng, type: 'break' },
        { lat: endLat, lon: endLng, type: 'break' },
      ],
      costing: 'auto',
      costing_options: {
        auto: {
          use_highways: 0.8,
          use_tolls: 0.5,
        },
      },
      directions_options: {
        units: 'kilometers',
        language: 'en-US',
      },
    };

    const url = `${this.baseUrl}/route`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(7000),
    });

    if (!response.ok) {
      throw new Error(`Valhalla routing failed with status: ${response.status}`);
    }

    const data = await response.json();
    const trip = data?.trip;

    if (!trip || !trip.legs || trip.legs.length === 0) {
      throw new Error(data?.status_message || 'No route found by Valhalla');
    }

    const leg = trip.legs[0];
    const encodedShape = leg.shape;
    const coordinates: Coordinate[] = decodeValhallaPolyline(encodedShape, 6);

    const distanceMeters = (trip.summary?.length || 0) * 1000;
    const durationSeconds = trip.summary?.time || 0;

    const steps: RouteStep[] = [];
    if (leg.maneuvers && Array.isArray(leg.maneuvers)) {
      for (const m of leg.maneuvers) {
        const coordIndex = m.begin_shape_index || 0;
        const maneuverLoc: Coordinate = coordinates[coordIndex] || [startLat, startLng];

        steps.push({
          instruction: m.instruction || 'Continue on route',
          distanceMeters: (m.length || 0) * 1000,
          durationSeconds: m.time || 0,
          name: m.street_names ? m.street_names.join(', ') : '',
          maneuver: {
            type: String(m.type || 'turn'),
            modifier: m.verbal_transition_alert_instruction,
            location: maneuverLoc,
            bearingAfter: m.verbal_succinct_transition_instruction,
          },
        });
      }
    }

    return {
      coordinates,
      distanceMeters,
      durationSeconds,
      steps,
      provider: 'valhalla',
      summary: trip.summary?.length ? `${trip.summary.length.toFixed(1)} km via optimal path` : 'Valhalla Route',
      geometryGeoJSON: {
        type: 'LineString',
        coordinates: coordinates.map(([lat, lng]) => [lng, lat]),
      },
    };
  }
}
