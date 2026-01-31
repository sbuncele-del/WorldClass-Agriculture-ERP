/**
 * Logistics Controller V2
 * Tenant-aware handlers for fleet, vehicles, drivers, shipments, and routes
 * 
 * IMPORTANT: Uses TenantRequest for typed tenant context from middleware.
 */

import { Response } from 'express';
import { TenantRequest } from '../../types';
import pool from '../../config/database';
import { LogisticsAccountingService } from './logistics-accounting.service';

const accountingService = new LogisticsAccountingService();

/**
 * Tenant context helper
 */
interface TenantContext {
  tenantId: string;
  userId?: string;
}

function getTenantContext(req: TenantRequest): TenantContext {
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    throw new Error('Tenant ID not found');
  }
  return {
    tenantId,
    userId: req.user?.id
  };
}

// Helper to get table name
const getTableName = (table: string) => `logistics.${table}`;

// ============================================================================
// FLEET & VEHICLES
// ============================================================================

export const getVehicles = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { 
      page = '1', 
      limit = '50', 
      status, 
      vehicle_type, 
      search 
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'logistics' AND table_name = 'vehicles'
      ) as exists
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({
        vehicles: [],
        total: 0,
        page: 1,
        totalPages: 0,
        message: 'Logistics module not initialized. Please run database migration.'
      });
    }

    let query = `
      SELECT v.*
      FROM logistics.vehicles v
      WHERE v.tenant_id = $1
    `;
    const values: any[] = [tenantId];
    let paramCount = 2;

    if (status) {
      query += ` AND v.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    } else {
      query += ` AND v.status = 'ACTIVE'`;
    }

    if (vehicle_type) {
      query += ` AND v.vehicle_type = $${paramCount}`;
      values.push(vehicle_type);
      paramCount++;
    }

    if (search) {
      query += ` AND (v.vehicle_registration ILIKE $${paramCount} OR v.make ILIKE $${paramCount} OR v.model ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY v.vehicle_registration ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(parseInt(limit as string), offset);

    const result = await pool.query(query, values);

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM logistics.vehicles WHERE tenant_id = $1`;
    const countResult = await pool.query(countQuery, [tenantId]);

    res.json({
      success: true,
      vehicles: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page as string),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit as string))
    });
  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vehicles', error: error.message });
  }
};

export const getVehicleById = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM logistics.vehicles WHERE vehicle_id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.json({ success: true, vehicle: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch vehicle', error: error.message });
  }
};

export const createVehicle = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const vehicleData = req.body;

    const result = await pool.query(
      `INSERT INTO logistics.vehicles (
        tenant_id, vehicle_registration, make, model, year, vehicle_type,
        capacity_kg, capacity_m3, fuel_type, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        tenantId,
        vehicleData.vehicle_registration || vehicleData.registration_number,
        vehicleData.make,
        vehicleData.model,
        vehicleData.year,
        vehicleData.vehicle_type,
        vehicleData.capacity_kg || vehicleData.capacity_weight,
        vehicleData.capacity_m3 || vehicleData.capacity_volume,
        vehicleData.fuel_type,
        vehicleData.status || 'ACTIVE',
        vehicleData.notes
      ]
    );

    res.status(201).json({ success: true, vehicle: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to create vehicle', error: error.message });
  }
};

// ============================================================================
// DRIVERS
// ============================================================================

export const getDrivers = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { status, search, page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = `SELECT * FROM logistics.drivers WHERE tenant_id = $1`;
    const values: any[] = [tenantId];
    let paramCount = 2;

    if (status) {
      query += ` AND status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (search) {
      query += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR license_number ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY last_name, first_name LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(parseInt(limit as string), offset);

    const result = await pool.query(query, values);

    res.json({ success: true, drivers: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch drivers', error: error.message });
  }
};

// ============================================================================
// SHIPMENTS
// ============================================================================

export const getShipments = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { status, customer_id, date_from, date_to, page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = `
      SELECT s.*
      FROM logistics.shipments s
      WHERE s.tenant_id = $1
    `;
    const values: any[] = [tenantId];
    let paramCount = 2;

    if (status) {
      query += ` AND s.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (customer_id) {
      query += ` AND s.customer_id = $${paramCount}`;
      values.push(customer_id);
      paramCount++;
    }

    if (date_from) {
      query += ` AND s.scheduled_pickup_date >= $${paramCount}`;
      values.push(date_from);
      paramCount++;
    }

    if (date_to) {
      query += ` AND s.scheduled_pickup_date <= $${paramCount}`;
      values.push(date_to);
      paramCount++;
    }

    query += ` ORDER BY s.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(parseInt(limit as string), offset);

    const result = await pool.query(query, values);

    res.json({ success: true, shipments: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch shipments', error: error.message });
  }
};

export const createShipment = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const shipmentData = req.body;

    const result = await pool.query(
      `INSERT INTO logistics.shipments (
        tenant_id, shipment_number, customer_id, origin_address, destination_address,
        scheduled_pickup_date, scheduled_delivery_date, weight, volume, 
        status, priority, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        tenantId,
        shipmentData.shipment_number || `SHP-${Date.now()}`,
        shipmentData.customer_id,
        shipmentData.origin_address,
        shipmentData.destination_address,
        shipmentData.scheduled_pickup_date,
        shipmentData.scheduled_delivery_date,
        shipmentData.weight,
        shipmentData.volume,
        shipmentData.status || 'PENDING',
        shipmentData.priority || 'NORMAL',
        shipmentData.notes,
        userId
      ]
    );

    res.status(201).json({ success: true, shipment: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to create shipment', error: error.message });
  }
};

// ============================================================================
// ROUTES
// ============================================================================

export const getRoutes = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { status, page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = `
      SELECT r.*
      FROM logistics.routes r
      WHERE r.tenant_id = $1
    `;
    const values: any[] = [tenantId];
    let paramCount = 2;

    if (status) {
      query += ` AND r.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    query += ` ORDER BY r.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(parseInt(limit as string), offset);

    const result = await pool.query(query, values);

    res.json({ success: true, routes: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch routes', error: error.message });
  }
};

// ============================================================================
// DASHBOARD
// ============================================================================

export const getLogisticsDashboard = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    // Get vehicle stats
    const vehicleStats = await pool.query(
      `SELECT 
        COUNT(*) as total_vehicles,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_vehicles,
        COUNT(*) FILTER (WHERE status = 'MAINTENANCE') as maintenance_vehicles
       FROM logistics.vehicles WHERE tenant_id = $1`,
      [tenantId]
    );

    // Get driver stats
    const driverStats = await pool.query(
      `SELECT 
        COUNT(*) as total_drivers,
        COUNT(*) FILTER (WHERE status = 'AVAILABLE') as available_drivers
       FROM logistics.drivers WHERE tenant_id = $1`,
      [tenantId]
    );

    // Get shipment stats
    const shipmentStats = await pool.query(
      `SELECT 
        COUNT(*) as total_shipments,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending_shipments,
        COUNT(*) FILTER (WHERE status = 'IN_TRANSIT') as in_transit_shipments,
        COUNT(*) FILTER (WHERE status = 'DELIVERED') as delivered_shipments
       FROM logistics.shipments WHERE tenant_id = $1`,
      [tenantId]
    );

    res.json({
      success: true,
      dashboard: {
        vehicles: vehicleStats.rows[0],
        drivers: driverStats.rows[0],
        shipments: shipmentStats.rows[0]
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard', error: error.message });
  }
};

export default {
  getVehicles,
  getVehicleById,
  createVehicle,
  getDrivers,
  getShipments,
  createShipment,
  getRoutes,
  getLogisticsDashboard
};
