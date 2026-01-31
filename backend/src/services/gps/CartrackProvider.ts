/**
 * Cartrack GPS Provider Implementation
 * Documentation: https://www.cartrack.com/za/developers
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { IGPSProvider, UnifiedPosition, GPSHistoryQuery, GPSProviderConfig } from './IGPSProvider';

export class CartrackProvider implements IGPSProvider {
  private client: AxiosInstance;
  private config: GPSProviderConfig;
  
  constructor(config: GPSProviderConfig) {
    this.config = config;
    
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.cartrack.com/rest',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
    });
  }
  
  async getVehiclePosition(vehicleId: string): Promise<UnifiedPosition | null> {
    try {
      // Cartrack API: GET /vehicles/{vehicleId}/position
      const response = await this.client.get(`/vehicles/${vehicleId}/position`);
      
      if (!response.data) {
        return null;
      }
      
      return this.parsePosition(response.data);
    } catch (error: any) {
      console.error(`Cartrack: Failed to get position for vehicle ${vehicleId}:`, error.message);
      return null;
    }
  }
  
  async getFleetPositions(): Promise<UnifiedPosition[]> {
    try {
      // Cartrack API: GET /vehicles/positions
      const response = await this.client.get('/vehicles/positions', {
        params: {
          customerId: this.config.customerId,
        },
      });
      
      if (!response.data || !Array.isArray(response.data.vehicles)) {
        return [];
      }
      
      return response.data.vehicles
        .map((vehicle: any) => this.parsePosition(vehicle))
        .filter((pos: UnifiedPosition | null) => pos !== null) as UnifiedPosition[];
    } catch (error: any) {
      console.error('Cartrack: Failed to get fleet positions:', error.message);
      return [];
    }
  }
  
  async getTripHistory(query: GPSHistoryQuery): Promise<UnifiedPosition[]> {
    try {
      // Cartrack API: GET /vehicles/{vehicleId}/history
      const response = await this.client.get(`/vehicles/${query.vehicleId}/history`, {
        params: {
          startDate: query.startDate.toISOString(),
          endDate: query.endDate.toISOString(),
          limit: query.limit || 1000,
        },
      });
      
      if (!response.data || !Array.isArray(response.data.positions)) {
        return [];
      }
      
      return response.data.positions
        .map((pos: any) => this.parsePosition(pos))
        .filter((p: UnifiedPosition | null) => p !== null) as UnifiedPosition[];
    } catch (error: any) {
      console.error(`Cartrack: Failed to get trip history for ${query.vehicleId}:`, error.message);
      return [];
    }
  }
  
  validateWebhook(payload: any, headers: any): boolean {
    // Cartrack webhook signature validation
    const signature = headers['x-cartrack-signature'];
    
    if (!signature || !this.config.webhookSecret) {
      return false;
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
  
  parsePosition(rawData: any): UnifiedPosition {
    // Cartrack data format:
    // {
    //   vehicleId: "ABC123GP",
    //   lat: -26.2041,
    //   lon: 28.0473,
    //   speed: 60,
    //   heading: 180,
    //   timestamp: "2025-11-25T10:30:00Z",
    //   ignition: true,
    //   odometer: 123456,
    //   fuelLevel: 75
    // }
    
    return {
      vehicleId: rawData.vehicleId || rawData.registration || rawData.id,
      latitude: parseFloat(rawData.lat || rawData.latitude),
      longitude: parseFloat(rawData.lon || rawData.longitude),
      speed: parseFloat(rawData.speed || 0),
      heading: parseInt(rawData.heading || rawData.direction || 0),
      timestamp: rawData.timestamp || new Date().toISOString(),
      ignition: rawData.ignition === true || rawData.ignition === 1 || rawData.engineOn === true,
      odometer: parseFloat(rawData.odometer || rawData.mileage || 0),
      fuelLevel: rawData.fuelLevel ? parseFloat(rawData.fuelLevel) : undefined,
      provider: 'cartrack',
      raw: rawData,
    };
  }
  
  getProviderName(): string {
    return 'Cartrack';
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      // Simple ping to check API availability
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Cartrack: Health check failed:', error);
      return false;
    }
  }
}
