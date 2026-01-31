/**
 * Core type definitions for the driver app
 */

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  driverId?: string;
  roles: string[];
  tenantId: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  biometricEnabled: boolean;
}

export interface Trip {
  trip_id: string;
  customer: string;
  origin: string;
  destination: string;
  driver: string;
  vehicle_reg: string;
  status: 'Planned' | 'In Transit' | 'Delivered' | 'Delayed' | 'Cancelled';
  pod_status: 'Pending' | 'Captured' | 'Verified' | 'Rejected';
  eta: string;
  created_at: string;
  updated_at: string;
  current_location?: Location;
}

export interface Location {
  lat: number;
  lng: number;
  timestamp?: Date;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface ProofOfDelivery {
  tripId: string;
  photos: string[]; // Base64 or URIs
  signature: string; // Base64 signature data
  location: Location;
  timestamp: Date;
  notes?: string;
  recipientName?: string;
  recipientPhone?: string;
}

export interface GPSUpdate {
  vehicleId: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: Date;
  ignition: boolean;
  odometer?: number;
  fuelLevel?: number;
  driver?: string;
  tripId?: string;
  accuracy?: number;
}

export interface OfflineQueueItem {
  id: string;
  type: 'trip_update' | 'gps_update' | 'pod_upload';
  data: any;
  timestamp: Date;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
}

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
}

export interface AppSettings {
  darkMode: boolean;
  gpsUpdateInterval: number;
  offlineSyncEnabled: boolean;
  biometricAuthEnabled: boolean;
  voiceInputEnabled: boolean;
  language: string;
}

export interface TripUpdate {
  tripId: string;
  status: Trip['status'];
  currentLocation?: Location;
  eta?: string;
  completedStops?: number;
  totalStops?: number;
  timestamp: Date;
}

export interface Alert {
  alertId: string;
  type: 'SPEEDING' | 'GEOFENCE' | 'IDLE' | 'LOW_FUEL' | 'MAINTENANCE' | 'DELAY';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  vehicleId?: string;
  tripId?: string;
  driverId?: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
}
