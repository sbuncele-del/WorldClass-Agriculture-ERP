/**
 * GPS Provider Factory
 * Manages multiple GPS providers and routes requests
 */

import { IGPSProvider, GPSProviderConfig } from './IGPSProvider';
import { CartrackProvider } from './CartrackProvider';
// Future imports:
// import { MixTelematicsProvider } from './MixTelematicsProvider';
// import { CtrackProvider } from './CtrackProvider';

export class GPSProviderFactory {
  private providers: Map<string, IGPSProvider> = new Map();
  private defaultProvider: string | null = null;
  
  /**
   * Initialize GPS providers from configuration
   */
  initialize(configs: GPSProviderConfig[]): void {
    for (const config of configs) {
      if (!config.enabled) {
        continue;
      }
      
      let provider: IGPSProvider | null = null;
      
      switch (config.provider) {
        case 'cartrack':
          provider = new CartrackProvider(config);
          break;
        
        // Future providers:
        // case 'mix':
        //   provider = new MixTelematicsProvider(config);
        //   break;
        // case 'ctrack':
        //   provider = new CtrackProvider(config);
        //   break;
        
        default:
          console.warn(`Unknown GPS provider: ${config.provider}`);
          continue;
      }
      
      if (provider) {
        this.providers.set(config.provider, provider);
        console.log(`✅ GPS Provider initialized: ${provider.getProviderName()}`);
        
        // Set first provider as default
        if (!this.defaultProvider) {
          this.defaultProvider = config.provider;
        }
      }
    }
    
    if (this.providers.size === 0) {
      console.warn('⚠️ No GPS providers configured. GPS tracking will not be available.');
    }
  }
  
  /**
   * Get a specific provider
   */
  getProvider(providerName: string): IGPSProvider | null {
    return this.providers.get(providerName) || null;
  }
  
  /**
   * Get default provider (first enabled provider)
   */
  getDefaultProvider(): IGPSProvider | null {
    if (!this.defaultProvider) {
      return null;
    }
    return this.providers.get(this.defaultProvider) || null;
  }
  
  /**
   * Get all enabled providers
   */
  getAllProviders(): IGPSProvider[] {
    return Array.from(this.providers.values());
  }
  
  /**
   * Check if any GPS provider is available
   */
  hasProviders(): boolean {
    return this.providers.size > 0;
  }
  
  /**
   * Get provider for a specific vehicle
   * This allows different vehicles to use different providers
   */
  getProviderForVehicle(vehicleId: string): IGPSProvider | null {
    // TODO: Implement vehicle-to-provider mapping from database
    // For now, return default provider
    return this.getDefaultProvider();
  }
  
  /**
   * Health check all providers
   */
  async healthCheckAll(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    for (const [name, provider] of this.providers.entries()) {
      const isHealthy = await provider.healthCheck();
      results.set(name, isHealthy);
    }
    
    return results;
  }
}

// Singleton instance
export const gpsProviderFactory = new GPSProviderFactory();
