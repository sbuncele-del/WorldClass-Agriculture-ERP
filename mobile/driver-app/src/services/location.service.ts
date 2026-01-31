/**
 * Location Service
 * Background GPS tracking and location management
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { APP_CONFIG } from '../config/api.config';
import databaseService from './database.service';
import apiService from './api.service';
import { GPSUpdate } from '../types';

const LOCATION_TASK_NAME = 'background-location-task';

class LocationService {
  private watchId: Location.LocationSubscription | null = null;
  private isTracking = false;
  private currentTripId: string | null = null;
  private vehicleId: string | null = null;

  async requestPermissions(): Promise<boolean> {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      console.error('Foreground location permission not granted');
      return false;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    
    if (backgroundStatus !== 'granted') {
      console.warn('Background location permission not granted');
      // Still return true as foreground is sufficient for basic operation
      return true;
    }

    return true;
  }

  async checkPermissions(): Promise<boolean> {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  }

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  setVehicleId(vehicleId: string) {
    this.vehicleId = vehicleId;
  }

  setCurrentTrip(tripId: string | null) {
    this.currentTripId = tripId;
  }

  async startTracking() {
    if (this.isTracking) {
      console.log('Location tracking already started');
      return;
    }

    const hasPermission = await this.checkPermissions();
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }

    if (!this.vehicleId) {
      throw new Error('Vehicle ID not set');
    }

    // Start foreground tracking
    this.watchId = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: APP_CONFIG.GPS_UPDATE_INTERVAL,
        distanceInterval: 50, // Update every 50 meters
      },
      (location) => {
        this.handleLocationUpdate(location);
      }
    );

    // Start background tracking
    await this.startBackgroundTracking();

    this.isTracking = true;
    console.log('Location tracking started');
  }

  private async startBackgroundTracking() {
    const hasBackgroundPermission = await Location.getBackgroundPermissionsAsync();
    
    if (hasBackgroundPermission.status !== 'granted') {
      console.warn('Background location permission not granted, skipping background tracking');
      return;
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: APP_CONFIG.GPS_UPDATE_INTERVAL,
      distanceInterval: 50,
      foregroundService: {
        notificationTitle: 'Driver App',
        notificationBody: 'Tracking your location for trip updates',
        notificationColor: '#1890ff',
      },
    });

    console.log('Background location tracking started');
  }

  async stopTracking() {
    if (!this.isTracking) {
      console.log('Location tracking not active');
      return;
    }

    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }

    // Stop background tracking
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }

    this.isTracking = false;
    this.currentTripId = null;
    console.log('Location tracking stopped');
  }

  private async handleLocationUpdate(location: Location.LocationObject) {
    if (!this.vehicleId) {
      console.warn('Vehicle ID not set, skipping location update');
      return;
    }

    const gpsUpdate: GPSUpdate = {
      vehicleId: this.vehicleId,
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      speed: location.coords.speed || 0,
      heading: location.coords.heading || 0,
      timestamp: new Date(location.timestamp),
      ignition: true, // Assume ignition is on when tracking
      accuracy: location.coords.accuracy || undefined,
      tripId: this.currentTripId || undefined,
    };

    // Save to local database first
    await databaseService.saveGPSUpdate(gpsUpdate);

    // Try to send to server
    try {
      await apiService.sendGPSUpdate({
        vehicleId: gpsUpdate.vehicleId,
        lat: gpsUpdate.lat,
        lng: gpsUpdate.lng,
        speed: gpsUpdate.speed,
        heading: gpsUpdate.heading,
        timestamp: gpsUpdate.timestamp,
        tripId: gpsUpdate.tripId,
      });
    } catch (error) {
      console.error('Failed to send GPS update to server:', error);
      // Will be synced later by offline sync service
    }
  }

  isTrackingActive(): boolean {
    return this.isTracking;
  }

  getCurrentTripId(): string | null {
    return this.currentTripId;
  }

  // Calculate ETA based on current location and destination
  calculateETA(
    currentLat: number,
    currentLng: number,
    destLat: number,
    destLng: number,
    averageSpeed: number // km/h
  ): Date {
    const DEFAULT_AVERAGE_SPEED_KMH = 60;
    const effectiveSpeed = averageSpeed || DEFAULT_AVERAGE_SPEED_KMH;
    
    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(destLat - currentLat);
    const dLon = this.toRad(destLng - currentLng);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(currentLat)) *
        Math.cos(this.toRad(destLat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    // Calculate time in hours
    const timeInHours = distance / effectiveSpeed;
    const timeInMilliseconds = timeInHours * 3600 * 1000;

    return new Date(Date.now() + timeInMilliseconds);
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Define background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data as any;
    if (locations && locations.length > 0) {
      const location = locations[0];
      // Handle location update in background
      // Note: This runs in a different context, so we need to be careful with service instances
      console.log('Background location update:', location.coords);
    }
  }
});

export default new LocationService();
