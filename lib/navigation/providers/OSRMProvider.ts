import { Coordinate, IRoutingProvider, RouteResult, RouteStep } from '../types';

export class OSRMProvider implements IRoutingProvider {
  readonly providerName = 'osrm' as const;

  private endpoints: string[];

  constructor(customUrl?: string) {
    const envUrl =
      typeof process !== 'undefined'
        ? process.env.NEXT_PUBLIC_OSRM_URL || process.env.VITE_OSRM_URL
        : undefined;

    this.endpoints = [
      customUrl || envUrl || 'https://router.project-osrm.org',
      'https://routing.openstreetmap.de/routed-car',
    ].filter(Boolean);
  }

  async getRoute(origin: Coordinate, destination: Coordinate): Promise<RouteResult> {
    const [startLat, startLng] = origin;
    const [endLat, endLng] = destination;

    let lastError: Error | null = null;

    for (const baseUrl of this.endpoints) {
      const url = `${baseUrl.replace(/\/$/, '')}/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true&annotations=distance,duration`;

      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (!response.ok) {
          throw new Error(`OSRM HTTP error: ${response.status}`);
        }

        const data = await response.json();
        if (!data || data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
          throw new Error(data?.message || 'No route found by OSRM');
        }

        const route = data.routes[0];
        const coordinates: Coordinate[] = route.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng] as Coordinate
        );

        const steps: RouteStep[] = [];
        if (route.legs && route.legs.length > 0) {
          for (const leg of route.legs) {
            if (leg.steps) {
              for (const s of leg.steps) {
                const maneuverLoc: Coordinate = s.maneuver?.location
                  ? [s.maneuver.location[1], s.maneuver.location[0]]
                  : [startLat, startLng];

                steps.push({
                  instruction: this.formatInstruction(s),
                  distanceMeters: s.distance || 0,
                  durationSeconds: s.duration || 0,
                  name: s.name || '',
                  maneuver: {
                    type: s.maneuver?.type || 'turn',
                    modifier: s.maneuver?.modifier,
                    location: maneuverLoc,
                    bearingAfter: s.maneuver?.bearing_after,
                    bearingBefore: s.maneuver?.bearing_before,
                  },
                });
              }
            }
          }
        }

        return {
          coordinates,
          distanceMeters: route.distance || 0,
          durationSeconds: route.duration || 0,
          steps,
          provider: 'osrm',
          summary: route.legs?.[0]?.summary || 'Fastest Route',
          geometryGeoJSON: route.geometry,
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    throw lastError || new Error('All OSRM routing endpoints failed.');
  }

  private formatInstruction(step: any): string {
    const maneuver = step.maneuver || {};
    const type = maneuver.type || '';
    const modifier = maneuver.modifier ? ` ${maneuver.modifier}` : '';
    const name = step.name ? ` onto ${step.name}` : '';

    if (type === 'depart') return `Head${modifier}${name}`;
    if (type === 'arrive') return 'Arrive at destination';
    if (type === 'turn') return `Turn${modifier}${name}`;
    if (type === 'new name') return `Continue${name}`;
    if (type === 'roundabout') return `Take roundabout${modifier}${name}`;
    if (type === 'fork') return `Take fork${modifier}${name}`;

    return `${type}${modifier}${name}`.trim() || 'Continue on route';
  }
}
