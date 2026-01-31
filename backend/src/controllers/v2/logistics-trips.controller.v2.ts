/**
 * Logistics Trips Controller V2
 * 
 * Tenant-hardened trip management for logistics module
 * Handles trip CRUD, status updates, and dashboard statistics
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

/**
 * GET /api/v2/logistics/trips
 * Get all trips with optional filters (tenant-scoped)
 */
export async function listTrips(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { status, pod_status, customer, driver, from_date, to_date, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT 
        trip_id,
        customer,
        origin,
        destination,
        driver,
        vehicle_reg,
        status,
        pod_status,
        eta,
        created_at,
        updated_at
      FROM logistics.trips
      WHERE tenant_id = $1
    `;

    const params: any[] = [tenantId];
    let paramCount = 2;

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (pod_status) {
      query += ` AND pod_status = $${paramCount}`;
      params.push(pod_status);
      paramCount++;
    }

    if (customer) {
      query += ` AND customer ILIKE $${paramCount}`;
      params.push(`%${customer}%`);
      paramCount++;
    }

    if (driver) {
      query += ` AND driver ILIKE $${paramCount}`;
      params.push(`%${driver}%`);
      paramCount++;
    }

    if (from_date) {
      query += ` AND eta >= $${paramCount}`;
      params.push(from_date);
      paramCount++;
    }

    if (to_date) {
      query += ` AND eta <= $${paramCount}`;
      params.push(to_date);
      paramCount++;
    }

    query += ` ORDER BY eta DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, params);

    // Get total count for pagination
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM logistics.trips WHERE tenant_id = $1`,
      [tenantId]
    );

    res.json({
      success: true,
      data: {
        trips: result.rows,
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error: any) {
    console.error('[TripsV2] List trips error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to fetch trips' });
  }
}

/**
 * GET /api/v2/logistics/trips/:id
 * Get single trip details (tenant-scoped)
 */
export async function getTrip(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM logistics.trips WHERE trip_id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Trip not found' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('[TripsV2] Get trip error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to fetch trip' });
  }
}

/**
 * POST /api/v2/logistics/trips
 * Create new trip (tenant-scoped)
 */
export async function createTrip(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const {
      customer,
      origin,
      destination,
      driver,
      vehicle_reg,
      status = 'Planned',
      pod_status = 'Pending',
      eta,
      notes
    } = req.body;

    // Validate required fields
    if (!customer || !origin || !destination || !driver || !vehicle_reg || !eta) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: customer, origin, destination, driver, vehicle_reg, eta' 
      });
      return;
    }

    // Generate tenant-scoped trip ID
    const tripIdResult = await pool.query(
      `SELECT 'TRP-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || 
       LPAD((COUNT(*) + 1)::TEXT, 5, '0') as trip_id 
       FROM logistics.trips 
       WHERE tenant_id = $1 AND trip_id LIKE 'TRP-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-%'`,
      [tenantId]
    );
    const trip_id = tripIdResult.rows[0].trip_id;

    const result = await pool.query(
      `INSERT INTO logistics.trips 
       (trip_id, tenant_id, customer, origin, destination, driver, vehicle_reg, status, pod_status, eta, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [trip_id, tenantId, customer, origin, destination, driver, vehicle_reg, status, pod_status, eta, notes, userId]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('[TripsV2] Create trip error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to create trip' });
  }
}

/**
 * PUT /api/v2/logistics/trips/:id
 * Update trip (tenant-scoped)
 */
export async function updateTrip(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;
    const {
      customer,
      origin,
      destination,
      driver,
      vehicle_reg,
      status,
      pod_status,
      eta,
      notes
    } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (customer !== undefined) {
      updates.push(`customer = $${paramCount}`);
      params.push(customer);
      paramCount++;
    }
    if (origin !== undefined) {
      updates.push(`origin = $${paramCount}`);
      params.push(origin);
      paramCount++;
    }
    if (destination !== undefined) {
      updates.push(`destination = $${paramCount}`);
      params.push(destination);
      paramCount++;
    }
    if (driver !== undefined) {
      updates.push(`driver = $${paramCount}`);
      params.push(driver);
      paramCount++;
    }
    if (vehicle_reg !== undefined) {
      updates.push(`vehicle_reg = $${paramCount}`);
      params.push(vehicle_reg);
      paramCount++;
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }
    if (pod_status !== undefined) {
      updates.push(`pod_status = $${paramCount}`);
      params.push(pod_status);
      paramCount++;
    }
    if (eta !== undefined) {
      updates.push(`eta = $${paramCount}`);
      params.push(eta);
      paramCount++;
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount}`);
      params.push(notes);
      paramCount++;
    }

    if (updates.length === 0) {
      res.status(400).json({ success: false, error: 'No fields to update' });
      return;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    updates.push(`updated_by = $${paramCount}`);
    params.push(userId);
    paramCount++;

    params.push(id, tenantId);

    const query = `
      UPDATE logistics.trips 
      SET ${updates.join(', ')}
      WHERE trip_id = $${paramCount} AND tenant_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Trip not found' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('[TripsV2] Update trip error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to update trip' });
  }
}

/**
 * DELETE /api/v2/logistics/trips/:id
 * Delete trip (tenant-scoped)
 */
export async function deleteTrip(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM logistics.trips WHERE trip_id = $1 AND tenant_id = $2 RETURNING trip_id`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Trip not found' });
      return;
    }

    res.json({ success: true, data: { message: 'Trip deleted successfully', trip_id: result.rows[0].trip_id } });
  } catch (error: any) {
    console.error('[TripsV2] Delete trip error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to delete trip' });
  }
}

/**
 * POST /api/v2/logistics/trips/:id/start
 * Start a trip (tenant-scoped)
 */
export async function startTrip(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE logistics.trips 
       SET status = 'In Transit', actual_start = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE trip_id = $1 AND tenant_id = $2 AND status = 'Planned'
       RETURNING *`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Trip not found or cannot be started' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('[TripsV2] Start trip error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to start trip' });
  }
}

/**
 * POST /api/v2/logistics/trips/:id/complete
 * Complete a trip (tenant-scoped)
 */
export async function completeTrip(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE logistics.trips 
       SET status = 'Delivered', actual_end = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE trip_id = $1 AND tenant_id = $2 AND status = 'In Transit'
       RETURNING *`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Trip not found or cannot be completed' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('[TripsV2] Complete trip error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to complete trip' });
  }
}

/**
 * POST /api/v2/logistics/trips/:id/cancel
 * Cancel a trip (tenant-scoped)
 */
export async function cancelTrip(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const { reason } = req.body;

    const result = await pool.query(
      `UPDATE logistics.trips 
       SET status = 'Cancelled', notes = COALESCE(notes || ' | ', '') || 'Cancelled: ' || COALESCE($1, 'No reason'), updated_at = CURRENT_TIMESTAMP
       WHERE trip_id = $2 AND tenant_id = $3 AND status IN ('Planned', 'In Transit')
       RETURNING *`,
      [reason, id, tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Trip not found or cannot be cancelled' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('[TripsV2] Cancel trip error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to cancel trip' });
  }
}

/**
 * GET /api/v2/logistics/trips/stats/dashboard
 * Get trip statistics for dashboard (tenant-scoped)
 */
export async function getDashboardStats(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);

    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'Planned') as planned,
        COUNT(*) FILTER (WHERE status = 'In Transit') as in_transit,
        COUNT(*) FILTER (WHERE status = 'Delivered') as delivered,
        COUNT(*) FILTER (WHERE status = 'Cancelled') as cancelled,
        COUNT(*) FILTER (WHERE pod_status = 'Pending' AND status NOT IN ('Cancelled', 'Delivered')) as pending_pod,
        COUNT(*) FILTER (WHERE status = 'Delivered' AND DATE(actual_end) = CURRENT_DATE) as delivered_today,
        COUNT(*) FILTER (WHERE DATE(eta) = CURRENT_DATE AND status IN ('Planned', 'In Transit')) as due_today
      FROM logistics.trips
      WHERE tenant_id = $1
    `, [tenantId]);

    res.json({ success: true, data: stats.rows[0] });
  } catch (error: any) {
    console.error('[TripsV2] Dashboard stats error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to fetch trip statistics' });
  }
}

/**
 * GET /api/v2/logistics/trips/recent
 * Get recent trips for quick view (tenant-scoped)
 */
export async function getRecentTrips(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await pool.query(`
      SELECT 
        trip_id,
        customer,
        origin,
        destination,
        driver,
        vehicle_reg,
        status,
        pod_status,
        eta,
        created_at
      FROM logistics.trips
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [tenantId, limit]);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('[TripsV2] Recent trips error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to fetch recent trips' });
  }
}

/**
 * GET /api/v2/logistics/customers
 * Get customers from sales module for logistics integration (tenant-scoped)
 */
export async function getCustomers(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { status = 'active', search, limit = 100 } = req.query;

    let query = `
      SELECT 
        id,
        code,
        name,
        contact_person,
        email,
        phone,
        address,
        city,
        status
      FROM customers
      WHERE tenant_id = $1
    `;

    const params: any[] = [tenantId];
    let paramCount = 2;

    if (status && status !== 'all') {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (search) {
      query += ` AND (name ILIKE $${paramCount} OR code ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY name ASC LIMIT $${paramCount}`;
    params.push(parseInt(limit as string));

    const result = await pool.query(query, params);

    res.json({ 
      success: true, 
      customers: result.rows,
      total: result.rows.length 
    });
  } catch (error: any) {
    console.error('[LogisticsV2] Get customers error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
}

/**
 * GET /api/v2/logistics/form-data
 * Get all form data needed for trip creation (customers, drivers, vehicles)
 */
export async function getFormData(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);

    // Fetch customers, drivers, and vehicles in parallel
    const [customersResult, driversResult, vehiclesResult] = await Promise.all([
      pool.query(`
        SELECT customer_id as id, customer_code as code, name, contact_person, email, phone, city
        FROM sales.customers
        WHERE tenant_id = $1 AND status = 'active'
        ORDER BY name ASC LIMIT 200
      `, [tenantId]),
      pool.query(`
        SELECT driver_id, first_name, last_name, license_number, phone, status
        FROM logistics.drivers
        WHERE tenant_id = $1 AND status IN ('ACTIVE', 'AVAILABLE', 'OFF_DUTY')
        ORDER BY first_name, last_name
      `, [tenantId]),
      pool.query(`
        SELECT vehicle_id, vehicle_registration as registration_number, make, model, vehicle_type, status
        FROM logistics.vehicles
        WHERE tenant_id = $1 AND status = 'ACTIVE'
        ORDER BY vehicle_registration
      `, [tenantId])
    ]);

    res.json({
      success: true,
      data: {
        customers: customersResult.rows,
        drivers: driversResult.rows,
        vehicles: vehiclesResult.rows
      }
    });
  } catch (error: any) {
    console.error('[LogisticsV2] Get form data error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to fetch form data' });
  }
}
