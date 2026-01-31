/**
 * Routes, Incidents & Geofences Controller V2
 * 
 * Tenant-hardened logistics management:
 * - Routes CRUD
 * - Incidents tracking
 * - Geofence management & events
 */

import { Request, Response } from 'express';
import { pool } from '../../config/database';

// Tenant-aware request type
interface TenantRequest extends Request {
  tenant?: { id: string };
  user?: { id: string; email: string; role: string; permissions: string[]; first_name?: string; last_name?: string };
}

// Extract tenant context with validation
function getTenantContext(req: TenantRequest): { tenantId: string; userId: string } {
  const tenantId = req.tenant?.id;
  const userId = req.user?.id;
  if (!tenantId) throw new Error('Tenant context required');
  if (!userId) throw new Error('User context required');
  return { tenantId, userId };
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * Get routes with pagination
 * GET /api/v2/logistics/routes
 */
export async function getRoutes(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { is_active, route_type, search, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const whereConditions: string[] = ['tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (is_active !== undefined) {
      whereConditions.push(`is_active = $${paramIndex++}`);
      params.push(is_active === 'true');
    }
    if (route_type) {
      whereConditions.push(`route_type = $${paramIndex++}`);
      params.push(route_type);
    }
    if (search) {
      whereConditions.push(`(route_name ILIKE $${paramIndex} OR route_code ILIKE $${paramIndex} OR origin_address ILIKE $${paramIndex} OR destination_address ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM routes WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const query = `
      SELECT * FROM routes 
      WHERE ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limitNum, offset);
    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        routes: result.rows,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('[RoutesV2] Get routes error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch routes' });
  }
}

/**
 * Get route by ID
 * GET /api/v2/logistics/routes/:id
 */
export async function getRouteById(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM routes WHERE route_id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Route not found' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('[RoutesV2] Get route by ID error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch route' });
  }
}

/**
 * Create route
 * POST /api/v2/logistics/routes
 */
export async function createRoute(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const {
      route_name, route_code, description, origin_address, origin_lat, origin_lng,
      destination_address, destination_lat, destination_lng, distance_km,
      estimated_duration_minutes, toll_cost, fuel_estimate_liters, route_type,
      waypoints, restrictions, notes
    } = req.body;

    const result = await pool.query(
      `INSERT INTO routes (
        route_name, route_code, description, origin_address, origin_lat, origin_lng,
        destination_address, destination_lat, destination_lng, distance_km,
        estimated_duration_minutes, toll_cost, fuel_estimate_liters, route_type,
        waypoints, restrictions, notes, created_by, tenant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        route_name, route_code, description, origin_address, origin_lat, origin_lng,
        destination_address, destination_lat, destination_lng, distance_km,
        estimated_duration_minutes, toll_cost, fuel_estimate_liters, route_type || 'standard',
        JSON.stringify(waypoints || []), JSON.stringify(restrictions || {}), notes,
        userId, tenantId
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('[RoutesV2] Create route error:', error);
    res.status(500).json({ success: false, error: 'Failed to create route' });
  }
}

/**
 * Update route
 * PUT /api/v2/logistics/routes/:id
 */
export async function updateRoute(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const {
      route_name, route_code, description, origin_address, origin_lat, origin_lng,
      destination_address, destination_lat, destination_lng, distance_km,
      estimated_duration_minutes, toll_cost, fuel_estimate_liters, route_type,
      waypoints, restrictions, notes, is_active
    } = req.body;

    const result = await pool.query(
      `UPDATE routes SET
        route_name = COALESCE($1, route_name),
        route_code = COALESCE($2, route_code),
        description = COALESCE($3, description),
        origin_address = COALESCE($4, origin_address),
        origin_lat = COALESCE($5, origin_lat),
        origin_lng = COALESCE($6, origin_lng),
        destination_address = COALESCE($7, destination_address),
        destination_lat = COALESCE($8, destination_lat),
        destination_lng = COALESCE($9, destination_lng),
        distance_km = COALESCE($10, distance_km),
        estimated_duration_minutes = COALESCE($11, estimated_duration_minutes),
        toll_cost = COALESCE($12, toll_cost),
        fuel_estimate_liters = COALESCE($13, fuel_estimate_liters),
        route_type = COALESCE($14, route_type),
        waypoints = COALESCE($15, waypoints),
        restrictions = COALESCE($16, restrictions),
        notes = COALESCE($17, notes),
        is_active = COALESCE($18, is_active),
        updated_at = NOW()
      WHERE route_id = $19 AND tenant_id = $20
      RETURNING *`,
      [
        route_name, route_code, description, origin_address, origin_lat, origin_lng,
        destination_address, destination_lat, destination_lng, distance_km,
        estimated_duration_minutes, toll_cost, fuel_estimate_liters, route_type,
        waypoints ? JSON.stringify(waypoints) : null,
        restrictions ? JSON.stringify(restrictions) : null,
        notes, is_active, id, tenantId
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Route not found' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('[RoutesV2] Update route error:', error);
    res.status(500).json({ success: false, error: 'Failed to update route' });
  }
}

/**
 * Delete route
 * DELETE /api/v2/logistics/routes/:id
 */
export async function deleteRoute(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM routes WHERE route_id = $1 AND tenant_id = $2 RETURNING route_id',
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Route not found' });
      return;
    }

    res.json({ success: true, data: { message: 'Route deleted', route_id: result.rows[0].route_id } });
  } catch (error: any) {
    console.error('[RoutesV2] Delete route error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete route' });
  }
}

// ============================================================================
// INCIDENTS
// ============================================================================

/**
 * Get logistics incidents
 * GET /api/v2/logistics/incidents
 */
export async function getIncidents(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { status, severity, incident_type, vehicle_id, driver_id, start_date, end_date, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const whereConditions: string[] = ['tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (status) {
      whereConditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (severity) {
      whereConditions.push(`severity = $${paramIndex++}`);
      params.push(severity);
    }
    if (incident_type) {
      whereConditions.push(`incident_type = $${paramIndex++}`);
      params.push(incident_type);
    }
    if (vehicle_id) {
      whereConditions.push(`vehicle_id = $${paramIndex++}`);
      params.push(vehicle_id);
    }
    if (driver_id) {
      whereConditions.push(`driver_id = $${paramIndex++}`);
      params.push(driver_id);
    }
    if (start_date) {
      whereConditions.push(`incident_date >= $${paramIndex++}`);
      params.push(start_date);
    }
    if (end_date) {
      whereConditions.push(`incident_date <= $${paramIndex++}`);
      params.push(end_date);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM incidents WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const query = `
      SELECT * FROM incidents 
      WHERE ${whereClause}
      ORDER BY incident_date DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limitNum, offset);
    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        incidents: result.rows,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('[RoutesV2] Get incidents error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch incidents' });
  }
}

/**
 * Get incident by ID
 * GET /api/v2/logistics/incidents/:id
 */
export async function getIncidentById(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM incidents WHERE incident_id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Incident not found' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('[RoutesV2] Get incident by ID error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch incident' });
  }
}

/**
 * Create incident
 * POST /api/v2/logistics/incidents
 */
export async function createIncident(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const {
      incident_type, severity, trip_id, vehicle_id, driver_id,
      location_address, location_lat, location_lng, incident_date,
      description, cause, injuries_count, fatalities_count, property_damage,
      damage_estimate, police_report_filed, police_report_number, photos, documents,
      witness_info, notes
    } = req.body;

    const result = await pool.query(
      `INSERT INTO incidents (
        incident_type, severity, trip_id, vehicle_id, driver_id,
        location_address, location_lat, location_lng, incident_date,
        description, cause, injuries_count, fatalities_count, property_damage,
        damage_estimate, police_report_filed, police_report_number, photos, documents,
        witness_info, reported_by, tenant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        incident_type, severity || 'medium', trip_id, vehicle_id, driver_id,
        location_address, location_lat, location_lng, incident_date || new Date(),
        description, cause, injuries_count || 0, fatalities_count || 0, property_damage || false,
        damage_estimate, police_report_filed || false, police_report_number,
        JSON.stringify(photos || []), JSON.stringify(documents || []),
        JSON.stringify(witness_info || []), userId, tenantId
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('[RoutesV2] Create incident error:', error);
    res.status(500).json({ success: false, error: 'Failed to create incident' });
  }
}

/**
 * Update incident
 * PUT /api/v2/logistics/incidents/:id
 */
export async function updateIncident(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const {
      status, severity, description, cause, injuries_count, fatalities_count,
      property_damage, damage_estimate, insurance_claim_number, insurance_status,
      police_report_filed, police_report_number, resolution_notes, corrective_actions,
      follow_up_required, follow_up_date, assigned_to
    } = req.body;

    const resolved_date = status === 'resolved' || status === 'closed' ? new Date() : null;

    const result = await pool.query(
      `UPDATE incidents SET
        status = COALESCE($1, status),
        severity = COALESCE($2, severity),
        description = COALESCE($3, description),
        cause = COALESCE($4, cause),
        injuries_count = COALESCE($5, injuries_count),
        fatalities_count = COALESCE($6, fatalities_count),
        property_damage = COALESCE($7, property_damage),
        damage_estimate = COALESCE($8, damage_estimate),
        insurance_claim_number = COALESCE($9, insurance_claim_number),
        insurance_status = COALESCE($10, insurance_status),
        police_report_filed = COALESCE($11, police_report_filed),
        police_report_number = COALESCE($12, police_report_number),
        resolution_notes = COALESCE($13, resolution_notes),
        corrective_actions = COALESCE($14, corrective_actions),
        follow_up_required = COALESCE($15, follow_up_required),
        follow_up_date = COALESCE($16, follow_up_date),
        assigned_to = COALESCE($17, assigned_to),
        resolved_date = COALESCE($18, resolved_date),
        updated_at = NOW()
      WHERE incident_id = $19 AND tenant_id = $20
      RETURNING *`,
      [
        status, severity, description, cause, injuries_count, fatalities_count,
        property_damage, damage_estimate, insurance_claim_number, insurance_status,
        police_report_filed, police_report_number, resolution_notes, corrective_actions,
        follow_up_required, follow_up_date, assigned_to, resolved_date, id, tenantId
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Incident not found' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('[RoutesV2] Update incident error:', error);
    res.status(500).json({ success: false, error: 'Failed to update incident' });
  }
}

/**
 * Delete incident
 * DELETE /api/v2/logistics/incidents/:id
 */
export async function deleteIncident(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM incidents WHERE incident_id = $1 AND tenant_id = $2 RETURNING incident_id',
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Incident not found' });
      return;
    }

    res.json({ success: true, data: { message: 'Incident deleted', incident_id: result.rows[0].incident_id } });
  } catch (error: any) {
    console.error('[RoutesV2] Delete incident error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete incident' });
  }
}

// ============================================================================
// GEOFENCES
// ============================================================================

/**
 * Get geofences
 * GET /api/v2/logistics/geofences
 */
export async function getGeofences(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { is_active, geofence_type, customer_id, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const whereConditions: string[] = ['tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (is_active !== undefined) {
      whereConditions.push(`is_active = $${paramIndex++}`);
      params.push(is_active === 'true');
    }
    if (geofence_type) {
      whereConditions.push(`geofence_type = $${paramIndex++}`);
      params.push(geofence_type);
    }
    if (customer_id) {
      whereConditions.push(`customer_id = $${paramIndex++}`);
      params.push(customer_id);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM geofences WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const query = `
      SELECT * FROM geofences 
      WHERE ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limitNum, offset);
    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        geofences: result.rows,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('[RoutesV2] Get geofences error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch geofences' });
  }
}

/**
 * Get geofence by ID
 * GET /api/v2/logistics/geofences/:id
 */
export async function getGeofenceById(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM geofences WHERE geofence_id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Geofence not found' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('[RoutesV2] Get geofence by ID error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch geofence' });
  }
}

/**
 * Create geofence
 * POST /api/v2/logistics/geofences
 */
export async function createGeofence(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const {
      geofence_name, geofence_code, geofence_type, geometry_type,
      center_lat, center_lng, radius_meters, polygon_coordinates,
      alert_on_enter, alert_on_exit, alert_on_dwell, dwell_time_minutes,
      speed_limit_kmh, schedule, alert_emails, alert_phone_numbers,
      customer_id, address, color, notes
    } = req.body;

    const result = await pool.query(
      `INSERT INTO geofences (
        geofence_name, geofence_code, geofence_type, geometry_type,
        center_lat, center_lng, radius_meters, polygon_coordinates,
        alert_on_enter, alert_on_exit, alert_on_dwell, dwell_time_minutes,
        speed_limit_kmh, schedule, alert_emails, alert_phone_numbers,
        customer_id, address, color, notes, created_by, tenant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        geofence_name, geofence_code, geofence_type, geometry_type || 'circle',
        center_lat, center_lng, radius_meters, polygon_coordinates ? JSON.stringify(polygon_coordinates) : null,
        alert_on_enter ?? true, alert_on_exit ?? true, alert_on_dwell ?? false, dwell_time_minutes,
        speed_limit_kmh, schedule ? JSON.stringify(schedule) : null, alert_emails, alert_phone_numbers,
        customer_id, address, color || '#3B82F6', notes, userId, tenantId
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('[RoutesV2] Create geofence error:', error);
    res.status(500).json({ success: false, error: 'Failed to create geofence' });
  }
}

/**
 * Update geofence
 * PUT /api/v2/logistics/geofences/:id
 */
export async function updateGeofence(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const {
      geofence_name, geofence_code, geofence_type, geometry_type,
      center_lat, center_lng, radius_meters, polygon_coordinates,
      is_active, alert_on_enter, alert_on_exit, alert_on_dwell, dwell_time_minutes,
      speed_limit_kmh, schedule, alert_emails, alert_phone_numbers,
      customer_id, address, color, notes
    } = req.body;

    const result = await pool.query(
      `UPDATE geofences SET
        geofence_name = COALESCE($1, geofence_name),
        geofence_code = COALESCE($2, geofence_code),
        geofence_type = COALESCE($3, geofence_type),
        geometry_type = COALESCE($4, geometry_type),
        center_lat = COALESCE($5, center_lat),
        center_lng = COALESCE($6, center_lng),
        radius_meters = COALESCE($7, radius_meters),
        polygon_coordinates = COALESCE($8, polygon_coordinates),
        is_active = COALESCE($9, is_active),
        alert_on_enter = COALESCE($10, alert_on_enter),
        alert_on_exit = COALESCE($11, alert_on_exit),
        alert_on_dwell = COALESCE($12, alert_on_dwell),
        dwell_time_minutes = COALESCE($13, dwell_time_minutes),
        speed_limit_kmh = COALESCE($14, speed_limit_kmh),
        schedule = COALESCE($15, schedule),
        alert_emails = COALESCE($16, alert_emails),
        alert_phone_numbers = COALESCE($17, alert_phone_numbers),
        customer_id = COALESCE($18, customer_id),
        address = COALESCE($19, address),
        color = COALESCE($20, color),
        notes = COALESCE($21, notes),
        updated_at = NOW()
      WHERE geofence_id = $22 AND tenant_id = $23
      RETURNING *`,
      [
        geofence_name, geofence_code, geofence_type, geometry_type,
        center_lat, center_lng, radius_meters,
        polygon_coordinates ? JSON.stringify(polygon_coordinates) : null,
        is_active, alert_on_enter, alert_on_exit, alert_on_dwell, dwell_time_minutes,
        speed_limit_kmh, schedule ? JSON.stringify(schedule) : null,
        alert_emails, alert_phone_numbers,
        customer_id, address, color, notes, id, tenantId
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Geofence not found' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('[RoutesV2] Update geofence error:', error);
    res.status(500).json({ success: false, error: 'Failed to update geofence' });
  }
}

/**
 * Delete geofence
 * DELETE /api/v2/logistics/geofences/:id
 */
export async function deleteGeofence(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM geofences WHERE geofence_id = $1 AND tenant_id = $2 RETURNING geofence_id',
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Geofence not found' });
      return;
    }

    res.json({ success: true, data: { message: 'Geofence deleted', geofence_id: result.rows[0].geofence_id } });
  } catch (error: any) {
    console.error('[RoutesV2] Delete geofence error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete geofence' });
  }
}

/**
 * Get geofence events
 * GET /api/v2/logistics/geofences/events
 */
export async function getGeofenceEvents(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { geofence_id, vehicle_id, event_type, start_date, end_date, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const whereConditions: string[] = ['tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (geofence_id) {
      whereConditions.push(`geofence_id = $${paramIndex++}`);
      params.push(geofence_id);
    }
    if (vehicle_id) {
      whereConditions.push(`vehicle_id = $${paramIndex++}`);
      params.push(vehicle_id);
    }
    if (event_type) {
      whereConditions.push(`event_type = $${paramIndex++}`);
      params.push(event_type);
    }
    if (start_date) {
      whereConditions.push(`event_time >= $${paramIndex++}`);
      params.push(start_date);
    }
    if (end_date) {
      whereConditions.push(`event_time <= $${paramIndex++}`);
      params.push(end_date);
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT * FROM geofence_events 
      WHERE ${whereClause}
      ORDER BY event_time DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limitNum, offset);
    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        events: result.rows,
        page: pageNum
      }
    });
  } catch (error: any) {
    console.error('[RoutesV2] Get geofence events error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch geofence events' });
  }
}
