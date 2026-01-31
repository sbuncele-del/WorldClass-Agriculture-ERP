/**
 * Property Controller V2
 * Tenant-hardened API for property management operations
 * 
 * Features:
 * - Property portfolio management
 * - Unit management
 * - Tenant (occupant) management
 * - Lease management
 * - Maintenance requests
 */

import { Response } from 'express';
import { TenantRequest } from '../types';
import pool from '../config/database';

/**
 * Tenant context helper
 */
function getTenantContext(req: TenantRequest): { tenantId: string; userId: string } {
  const tenantId = req.tenant?.id;
  const userId = req.user?.id;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }
  return { tenantId, userId: userId || '' };
}

// ============================================================================
// WORKSPACE
// ============================================================================
export const getWorkspace = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    const [propertiesResult, unitsResult, occupiedResult, maintenanceResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) as total_properties, COALESCE(SUM(total_units), 0) as total_units
        FROM properties WHERE tenant_id = $1 AND is_active = true`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) as vacant_units
        FROM property_units WHERE tenant_id = $1 AND status = 'vacant'`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) as occupied_units
        FROM property_units WHERE tenant_id = $1 AND status = 'occupied'`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) as open_requests
        FROM property_maintenance WHERE tenant_id = $1 AND status IN ('pending', 'in_progress')`,
        [tenantId]
      )
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalProperties: parseInt(propertiesResult.rows[0]?.total_properties || '0'),
          totalUnits: parseInt(propertiesResult.rows[0]?.total_units || '0'),
          vacantUnits: parseInt(unitsResult.rows[0]?.vacant_units || '0'),
          occupiedUnits: parseInt(occupiedResult.rows[0]?.occupied_units || '0'),
          openMaintenanceRequests: parseInt(maintenanceResult.rows[0]?.open_requests || '0')
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Property workspace error:', error);
    res.status(500).json({ success: false, error: 'Failed to load workspace' });
  }
};

// ============================================================================
// PROPERTIES
// ============================================================================
export const getProperties = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { propertyType, status } = req.query;

    let queryStr = `
      SELECT 
        COALESCE(id::text, property_id::text) as id, 
        COALESCE(code, property_code) as code, 
        COALESCE(name, property_name) as name, 
        COALESCE(property_type, 'COMMERCIAL') as property_type, 
        address, 
        city, 
        COALESCE(province, state_province) as province, 
        postal_code,
        COALESCE(total_units, 1) as total_units, 
        COALESCE(status, 'ACTIVE') as status, 
        year_built, 
        COALESCE(total_sqm, total_area, 0) as total_sqm, 
        manager_name, 
        created_at
      FROM properties WHERE tenant_id = $1 AND COALESCE(is_active, true) = true
    `;
    const params: any[] = [tenantId];

    if (propertyType) {
      params.push(propertyType);
      queryStr += ` AND property_type = $${params.length}`;
    }
    if (status) {
      params.push(status);
      queryStr += ` AND status = $${params.length}`;
    }

    queryStr += ' ORDER BY name ASC';
    const result = await pool.query(queryStr, params);

    res.json({
      success: true,
      data: result.rows.map(p => ({
        id: p.id,
        code: p.code,
        name: p.name,
        type: p.property_type,
        address: { street: p.address, city: p.city, province: p.province, postalCode: p.postal_code },
        totalUnits: parseInt(p.total_units),
        status: p.status,
        yearBuilt: p.year_built,
        totalSqm: parseFloat(p.total_sqm),
        manager: p.manager_name
      }))
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get properties error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch properties' });
  }
};

export const getPropertyById = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM properties WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get property error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch property' });
  }
};

export const createProperty = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { code, name, propertyType, address, city, province, postalCode, 
            totalUnits, yearBuilt, totalSqm, managerName, description } = req.body;

    const result = await pool.query(
      `INSERT INTO properties (tenant_id, code, name, property_type, address, city, 
        province, postal_code, total_units, year_built, total_sqm, manager_name, 
        description, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'active')
      RETURNING *`,
      [tenantId, code, name, propertyType, address, city, province, postalCode,
       totalUnits || 0, yearBuilt, totalSqm, managerName, description]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Property created' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Property code already exists' });
    }
    console.error('Create property error:', error);
    res.status(500).json({ success: false, error: 'Failed to create property' });
  }
};

export const updateProperty = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const updates = req.body;

    const result = await pool.query(
      `UPDATE properties SET
        name = COALESCE($3, name),
        status = COALESCE($4, status),
        manager_name = COALESCE($5, manager_name),
        total_units = COALESCE($6, total_units),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, updates.name, updates.status, updates.managerName, updates.totalUnits]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Property updated' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update property error:', error);
    res.status(500).json({ success: false, error: 'Failed to update property' });
  }
};

// ============================================================================
// PROPERTY UNITS
// ============================================================================
export const getUnits = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { propertyId, status, unitType } = req.query;

    let queryStr = `
      SELECT u.*, p.name as property_name
      FROM property_units u
      LEFT JOIN properties p ON u.property_id = p.id
      WHERE u.tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (propertyId) {
      params.push(propertyId);
      queryStr += ` AND u.property_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      queryStr += ` AND u.status = $${params.length}`;
    }
    if (unitType) {
      params.push(unitType);
      queryStr += ` AND u.unit_type = $${params.length}`;
    }

    queryStr += ' ORDER BY u.unit_number';
    const result = await pool.query(queryStr, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get units error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch units' });
  }
};

export const createUnit = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { propertyId, unitNumber, unitType, floor, bedrooms, bathrooms, 
            sizeSqm, monthlyRent, features } = req.body;

    const result = await pool.query(
      `INSERT INTO property_units (tenant_id, property_id, unit_number, unit_type, floor,
        bedrooms, bathrooms, size_sqm, monthly_rent, features, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'vacant')
      RETURNING *`,
      [tenantId, propertyId, unitNumber, unitType, floor, bedrooms, bathrooms,
       sizeSqm, monthlyRent, features]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Unit added' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Unit number already exists' });
    }
    console.error('Add unit error:', error);
    res.status(500).json({ success: false, error: 'Failed to add unit' });
  }
};

export const updateUnit = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const { status, monthlyRent, features } = req.body;

    const result = await pool.query(
      `UPDATE property_units SET
        status = COALESCE($3, status),
        monthly_rent = COALESCE($4, monthly_rent),
        features = COALESCE($5, features)
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, status, monthlyRent, features]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Unit not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Unit updated' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update unit error:', error);
    res.status(500).json({ success: false, error: 'Failed to update unit' });
  }
};

// ============================================================================
// PROPERTY TENANTS (OCCUPANTS)
// ============================================================================
export const getOccupants = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { propertyId, status } = req.query;

    let queryStr = `
      SELECT t.*, u.unit_number, p.name as property_name
      FROM property_tenants t
      LEFT JOIN property_units u ON t.unit_id = u.id
      LEFT JOIN properties p ON u.property_id = p.id
      WHERE t.tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (propertyId) {
      params.push(propertyId);
      queryStr += ` AND u.property_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      queryStr += ` AND t.status = $${params.length}`;
    }

    queryStr += ' ORDER BY t.last_name, t.first_name';
    const result = await pool.query(queryStr, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get occupants error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch occupants' });
  }
};

export const createOccupant = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { unitId, firstName, lastName, email, phone, idNumber, employerName, 
            monthlyIncome, emergencyContactName, emergencyContactPhone } = req.body;

    const result = await pool.query(
      `INSERT INTO property_tenants (tenant_id, unit_id, first_name, last_name, email, phone,
        id_number, employer_name, monthly_income, emergency_contact_name, 
        emergency_contact_phone, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
      RETURNING *`,
      [tenantId, unitId, firstName, lastName, email, phone, idNumber, employerName,
       monthlyIncome, emergencyContactName, emergencyContactPhone]
    );

    // Update unit status to occupied
    await pool.query(
      `UPDATE property_units SET status = 'occupied' WHERE id = $1 AND tenant_id = $2`,
      [unitId, tenantId]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Occupant added' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Add occupant error:', error);
    res.status(500).json({ success: false, error: 'Failed to add occupant' });
  }
};

export const updateOccupant = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const { status, phone, email, employerName, monthlyIncome } = req.body;

    const result = await pool.query(
      `UPDATE property_tenants SET
        status = COALESCE($3, status),
        phone = COALESCE($4, phone),
        email = COALESCE($5, email),
        employer_name = COALESCE($6, employer_name),
        monthly_income = COALESCE($7, monthly_income)
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, status, phone, email, employerName, monthlyIncome]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Occupant not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Occupant updated' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update occupant error:', error);
    res.status(500).json({ success: false, error: 'Failed to update occupant' });
  }
};

// ============================================================================
// LEASES
// ============================================================================
export const getLeases = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { propertyId, status, expiringWithinDays } = req.query;

    let queryStr = `
      SELECT 
        l.lease_id as id,
        l.lease_number,
        l.start_date,
        l.end_date,
        COALESCE(l.monthly_rent, 0) as monthly_rent,
        l.status,
        l.lessee_name as tenant_name,
        p.property_name
      FROM leases l
      LEFT JOIN properties p ON l.property_id = p.property_id
      WHERE l.tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (propertyId) {
      params.push(propertyId);
      queryStr += ` AND l.property_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      queryStr += ` AND l.status = $${params.length}`;
    }
    if (expiringWithinDays) {
      params.push(expiringWithinDays);
      queryStr += ` AND l.end_date <= CURRENT_DATE + ($${params.length} || ' days')::interval AND l.status = 'active'`;
    }

    queryStr += ' ORDER BY l.end_date ASC';
    const result = await pool.query(queryStr, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get leases error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leases' });
  }
};

export const createLease = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { unitId, propertyTenantId, startDate, endDate, monthlyRent, 
            depositAmount, paymentDueDay, terms } = req.body;

    const result = await pool.query(
      `INSERT INTO property_leases (tenant_id, unit_id, property_tenant_id, start_date, 
        end_date, monthly_rent, deposit_amount, payment_due_day, terms, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
      RETURNING *`,
      [tenantId, unitId, propertyTenantId, startDate, endDate, monthlyRent,
       depositAmount, paymentDueDay || 1, terms]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Lease created' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Create lease error:', error);
    res.status(500).json({ success: false, error: 'Failed to create lease' });
  }
};

export const updateLease = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const { status, endDate, monthlyRent, notes } = req.body;

    const result = await pool.query(
      `UPDATE property_leases SET
        status = COALESCE($3, status),
        end_date = COALESCE($4, end_date),
        monthly_rent = COALESCE($5, monthly_rent),
        notes = COALESCE($6, notes)
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, status, endDate, monthlyRent, notes]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lease not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Lease updated' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update lease error:', error);
    res.status(500).json({ success: false, error: 'Failed to update lease' });
  }
};

// ============================================================================
// MAINTENANCE
// ============================================================================
export const getMaintenanceRequests = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { propertyId, unitId, status, priority } = req.query;

    let queryStr = `
      SELECT m.*, u.unit_number, p.name as property_name, 
        t.first_name || ' ' || t.last_name as reported_by_name
      FROM property_maintenance m
      LEFT JOIN property_units u ON m.unit_id = u.id
      LEFT JOIN properties p ON u.property_id = p.id
      LEFT JOIN property_tenants t ON m.reported_by_tenant_id = t.id
      WHERE m.tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (propertyId) {
      params.push(propertyId);
      queryStr += ` AND u.property_id = $${params.length}`;
    }
    if (unitId) {
      params.push(unitId);
      queryStr += ` AND m.unit_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      queryStr += ` AND m.status = $${params.length}`;
    }
    if (priority) {
      params.push(priority);
      queryStr += ` AND m.priority = $${params.length}`;
    }

    queryStr += ' ORDER BY m.created_at DESC';
    const result = await pool.query(queryStr, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get maintenance error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch maintenance requests' });
  }
};

export const createMaintenanceRequest = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { unitId, reportedByTenantId, title, description, category, priority, 
            preferredDate } = req.body;

    const result = await pool.query(
      `INSERT INTO property_maintenance (tenant_id, unit_id, reported_by_tenant_id, title,
        description, category, priority, preferred_date, status, created_by_user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
      RETURNING *`,
      [tenantId, unitId, reportedByTenantId, title, description, category, 
       priority || 'medium', preferredDate, userId]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Request submitted' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Create maintenance error:', error);
    res.status(500).json({ success: false, error: 'Failed to create request' });
  }
};

export const updateMaintenanceRequest = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const { status, assignedToName, scheduledDate, completedDate, cost, notes } = req.body;

    const result = await pool.query(
      `UPDATE property_maintenance SET
        status = COALESCE($3, status),
        assigned_to_name = COALESCE($4, assigned_to_name),
        scheduled_date = COALESCE($5, scheduled_date),
        completed_date = COALESCE($6, completed_date),
        cost = COALESCE($7, cost),
        notes = COALESCE($8, notes)
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, status, assignedToName, scheduledDate, completedDate, cost, notes]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Request updated' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update maintenance error:', error);
    res.status(500).json({ success: false, error: 'Failed to update request' });
  }
};

/**
 * Get property dashboard
 */
export const getPropertyDashboard = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    // Get property stats
    const propertyStats = await pool.query(
      `SELECT COUNT(*) as total_properties FROM property_properties WHERE tenant_id = $1`,
      [tenantId]
    );

    // Get unit stats
    const unitStats = await pool.query(
      `SELECT 
         COUNT(*) as total_units,
         SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied,
         SUM(CASE WHEN status = 'vacant' THEN 1 ELSE 0 END) as vacant
       FROM property_units 
       WHERE tenant_id = $1`,
      [tenantId]
    );

    // Get lease stats
    const leaseStats = await pool.query(
      `SELECT 
         COUNT(*) as active_leases,
         SUM(monthly_rent) as total_monthly_rent
       FROM property_leases 
       WHERE tenant_id = $1 AND status = 'active'`,
      [tenantId]
    );

    res.json({
      success: true,
      data: {
        totalProperties: parseInt(propertyStats.rows[0]?.total_properties || '0'),
        totalUnits: parseInt(unitStats.rows[0]?.total_units || '0'),
        occupiedUnits: parseInt(unitStats.rows[0]?.occupied || '0'),
        vacantUnits: parseInt(unitStats.rows[0]?.vacant || '0'),
        activeLeases: parseInt(leaseStats.rows[0]?.active_leases || '0'),
        monthlyRentalIncome: parseFloat(leaseStats.rows[0]?.total_monthly_rent || '0'),
        occupancyRate: parseInt(unitStats.rows[0]?.total_units || '0') > 0 
          ? Math.round((parseInt(unitStats.rows[0]?.occupied || '0') / parseInt(unitStats.rows[0]?.total_units || '1')) * 100)
          : 0,
        summary: {
          properties: parseInt(propertyStats.rows[0]?.total_properties || '0'),
          units: parseInt(unitStats.rows[0]?.total_units || '0')
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get property dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch property dashboard' });
  }
};

export default {
  getWorkspace,
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  getUnits,
  createUnit,
  updateUnit,
  getOccupants,
  createOccupant,
  updateOccupant,
  getLeases,
  createLease,
  updateLease,
  getMaintenanceRequests,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  getPropertyDashboard
};
