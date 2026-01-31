/**
 * Database Service
 * SQLite database for offline storage
 */

import * as SQLite from 'expo-sqlite';
import { Trip, GPSUpdate, ProofOfDelivery, OfflineQueueItem } from '../types';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize() {
    try {
      this.db = await SQLite.openDatabaseAsync('driver_app.db');
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    // Trips table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS trips (
        trip_id TEXT PRIMARY KEY,
        customer TEXT NOT NULL,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        driver TEXT NOT NULL,
        vehicle_reg TEXT NOT NULL,
        status TEXT NOT NULL,
        pod_status TEXT NOT NULL,
        eta TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        current_location TEXT,
        synced INTEGER DEFAULT 0
      );
    `);

    // GPS updates queue
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS gps_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        speed REAL NOT NULL,
        heading REAL NOT NULL,
        timestamp TEXT NOT NULL,
        trip_id TEXT,
        accuracy REAL,
        synced INTEGER DEFAULT 0
      );
    `);

    // Offline queue for actions
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS offline_queue (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending'
      );
    `);

    // Proof of delivery cache
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS pod_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id TEXT NOT NULL,
        photos TEXT NOT NULL,
        signature TEXT NOT NULL,
        location TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        notes TEXT,
        recipient_name TEXT,
        synced INTEGER DEFAULT 0
      );
    `);

    console.log('Database tables created');
  }

  // Trip operations
  async saveTrip(trip: Trip) {
    if (!this.db) throw new Error('Database not initialized');

    const currentLocation = trip.current_location 
      ? JSON.stringify(trip.current_location) 
      : null;

    await this.db.runAsync(
      `INSERT OR REPLACE INTO trips 
       (trip_id, customer, origin, destination, driver, vehicle_reg, status, pod_status, eta, created_at, updated_at, current_location, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        trip.trip_id,
        trip.customer,
        trip.origin,
        trip.destination,
        trip.driver,
        trip.vehicle_reg,
        trip.status,
        trip.pod_status,
        trip.eta,
        trip.created_at,
        trip.updated_at,
        currentLocation,
        1,
      ]
    );
  }

  async getTrips(filters?: { status?: string; driver?: string }): Promise<Trip[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM trips WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters?.driver) {
      query += ' AND driver = ?';
      params.push(filters.driver);
    }

    query += ' ORDER BY eta DESC';

    const result = await this.db.getAllAsync<any>(query, params);

    return result.map((row) => ({
      ...row,
      current_location: row.current_location ? JSON.parse(row.current_location) : undefined,
    }));
  }

  async getTripById(tripId: string): Promise<Trip | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<any>(
      'SELECT * FROM trips WHERE trip_id = ?',
      [tripId]
    );

    if (!result) return null;

    return {
      ...result,
      current_location: result.current_location ? JSON.parse(result.current_location) : undefined,
    };
  }

  // GPS updates
  async saveGPSUpdate(update: GPSUpdate) {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT INTO gps_updates 
       (vehicle_id, lat, lng, speed, heading, timestamp, trip_id, accuracy, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        update.vehicleId,
        update.lat,
        update.lng,
        update.speed,
        update.heading,
        update.timestamp.toISOString(),
        update.tripId || null,
        update.accuracy || null,
        0,
      ]
    );
  }

  async getUnsyncedGPSUpdates(): Promise<(GPSUpdate & { id: number })[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync<any>(
      'SELECT * FROM gps_updates WHERE synced = 0 ORDER BY timestamp ASC LIMIT 100'
    );

    return result.map((row) => ({
      id: row.id,
      vehicleId: row.vehicle_id,
      lat: row.lat,
      lng: row.lng,
      speed: row.speed,
      heading: row.heading,
      timestamp: new Date(row.timestamp),
      tripId: row.trip_id,
      accuracy: row.accuracy,
      ignition: true,
    }));
  }

  async markGPSUpdatesSynced(ids: number[]) {
    if (!this.db) throw new Error('Database not initialized');

    const placeholders = ids.map(() => '?').join(',');
    await this.db.runAsync(
      `UPDATE gps_updates SET synced = 1 WHERE id IN (${placeholders})`,
      ids
    );
  }

  // Offline queue operations
  async addToOfflineQueue(item: Omit<OfflineQueueItem, 'id'>) {
    if (!this.db) throw new Error('Database not initialized');

    const id = `${item.type}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    await this.db.runAsync(
      `INSERT INTO offline_queue (id, type, data, timestamp, retry_count, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, item.type, JSON.stringify(item.data), item.timestamp.toISOString(), item.retryCount, item.status]
    );

    return id;
  }

  async getOfflineQueue(): Promise<OfflineQueueItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync<any>(
      `SELECT * FROM offline_queue WHERE status IN ('pending', 'failed') 
       ORDER BY timestamp ASC LIMIT 50`
    );

    return result.map((row) => ({
      id: row.id,
      type: row.type,
      data: JSON.parse(row.data),
      timestamp: new Date(row.timestamp),
      retryCount: row.retry_count,
      status: row.status,
    }));
  }

  async updateOfflineQueueItem(id: string, updates: Partial<OfflineQueueItem>) {
    if (!this.db) throw new Error('Database not initialized');

    const setClauses: string[] = [];
    const values: any[] = [];

    if (updates.status) {
      setClauses.push('status = ?');
      values.push(updates.status);
    }

    if (updates.retryCount !== undefined) {
      setClauses.push('retry_count = ?');
      values.push(updates.retryCount);
    }

    if (setClauses.length === 0) return;

    values.push(id);

    await this.db.runAsync(
      `UPDATE offline_queue SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteOfflineQueueItem(id: string) {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync('DELETE FROM offline_queue WHERE id = ?', [id]);
  }

  // POD cache operations
  async savePODCache(pod: ProofOfDelivery) {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT INTO pod_cache 
       (trip_id, photos, signature, location, timestamp, notes, recipient_name, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pod.tripId,
        JSON.stringify(pod.photos),
        pod.signature,
        JSON.stringify(pod.location),
        pod.timestamp.toISOString(),
        pod.notes || null,
        pod.recipientName || null,
        0,
      ]
    );
  }

  async getUnsyncedPODs(): Promise<(ProofOfDelivery & { id: number })[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync<any>(
      'SELECT * FROM pod_cache WHERE synced = 0 ORDER BY timestamp ASC'
    );

    return result.map((row) => ({
      id: row.id,
      tripId: row.trip_id,
      photos: JSON.parse(row.photos),
      signature: row.signature,
      location: JSON.parse(row.location),
      timestamp: new Date(row.timestamp),
      notes: row.notes,
      recipientName: row.recipient_name,
    }));
  }

  async markPODSynced(id: number) {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync('UPDATE pod_cache SET synced = 1 WHERE id = ?', [id]);
  }

  // Clear all data
  async clearAll() {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      DELETE FROM trips;
      DELETE FROM gps_updates;
      DELETE FROM offline_queue;
      DELETE FROM pod_cache;
    `);
  }
}

export default new DatabaseService();
