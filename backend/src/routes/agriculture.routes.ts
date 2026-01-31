/**
 * AGRICULTURE INDUSTRY ROUTES - TENANT-AWARE
 * 
 * Agriculture-specific operations API:
 * - Farm management
 * - Crop planning & tracking
 * - Livestock management
 * - Equipment & tasks
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
  } catch (error) {
    console.error('Agriculture workspace error:', error);
    res.status(500).json({ success: false, error: 'Failed to load workspace' });
  }
});

// ============================================================================
// FARMS
// ============================================================================
router.get('/farms', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { type, status } = req.query;

    let query = `
      SELECT id, code, name, location_lat, location_lng, province, address,
        size_hectares, farm_type, status, manager_name, water_source, created_at
      FROM farms WHERE tenant_id = $1 AND is_active = true
    `;
    const params: any[] = [tenantId];

    if (type) {
      params.push(type);
      query += ` AND farm_type = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ' ORDER BY name ASC';
    const result = await pool.query(query, params);

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
  } catch (error) {
    console.error('Get farms error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch farms' });
  }
});

router.get('/farms/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM farms WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Farm not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get farm error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch farm' });
  }
});

router.post('/farms', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
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
    console.error('Create farm error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Farm code already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to create farm' });
  }
});

router.put('/farms/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
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
  } catch (error) {
    console.error('Update farm error:', error);
    res.status(500).json({ success: false, error: 'Failed to update farm' });
  }
});

// ============================================================================
// FARM FIELDS
// ============================================================================
router.get('/farms/:farmId/fields', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { farmId } = req.params;

    const result = await pool.query(
      `SELECT * FROM farm_fields WHERE farm_id = $1 AND tenant_id = $2 ORDER BY code`,
      [farmId, tenantId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get fields error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch fields' });
  }
});

router.post('/farms/:farmId/fields', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { farmId } = req.params;
    const { code, name, sizeHectares, soilType, irrigationType, currentCrop } = req.body;

    const result = await pool.query(
      `INSERT INTO farm_fields (tenant_id, farm_id, code, name, size_hectares, soil_type, irrigation_type, current_crop)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [tenantId, farmId, code, name, sizeHectares, soilType, irrigationType, currentCrop]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Field added' });
  } catch (error) {
    console.error('Add field error:', error);
    res.status(500).json({ success: false, error: 'Failed to add field' });
  }
});

// ============================================================================
// CROPS
// ============================================================================
router.get('/crops', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { farmId, status } = req.query;

    let query = `
      SELECT c.*, f.farm_name as farm_name
      FROM crops c
      LEFT JOIN farms f ON c.farm_id = f.farm_id
      WHERE c.tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (farmId) {
      params.push(farmId);
      query += ` AND c.farm_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND c.status = $${params.length}`;
    }

    query += ' ORDER BY c.planting_date DESC';
    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get crops error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch crops' });
  }
});

router.post('/crops', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
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
  } catch (error) {
    console.error('Plant crop error:', error);
    res.status(500).json({ success: false, error: 'Failed to plant crop' });
  }
});

router.put('/crops/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
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
  } catch (error) {
    console.error('Update crop error:', error);
    res.status(500).json({ success: false, error: 'Failed to update crop' });
  }
});

// ============================================================================
// LIVESTOCK
// ============================================================================
router.get('/livestock', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { farmId, animalType, status } = req.query;

    let query = `
      SELECT l.*, f.farm_name as farm_name
      FROM livestock l
      LEFT JOIN farms f ON l.farm_id = f.farm_id
      WHERE l.tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (farmId) {
      params.push(farmId);
      query += ` AND l.farm_id = $${params.length}`;
    }
    if (animalType) {
      params.push(animalType);
      query += ` AND l.animal_type = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND l.status = $${params.length}`;
    }

    query += ' ORDER BY l.tag_number';
    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get livestock error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch livestock' });
  }
});

router.post('/livestock', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
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
    console.error('Register animal error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Tag number already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to register animal' });
  }
});

router.put('/livestock/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
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
  } catch (error) {
    console.error('Update animal error:', error);
    res.status(500).json({ success: false, error: 'Failed to update animal' });
  }
});

// ============================================================================
// FARM TASKS
// ============================================================================
router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { farmId, status, taskType } = req.query;

    let query = `
      SELECT t.*, f.name as farm_name
      FROM farm_tasks t
      LEFT JOIN farms f ON t.farm_id = f.id
      WHERE t.tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (farmId) {
      params.push(farmId);
      query += ` AND t.farm_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND t.status = $${params.length}`;
    }
    if (taskType) {
      params.push(taskType);
      query += ` AND t.task_type = $${params.length}`;
    }

    query += ' ORDER BY t.scheduled_date ASC';
    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
});

router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
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
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
});

router.put('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
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
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, error: 'Failed to update task' });
  }
});

export default router;
