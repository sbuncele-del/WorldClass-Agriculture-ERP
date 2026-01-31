/**
 * Mining Controller V2
 * Tenant-hardened API for mining industry operations
 * 
 * Features:
 * - Mining site management
 * - Production tracking
 * - Safety incident reporting
 * - Equipment management
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

    const [sitesResult, productionResult, safetyResult, equipmentResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) as total_sites
        FROM mining_sites WHERE tenant_id = $1 AND is_active = true`,
        [tenantId]
      ),
      pool.query(
        `SELECT COALESCE(SUM(quantity_extracted), 0) as total_production
        FROM mining_production WHERE tenant_id = $1 
        AND extraction_date >= DATE_TRUNC('month', CURRENT_DATE)`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) as open_incidents
        FROM mining_safety_incidents WHERE tenant_id = $1 AND status IN ('reported', 'investigating')`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) as equipment_needing_maintenance
        FROM mining_equipment WHERE tenant_id = $1 
        AND next_maintenance_date <= CURRENT_DATE + INTERVAL '7 days'`,
        [tenantId]
      )
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalSites: parseInt(sitesResult.rows[0]?.total_sites || '0'),
          monthlyProduction: parseFloat(productionResult.rows[0]?.total_production || '0'),
          openIncidents: parseInt(safetyResult.rows[0]?.open_incidents || '0'),
          equipmentNeedingMaintenance: parseInt(equipmentResult.rows[0]?.equipment_needing_maintenance || '0')
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Mining workspace error:', error);
    res.status(500).json({ success: false, error: 'Failed to load workspace' });
  }
};

// ============================================================================
// MINING SITES
// ============================================================================
export const getSites = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { status, mineralType } = req.query;

    let queryStr = `
      SELECT id, code, name, location_lat, location_lng, province, address,
        area_hectares, mineral_type, mining_method, status, license_number, 
        license_expiry, created_at
      FROM mining_sites WHERE tenant_id = $1 AND is_active = true
    `;
    const params: any[] = [tenantId];

    if (status) {
      params.push(status);
      queryStr += ` AND status = $${params.length}`;
    }
    if (mineralType) {
      params.push(mineralType);
      queryStr += ` AND mineral_type = $${params.length}`;
    }

    queryStr += ' ORDER BY name ASC';
    const result = await pool.query(queryStr, params);

    res.json({
      success: true,
      data: result.rows.map(s => ({
        id: s.id,
        code: s.code,
        name: s.name,
        location: { lat: parseFloat(s.location_lat), lng: parseFloat(s.location_lng), province: s.province },
        areaHectares: parseFloat(s.area_hectares),
        mineralType: s.mineral_type,
        miningMethod: s.mining_method,
        status: s.status,
        license: { number: s.license_number, expiry: s.license_expiry }
      }))
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get mining sites error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sites' });
  }
};

export const getSiteById = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM mining_sites WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Site not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get site error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch site' });
  }
};

export const createSite = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { code, name, locationLat, locationLng, province, address, areaHectares,
            mineralType, miningMethod, licenseNumber, licenseExpiry } = req.body;

    const result = await pool.query(
      `INSERT INTO mining_sites (tenant_id, code, name, location_lat, location_lng, province,
        address, area_hectares, mineral_type, mining_method, license_number, license_expiry, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'exploration')
      RETURNING *`,
      [tenantId, code, name, locationLat, locationLng, province, address, areaHectares,
       mineralType, miningMethod, licenseNumber, licenseExpiry]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Site created' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Site code already exists' });
    }
    console.error('Create site error:', error);
    res.status(500).json({ success: false, error: 'Failed to create site' });
  }
};

export const updateSite = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const updates = req.body;

    const result = await pool.query(
      `UPDATE mining_sites SET
        name = COALESCE($3, name),
        status = COALESCE($4, status),
        license_number = COALESCE($5, license_number),
        license_expiry = COALESCE($6, license_expiry),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, updates.name, updates.status, updates.licenseNumber, updates.licenseExpiry]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Site not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Site updated' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update site error:', error);
    res.status(500).json({ success: false, error: 'Failed to update site' });
  }
};

// ============================================================================
// PRODUCTION RECORDS
// ============================================================================
export const getProduction = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { siteId, startDate, endDate } = req.query;

    let queryStr = `
      SELECT p.*, s.name as site_name
      FROM mining_production p
      LEFT JOIN mining_sites s ON p.site_id = s.id
      WHERE p.tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (siteId) {
      params.push(siteId);
      queryStr += ` AND p.site_id = $${params.length}`;
    }
    if (startDate) {
      params.push(startDate);
      queryStr += ` AND p.extraction_date >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      queryStr += ` AND p.extraction_date <= $${params.length}`;
    }

    queryStr += ' ORDER BY p.extraction_date DESC';
    const result = await pool.query(queryStr, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get production error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch production' });
  }
};

export const recordProduction = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { siteId, extractionDate, shiftType, mineralType, quantityExtracted, quantityUnit,
            gradePercent, processingStatus, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO mining_production (tenant_id, site_id, extraction_date, shift_type, mineral_type,
        quantity_extracted, quantity_unit, grade_percent, processing_status, notes, recorded_by_user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [tenantId, siteId, extractionDate, shiftType, mineralType, quantityExtracted,
       quantityUnit || 'tonnes', gradePercent, processingStatus || 'unprocessed', notes, userId]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Production recorded' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Record production error:', error);
    res.status(500).json({ success: false, error: 'Failed to record production' });
  }
};

export const updateProduction = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const { processingStatus, gradePercent, notes } = req.body;

    const result = await pool.query(
      `UPDATE mining_production SET
        processing_status = COALESCE($3, processing_status),
        grade_percent = COALESCE($4, grade_percent),
        notes = COALESCE($5, notes)
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, processingStatus, gradePercent, notes]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Production record not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Production updated' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update production error:', error);
    res.status(500).json({ success: false, error: 'Failed to update production' });
  }
};

// ============================================================================
// SAFETY INCIDENTS
// ============================================================================
export const getSafetyIncidents = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { siteId, status, severity } = req.query;

    let queryStr = `
      SELECT i.*, s.name as site_name
      FROM mining_safety_incidents i
      LEFT JOIN mining_sites s ON i.site_id = s.id
      WHERE i.tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (siteId) {
      params.push(siteId);
      queryStr += ` AND i.site_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      queryStr += ` AND i.status = $${params.length}`;
    }
    if (severity) {
      params.push(severity);
      queryStr += ` AND i.severity = $${params.length}`;
    }

    queryStr += ' ORDER BY i.incident_date DESC';
    const result = await pool.query(queryStr, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get incidents error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch incidents' });
  }
};

export const reportSafetyIncident = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { siteId, incidentDate, incidentType, severity, location, description,
            injuriesCount, fatalitiesCount, rootCause, correctiveActions } = req.body;

    const result = await pool.query(
      `INSERT INTO mining_safety_incidents (tenant_id, site_id, incident_date, incident_type, 
        severity, location, description, injuries_count, fatalities_count, root_cause, 
        corrective_actions, status, reported_by_user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'reported', $12)
      RETURNING *`,
      [tenantId, siteId, incidentDate, incidentType, severity, location, description,
       injuriesCount || 0, fatalitiesCount || 0, rootCause, correctiveActions, userId]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Incident reported' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Report incident error:', error);
    res.status(500).json({ success: false, error: 'Failed to report incident' });
  }
};

export const updateSafetyIncident = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const { status, rootCause, correctiveActions, resolutionDate, investigationNotes } = req.body;

    const result = await pool.query(
      `UPDATE mining_safety_incidents SET
        status = COALESCE($3, status),
        root_cause = COALESCE($4, root_cause),
        corrective_actions = COALESCE($5, corrective_actions),
        resolution_date = COALESCE($6, resolution_date),
        investigation_notes = COALESCE($7, investigation_notes)
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, status, rootCause, correctiveActions, resolutionDate, investigationNotes]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Incident updated' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update incident error:', error);
    res.status(500).json({ success: false, error: 'Failed to update incident' });
  }
};

// ============================================================================
// EQUIPMENT
// ============================================================================
export const getEquipment = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { siteId, equipmentType, status } = req.query;

    let queryStr = `
      SELECT e.*, s.name as site_name
      FROM mining_equipment e
      LEFT JOIN mining_sites s ON e.site_id = s.id
      WHERE e.tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (siteId) {
      params.push(siteId);
      queryStr += ` AND e.site_id = $${params.length}`;
    }
    if (equipmentType) {
      params.push(equipmentType);
      queryStr += ` AND e.equipment_type = $${params.length}`;
    }
    if (status) {
      params.push(status);
      queryStr += ` AND e.status = $${params.length}`;
    }

    queryStr += ' ORDER BY e.code';
    const result = await pool.query(queryStr, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get equipment error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch equipment' });
  }
};

export const registerEquipment = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { siteId, code, name, equipmentType, manufacturer, model, serialNumber,
            purchaseDate, purchasePrice, lastMaintenanceDate, nextMaintenanceDate } = req.body;

    const result = await pool.query(
      `INSERT INTO mining_equipment (tenant_id, site_id, code, name, equipment_type, manufacturer,
        model, serial_number, purchase_date, purchase_price, last_maintenance_date, 
        next_maintenance_date, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'operational')
      RETURNING *`,
      [tenantId, siteId, code, name, equipmentType, manufacturer, model, serialNumber,
       purchaseDate, purchasePrice, lastMaintenanceDate, nextMaintenanceDate]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Equipment registered' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Equipment code already exists' });
    }
    console.error('Register equipment error:', error);
    res.status(500).json({ success: false, error: 'Failed to register equipment' });
  }
};

export const updateEquipment = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const { status, lastMaintenanceDate, nextMaintenanceDate, operatingHours, notes } = req.body;

    const result = await pool.query(
      `UPDATE mining_equipment SET
        status = COALESCE($3, status),
        last_maintenance_date = COALESCE($4, last_maintenance_date),
        next_maintenance_date = COALESCE($5, next_maintenance_date),
        operating_hours = COALESCE($6, operating_hours),
        notes = COALESCE($7, notes)
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, status, lastMaintenanceDate, nextMaintenanceDate, operatingHours, notes]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Equipment updated' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update equipment error:', error);
    res.status(500).json({ success: false, error: 'Failed to update equipment' });
  }
};

/**
 * Get mining dashboard
 */
export const getMiningDashboard = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    // Get site count
    const sitesCount = await pool.query(
      `SELECT COUNT(*) as count FROM mining_sites WHERE tenant_id = $1`,
      [tenantId]
    );

    // Get production stats
    const productionStats = await pool.query(
      `SELECT 
         SUM(quantity) as total_quantity,
         COUNT(*) as records_count
       FROM mining_production 
       WHERE tenant_id = $1 AND EXTRACT(MONTH FROM production_date) = EXTRACT(MONTH FROM CURRENT_DATE)`,
      [tenantId]
    );

    // Get safety incidents
    const safetyStats = await pool.query(
      `SELECT 
         COUNT(*) as total_incidents,
         SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical
       FROM mining_safety_incidents 
       WHERE tenant_id = $1 AND EXTRACT(YEAR FROM incident_date) = EXTRACT(YEAR FROM CURRENT_DATE)`,
      [tenantId]
    );

    res.json({
      success: true,
      data: {
        totalSites: parseInt(sitesCount.rows[0]?.count || '0'),
        monthlyProduction: parseFloat(productionStats.rows[0]?.total_quantity || '0'),
        productionRecords: parseInt(productionStats.rows[0]?.records_count || '0'),
        yearlyIncidents: parseInt(safetyStats.rows[0]?.total_incidents || '0'),
        criticalIncidents: parseInt(safetyStats.rows[0]?.critical || '0'),
        summary: {
          sites: parseInt(sitesCount.rows[0]?.count || '0'),
          safetyScore: 100 - parseInt(safetyStats.rows[0]?.critical || '0') * 10
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get mining dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch mining dashboard' });
  }
};

export default {
  getWorkspace,
  getSites,
  getSiteById,
  createSite,
  updateSite,
  getProduction,
  recordProduction,
  updateProduction,
  getSafetyIncidents,
  reportSafetyIncident,
  updateSafetyIncident,
  getEquipment,
  registerEquipment,
  updateEquipment,
  getMiningDashboard
};
