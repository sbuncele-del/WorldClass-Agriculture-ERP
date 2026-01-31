/**
 * Vehicle Tracking Controller V2
 * 
 * Tenant-hardened vehicle tracking and GPS provider management
 * Handles real-time positions, provider configuration, and alerts
 */

import { Request, Response } from 'express';
import pool from '../../config/database';

// Tenant-aware request type
interface TenantRequest extends Request {
  tenant?: { id: string };
  user?: { id: string; email: string; role: string };
}

// Extract tenant context with validation
function getTenantContext(req: TenantRequest): { tenantId: string; userId: string } {
  const tenantId = req.tenant?.id;
  const userId = req.user?.id;
  if (!tenantId) throw new Error('Tenant context required');
  return { tenantId, userId: userId || '' };
}

// In-memory position cache (would be Redis in production)
const positionCache = new Map<string, Map<string, VehiclePosition>>();

interface VehiclePosition {
  vehicleId: string;
  registration: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: Date;
  driverId?: string;
  driverName?: string;
  status: 'moving' | 'idle' | 'stopped' | 'offline';
  providerId?: string;
}

/**
 * GET /api/v2/logistics/tracking/positions
 * Get all current vehicle positions (tenant-scoped)
 */
export async function getAllPositions(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);

    // Get tenant's vehicles with last known positions
    const result = await pool.query(`
      SELECT 
        v.vehicle_id,
        v.registration,
        v.make,
        v.model,
        vp.latitude,
        vp.longitude,
        vp.speed,
        vp.heading,
        vp.timestamp,
        vp.status,
        d.driver_id,
        d.first_name || ' ' || d.last_name as driver_name
      FROM logistics.vehicles v
      LEFT JOIN logistics.vehicle_positions vp ON v.vehicle_id = vp.vehicle_id
      LEFT JOIN logistics.drivers d ON v.assigned_driver_id = d.driver_id
      WHERE v.tenant_id = $1 AND v.status = 'active'
      ORDER BY v.registration
    `, [tenantId]);

    // Also check in-memory cache for more recent positions
    const tenantCache = positionCache.get(tenantId) || new Map();
    
    const positions = result.rows.map(row => {
      const cached = tenantCache.get(row.vehicle_id);
      if (cached && cached.timestamp > new Date(row.timestamp || 0)) {
        return cached;
      }
      return {
        vehicleId: row.vehicle_id,
        registration: row.registration,
        make: row.make,
        model: row.model,
        latitude: row.latitude,
        longitude: row.longitude,
        speed: row.speed || 0,
        heading: row.heading || 0,
        timestamp: row.timestamp,
        status: row.status || 'offline',
        driverId: row.driver_id,
        driverName: row.driver_name
      };
    });

    res.json({
      success: true,
      data: {
        count: positions.length,
        positions
      }
    });
  } catch (error: any) {
    console.error('[TrackingV2] Get positions error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to get positions' });
  }
}

/**
 * GET /api/v2/logistics/tracking/positions/:vehicleId
 * Get position for specific vehicle (tenant-scoped)
 */
export async function getVehiclePosition(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { vehicleId } = req.params;

    const result = await pool.query(`
      SELECT 
        v.vehicle_id,
        v.registration,
        v.make,
        v.model,
        vp.latitude,
        vp.longitude,
        vp.speed,
        vp.heading,
        vp.timestamp,
        vp.status,
        d.driver_id,
        d.first_name || ' ' || d.last_name as driver_name
      FROM logistics.vehicles v
      LEFT JOIN logistics.vehicle_positions vp ON v.vehicle_id = vp.vehicle_id
      LEFT JOIN logistics.drivers d ON v.assigned_driver_id = d.driver_id
      WHERE v.vehicle_id = $1 AND v.tenant_id = $2
    `, [vehicleId, tenantId]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Vehicle not found' });
      return;
    }

    const row = result.rows[0];
    
    // Check in-memory cache for more recent position
    const tenantCache = positionCache.get(tenantId) || new Map();
    const cached = tenantCache.get(vehicleId);
    
    const position = (cached && cached.timestamp > new Date(row.timestamp || 0)) ? cached : {
      vehicleId: row.vehicle_id,
      registration: row.registration,
      make: row.make,
      model: row.model,
      latitude: row.latitude,
      longitude: row.longitude,
      speed: row.speed || 0,
      heading: row.heading || 0,
      timestamp: row.timestamp,
      status: row.status || 'offline',
      driverId: row.driver_id,
      driverName: row.driver_name
    };

    res.json({ success: true, data: position });
  } catch (error: any) {
    console.error('[TrackingV2] Get vehicle position error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to get position' });
  }
}

/**
 * GET /api/v2/logistics/tracking/history/:vehicleId
 * Get position history for a vehicle (tenant-scoped)
 */
export async function getPositionHistory(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { vehicleId } = req.params;
    const { from, to, limit = 1000 } = req.query;

    // Verify vehicle belongs to tenant
    const vehicleCheck = await pool.query(
      `SELECT vehicle_id FROM logistics.vehicles WHERE vehicle_id = $1 AND tenant_id = $2`,
      [vehicleId, tenantId]
    );

    if (vehicleCheck.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Vehicle not found' });
      return;
    }

    let query = `
      SELECT latitude, longitude, speed, heading, timestamp, status
      FROM logistics.vehicle_position_history
      WHERE vehicle_id = $1
    `;
    const params: any[] = [vehicleId];
    let paramCount = 2;

    if (from) {
      query += ` AND timestamp >= $${paramCount}`;
      params.push(from);
      paramCount++;
    }
    if (to) {
      query += ` AND timestamp <= $${paramCount}`;
      params.push(to);
      paramCount++;
    }

    query += ` ORDER BY timestamp DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit as string));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        vehicleId,
        count: result.rows.length,
        history: result.rows
      }
    });
  } catch (error: any) {
    console.error('[TrackingV2] Get position history error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to get position history' });
  }
}

/**
 * POST /api/v2/logistics/tracking/refresh
 * Force refresh positions from all providers (tenant-scoped)
 */
export async function refreshPositions(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);

    // Get tenant's tracking providers
    const providers = await pool.query(
      `SELECT * FROM logistics.tracking_providers WHERE tenant_id = $1 AND enabled = true`,
      [tenantId]
    );

    // Clear and rebuild cache for tenant
    const tenantCache = new Map<string, VehiclePosition>();
    
    // In production, this would call each provider's API
    // For now, just update from database
    const positions = await pool.query(`
      SELECT vehicle_id, latitude, longitude, speed, heading, timestamp, status
      FROM logistics.vehicle_positions
      WHERE vehicle_id IN (SELECT vehicle_id FROM logistics.vehicles WHERE tenant_id = $1)
    `, [tenantId]);

    positions.rows.forEach(row => {
      tenantCache.set(row.vehicle_id, {
        vehicleId: row.vehicle_id,
        registration: '',
        latitude: row.latitude,
        longitude: row.longitude,
        speed: row.speed,
        heading: row.heading,
        timestamp: row.timestamp,
        status: row.status
      });
    });

    positionCache.set(tenantId, tenantCache);

    res.json({
      success: true,
      data: {
        message: 'Positions refreshed',
        count: tenantCache.size,
        providersChecked: providers.rows.length
      }
    });
  } catch (error: any) {
    console.error('[TrackingV2] Refresh positions error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to refresh positions' });
  }
}

/**
 * GET /api/v2/logistics/tracking/providers
 * Get all configured tracking providers (tenant-scoped)
 */
export async function listProviders(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);

    const result = await pool.query(`
      SELECT 
        provider_id,
        name,
        type,
        enabled,
        last_sync,
        vehicle_count,
        created_at
      FROM logistics.tracking_providers
      WHERE tenant_id = $1
      ORDER BY name
    `, [tenantId]);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.provider_id,
        name: row.name,
        type: row.type,
        enabled: row.enabled,
        lastSync: row.last_sync,
        vehicleCount: row.vehicle_count || 0,
        createdAt: row.created_at
      }))
    });
  } catch (error: any) {
    console.error('[TrackingV2] List providers error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to get providers' });
  }
}

/**
 * POST /api/v2/logistics/tracking/providers
 * Add or update tracking provider (tenant-scoped)
 */
export async function upsertProvider(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id, name, type, apiUrl, apiKey, enabled = true, config } = req.body;

    if (!name || !type || !apiUrl) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: name, type, apiUrl' 
      });
      return;
    }

    const providerId = id || `provider_${Date.now()}`;

    const result = await pool.query(`
      INSERT INTO logistics.tracking_providers 
        (provider_id, tenant_id, name, type, api_url, api_key, enabled, config, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (provider_id, tenant_id) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        api_url = EXCLUDED.api_url,
        api_key = EXCLUDED.api_key,
        enabled = EXCLUDED.enabled,
        config = EXCLUDED.config,
        updated_at = CURRENT_TIMESTAMP
      RETURNING provider_id, name, type, enabled
    `, [providerId, tenantId, name, type, apiUrl, apiKey, enabled, JSON.stringify(config || {}), userId]);

    res.json({
      success: true,
      data: {
        id: result.rows[0].provider_id,
        name: result.rows[0].name,
        type: result.rows[0].type,
        enabled: result.rows[0].enabled
      }
    });
  } catch (error: any) {
    console.error('[TrackingV2] Upsert provider error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to save provider' });
  }
}

/**
 * DELETE /api/v2/logistics/tracking/providers/:providerId
 * Delete a tracking provider (tenant-scoped)
 */
export async function deleteProvider(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { providerId } = req.params;

    const result = await pool.query(
      `DELETE FROM logistics.tracking_providers WHERE provider_id = $1 AND tenant_id = $2 RETURNING provider_id`,
      [providerId, tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Provider not found' });
      return;
    }

    res.json({ success: true, data: { message: 'Provider deleted successfully' } });
  } catch (error: any) {
    console.error('[TrackingV2] Delete provider error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to delete provider' });
  }
}

/**
 * GET /api/v2/logistics/tracking/alerts
 * Get tracking alerts (tenant-scoped)
 */
export async function getAlerts(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { type, status = 'active', from, to, limit = 50 } = req.query;

    let query = `
      SELECT 
        a.alert_id,
        a.type,
        a.vehicle_id,
        v.registration,
        a.message,
        a.data,
        a.latitude,
        a.longitude,
        a.timestamp,
        a.status,
        a.resolved_at,
        a.resolved_by
      FROM logistics.tracking_alerts a
      JOIN logistics.vehicles v ON a.vehicle_id = v.vehicle_id
      WHERE v.tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramCount = 2;

    if (type) {
      query += ` AND a.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }
    if (status) {
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    if (from) {
      query += ` AND a.timestamp >= $${paramCount}`;
      params.push(from);
      paramCount++;
    }
    if (to) {
      query += ` AND a.timestamp <= $${paramCount}`;
      params.push(to);
      paramCount++;
    }

    query += ` ORDER BY a.timestamp DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit as string));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.alert_id,
        type: row.type,
        vehicleId: row.vehicle_id,
        registration: row.registration,
        message: row.message,
        data: row.data,
        location: { lat: row.latitude, lng: row.longitude },
        timestamp: row.timestamp,
        status: row.status,
        resolvedAt: row.resolved_at,
        resolvedBy: row.resolved_by
      }))
    });
  } catch (error: any) {
    console.error('[TrackingV2] Get alerts error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to get alerts' });
  }
}

/**
 * POST /api/v2/logistics/tracking/alerts/:alertId/resolve
 * Resolve a tracking alert (tenant-scoped)
 */
export async function resolveAlert(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { alertId } = req.params;
    const { resolution } = req.body;

    const result = await pool.query(`
      UPDATE logistics.tracking_alerts a
      SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP, resolved_by = $1, resolution = $2
      FROM logistics.vehicles v
      WHERE a.alert_id = $3 AND a.vehicle_id = v.vehicle_id AND v.tenant_id = $4
      RETURNING a.alert_id
    `, [userId, resolution, alertId, tenantId]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }

    res.json({ success: true, data: { message: 'Alert resolved' } });
  } catch (error: any) {
    console.error('[TrackingV2] Resolve alert error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to resolve alert' });
  }
}

/**
 * GET /api/v2/logistics/tracking/stats
 * Get tracking statistics (tenant-scoped)
 */
export async function getTrackingStats(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);

    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM logistics.vehicles WHERE tenant_id = $1 AND status = 'active') as total_vehicles,
        (SELECT COUNT(*) FROM logistics.vehicle_positions vp 
         JOIN logistics.vehicles v ON vp.vehicle_id = v.vehicle_id 
         WHERE v.tenant_id = $1 AND vp.status = 'moving') as vehicles_moving,
        (SELECT COUNT(*) FROM logistics.vehicle_positions vp 
         JOIN logistics.vehicles v ON vp.vehicle_id = v.vehicle_id 
         WHERE v.tenant_id = $1 AND vp.status = 'idle') as vehicles_idle,
        (SELECT COUNT(*) FROM logistics.vehicle_positions vp 
         JOIN logistics.vehicles v ON vp.vehicle_id = v.vehicle_id 
         WHERE v.tenant_id = $1 AND vp.status = 'offline') as vehicles_offline,
        (SELECT COUNT(*) FROM logistics.tracking_alerts a
         JOIN logistics.vehicles v ON a.vehicle_id = v.vehicle_id 
         WHERE v.tenant_id = $1 AND a.status = 'active') as active_alerts,
        (SELECT COUNT(*) FROM logistics.tracking_providers WHERE tenant_id = $1 AND enabled = true) as active_providers
    `, [tenantId]);

    res.json({ success: true, data: stats.rows[0] });
  } catch (error: any) {
    console.error('[TrackingV2] Get tracking stats error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to get tracking stats' });
  }
}
