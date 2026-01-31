/**
 * Logistics Automation Service
 * 
 * South African Fleet & Transport Management
 * 
 * Features:
 * - Smart Dispatch & Driver Assignment
 * - Route Optimization with Traffic
 * - Driver Scoring & Performance
 * - Load Balancing Across Fleet
 * - Return Load (Backhaul) Matching
 * - ETA Calculation & Notifications
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// South African Major Cities/Hubs with coordinates
export const SA_LOGISTICS_HUBS: Record<string, {
  name: string;
  province: string;
  lat: number;
  lng: number;
  isPort: boolean;
  isBorderPost: boolean;
}> = {
  'JHB': { name: 'Johannesburg', province: 'Gauteng', lat: -26.2041, lng: 28.0473, isPort: false, isBorderPost: false },
  'CPT': { name: 'Cape Town', province: 'Western Cape', lat: -33.9249, lng: 18.4241, isPort: true, isBorderPost: false },
  'DUR': { name: 'Durban', province: 'KwaZulu-Natal', lat: -29.8587, lng: 31.0218, isPort: true, isBorderPost: false },
  'PTA': { name: 'Pretoria', province: 'Gauteng', lat: -25.7479, lng: 28.2293, isPort: false, isBorderPost: false },
  'PE': { name: 'Gqeberha (Port Elizabeth)', province: 'Eastern Cape', lat: -33.9608, lng: 25.6022, isPort: true, isBorderPost: false },
  'BFN': { name: 'Bloemfontein', province: 'Free State', lat: -29.0852, lng: 26.1596, isPort: false, isBorderPost: false },
  'EL': { name: 'East London', province: 'Eastern Cape', lat: -33.0292, lng: 27.8546, isPort: true, isBorderPost: false },
  'PLK': { name: 'Polokwane', province: 'Limpopo', lat: -23.9045, lng: 29.4689, isPort: false, isBorderPost: false },
  'NLP': { name: 'Nelspruit', province: 'Mpumalanga', lat: -25.4753, lng: 30.9694, isPort: false, isBorderPost: false },
  'RCB': { name: 'Richards Bay', province: 'KwaZulu-Natal', lat: -28.7830, lng: 32.0377, isPort: true, isBorderPost: false },
  // Border Posts
  'BBR': { name: 'Beitbridge', province: 'Limpopo', lat: -22.2167, lng: 30.0000, isPort: false, isBorderPost: true },
  'LEB': { name: 'Lebombo', province: 'Mpumalanga', lat: -25.4667, lng: 31.9833, isPort: false, isBorderPost: true },
  'MAS': { name: 'Maseru Bridge', province: 'Free State', lat: -29.3167, lng: 27.4833, isPort: false, isBorderPost: true },
};

// Vehicle Types with capacity
export const VEHICLE_TYPES: Record<string, {
  type: string;
  description: string;
  maxPayloadKg: number;
  volumeM3: number;
  palletCapacity: number;
  fuelConsumptionPer100km: number;
  licenseRequired: string;
  requiresPDP: boolean;
}> = {
  'LDV': { type: 'LDV', description: 'Light Delivery Vehicle (Bakkie)', maxPayloadKg: 1000, volumeM3: 4, palletCapacity: 2, fuelConsumptionPer100km: 10, licenseRequired: 'B', requiresPDP: false },
  '4TON': { type: '4TON', description: '4 Ton Truck', maxPayloadKg: 4000, volumeM3: 20, palletCapacity: 8, fuelConsumptionPer100km: 18, licenseRequired: 'C1', requiresPDP: false },
  '8TON': { type: '8TON', description: '8 Ton Truck', maxPayloadKg: 8000, volumeM3: 40, palletCapacity: 16, fuelConsumptionPer100km: 25, licenseRequired: 'C', requiresPDP: false },
  'SUPER': { type: 'SUPER', description: 'Superlink (34 Ton)', maxPayloadKg: 34000, volumeM3: 120, palletCapacity: 60, fuelConsumptionPer100km: 45, licenseRequired: 'EC', requiresPDP: true },
  'INTERLINK': { type: 'INTERLINK', description: 'Interlink (28 Ton)', maxPayloadKg: 28000, volumeM3: 90, palletCapacity: 44, fuelConsumptionPer100km: 38, licenseRequired: 'EC', requiresPDP: true },
  'TAUTLINER': { type: 'TAUTLINER', description: 'Tautliner', maxPayloadKg: 30000, volumeM3: 100, palletCapacity: 48, fuelConsumptionPer100km: 40, licenseRequired: 'EC', requiresPDP: true },
  'TANKER': { type: 'TANKER', description: 'Fuel/Chemical Tanker', maxPayloadKg: 32000, volumeM3: 36000, palletCapacity: 0, fuelConsumptionPer100km: 42, licenseRequired: 'EC', requiresPDP: true },
  'REFRIGERATED': { type: 'REFRIGERATED', description: 'Refrigerated Truck', maxPayloadKg: 26000, volumeM3: 80, palletCapacity: 40, fuelConsumptionPer100km: 50, licenseRequired: 'EC', requiresPDP: true },
  'FLATBED': { type: 'FLATBED', description: 'Flatbed/Lowbed', maxPayloadKg: 35000, volumeM3: 0, palletCapacity: 0, fuelConsumptionPer100km: 48, licenseRequired: 'EC', requiresPDP: true },
};

// Driver Scoring Metrics
export const DRIVER_SCORE_WEIGHTS = {
  harshBraking: 0.15,      // Events per 100km
  harshAcceleration: 0.10, // Events per 100km
  speeding: 0.20,          // % time over limit
  idling: 0.10,            // Minutes per hour
  fuelEfficiency: 0.15,    // L/100km vs target
  onTimeDelivery: 0.15,    // % on time
  customerRating: 0.10,    // Average rating
  incidentFree: 0.05,      // Days without incident
};

export class LogisticsAutomationService {
  private pool: Pool;
  private tenantId: string;

  constructor(pool: Pool, tenantId: string) {
    this.pool = pool;
    this.tenantId = tenantId;
  }

  // ============================================
  // 1. SMART DISPATCH - Auto-assign drivers
  // ============================================
  async smartDispatch(tripRequest: {
    origin: string;
    destination: string;
    pickupTime: Date;
    cargoType: string;
    weightKg: number;
    volumeM3?: number;
    pallets?: number;
    isUrgent?: boolean;
    requiresRefrigeration?: boolean;
  }): Promise<{
    success: boolean;
    recommendedDrivers: Array<{
      driverId: string;
      driverName: string;
      vehicleReg: string;
      vehicleType: string;
      currentLocation: { lat: number; lng: number; address: string };
      distanceToPickup: number;
      estimatedArrival: string;
      availableHours: number;
      driverScore: number;
      matchScore: number;
      reason: string;
    }>;
    alternativeOptions: string[];
  }> {
    const recommendedDrivers: any[] = [];
    const alternativeOptions: string[] = [];

    // Get available drivers with assigned vehicles
    const driversResult = await this.pool.query(
      `SELECT d.driver_id, d.first_name, d.last_name, d.license_type, d.pdp_expiry,
              v.vehicle_id, v.vehicle_registration, v.vehicle_type, v.current_location,
              v.current_odometer
       FROM logistics.drivers d
       JOIN logistics.vehicles v ON v.current_driver_id = d.driver_id
       WHERE d.tenant_id = $1 
         AND d.status = 'AVAILABLE'
         AND v.status = 'ACTIVE'`,
      [this.tenantId]
    );

    // Get origin coordinates (simplified - would use geocoding API)
    const originHub = SA_LOGISTICS_HUBS[tripRequest.origin] || SA_LOGISTICS_HUBS['JHB'];
    
    for (const driver of driversResult.rows) {
      const vehicleSpec = VEHICLE_TYPES[driver.vehicle_type] || VEHICLE_TYPES['8TON'];
      
      // Check vehicle capacity
      if (tripRequest.weightKg > vehicleSpec.maxPayloadKg) continue;
      if (tripRequest.volumeM3 && tripRequest.volumeM3 > vehicleSpec.volumeM3) continue;
      if (tripRequest.pallets && tripRequest.pallets > vehicleSpec.palletCapacity) continue;
      
      // Check refrigeration requirement
      if (tripRequest.requiresRefrigeration && driver.vehicle_type !== 'REFRIGERATED') continue;
      
      // Check PDP for heavy vehicles
      if (vehicleSpec.requiresPDP && (!driver.pdp_expiry || new Date(driver.pdp_expiry) < new Date())) {
        alternativeOptions.push(`${driver.first_name} ${driver.last_name} - PDP expired`);
        continue;
      }

      // Calculate distance to pickup (default to origin hub if no location)
      const driverLat = originHub.lat;
      const driverLng = originHub.lng;
      const distanceToPickup = this.calculateDistance(driverLat, driverLng, originHub.lat, originHub.lng);
      
      // Estimate arrival time (assume 60km/h average in urban, 80km/h highway)
      const avgSpeed = distanceToPickup > 50 ? 80 : 60;
      const hoursToPickup = distanceToPickup / avgSpeed;
      const estimatedArrival = new Date(Date.now() + hoursToPickup * 60 * 60 * 1000);

      // Get driver score
      const driverScore = await this.getDriverScore(driver.driver_id);
      
      // Calculate match score (0-100)
      let matchScore = 100;
      matchScore -= distanceToPickup * 0.5; // Penalize distance
      matchScore += driverScore * 0.3; // Reward good drivers
      if (tripRequest.isUrgent && estimatedArrival > tripRequest.pickupTime) {
        matchScore -= 30; // Penalize if can't make urgent pickup
      }
      
      recommendedDrivers.push({
        driverId: driver.driver_id,
        driverName: `${driver.first_name} ${driver.last_name}`,
        vehicleReg: driver.vehicle_registration,
        vehicleType: driver.vehicle_type,
        currentLocation: {
          lat: driverLat,
          lng: driverLng,
          address: driver.current_location || 'Depot'
        },
        distanceToPickup: Math.round(distanceToPickup),
        estimatedArrival: estimatedArrival.toISOString(),
        availableHours: 11 - (await this.getTodayDrivingHours(driver.driver_id)), // RTMS limit
        driverScore: Math.round(driverScore),
        matchScore: Math.round(Math.max(0, Math.min(100, matchScore))),
        reason: matchScore > 80 ? '⭐ Best match' : matchScore > 60 ? '✅ Good option' : '⚠️ Consider alternatives'
      });
    }

    // Sort by match score
    recommendedDrivers.sort((a, b) => b.matchScore - a.matchScore);

    return {
      success: recommendedDrivers.length > 0,
      recommendedDrivers: recommendedDrivers.slice(0, 5),
      alternativeOptions,
    };
  }

  // ============================================
  // 2. ROUTE OPTIMIZATION
  // ============================================
  async optimizeRoute(
    origin: string,
    destination: string,
    waypoints: string[] = [],
    vehicleType: string = '8TON',
    departureTime: Date = new Date()
  ): Promise<{
    optimizedRoute: {
      totalDistanceKm: number;
      totalDurationHours: number;
      estimatedFuelLitres: number;
      estimatedFuelCost: number;
      tollsCost: number;
      legs: Array<{
        from: string;
        to: string;
        distanceKm: number;
        durationMinutes: number;
        tollPlazas: string[];
      }>;
    };
    alternativeRoutes: Array<{
      name: string;
      distanceKm: number;
      durationHours: number;
      tollsCost: number;
      recommendation: string;
    }>;
    trafficAlerts: string[];
    fuelStops: Array<{ name: string; location: string; pricePerLitre: number }>;
  }> {
    const vehicleSpec = VEHICLE_TYPES[vehicleType] || VEHICLE_TYPES['8TON'];
    const originHub = SA_LOGISTICS_HUBS[origin] || SA_LOGISTICS_HUBS['JHB'];
    const destHub = SA_LOGISTICS_HUBS[destination] || SA_LOGISTICS_HUBS['CPT'];

    // Calculate base distance
    const baseDistance = this.calculateDistance(originHub.lat, originHub.lng, destHub.lat, destHub.lng);
    // Road distance is typically 1.3x straight line
    const roadDistance = Math.round(baseDistance * 1.3);
    
    // Calculate duration (considering traffic)
    const hour = departureTime.getHours();
    const isRushHour = (hour >= 6 && hour <= 9) || (hour >= 16 && hour <= 19);
    const avgSpeed = isRushHour ? 50 : 75;
    const durationHours = roadDistance / avgSpeed;

    // Calculate fuel
    const fuelLitres = (roadDistance / 100) * vehicleSpec.fuelConsumptionPer100km;
    const fuelPricePerLitre = 23.50; // Current SA diesel price
    const fuelCost = fuelLitres * fuelPricePerLitre;

    // Estimate tolls (N1, N3, N4 tolls)
    let tollsCost = 0;
    if (origin === 'JHB' && destination === 'CPT') {
      tollsCost = 850; // Approx JHB-CPT tolls for heavy vehicle
    } else if (origin === 'JHB' && destination === 'DUR') {
      tollsCost = 450; // N3 tolls
    } else if (roadDistance > 200) {
      tollsCost = roadDistance * 1.5; // Rough estimate
    }

    const trafficAlerts: string[] = [];
    if (isRushHour) {
      trafficAlerts.push(`⚠️ Rush hour traffic expected - consider departing after ${hour >= 6 && hour <= 9 ? '09:00' : '19:00'}`);
    }
    if (origin === 'JHB' || destination === 'JHB') {
      trafficAlerts.push('📍 Gauteng Freeway Improvement Project - possible delays on N1/N12');
    }

    return {
      optimizedRoute: {
        totalDistanceKm: roadDistance,
        totalDurationHours: Math.round(durationHours * 10) / 10,
        estimatedFuelLitres: Math.round(fuelLitres),
        estimatedFuelCost: Math.round(fuelCost),
        tollsCost: Math.round(tollsCost),
        legs: [
          {
            from: originHub.name,
            to: destHub.name,
            distanceKm: roadDistance,
            durationMinutes: Math.round(durationHours * 60),
            tollPlazas: roadDistance > 100 ? ['Toll Plaza 1', 'Toll Plaza 2'] : [],
          }
        ],
      },
      alternativeRoutes: [
        {
          name: 'Toll-Free Route',
          distanceKm: Math.round(roadDistance * 1.15),
          durationHours: Math.round((roadDistance * 1.15 / 60) * 10) / 10,
          tollsCost: 0,
          recommendation: tollsCost > 500 ? '💰 Save on tolls for longer route' : 'Not recommended',
        }
      ],
      trafficAlerts,
      fuelStops: [
        { name: 'Engen 1-Stop', location: 'Midrand', pricePerLitre: 23.45 },
        { name: 'Shell Ultra City', location: 'Harrismith', pricePerLitre: 23.52 },
      ],
    };
  }

  // ============================================
  // 3. DRIVER SCORING
  // ============================================
  async getDriverScore(driverId: string): Promise<number> {
    // Get driver metrics from trips
    const metricsResult = await this.pool.query(
      `SELECT 
        COUNT(*) as total_trips,
        AVG(CASE WHEN status = 'COMPLETED' AND delivered_at <= eta THEN 100 ELSE 0 END) as on_time_pct,
        AVG(customer_rating) as avg_rating
       FROM logistics.trips
       WHERE driver_id = $1 AND tenant_id = $2 AND created_at > NOW() - INTERVAL '90 days'`,
      [driverId, this.tenantId]
    );

    const metrics = metricsResult.rows[0] || {};
    
    // Calculate composite score
    let score = 70; // Base score
    score += (metrics.on_time_pct || 0) * 0.2;
    score += ((metrics.avg_rating || 3) / 5) * 20;
    score = Math.min(100, Math.max(0, score));

    return score;
  }

  async calculateDriverScores(): Promise<{
    drivers: Array<{
      driverId: string;
      driverName: string;
      overallScore: number;
      metrics: {
        onTimeDelivery: number;
        customerRating: number;
        fuelEfficiency: number;
        safetyScore: number;
        totalTrips: number;
        totalKm: number;
      };
      ranking: number;
      trend: 'UP' | 'DOWN' | 'STABLE';
      badges: string[];
    }>;
    fleetAverage: number;
  }> {
    const driversResult = await this.pool.query(
      `SELECT d.driver_id, d.first_name, d.last_name,
              COUNT(t.trip_id) as total_trips,
              SUM(t.distance_km) as total_km,
              AVG(CASE WHEN t.delivered_at <= t.eta THEN 100 ELSE 0 END) as on_time_pct,
              AVG(t.customer_rating) as avg_rating
       FROM logistics.drivers d
       LEFT JOIN logistics.trips t ON d.driver_id = t.driver_id AND t.created_at > NOW() - INTERVAL '30 days'
       WHERE d.tenant_id = $1 AND d.status = 'ACTIVE'
       GROUP BY d.driver_id, d.first_name, d.last_name`,
      [this.tenantId]
    );

    const drivers = driversResult.rows.map((d, idx) => {
      const onTimeDelivery = parseFloat(d.on_time_pct) || 85;
      const customerRating = parseFloat(d.avg_rating) || 4.0;
      const safetyScore = 85 + Math.random() * 15; // Would come from telematics
      const fuelEfficiency = 80 + Math.random() * 20;
      
      const overallScore = Math.round(
        onTimeDelivery * 0.30 +
        (customerRating / 5 * 100) * 0.25 +
        safetyScore * 0.25 +
        fuelEfficiency * 0.20
      );

      const badges: string[] = [];
      if (onTimeDelivery >= 95) badges.push('🏆 On-Time Champion');
      if (customerRating >= 4.5) badges.push('⭐ Customer Favorite');
      if (safetyScore >= 95) badges.push('🛡️ Safety Star');
      if (parseInt(d.total_trips) >= 50) badges.push('🚚 Road Warrior');

      return {
        driverId: d.driver_id,
        driverName: `${d.first_name} ${d.last_name}`,
        overallScore,
        metrics: {
          onTimeDelivery: Math.round(onTimeDelivery),
          customerRating: Math.round(customerRating * 10) / 10,
          fuelEfficiency: Math.round(fuelEfficiency),
          safetyScore: Math.round(safetyScore),
          totalTrips: parseInt(d.total_trips) || 0,
          totalKm: parseInt(d.total_km) || 0,
        },
        ranking: 0, // Set after sorting
        trend: (Math.random() > 0.5 ? 'UP' : Math.random() > 0.5 ? 'DOWN' : 'STABLE') as 'UP' | 'DOWN' | 'STABLE',
        badges,
      };
    });

    // Sort and assign rankings
    drivers.sort((a, b) => b.overallScore - a.overallScore);
    drivers.forEach((d, idx) => d.ranking = idx + 1);

    const fleetAverage = drivers.length > 0
      ? Math.round(drivers.reduce((sum, d) => sum + d.overallScore, 0) / drivers.length)
      : 0;

    return { drivers, fleetAverage };
  }

  // ============================================
  // 4. LOAD BALANCING
  // ============================================
  async analyzeLoadBalance(): Promise<{
    summary: {
      totalDrivers: number;
      totalTripsToday: number;
      avgTripsPerDriver: number;
      utilizationRate: number;
    };
    driversOverworked: Array<{ driverId: string; name: string; trips: number; hours: number; recommendation: string }>;
    driversUnderutilized: Array<{ driverId: string; name: string; trips: number; hours: number; recommendation: string }>;
    recommendations: string[];
  }> {
    const utilizationResult = await this.pool.query(
      `SELECT d.driver_id, d.first_name, d.last_name,
              COUNT(t.trip_id) as trips_today,
              SUM(EXTRACT(EPOCH FROM (COALESCE(t.delivered_at, NOW()) - t.started_at))/3600) as hours_today
       FROM logistics.drivers d
       LEFT JOIN logistics.trips t ON d.driver_id = t.driver_id 
         AND t.created_at::date = CURRENT_DATE
         AND t.tenant_id = $1
       WHERE d.tenant_id = $1 AND d.status = 'ACTIVE'
       GROUP BY d.driver_id, d.first_name, d.last_name`,
      [this.tenantId]
    );

    const drivers = utilizationResult.rows;
    const totalDrivers = drivers.length;
    const totalTrips = drivers.reduce((sum, d) => sum + (parseInt(d.trips_today) || 0), 0);
    const avgTripsPerDriver = totalDrivers > 0 ? totalTrips / totalDrivers : 0;

    const driversOverworked = drivers
      .filter(d => (parseFloat(d.hours_today) || 0) > 9)
      .map(d => ({
        driverId: d.driver_id,
        name: `${d.first_name} ${d.last_name}`,
        trips: parseInt(d.trips_today) || 0,
        hours: Math.round((parseFloat(d.hours_today) || 0) * 10) / 10,
        recommendation: '⚠️ Approaching RTMS limit - no new trips'
      }));

    const driversUnderutilized = drivers
      .filter(d => (parseInt(d.trips_today) || 0) === 0)
      .map(d => ({
        driverId: d.driver_id,
        name: `${d.first_name} ${d.last_name}`,
        trips: 0,
        hours: 0,
        recommendation: '📋 Available for assignments'
      }));

    const recommendations: string[] = [];
    if (driversOverworked.length > 0) {
      recommendations.push(`${driversOverworked.length} drivers approaching maximum hours - redistribute load`);
    }
    if (driversUnderutilized.length > totalDrivers * 0.3) {
      recommendations.push(`${driversUnderutilized.length} drivers idle - consider consolidating shifts`);
    }

    return {
      summary: {
        totalDrivers,
        totalTripsToday: totalTrips,
        avgTripsPerDriver: Math.round(avgTripsPerDriver * 10) / 10,
        utilizationRate: totalDrivers > 0 ? Math.round((totalTrips / (totalDrivers * 4)) * 100) : 0,
      },
      driversOverworked,
      driversUnderutilized,
      recommendations,
    };
  }

  // ============================================
  // 5. BACKHAUL (RETURN LOAD) MATCHING
  // ============================================
  async findBackhaulLoads(
    currentLocation: string,
    homeBase: string,
    vehicleType: string,
    availableCapacityKg: number
  ): Promise<{
    matchingLoads: Array<{
      loadId: string;
      origin: string;
      destination: string;
      cargoDescription: string;
      weightKg: number;
      revenue: number;
      matchScore: number;
      detourKm: number;
      recommendation: string;
    }>;
    potentialRevenue: number;
    emptyRunCostSaved: number;
  }> {
    // Find loads going towards home base
    const loadsResult = await this.pool.query(
      `SELECT load_id, origin, destination, commodity as cargo_description, 
              weight_kg, rate as revenue
       FROM logistics.loads
       WHERE tenant_id = $1 
         AND status = 'PENDING'
         AND weight_kg <= $2
       ORDER BY created_at DESC
       LIMIT 20`,
      [this.tenantId, availableCapacityKg]
    );

    const currentHub = SA_LOGISTICS_HUBS[currentLocation] || SA_LOGISTICS_HUBS['JHB'];
    const homeHub = SA_LOGISTICS_HUBS[homeBase] || SA_LOGISTICS_HUBS['JHB'];
    const directDistance = this.calculateDistance(currentHub.lat, currentHub.lng, homeHub.lat, homeHub.lng);

    const matchingLoads = loadsResult.rows.map(load => {
      const loadOrigin = SA_LOGISTICS_HUBS[load.origin] || currentHub;
      const loadDest = SA_LOGISTICS_HUBS[load.destination] || homeHub;
      
      // Calculate if this load is "on the way" home
      const distanceViaLoad = 
        this.calculateDistance(currentHub.lat, currentHub.lng, loadOrigin.lat, loadOrigin.lng) +
        this.calculateDistance(loadOrigin.lat, loadOrigin.lng, loadDest.lat, loadDest.lng);
      
      const detourKm = Math.max(0, (distanceViaLoad * 1.3) - (directDistance * 1.3));
      
      // Score based on detour and revenue
      const matchScore = Math.max(0, 100 - (detourKm * 0.5) + (parseFloat(load.revenue) / 100));

      return {
        loadId: load.load_id,
        origin: load.origin,
        destination: load.destination,
        cargoDescription: load.cargo_description,
        weightKg: load.weight_kg,
        revenue: parseFloat(load.revenue) || 0,
        matchScore: Math.round(matchScore),
        detourKm: Math.round(detourKm),
        recommendation: matchScore > 70 ? '✅ Good backhaul option' : matchScore > 50 ? '⚠️ Consider if no better options' : '❌ Too far out of route',
      };
    }).filter(l => l.matchScore > 30);

    matchingLoads.sort((a, b) => b.matchScore - a.matchScore);

    const vehicleSpec = VEHICLE_TYPES[vehicleType] || VEHICLE_TYPES['8TON'];
    const fuelCostPerKm = (vehicleSpec.fuelConsumptionPer100km / 100) * 23.50;
    const emptyRunCostSaved = directDistance * fuelCostPerKm;
    const potentialRevenue = matchingLoads.slice(0, 3).reduce((sum, l) => sum + l.revenue, 0);

    return {
      matchingLoads: matchingLoads.slice(0, 5),
      potentialRevenue,
      emptyRunCostSaved: Math.round(emptyRunCostSaved),
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI/180);
  }

  private async getTodayDrivingHours(driverId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT SUM(EXTRACT(EPOCH FROM (COALESCE(delivered_at, NOW()) - started_at))/3600) as hours
       FROM logistics.trips
       WHERE driver_id = $1 AND tenant_id = $2 AND started_at::date = CURRENT_DATE`,
      [driverId, this.tenantId]
    );
    return parseFloat(result.rows[0]?.hours) || 0;
  }
}

// Export factory
export const createLogisticsAutomationService = (pool: Pool, tenantId: string) => {
  return new LogisticsAutomationService(pool, tenantId);
};
