/**
 * GPS Provider Interface
 * Unified abstraction for multiple GPS tracking providers
 */

export interface UnifiedPosition {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number; // km/h
  heading: number; // 0-360 degrees
  timestamp: string; // ISO8601
  ignition: boolean;
  odometer: number; // kilometers
  fuelLevel?: number; // percentage 0-100
  provider: 'cartrack' | 'mix' | 'ctrack';
  raw: any; // Original provider response for debugging
}

export interface GPSHistoryQuery {
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  limit?: number;
}

export interface IGPSProvider {
  /**
   * Get current position for a single vehicle
   */
  getVehiclePosition(vehicleId: string): Promise<UnifiedPosition | null>;
  
  /**
   * Get current positions for all vehicles in fleet
   */
  getFleetPositions(): Promise<UnifiedPosition[]>;
  
  /**
   * Get historical positions for a vehicle
   */
  getTripHistory(query: GPSHistoryQuery): Promise<UnifiedPosition[]>;
  
  /**
   * Validate webhook payload signature/authentication
   */
  validateWebhook(payload: any, headers: any): boolean;
  
  /**
   * Parse webhook payload into unified format
   */
  parsePosition(rawData: any): UnifiedPosition;
  
  /**
   * Provider name
   */
  getProviderName(): string;
  
  /**
   * Check if provider is healthy/reachable
   */
  healthCheck(): Promise<boolean>;
}

export interface GPSProviderConfig {
  provider: 'cartrack' | 'mix' | 'ctrack';
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
  webhookSecret?: string;
  customerId?: string;
  enabled: boolean;
}
