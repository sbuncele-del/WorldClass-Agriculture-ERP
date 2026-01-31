/**
 * Logistics API Service
 * Centralized service for all logistics module API calls
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete, apiUpload } from '../services/api.service';

const BASE = '/api/v2/logistics';

export interface Trip {
  trip_id: string;
  customer: string;
  origin: string;
  destination: string;
  driver: string;
  vehicle_reg: string;
  status: 'Planned' | 'Assigned' | 'Loading' | 'In Transit' | 'Delivered' | 'Cancelled';
  pod_status: 'Pending' | 'Received';
  eta: string;
  created_at?: string;
  updated_at?: string;
}

export interface Vehicle {
  vehicle_id: number;
  vehicle_number: string;
  registration_number: string;
  make: string;
  model: string;
  vehicle_type: string;
  year_of_manufacture: number;
  status: string;
  current_driver: string;
  last_service_date: string;
  next_service_date: string;
  next_service_km: number;
  current_odometer: number;
  license_expiry: string;
  roadworthy_expiry: string;
  insurance_expiry: string;
}

export interface FuelTransaction {
  transaction_id: string;
  transaction_number?: string;
  vehicle_id?: string;
  driver_id?: string;
  trip_id?: string;
  transaction_date: string;
  fuel_station?: string;
  location?: string;
  fuel_type?: string;
  litres: number;
  price_per_litre: number;
  total_amount: number;
  odometer_reading?: number;
  payment_method?: string;
  fuel_card_number?: string;
  created_by?: string;
  vehicle_registration?: string;
  driver_name?: string;
  reconciled?: boolean;
}

export interface FuelTransactionResponse {
  fuel_transactions: FuelTransaction[];
  total: number;
  page: number;
  totalPages: number;
}

export interface DocumentExtraction {
  success: boolean;
  message: string;
  filename: string;
  extractedText: string;
  parsedData: any;
  confidence: number;
  processedAt: string;
}

export interface Customer {
  id: string;
  code?: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  status?: string;
}

/**
 * Trips API
 */
export const tripsAPI = {
  /**
   * Get customers from sales module for trip assignment
   */
  async getCustomers(params?: { status?: string; search?: string }): Promise<{ customers: Customer[]; total: number }> {
    return apiGet(`${BASE}/customers`, params);
  },

  /**
   * Get all form data for trip creation (customers, drivers, vehicles)
   */
  async getFormData(): Promise<{ 
    data: { 
      customers: Customer[]; 
      drivers: any[]; 
      vehicles: any[] 
    } 
  }> {
    return apiGet(`${BASE}/form-data`);
  },

  /**
   * Get all trips with optional filters
   */
  async getTrips(filters?: {
    status?: string;
    pod_status?: string;
    customer?: string;
    driver?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<{ trips: Trip[]; total: number }> {
    return apiGet(`${BASE}/trips`, filters);
  },

  /**
   * Get single trip by ID
   */
  async getTripById(tripId: string): Promise<Trip> {
    return apiGet(`${BASE}/trips/${tripId}`);
  },

  /**
   * Create new trip
   */
  async createTrip(tripData: Partial<Trip>): Promise<Trip> {
    return apiPost(`${BASE}/trips`, tripData);
  },

  /**
   * Update trip
   */
  async updateTrip(tripId: string, tripData: Partial<Trip>): Promise<Trip> {
    return apiPut(`${BASE}/trips/${tripId}`, tripData);
  },

  /**
   * Update trip status
   */
  async updateTripStatus(tripId: string, status: Trip['status']): Promise<void> {
    return apiPatch(`${BASE}/trips/${tripId}`, { status });
  },

  /**
   * Start trip
   */
  async startTrip(tripId: string): Promise<void> {
    return apiPost(`${BASE}/trips/${tripId}/start`);
  },

  /**
   * Complete trip
   */
  async completeTrip(tripId: string, podData?: any): Promise<void> {
    return apiPost(`${BASE}/trips/${tripId}/complete`, podData || {});
  },

  /**
   * Cancel trip
   */
  async cancelTrip(tripId: string, reason?: string): Promise<void> {
    return apiPost(`${BASE}/trips/${tripId}/cancel`, { reason });
  },

  /**
   * Update trip status directly
   */
  async updateStatus(tripId: string, status: string): Promise<void> {
    return apiPatch(`${BASE}/trips/${tripId}`, { status });
  },
};

/**
 * POD (Proof of Delivery) API
 */
export const podAPI = {
  /**
   * Initiate POD verification - sends SMS code to customer
   */
  async initiateVerification(tripId: string, customerPhone: string): Promise<{ code: string }> {
    return apiPost(`/api/v2/delivery/${tripId}/verify/initiate`, { customerPhone });
  },

  /**
   * Verify customer code
   */
  async verifyCode(tripId: string, code: string): Promise<{ verified: boolean }> {
    return apiPost(`/api/v2/delivery/${tripId}/verify/code`, { code });
  },

  /**
   * Upload POD documents (signature, photos)
   */
  async uploadPOD(tripId: string, podData: {
    signature?: string;
    photos?: string[];
    notes?: string;
    receiverName?: string;
  }): Promise<{ podReference: string }> {
    return apiPost(`/api/v2/delivery/${tripId}/pod/upload`, podData);
  },

  /**
   * Complete delivery with POD
   */
  async completeDelivery(tripId: string): Promise<{ invoiceNumber: string }> {
    return apiPost(`/api/v2/delivery/${tripId}/complete`, {});
  },

  /**
   * Get delivery status including POD info
   */
  async getDeliveryStatus(tripId: string): Promise<any> {
    return apiGet(`/api/v2/delivery/${tripId}/status`);
  },

  /**
   * Verify POD reference (for customers)
   */
  async verifyPODReference(podReference: string): Promise<any> {
    return apiGet(`/api/v2/driver/verify-pod/${podReference}`);
  },
};

/**
 * Driver App API (Mobile/Simplified interface for drivers)
 */
export const driverAppAPI = {
  /**
   * Get driver dashboard stats
   */
  async getDashboard(): Promise<any> {
    return apiGet('/api/v2/driver/dashboard');
  },

  /**
   * Get driver's assigned trips
   */
  async getMyTrips(status?: string): Promise<{ trips: any[] }> {
    return apiGet('/api/v2/driver/trips', status ? { status } : undefined);
  },

  /**
   * Get single trip details
   */
  async getTripDetails(tripId: string): Promise<any> {
    return apiGet(`/api/v2/driver/trips/${tripId}`);
  },

  /**
   * Start a trip
   */
  async startTrip(tripId: string): Promise<any> {
    return apiPost(`/api/v2/driver/trips/${tripId}/start`, {});
  },

  /**
   * Mark arrival at destination
   */
  async markArrived(tripId: string, location?: { lat: number; lng: number }): Promise<any> {
    return apiPost(`/api/v2/driver/trips/${tripId}/arrive`, { location });
  },

  /**
   * Request POD verification (sends code to customer)
   */
  async requestPODReady(tripId: string, customerPhone?: string): Promise<{ code: string }> {
    return apiPost(`/api/v2/driver/trips/${tripId}/pod-ready`, { customerPhone });
  },

  /**
   * Verify customer code
   */
  async verifyCustomer(tripId: string, code: string): Promise<{ verified: boolean }> {
    return apiPost(`/api/v2/driver/trips/${tripId}/verify-customer`, { code });
  },

  /**
   * Upload POD documents
   */
  async uploadPOD(tripId: string, data: {
    receiverName: string;
    signature?: string;
    photos?: string[];
    notes?: string;
  }): Promise<{ podReference: string }> {
    return apiPost(`/api/v2/driver/trips/${tripId}/pod-upload`, data);
  },

  /**
   * Complete delivery and generate invoice
   */
  async completeDelivery(tripId: string): Promise<{ invoiceNumber: string; podReference: string }> {
    return apiPost(`/api/v2/driver/trips/${tripId}/complete`, {});
  },
};

/**
 * RTMS Compliance API (South African Road Transport Management System)
 */
export interface PreTripChecklistItem {
  id: string;
  category: 'EXTERIOR' | 'TYRES' | 'BRAKES' | 'ENGINE' | 'SAFETY' | 'CABIN' | 'DOCUMENTS';
  item: string;
  description: string;
  criticalDefect: boolean;
  requiresPhoto: boolean;
}

export interface DriverHoursCompliance {
  compliant: boolean;
  driver: { id: string; name: string };
  today: {
    drivingHours: number;
    dutyHours: number;
    remainingDriving: number;
    lastBreak: string | null;
    needsBreak: boolean;
  };
  thisWeek: {
    drivingHours: number;
    remainingDriving: number;
  };
  lastRest: {
    startTime: string;
    endTime: string;
    durationHours: number;
    compliant: boolean;
  } | null;
  violations: string[];
  warnings: string[];
}

export interface PreTripInspectionResponse {
  inspectionId: string;
  passed: boolean;
  criticalDefects: number;
  totalDefects: number;
  canProceed: boolean;
}

export const complianceAPI = {
  /**
   * Get pre-trip checklist items (35 RTMS standard items)
   */
  async getPreTripChecklist(): Promise<{ checklist: PreTripChecklistItem[] }> {
    const response = await apiGet(`${BASE}/compliance/pre-trip/checklist`);
    return response.data || response;
  },

  /**
   * Start a pre-trip inspection
   */
  async startPreTripInspection(vehicleId: string, tripId?: string): Promise<{ inspectionId: string }> {
    return apiPost(`${BASE}/compliance/pre-trip/start`, { vehicleId, tripId });
  },

  /**
   * Submit pre-trip inspection results
   */
  async submitPreTripInspection(data: {
    inspectionId?: string;
    vehicleId: string;
    tripId?: string;
    responses: Array<{ checklistItemId: string; passed: boolean; notes?: string; photoUrl?: string }>;
    odometer: number;
    driverSignature?: string;
  }): Promise<PreTripInspectionResponse> {
    return apiPost(`${BASE}/compliance/pre-trip/submit`, data);
  },

  /**
   * Get driver's RTMS hours compliance
   */
  async getDriverHours(driverId: string): Promise<DriverHoursCompliance> {
    const response = await apiGet(`${BASE}/compliance/driver-hours/${driverId}`);
    return response.data || response;
  },

  /**
   * Get license expiry warnings
   */
  async getLicenseExpiry(daysAhead: number = 30): Promise<{
    driversExpiring: Array<{ driverId: string; name: string; type: string; expiryDate: string; daysUntilExpiry: number }>;
    vehiclesExpiring: Array<{ vehicleId: string; registration: string; type: string; expiryDate: string; daysUntilExpiry: number }>;
    summary: { expired: number; critical: number; warning: number };
  }> {
    const response = await apiGet(`${BASE}/compliance/license-expiry`, { daysAhead });
    return response.data || response;
  },
};

/**
 * Fuel Management API
 */
export const fuelAPI = {
  /**
   * Get all fuel transactions
   */
  async getFuelTransactions(filters?: {
    vehicle_id?: string;
    driver_id?: string;
    date_from?: string;
    date_to?: string;
    reconciled?: boolean | string;
    limit?: string;
    page?: string;
  }): Promise<FuelTransactionResponse> {
    return apiGet(`${BASE}/fuel`, filters);
  },

  /**
   * Create fuel transaction
   */
  async createFuelTransaction(data: Partial<FuelTransaction>): Promise<{ fuel_transaction: FuelTransaction }> {
    return apiPost(`${BASE}/fuel`, data);
  },

  /**
   * Reconcile fuel transaction
   */
  async reconcileFuelTransaction(id: number | string): Promise<void> {
    return apiPost(`${BASE}/fuel/reconcile`, { id });
  },
};

/**
 * Loads API
 */
export const loadsAPI = {
  /**
   * Get all loads
   */
  async getLoads(): Promise<any[]> {
    return apiGet(`${BASE}/loads`);
  },

  /**
   * Get load by ID
   */
  async getLoadById(loadId: string): Promise<any> {
    return apiGet(`${BASE}/loads/${loadId}`);
  },

  /**
   * Create new load
   */
  async createLoad(loadData: any): Promise<any> {
    return apiPost(`${BASE}/loads`, loadData);
  },

  /**
   * Update load status
   */
  async updateLoadStatus(loadId: string, status: string): Promise<void> {
    return apiPut(`${BASE}/loads/${loadId}/status`, { status });
  },
};

/**
 * Maintenance API
 */
export const maintenanceAPI = {
  /**
   * Get maintenance records
   */
  async getMaintenanceRecords(vehicleReg?: string): Promise<any[]> {
    const params = vehicleReg ? { vehicle_reg: vehicleReg } : undefined;
    return apiGet(`${BASE}/maintenance`, params);
  },

  /**
   * Create maintenance record
   */
  async createMaintenanceRecord(data: any): Promise<any> {
    return apiPost(`${BASE}/maintenance`, data);
  },
};

/**
 * Document Processing API
 */
export const documentsAPI = {
  /**
   * Extract data from document using AWS Textract
   */
  async extractDocument(file: File, onProgress?: (progress: number) => void): Promise<DocumentExtraction> {
    return apiUpload(`${BASE}/documents/extract`, (() => {
      const formData = new FormData();
      formData.append('file', file);
      return formData;
    })());
  },
};

/**
 * Dashboard API
 */
export const dashboardAPI = {
  /**
   * Get logistics dashboard statistics
   */
  async getDashboardStats(): Promise<any> {
    return apiGet(`${BASE}/dashboard`);
  },
};

/**
 * Vehicles API
 */
export const vehiclesAPI = {
  /**
   * Get all vehicles with optional filters
   */
  async getVehicles(filters?: {
    status?: string;
    vehicle_type?: string;
    search?: string;
  }): Promise<{ vehicles: Vehicle[]; total: number }> {
    return apiGet(`${BASE}/vehicles`, filters);
  },

  /**
   * Get single vehicle by ID
   */
  async getVehicleById(vehicleId: number): Promise<Vehicle> {
    return apiGet(`${BASE}/vehicles/${vehicleId}`);
  },

  /**
   * Create new vehicle
   */
  async createVehicle(vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    return apiPost(`${BASE}/vehicles`, vehicleData);
  },

  /**
   * Update vehicle
   */
  async updateVehicle(vehicleId: number, vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    return apiPut(`${BASE}/vehicles/${vehicleId}`, vehicleData);
  },

  /**
   * Delete vehicle
   */
  async deleteVehicle(vehicleId: number): Promise<void> {
    return apiDelete(`${BASE}/vehicles/${vehicleId}`);
  },
};

/**
 * Drivers API
 */
export const driversAPI = {
  /**
   * Get all drivers with optional filters
   */
  async getDrivers(filters?: {
    status?: string;
    license_class?: string;
    search?: string;
  }): Promise<{ drivers: any[]; total: number }> {
    return apiGet(`${BASE}/drivers`, filters);
  },

  /**
   * Get single driver by ID
   */
  async getDriverById(driverId: number): Promise<any> {
    return apiGet(`${BASE}/drivers/${driverId}`);
  },

  /**
   * Create new driver
   */
  async createDriver(driverData: any): Promise<any> {
    return apiPost(`${BASE}/drivers`, driverData);
  },

  /**
   * Update driver
   */
  async updateDriver(driverId: number, driverData: any): Promise<any> {
    return apiPut(`${BASE}/drivers/${driverId}`, driverData);
  },

  /**
   * Delete driver
   */
  async deleteDriver(driverId: number): Promise<void> {
    return apiDelete(`${BASE}/drivers/${driverId}`);
  },
};

/**
 * Workspace API
 */
export const workspaceAPI = {
  /**
   * Get logistics workspace data
   */
  async getWorkspace(): Promise<any> {
    return apiGet(`${BASE}/workspace`);
  },
};

/**
 * Routes API
 */
export interface Route {
  route_id: number;
  route_name: string;
  route_code?: string;
  description?: string;
  origin_address: string;
  origin_lat?: number;
  origin_lng?: number;
  destination_address: string;
  destination_lat?: number;
  destination_lng?: number;
  distance_km?: number;
  estimated_duration_minutes?: number;
  toll_cost?: number;
  fuel_estimate_liters?: number;
  route_type: string;
  is_active: boolean;
  waypoints?: any[];
  restrictions?: any;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const routesAPI = {
  async getRoutes(filters?: {
    is_active?: boolean;
    route_type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ routes: Route[]; total: number; page: number; totalPages: number }> {
    return apiGet(`${BASE}/routes`, filters);
  },

  async getRouteById(routeId: number): Promise<Route> {
    return apiGet(`${BASE}/routes/${routeId}`);
  },

  async createRoute(data: Partial<Route>): Promise<Route> {
    return apiPost(`${BASE}/routes`, data);
  },

  async updateRoute(routeId: number, data: Partial<Route>): Promise<Route> {
    return apiPut(`${BASE}/routes/${routeId}`, data);
  },

  async deleteRoute(routeId: number): Promise<void> {
    return apiDelete(`${BASE}/routes/${routeId}`);
  },
};

/**
 * Incidents API
 */
export interface Incident {
  incident_id: number;
  incident_number?: string;
  incident_type: string;
  severity: string;
  status: string;
  trip_id?: number;
  vehicle_id?: number;
  driver_id?: number;
  location_address?: string;
  location_lat?: number;
  location_lng?: number;
  incident_date: string;
  description: string;
  cause?: string;
  injuries_count?: number;
  fatalities_count?: number;
  property_damage?: boolean;
  damage_estimate?: number;
  insurance_claim_number?: string;
  insurance_status?: string;
  police_report_filed?: boolean;
  police_report_number?: string;
  resolution_notes?: string;
  corrective_actions?: string;
  photos?: string[];
  documents?: string[];
  created_at?: string;
  updated_at?: string;
}

export const incidentsAPI = {
  async getIncidents(filters?: {
    status?: string;
    severity?: string;
    incident_type?: string;
    vehicle_id?: number;
    driver_id?: number;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<{ incidents: Incident[]; total: number; page: number; totalPages: number }> {
    return apiGet(`${BASE}/incidents`, filters);
  },

  async getIncidentById(incidentId: number): Promise<Incident> {
    return apiGet(`${BASE}/incidents/${incidentId}`);
  },

  async createIncident(data: Partial<Incident>): Promise<Incident> {
    return apiPost(`${BASE}/incidents`, data);
  },

  async updateIncident(incidentId: number, data: Partial<Incident>): Promise<Incident> {
    return apiPut(`${BASE}/incidents/${incidentId}`, data);
  },

  async deleteIncident(incidentId: number): Promise<void> {
    return apiDelete(`${BASE}/incidents/${incidentId}`);
  },
};

/**
 * Geofences API
 */
export interface Geofence {
  geofence_id: number;
  geofence_name: string;
  geofence_code?: string;
  geofence_type: string;
  geometry_type: string;
  center_lat?: number;
  center_lng?: number;
  radius_meters?: number;
  polygon_coordinates?: any[];
  is_active: boolean;
  alert_on_enter: boolean;
  alert_on_exit: boolean;
  alert_on_dwell: boolean;
  dwell_time_minutes?: number;
  speed_limit_kmh?: number;
  schedule?: any;
  alert_emails?: string[];
  alert_phone_numbers?: string[];
  customer_id?: number;
  address?: string;
  color?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GeofenceEvent {
  event_id: number;
  geofence_id: number;
  vehicle_id?: number;
  driver_id?: number;
  event_type: string;
  event_time: string;
  lat?: number;
  lng?: number;
  speed_kmh?: number;
  alert_sent: boolean;
}

export const geofencesAPI = {
  async getGeofences(filters?: {
    is_active?: boolean;
    geofence_type?: string;
    customer_id?: number;
    page?: number;
    limit?: number;
  }): Promise<{ geofences: Geofence[]; total: number; page: number; totalPages: number }> {
    return apiGet(`${BASE}/geofences`, filters);
  },

  async getGeofenceById(geofenceId: number): Promise<Geofence> {
    return apiGet(`${BASE}/geofences/${geofenceId}`);
  },

  async createGeofence(data: Partial<Geofence>): Promise<Geofence> {
    return apiPost(`${BASE}/geofences`, data);
  },

  async updateGeofence(geofenceId: number, data: Partial<Geofence>): Promise<Geofence> {
    return apiPut(`${BASE}/geofences/${geofenceId}`, data);
  },

  async deleteGeofence(geofenceId: number): Promise<void> {
    return apiDelete(`${BASE}/geofences/${geofenceId}`);
  },

  async getGeofenceEvents(geofenceId: number): Promise<{ events: GeofenceEvent[]; page?: number }> {
    return apiGet(`${BASE}/geofences/${geofenceId}/events`);
  },
};

export default {
  trips: tripsAPI,
  pod: podAPI,
  driverApp: driverAppAPI,
  fuel: fuelAPI,
  loads: loadsAPI,
  maintenance: maintenanceAPI,
  documents: documentsAPI,
  dashboard: dashboardAPI,
  vehicles: vehiclesAPI,
  drivers: driversAPI,
  workspace: workspaceAPI,
  routes: routesAPI,
  incidents: incidentsAPI,
  geofences: geofencesAPI,
};
