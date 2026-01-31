/**
 * PROPERTY MANAGEMENT ROUTES - TENANT-AWARE
 * 
 * Property/Real Estate operations API:
 * - Property portfolio management
 * - Tenant management
 * - Lease administration
 * - Maintenance & work orders
 */

import express, { Request, Response } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

// ============================================================================
// WORKSPACE SUMMARY
// ============================================================================
router.get('/workspace', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    const [propertiesResult, unitsResult, maintenanceResult, leasesResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) as total_properties, COALESCE(SUM(total_units), 0) as total_units
        FROM properties WHERE tenant_id = $1 AND is_active = true`,
        [tenantId]
      ),
      pool.query(
        `SELECT 
          COUNT(*) as total_units,
          COUNT(*) FILTER (WHERE status = 'occupied') as occupied_units,
          COUNT(*) FILTER (WHERE status = 'vacant') as vacant_units,
          COALESCE(SUM(monthly_rent) FILTER (WHERE status = 'occupied'), 0) as monthly_income
        FROM property_units WHERE tenant_id = $1`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) FILTER (WHERE status IN ('open', 'assigned', 'in_progress')) as open_requests
        FROM property_maintenance WHERE tenant_id = $1`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) as expiring_leases
        FROM property_leases 
        WHERE tenant_id = $1 AND status = 'active' 
        AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'`,
        [tenantId]
      )
    ]);

    const totalUnits = parseInt(unitsResult.rows[0]?.total_units || '0');
    const occupiedUnits = parseInt(unitsResult.rows[0]?.occupied_units || '0');
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalProperties: parseInt(propertiesResult.rows[0]?.total_properties || '0'),
          totalUnits,
          occupancyRate,
          vacantUnits: parseInt(unitsResult.rows[0]?.vacant_units || '0'),
          monthlyRentalIncome: parseFloat(unitsResult.rows[0]?.monthly_income || '0'),
          maintenanceRequests: parseInt(maintenanceResult.rows[0]?.open_requests || '0'),
          expiringLeases: parseInt(leasesResult.rows[0]?.expiring_leases || '0')
        }
      }
    });
  } catch (error) {
    console.error('Property workspace error:', error);
    res.status(500).json({ success: false, error: 'Failed to load workspace' });
  }
});

// ============================================================================
// PROPERTIES
// ============================================================================
router.get('/properties', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { type, status } = req.query;

    let query = `
      SELECT p.*, 
        0 as unit_count,
        0 as occupied_count
      FROM properties p
      WHERE p.tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (type) {
      params.push(type);
      query += ` AND p.property_type = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND p.status = $${params.length}`;
    }

    query += ' ORDER BY p.name ASC';
    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(p => ({
        id: p.id,
        code: p.code,
        name: p.name,
        type: p.property_type,
        subType: p.sub_type,
        address: p.address,
        province: p.province,
        city: p.city,
        totalUnits: parseInt(p.unit_count) || p.total_units,
        occupiedUnits: parseInt(p.occupied_count) || 0,
        occupancyRate: p.unit_count > 0 ? Math.round((p.occupied_count / p.unit_count) * 100) : 0,
        marketValue: parseFloat(p.market_value) || null,
        manager: p.manager_name,
        status: p.status
      }))
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch properties' });
  }
});

router.get('/properties/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM properties WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch property' });
  }
});

router.post('/properties', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { code, name, propertyType, subType, address, province, city, postalCode,
            totalUnits, totalAreaSqm, marketValue, purchaseDate, purchasePrice, managerName } = req.body;

    const result = await pool.query(
      `INSERT INTO properties 
        (tenant_id, code, name, property_type, sub_type, address, province, city, postal_code,
         total_units, total_area_sqm, market_value, purchase_date, purchase_price, manager_name, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'active')
      RETURNING *`,
      [tenantId, code, name, propertyType, subType, address, province, city, postalCode,
       totalUnits || 1, totalAreaSqm, marketValue, purchaseDate, purchasePrice, managerName]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Property created' });
  } catch (error: any) {
    console.error('Create property error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Property code already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to create property' });
  }
});

router.put('/properties/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;
    const { name, status, marketValue, managerName } = req.body;

    const result = await pool.query(
      `UPDATE properties SET
        name = COALESCE($3, name),
        status = COALESCE($4, status),
        market_value = COALESCE($5, market_value),
        manager_name = COALESCE($6, manager_name),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, name, status, marketValue, managerName]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Property updated' });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ success: false, error: 'Failed to update property' });
  }
});

// ============================================================================
// PROPERTY UNITS
// ============================================================================
router.get('/properties/:propertyId/units', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { propertyId } = req.params;
    const { status } = req.query;

    let query = `SELECT * FROM property_units WHERE property_id = $1 AND tenant_id = $2`;
    const params: any[] = [propertyId, tenantId];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ' ORDER BY unit_number';
    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get units error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch units' });
  }
});

router.post('/properties/:propertyId/units', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { propertyId } = req.params;
    const { unitNumber, floorNumber, unitType, areaSqm, bedrooms, bathrooms, monthlyRent } = req.body;

    const result = await pool.query(
      `INSERT INTO property_units 
        (tenant_id, property_id, unit_number, floor_number, unit_type, area_sqm, 
         bedrooms, bathrooms, monthly_rent, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'vacant')
      RETURNING *`,
      [tenantId, propertyId, unitNumber, floorNumber, unitType, areaSqm, 
       bedrooms, bathrooms, monthlyRent]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Unit added' });
  } catch (error) {
    console.error('Add unit error:', error);
    res.status(500).json({ success: false, error: 'Failed to add unit' });
  }
});

router.put('/units/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;
    const { status, monthlyRent, currentTenantName, leaseStartDate, leaseEndDate } = req.body;

    const result = await pool.query(
      `UPDATE property_units SET
        status = COALESCE($3, status),
        monthly_rent = COALESCE($4, monthly_rent),
        current_tenant_name = COALESCE($5, current_tenant_name),
        lease_start_date = COALESCE($6, lease_start_date),
        lease_end_date = COALESCE($7, lease_end_date)
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, status, monthlyRent, currentTenantName, leaseStartDate, leaseEndDate]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Unit not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Unit updated' });
  } catch (error) {
    console.error('Update unit error:', error);
    res.status(500).json({ success: false, error: 'Failed to update unit' });
  }
});

// ============================================================================
// TENANTS (Property Tenants/Renters)
// ============================================================================
router.get('/tenants', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { status } = req.query;

    let query = `SELECT * FROM property_tenants WHERE tenant_id = $1`;
    const params: any[] = [tenantId];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ' ORDER BY name';
    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tenants' });
  }
});

router.post('/tenants', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { code, name, tenantType, idNumber, email, phone, address } = req.body;

    const result = await pool.query(
      `INSERT INTO property_tenants 
        (tenant_id, code, name, tenant_type, id_number, email, phone, address, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
      RETURNING *`,
      [tenantId, code, name, tenantType, idNumber, email, phone, address]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Tenant created' });
  } catch (error: any) {
    console.error('Create tenant error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Tenant code already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to create tenant' });
  }
});

// ============================================================================
// LEASES
// ============================================================================
router.get('/leases', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { propertyId, status } = req.query;

    let query = `
      SELECT l.*
      FROM leases l
      WHERE l.tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (status) {
      params.push(status);
      query += ` AND l.status = $${params.length}`;
    }

    query += ' ORDER BY l.start_date DESC';
    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get leases error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leases' });
  }
});

router.post('/leases', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { propertyId, unitId, propertyTenantId, leaseNumber, startDate, endDate,
            monthlyRent, depositAmount, escalationRate, paymentDueDay } = req.body;

    const result = await pool.query(
      `INSERT INTO property_leases 
        (tenant_id, property_id, unit_id, property_tenant_id, lease_number, start_date,
         end_date, monthly_rent, deposit_amount, escalation_rate, payment_due_day, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
      RETURNING *`,
      [tenantId, propertyId, unitId, propertyTenantId, leaseNumber, startDate, endDate,
       monthlyRent, depositAmount, escalationRate, paymentDueDay || 1]
    );

    // Update unit status to occupied
    await pool.query(
      `UPDATE property_units SET status = 'occupied', lease_start_date = $3, lease_end_date = $4
      WHERE id = $1 AND tenant_id = $2`,
      [unitId, tenantId, startDate, endDate]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Lease created' });
  } catch (error: any) {
    console.error('Create lease error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Lease number already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to create lease' });
  }
});

// ============================================================================
// MAINTENANCE REQUESTS
// ============================================================================
router.get('/maintenance', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { propertyId, status, priority } = req.query;

    let query = `
      SELECT m.*, p.name as property_name, u.unit_number
      FROM property_maintenance m
      LEFT JOIN properties p ON m.property_id = p.id
      LEFT JOIN property_units u ON m.unit_id = u.id
      WHERE m.tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (propertyId) {
      params.push(propertyId);
      query += ` AND m.property_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND m.status = $${params.length}`;
    }
    if (priority) {
      params.push(priority);
      query += ` AND m.priority = $${params.length}`;
    }

    query += ' ORDER BY m.created_at DESC';
    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get maintenance error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch maintenance requests' });
  }
});

router.post('/maintenance', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { propertyId, unitId, title, description, category, priority, reportedBy } = req.body;

    // Generate request number
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM property_maintenance WHERE tenant_id = $1',
      [tenantId]
    );
    const requestNumber = `MR-${String(parseInt(countResult.rows[0].count) + 1).padStart(5, '0')}`;

    const result = await pool.query(
      `INSERT INTO property_maintenance 
        (tenant_id, property_id, unit_id, request_number, title, description, category,
         priority, reported_by, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open')
      RETURNING *`,
      [tenantId, propertyId, unitId, requestNumber, title, description, category,
       priority || 'medium', reportedBy]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Maintenance request created' });
  } catch (error) {
    console.error('Create maintenance error:', error);
    res.status(500).json({ success: false, error: 'Failed to create maintenance request' });
  }
});

router.put('/maintenance/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;
    const { status, assignedTo, scheduledDate, completedDate, cost, notes } = req.body;

    const result = await pool.query(
      `UPDATE property_maintenance SET
        status = COALESCE($3, status),
        assigned_to = COALESCE($4, assigned_to),
        scheduled_date = COALESCE($5, scheduled_date),
        completed_date = COALESCE($6, completed_date),
        cost = COALESCE($7, cost),
        notes = COALESCE($8, notes)
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, status, assignedTo, scheduledDate, completedDate, cost, notes]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Maintenance request not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Maintenance request updated' });
  } catch (error) {
    console.error('Update maintenance error:', error);
    res.status(500).json({ success: false, error: 'Failed to update maintenance request' });
  }
});

export default router;
