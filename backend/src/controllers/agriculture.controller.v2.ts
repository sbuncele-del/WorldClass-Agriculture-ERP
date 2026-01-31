/**
 * Agriculture Controller V2
 * Tenant-hardened API for agriculture industry operations
 * 
 * Features:
 * - Farm management
 * - Crop planning & tracking
 * - Livestock management
 * - Farm tasks & equipment
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

    const [farmsResult, cropsResult, livestockResult, tasksResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) as total_farms, COALESCE(SUM(size_hectares), 0) as total_hectares
        FROM farms WHERE tenant_id = $1 AND is_active = true`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) as active_crops
        FROM crops WHERE tenant_id = $1 AND status IN ('planted', 'growing')`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) as livestock_count
        FROM livestock WHERE tenant_id = $1 AND status = 'active'`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) as pending_tasks
        FROM farm_tasks WHERE tenant_id = $1 AND status IN ('pending', 'in_progress')`,
        [tenantId]
      )
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalFarms: parseInt(farmsResult.rows[0]?.total_farms || '0'),
          totalHectares: parseFloat(farmsResult.rows[0]?.total_hectares || '0'),
          activeCrops: parseInt(cropsResult.rows[0]?.active_crops || '0'),
          livestockCount: parseInt(livestockResult.rows[0]?.livestock_count || '0'),
          pendingTasks: parseInt(tasksResult.rows[0]?.pending_tasks || '0')
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Agriculture workspace error:', error);
    res.status(500).json({ success: false, error: 'Failed to load workspace' });
  }
};

// ============================================================================
// FARMS
// ============================================================================
export const getFarms = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { type, status } = req.query;

    let queryStr = `
      SELECT id, code, name, 
        COALESCE(location_lat, 0) as location_lat, 
        COALESCE(location_lng, 0) as location_lng, 
        COALESCE(province, '') as province, 
        COALESCE(address, location, '') as address,
        COALESCE(size_hectares, total_hectares, 0) as size_hectares, 
        farm_type, 
        COALESCE(status, 'ACTIVE') as status, 
        COALESCE(manager_name, '') as manager_name, 
        COALESCE(water_source, '') as water_source, 
        created_at
      FROM farms WHERE tenant_id = $1 AND COALESCE(is_active, true) = true
    `;
    const params: any[] = [tenantId];

    if (type) {
      params.push(type);
      queryStr += ` AND farm_type = $${params.length}`;
    }
    if (status) {
      params.push(status);
      queryStr += ` AND status = $${params.length}`;
    }

    queryStr += ' ORDER BY name ASC';
    const result = await pool.query(queryStr, params);

    res.json({
      success: true,
      data: result.rows.map(f => ({
        id: f.id,
        code: f.code,
        name: f.name,
        location: { lat: parseFloat(f.location_lat), lng: parseFloat(f.location_lng), province: f.province },
        size: parseFloat(f.size_hectares),
        type: f.farm_type,
        status: f.status,
        manager: f.manager_name,
        waterSource: f.water_source
      }))
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get farms error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch farms' });
  }
};

export const getFarmById = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM farms WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Farm not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get farm error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch farm' });
  }
};

export const createFarm = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { code, name, locationLat, locationLng, province, address, sizeHectares, 
            farmType, managerName, waterSource } = req.body;

    const result = await pool.query(
      `INSERT INTO farms (tenant_id, code, name, location_lat, location_lng, province, 
        address, size_hectares, farm_type, manager_name, water_source, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'operational')
      RETURNING *`,
      [tenantId, code, name, locationLat, locationLng, province, address, 
       sizeHectares, farmType, managerName, waterSource]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Farm created' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Farm code already exists' });
    }
    console.error('Create farm error:', error);
    res.status(500).json({ success: false, error: 'Failed to create farm' });
  }
};

export const updateFarm = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const updates = req.body;

    const result = await pool.query(
      `UPDATE farms SET
        name = COALESCE($3, name),
        status = COALESCE($4, status),
        manager_name = COALESCE($5, manager_name),
        size_hectares = COALESCE($6, size_hectares),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, updates.name, updates.status, updates.managerName, updates.sizeHectares]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Farm not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Farm updated' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update farm error:', error);
    res.status(500).json({ success: false, error: 'Failed to update farm' });
  }
};

// ============================================================================
// FARM FIELDS
// ============================================================================
export const getFarmFields = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { farmId } = req.params;

    const result = await pool.query(
      `SELECT * FROM farm_fields WHERE farm_id = $1 AND tenant_id = $2 ORDER BY code`,
      [farmId, tenantId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get fields error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch fields' });
  }
};

export const createFarmField = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { farmId } = req.params;
    const { code, name, sizeHectares, soilType, irrigationType, currentCrop } = req.body;

    const result = await pool.query(
      `INSERT INTO farm_fields (tenant_id, farm_id, code, name, size_hectares, soil_type, irrigation_type, current_crop)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [tenantId, farmId, code, name, sizeHectares, soilType, irrigationType, currentCrop]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Field added' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Add field error:', error);
    res.status(500).json({ success: false, error: 'Failed to add field' });
  }
};

// ============================================================================
// CROPS
// ============================================================================
export const getCrops = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { farmId, status } = req.query;

    let queryStr = `
      SELECT c.*, f.farm_name as farm_name
      FROM crops c
      LEFT JOIN farms f ON c.farm_id = f.farm_id
      WHERE c.tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (farmId) {
      params.push(farmId);
      queryStr += ` AND c.farm_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      queryStr += ` AND c.status = $${params.length}`;
    }

    queryStr += ' ORDER BY c.planting_date DESC';
    const result = await pool.query(queryStr, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get crops error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch crops' });
  }
};

export const createCrop = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { farmId, fieldId, cropName, variety, plantingDate, expectedHarvestDate, 
            areaPlanted, expectedYield, yieldUnit } = req.body;

    const result = await pool.query(
      `INSERT INTO crops (tenant_id, farm_id, field_id, crop_name, variety, planting_date,
        expected_harvest_date, area_planted, expected_yield, yield_unit, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'planted')
      RETURNING *`,
      [tenantId, farmId, fieldId, cropName, variety, plantingDate, 
       expectedHarvestDate, areaPlanted, expectedYield, yieldUnit || 'tonnes']
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Crop planted' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Plant crop error:', error);
    res.status(500).json({ success: false, error: 'Failed to plant crop' });
  }
};

export const updateCrop = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const { status, actualHarvestDate, actualYield, notes } = req.body;

    const result = await pool.query(
      `UPDATE crops SET
        status = COALESCE($3, status),
        actual_harvest_date = COALESCE($4, actual_harvest_date),
        actual_yield = COALESCE($5, actual_yield),
        notes = COALESCE($6, notes)
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, status, actualHarvestDate, actualYield, notes]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Crop not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Crop updated' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update crop error:', error);
    res.status(500).json({ success: false, error: 'Failed to update crop' });
  }
};

// ============================================================================
// LIVESTOCK
// ============================================================================
export const getLivestock = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { farmId, animalType, status } = req.query;

    let queryStr = `
      SELECT l.*, f.farm_name as farm_name
      FROM livestock l
      LEFT JOIN farms f ON l.farm_id = f.farm_id
      WHERE l.tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (farmId) {
      params.push(farmId);
      queryStr += ` AND l.farm_id = $${params.length}`;
    }
    if (animalType) {
      params.push(animalType);
      queryStr += ` AND l.animal_type = $${params.length}`;
    }
    if (status) {
      params.push(status);
      queryStr += ` AND l.status = $${params.length}`;
    }

    queryStr += ' ORDER BY l.tag_number';
    const result = await pool.query(queryStr, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get livestock error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch livestock' });
  }
};

export const createLivestock = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { farmId, tagNumber, animalType, breed, gender, birthDate, purchaseDate, 
            purchasePrice, weight } = req.body;

    const result = await pool.query(
      `INSERT INTO livestock (tenant_id, farm_id, tag_number, animal_type, breed, gender,
        birth_date, purchase_date, purchase_price, weight, status, health_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', 'healthy')
      RETURNING *`,
      [tenantId, farmId, tagNumber, animalType, breed, gender, birthDate, 
       purchaseDate, purchasePrice, weight]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Animal registered' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Tag number already exists' });
    }
    console.error('Register animal error:', error);
    res.status(500).json({ success: false, error: 'Failed to register animal' });
  }
};

export const updateLivestock = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const { status, healthStatus, weight, notes } = req.body;

    const result = await pool.query(
      `UPDATE livestock SET
        status = COALESCE($3, status),
        health_status = COALESCE($4, health_status),
        weight = COALESCE($5, weight),
        notes = COALESCE($6, notes)
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, status, healthStatus, weight, notes]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Animal not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Animal updated' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update animal error:', error);
    res.status(500).json({ success: false, error: 'Failed to update animal' });
  }
};

// ============================================================================
// FARM TASKS
// ============================================================================
export const getTasks = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { farmId, status, taskType } = req.query;

    let queryStr = `
      SELECT t.*, f.name as farm_name
      FROM farm_tasks t
      LEFT JOIN farms f ON t.farm_id = f.id
      WHERE t.tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (farmId) {
      params.push(farmId);
      queryStr += ` AND t.farm_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      queryStr += ` AND t.status = $${params.length}`;
    }
    if (taskType) {
      params.push(taskType);
      queryStr += ` AND t.task_type = $${params.length}`;
    }

    queryStr += ' ORDER BY t.scheduled_date ASC';
    const result = await pool.query(queryStr, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
};

export const createTask = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { farmId, fieldId, title, description, taskType, priority, scheduledDate, assignedToName } = req.body;

    const result = await pool.query(
      `INSERT INTO farm_tasks (tenant_id, farm_id, field_id, title, description, task_type,
        priority, scheduled_date, assigned_to_name, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING *`,
      [tenantId, farmId, fieldId, title, description, taskType, priority || 'medium', 
       scheduledDate, assignedToName]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Task created' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Create task error:', error);
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
};

export const updateTask = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const { status, completedDate } = req.body;

    const result = await pool.query(
      `UPDATE farm_tasks SET
        status = COALESCE($3, status),
        completed_date = COALESCE($4, completed_date)
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, status, completedDate]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Task updated' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update task error:', error);
    res.status(500).json({ success: false, error: 'Failed to update task' });
  }
};

/**
 * Get agriculture dashboard
 */
export const getAgricultureDashboard = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    // Get farm stats
    const farmStats = await pool.query(
      `SELECT 
         COUNT(*) as total_farms,
         SUM(total_area) as total_area
       FROM agriculture_farms 
       WHERE tenant_id = $1`,
      [tenantId]
    );

    // Get crop stats
    const cropStats = await pool.query(
      `SELECT 
         COUNT(*) as total_crops,
         SUM(planted_area) as planted_area
       FROM farm_crops 
       WHERE tenant_id = $1`,
      [tenantId]
    );

    // Get livestock stats
    const livestockStats = await pool.query(
      `SELECT 
         COUNT(DISTINCT livestock_type) as livestock_types,
         SUM(quantity) as total_livestock
       FROM farm_livestock 
       WHERE tenant_id = $1`,
      [tenantId]
    );

    // Get pending tasks
    const taskStats = await pool.query(
      `SELECT COUNT(*) as pending_tasks
       FROM farm_tasks 
       WHERE tenant_id = $1 AND status = 'pending'`,
      [tenantId]
    );

    res.json({
      success: true,
      data: {
        totalFarms: parseInt(farmStats.rows[0]?.total_farms || '0'),
        totalArea: parseFloat(farmStats.rows[0]?.total_area || '0'),
        totalCrops: parseInt(cropStats.rows[0]?.total_crops || '0'),
        plantedArea: parseFloat(cropStats.rows[0]?.planted_area || '0'),
        livestockTypes: parseInt(livestockStats.rows[0]?.livestock_types || '0'),
        totalLivestock: parseInt(livestockStats.rows[0]?.total_livestock || '0'),
        pendingTasks: parseInt(taskStats.rows[0]?.pending_tasks || '0'),
        summary: {
          farms: parseInt(farmStats.rows[0]?.total_farms || '0'),
          crops: parseInt(cropStats.rows[0]?.total_crops || '0'),
          livestock: parseInt(livestockStats.rows[0]?.total_livestock || '0')
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get agriculture dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch agriculture dashboard' });
  }
};

export default {
  getWorkspace,
  getFarms,
  getFarmById,
  createFarm,
  updateFarm,
  getFarmFields,
  createFarmField,
  getCrops,
  createCrop,
  updateCrop,
  getLivestock,
  createLivestock,
  updateLivestock,
  getTasks,
  createTask,
  updateTask,
  getAgricultureDashboard
};
