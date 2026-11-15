import { Coordinate, IRoutingProvider, RouteResult } from '../types';
import { OSRMProvider } from './OSRMProvider';
import { ValhallaProvider } from './ValhallaProvider';

export type ProviderType = 'osrm' | 'valhalla';

/**
 * RoutingAdapter - Provider-independent routing facade with dynamic failover.
 * Configured via NEXT_PUBLIC_ROUTING_PROVIDER or VITE_ROUTING_PROVIDER.
 * Defaults to OSRM for quick testing, supports self-hosted Valhalla for production.
 */
export class RoutingAdapter implements IRoutingProvider {
  private primaryProviderType: ProviderType;
  private osrmProvider: OSRMProvider;
  private valhallaProvider: ValhallaProvider;

  constructor(preferredProvider?: ProviderType) {
    const envProvider = (
      typeof process !== 'undefined' && process.env
        ? process.env.NEXT_PUBLIC_ROUTING_PROVIDER || process.env.VITE_ROUTING_PROVIDER
        : 'osrm'
    ) as ProviderType;

    this.primaryProviderType = preferredProvider || envProvider || 'osrm';
    this.osrmProvider = new OSRMProvider();
    this.valhallaProvider = new ValhallaProvider();
  }

  get providerName(): ProviderType {
    return this.primaryProviderType;
  }

  public setProvider(provider: ProviderType): void {
    this.primaryProviderType = provider;
  }

  public getActiveProvider(): IRoutingProvider {
    return this.primaryProviderType === 'valhalla'
      ? this.valhallaProvider
      : this.osrmProvider;
  }

  public async getRoute(origin: Coordinate, destination: Coordinate): Promise<RouteResult> {
    const activeProvider = this.getActiveProvider();

    try {
      const result = await activeProvider.getRoute(origin, destination);
      return result;
    } catch (primaryErr) {
      // If Valhalla failed, fall back to OSRM automatically
      if (this.primaryProviderType === 'valhalla') {
        console.warn(
          '[RoutingAdapter] Valhalla routing failed or unavailable. Falling back to OSRM:',
          primaryErr
        );
        try {
          const fallbackResult = await this.osrmProvider.getRoute(origin, destination);
          return fallbackResult;
        } catch (fallbackErr) {
          throw new Error(
            `Routing failed for both Valhalla and OSRM: ${(fallbackErr as Error).message}`
          );
        }
      }
      throw primaryErr;
    }
  }
}

// Default singleton instance
export const defaultRoutingAdapter = new RoutingAdapter();
