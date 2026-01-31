/**
 * Vehicle Tracking Provider Integration Service
 * 
 * Consolidates data from multiple tracking providers:
 * - MiX Telematics
 * - Netstar
 * - Ctrack
 * - Tracker SA
 * - Cartrack
 * - Custom API providers
 * 
 * Normalizes data into a unified format for the ERP system.
 */

import axios, { AxiosInstance } from 'axios';
import pool from '../../config/database';

// Unified Vehicle Position Interface
export interface VehiclePosition {
  vehicleId: string;
  registration: string;
  providerId: string;
  providerName: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  altitude?: number;
  ignition: boolean;
  odometer?: number;
  fuelLevel?: number;
  driver?: string;
  tripId?: string;
  timestamp: Date;
  rawData?: Record<string, unknown>;
}

// Provider Configuration
export interface TrackingProviderConfig {
  id: string;
  name: string;
  type: 'mix_telematics' | 'netstar' | 'ctrack' | 'tracker_sa' | 'cartrack' | 'custom';
  apiUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  webhookSecret?: string;
  refreshToken?: string;
  accessToken?: string;
  tokenExpiry?: Date;
  enabled: boolean;
  syncInterval: number; // seconds
  lastSync?: Date;
}

// Provider Status
export interface ProviderStatus {
  id: string;
  name: string;
  connected: boolean;
  vehicleCount: number;
  lastSync: Date | null;
  errorMessage?: string;
}

class TrackingProvidersService {
  private providers: Map<string, TrackingProviderConfig> = new Map();
  private apiClients: Map<string, AxiosInstance> = new Map();
  private positions: Map<string, VehiclePosition> = new Map();

  constructor() {
    this.loadProviders();
  }

  /**
   * Load provider configurations from database
   */
  async loadProviders(): Promise<void> {
    try {
      const result = await pool.query(`
        SELECT * FROM logistics.tracking_providers WHERE enabled = true
      `);

      result.rows.forEach((row: TrackingProviderConfig) => {
        this.providers.set(row.id, row);
        this.initializeApiClient(row);
      });

      console.log(`Loaded ${this.providers.size} tracking providers`);
    } catch (error) {
      console.error('Error loading tracking providers:', error);
    }
  }

  /**
   * Initialize API client for a provider
   */
  private initializeApiClient(config: TrackingProviderConfig): void {
    const client = axios.create({
      baseURL: config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Add auth interceptor based on provider type
    client.interceptors.request.use(async (requestConfig) => {
      const provider = this.providers.get(config.id);
      if (!provider) return requestConfig;

      switch (provider.type) {
        case 'mix_telematics':
          requestConfig.headers['Authorization'] = `Bearer ${await this.getMixToken(provider)}`;
          break;
        case 'netstar':
          requestConfig.headers['X-Api-Key'] = provider.apiKey;
          break;
        case 'ctrack':
          requestConfig.headers['Authorization'] = `Basic ${Buffer.from(`${provider.username}:${provider.password}`).toString('base64')}`;
          break;
        case 'tracker_sa':
          requestConfig.headers['Authorization'] = `Bearer ${provider.apiKey}`;
          break;
        case 'cartrack':
          requestConfig.params = { ...requestConfig.params, api_key: provider.apiKey };
          break;
        case 'custom':
          if (provider.apiKey) {
            requestConfig.headers['Authorization'] = `Bearer ${provider.apiKey}`;
          }
          break;
      }

      return requestConfig;
    });

    this.apiClients.set(config.id, client);
  }

  /**
   * MiX Telematics OAuth token management
   */
  private async getMixToken(provider: TrackingProviderConfig): Promise<string> {
    // Check if token is still valid
    if (provider.accessToken && provider.tokenExpiry && new Date() < provider.tokenExpiry) {
      return provider.accessToken;
    }

    // Refresh token
    try {
      const response = await axios.post(`${provider.apiUrl}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
      });

      provider.accessToken = response.data.access_token;
      provider.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));

      // Update in database
      await pool.query(`
        UPDATE logistics.tracking_providers 
        SET access_token = $1, token_expiry = $2 
        WHERE id = $3
      `, [provider.accessToken, provider.tokenExpiry, provider.id]);

      return provider.accessToken;
    } catch (error) {
      console.error('Error refreshing MiX token:', error);
      throw error;
    }
  }

  /**
   * Fetch positions from all providers
   */
  async fetchAllPositions(): Promise<VehiclePosition[]> {
    const allPositions: VehiclePosition[] = [];

    for (const [providerId, provider] of this.providers) {
      try {
        const positions = await this.fetchProviderPositions(provider);
        allPositions.push(...positions);
        
        // Update last sync
        provider.lastSync = new Date();
        await pool.query(`
          UPDATE logistics.tracking_providers SET last_sync = $1 WHERE id = $2
        `, [provider.lastSync, providerId]);
      } catch (error) {
        console.error(`Error fetching from provider ${provider.name}:`, error);
      }
    }

    // Store positions in memory
    allPositions.forEach(pos => {
      this.positions.set(pos.vehicleId, pos);
    });

    return allPositions;
  }

  /**
   * Fetch positions from a specific provider
   */
  private async fetchProviderPositions(provider: TrackingProviderConfig): Promise<VehiclePosition[]> {
    const client = this.apiClients.get(provider.id);
    if (!client) return [];

    switch (provider.type) {
      case 'mix_telematics':
        return this.fetchMixPositions(client, provider);
      case 'netstar':
        return this.fetchNetstarPositions(client, provider);
      case 'ctrack':
        return this.fetchCtrackPositions(client, provider);
      case 'tracker_sa':
        return this.fetchTrackerSAPositions(client, provider);
      case 'cartrack':
        return this.fetchCartrackPositions(client, provider);
      case 'custom':
        return this.fetchCustomPositions(client, provider);
      default:
        return [];
    }
  }

  /**
   * MiX Telematics API Integration
   */
  private async fetchMixPositions(client: AxiosInstance, provider: TrackingProviderConfig): Promise<VehiclePosition[]> {
    try {
      const response = await client.get('/api/v2/positions/latest');
      
      return response.data.map((item: Record<string, unknown>) => ({
        vehicleId: `MIX-${item.AssetId}`,
        registration: item.RegistrationNumber as string,
        providerId: provider.id,
        providerName: 'MiX Telematics',
        lat: item.Latitude as number,
        lng: item.Longitude as number,
        speed: item.SpeedKmh as number || 0,
        heading: item.Heading as number || 0,
        ignition: item.IgnitionOn as boolean || false,
        odometer: item.OdometerKm as number,
        fuelLevel: item.FuelPercentage as number,
        timestamp: new Date(item.Timestamp as string),
        rawData: item
      }));
    } catch (error) {
      console.error('MiX Telematics API error:', error);
      return [];
    }
  }

  /**
   * Netstar API Integration
   */
  private async fetchNetstarPositions(client: AxiosInstance, provider: TrackingProviderConfig): Promise<VehiclePosition[]> {
    try {
      const response = await client.get('/fleet/vehicles/positions');
      
      return response.data.vehicles.map((item: Record<string, unknown>) => ({
        vehicleId: `NET-${item.vehicle_id}`,
        registration: item.registration as string,
        providerId: provider.id,
        providerName: 'Netstar',
        lat: item.latitude as number,
        lng: item.longitude as number,
        speed: item.speed as number || 0,
        heading: item.direction as number || 0,
        ignition: (item.status as string) === 'moving' || (item.status as string) === 'idling',
        timestamp: new Date(item.timestamp as string),
        rawData: item
      }));
    } catch (error) {
      console.error('Netstar API error:', error);
      return [];
    }
  }

  /**
   * Ctrack API Integration
   */
  private async fetchCtrackPositions(client: AxiosInstance, provider: TrackingProviderConfig): Promise<VehiclePosition[]> {
    try {
      const response = await client.get('/v1/vehicles/positions');
      
      return response.data.data.map((item: Record<string, unknown>) => ({
        vehicleId: `CTR-${item.id}`,
        registration: item.reg_number as string,
        providerId: provider.id,
        providerName: 'Ctrack',
        lat: (item.position as Record<string, unknown>)?.lat as number,
        lng: (item.position as Record<string, unknown>)?.lon as number,
        speed: item.speed as number || 0,
        heading: item.bearing as number || 0,
        ignition: item.ignition_on as boolean,
        odometer: item.odometer as number,
        timestamp: new Date(item.gps_time as string),
        rawData: item
      }));
    } catch (error) {
      console.error('Ctrack API error:', error);
      return [];
    }
  }

  /**
   * Tracker SA API Integration
   */
  private async fetchTrackerSAPositions(client: AxiosInstance, provider: TrackingProviderConfig): Promise<VehiclePosition[]> {
    try {
      const response = await client.get('/api/fleet/current-positions');
      
      return response.data.map((item: Record<string, unknown>) => ({
        vehicleId: `TRK-${item.unit_id}`,
        registration: item.vehicle_reg as string,
        providerId: provider.id,
        providerName: 'Tracker SA',
        lat: item.lat as number,
        lng: item.lon as number,
        speed: item.speed_kmh as number || 0,
        heading: item.course as number || 0,
        ignition: item.ignition as boolean,
        timestamp: new Date(item.event_time as string),
        rawData: item
      }));
    } catch (error) {
      console.error('Tracker SA API error:', error);
      return [];
    }
  }

  /**
   * Cartrack API Integration
   */
  private async fetchCartrackPositions(client: AxiosInstance, provider: TrackingProviderConfig): Promise<VehiclePosition[]> {
    try {
      const response = await client.get('/api/v1/fleet/positions');
      
      return response.data.results.map((item: Record<string, unknown>) => ({
        vehicleId: `CAR-${item.asset_id}`,
        registration: item.registration as string,
        providerId: provider.id,
        providerName: 'Cartrack',
        lat: item.latitude as number,
        lng: item.longitude as number,
        speed: item.speed as number || 0,
        heading: item.heading as number || 0,
        ignition: (item.state as string) !== 'parked',
        fuelLevel: item.fuel_percent as number,
        timestamp: new Date(item.timestamp as string),
        rawData: item
      }));
    } catch (error) {
      console.error('Cartrack API error:', error);
      return [];
    }
  }

  /**
   * Custom API Integration (Generic)
   */
  private async fetchCustomPositions(client: AxiosInstance, provider: TrackingProviderConfig): Promise<VehiclePosition[]> {
    try {
      const response = await client.get('/positions');
      
      // Assuming standard format - can be customized per provider
      return response.data.map((item: Record<string, unknown>) => ({
        vehicleId: `CUSTOM-${provider.id}-${item.id}`,
        registration: (item.registration || item.reg || item.vehicle_number) as string,
        providerId: provider.id,
        providerName: provider.name,
        lat: (item.lat || item.latitude) as number,
        lng: (item.lng || item.lon || item.longitude) as number,
        speed: (item.speed || item.speed_kmh || 0) as number,
        heading: (item.heading || item.direction || 0) as number,
        ignition: (item.ignition || item.engine_on || false) as boolean,
        timestamp: new Date((item.timestamp || item.time || new Date()) as string),
        rawData: item
      }));
    } catch (error) {
      console.error(`Custom provider ${provider.name} API error:`, error);
      return [];
    }
  }

  /**
   * Process incoming webhook from tracking provider
   */
  async processWebhook(providerId: string, data: Record<string, unknown>): Promise<VehiclePosition | null> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      console.error(`Unknown provider: ${providerId}`);
      return null;
    }

    let position: VehiclePosition | null = null;

    switch (provider.type) {
      case 'mix_telematics':
        position = this.parseMixWebhook(data, provider);
        break;
      case 'netstar':
        position = this.parseNetstarWebhook(data, provider);
        break;
      case 'custom':
        position = this.parseCustomWebhook(data, provider);
        break;
      default:
        console.warn(`Webhook parsing not implemented for ${provider.type}`);
    }

    if (position) {
      this.positions.set(position.vehicleId, position);
      
      // Store in database
      await this.storePosition(position);
    }

    return position;
  }

  private parseMixWebhook(data: Record<string, unknown>, provider: TrackingProviderConfig): VehiclePosition {
    return {
      vehicleId: `MIX-${data.AssetId}`,
      registration: data.RegistrationNumber as string,
      providerId: provider.id,
      providerName: 'MiX Telematics',
      lat: data.Latitude as number,
      lng: data.Longitude as number,
      speed: data.SpeedKmh as number || 0,
      heading: data.Heading as number || 0,
      ignition: data.IgnitionOn as boolean,
      timestamp: new Date(data.Timestamp as string),
      rawData: data
    };
  }

  private parseNetstarWebhook(data: Record<string, unknown>, provider: TrackingProviderConfig): VehiclePosition {
    return {
      vehicleId: `NET-${data.vehicle_id}`,
      registration: data.registration as string,
      providerId: provider.id,
      providerName: 'Netstar',
      lat: data.latitude as number,
      lng: data.longitude as number,
      speed: data.speed as number || 0,
      heading: data.direction as number || 0,
      ignition: (data.status as string) === 'moving',
      timestamp: new Date(data.timestamp as string),
      rawData: data
    };
  }

  private parseCustomWebhook(data: Record<string, unknown>, provider: TrackingProviderConfig): VehiclePosition {
    return {
      vehicleId: `CUSTOM-${provider.id}-${data.id}`,
      registration: (data.registration || data.reg) as string,
      providerId: provider.id,
      providerName: provider.name,
      lat: (data.lat || data.latitude) as number,
      lng: (data.lng || data.longitude) as number,
      speed: (data.speed || 0) as number,
      heading: (data.heading || 0) as number,
      ignition: (data.ignition || false) as boolean,
      timestamp: new Date((data.timestamp || new Date()) as string),
      rawData: data
    };
  }

  /**
   * Store position in database
   */
  private async storePosition(position: VehiclePosition): Promise<void> {
    try {
      await pool.query(`
        INSERT INTO logistics.vehicle_positions 
        (vehicle_id, registration, provider_id, provider_name, lat, lng, speed, heading, ignition, timestamp, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (vehicle_id) DO UPDATE SET
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          speed = EXCLUDED.speed,
          heading = EXCLUDED.heading,
          ignition = EXCLUDED.ignition,
          timestamp = EXCLUDED.timestamp,
          raw_data = EXCLUDED.raw_data,
          updated_at = NOW()
      `, [
        position.vehicleId,
        position.registration,
        position.providerId,
        position.providerName,
        position.lat,
        position.lng,
        position.speed,
        position.heading,
        position.ignition,
        position.timestamp,
        JSON.stringify(position.rawData)
      ]);
    } catch (error) {
      console.error('Error storing position:', error);
    }
  }

  /**
   * Get current position for a vehicle
   */
  getPosition(vehicleId: string): VehiclePosition | undefined {
    return this.positions.get(vehicleId);
  }

  /**
   * Get all current positions
   */
  getAllPositions(): VehiclePosition[] {
    return Array.from(this.positions.values());
  }

  /**
   * Get provider status
   */
  async getProviderStatus(): Promise<ProviderStatus[]> {
    const statuses: ProviderStatus[] = [];

    for (const [, provider] of this.providers) {
      const vehicleCount = Array.from(this.positions.values())
        .filter(p => p.providerId === provider.id).length;

      statuses.push({
        id: provider.id,
        name: provider.name,
        connected: provider.enabled,
        vehicleCount,
        lastSync: provider.lastSync || null
      });
    }

    return statuses;
  }

  /**
   * Add or update provider configuration
   */
  async upsertProvider(config: Partial<TrackingProviderConfig>): Promise<TrackingProviderConfig | null> {
    try {
      const result = await pool.query(`
        INSERT INTO logistics.tracking_providers 
        (id, name, type, api_url, api_key, username, password, client_id, client_secret, webhook_secret, enabled, sync_interval)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          name = COALESCE(EXCLUDED.name, logistics.tracking_providers.name),
          type = COALESCE(EXCLUDED.type, logistics.tracking_providers.type),
          api_url = COALESCE(EXCLUDED.api_url, logistics.tracking_providers.api_url),
          api_key = COALESCE(EXCLUDED.api_key, logistics.tracking_providers.api_key),
          username = COALESCE(EXCLUDED.username, logistics.tracking_providers.username),
          password = COALESCE(EXCLUDED.password, logistics.tracking_providers.password),
          client_id = COALESCE(EXCLUDED.client_id, logistics.tracking_providers.client_id),
          client_secret = COALESCE(EXCLUDED.client_secret, logistics.tracking_providers.client_secret),
          webhook_secret = COALESCE(EXCLUDED.webhook_secret, logistics.tracking_providers.webhook_secret),
          enabled = COALESCE(EXCLUDED.enabled, logistics.tracking_providers.enabled),
          sync_interval = COALESCE(EXCLUDED.sync_interval, logistics.tracking_providers.sync_interval),
          updated_at = NOW()
        RETURNING *
      `, [
        config.id,
        config.name,
        config.type,
        config.apiUrl,
        config.apiKey,
        config.username,
        config.password,
        config.clientId,
        config.clientSecret,
        config.webhookSecret,
        config.enabled ?? true,
        config.syncInterval ?? 60
      ]);

      const newProvider = result.rows[0] as TrackingProviderConfig;
      this.providers.set(newProvider.id, newProvider);
      this.initializeApiClient(newProvider);

      return newProvider;
    } catch (error) {
      console.error('Error upserting provider:', error);
      return null;
    }
  }

  /**
   * Delete provider
   */
  async deleteProvider(providerId: string): Promise<boolean> {
    try {
      await pool.query(`DELETE FROM logistics.tracking_providers WHERE id = $1`, [providerId]);
      this.providers.delete(providerId);
      this.apiClients.delete(providerId);
      return true;
    } catch (error) {
      console.error('Error deleting provider:', error);
      return false;
    }
  }
}

// Singleton instance
export const trackingProvidersService = new TrackingProvidersService();
export default trackingProvidersService;
