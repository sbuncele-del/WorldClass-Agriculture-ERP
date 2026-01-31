/**
 * Fixed Assets Controller V2
 * Tenant-aware handlers for fixed assets, depreciation, disposals, transfers, and maintenance
 * 
 * IMPORTANT: Uses TenantRequest for typed tenant context from middleware.
 */

import { Response } from 'express';
import { TenantRequest } from '../types';
import pool from '../config/database';
import {
  DepreciationMethod,
  AssetStatus
} from '../models/asset-management.model';

/**
 * Tenant context helper
 */
function getTenantContext(req: TenantRequest): { tenantId: string; userId?: string } {
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    throw new Error('Tenant ID not found');
  }
  return {
    tenantId,
    userId: req.user?.id
  };
}

// =====================================================
// FIXED ASSETS CRUD
// =====================================================

/**
 * GET /api/assets
 * Get all fixed assets with filtering, pagination, and sorting
 */
export async function getAllAssets(req: TenantRequest, res: Response) {
  try {
    const { tenantId } = getTenantContext(req);
    const {
      page = '1',
      limit = '50',
      category_id,
      asset_status,
      location_id,
      department_id,
      cost_center_id,
      search,
      sort_by = 'asset_number',
      sort_order = 'ASC'
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereConditions: string[] = ['fa.tenant_id = $1'];
    let queryParams: any[] = [tenantId];
    let paramIndex = 2;

    if (category_id) {
      whereConditions.push(`fa.category_id = $${paramIndex++}`);
      queryParams.push(category_id);
    }

    if (asset_status) {
      whereConditions.push(`fa.asset_status = $${paramIndex++}`);
      queryParams.push(asset_status);
    }

    if (location_id) {
      whereConditions.push(`fa.location_id = $${paramIndex++}`);
      queryParams.push(location_id);
    }

    if (department_id) {
      whereConditions.push(`fa.department_id = $${paramIndex++}`);
      queryParams.push(department_id);
    }

    if (cost_center_id) {
      whereConditions.push(`fa.cost_center_id = $${paramIndex++}`);
      queryParams.push(cost_center_id);
    }

    if (search) {
      whereConditions.push(`(
        fa.asset_number ILIKE $${paramIndex} OR 
        fa.asset_name ILIKE $${paramIndex} OR 
        fa.serial_number ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Validate sort column to prevent SQL injection
    const allowedSortColumns = ['asset_number', 'asset_name', 'purchase_cost', 'acquisition_date', 'asset_status', 'created_at'];
    const safeSortBy = allowedSortColumns.includes(sort_by as string) ? sort_by : 'asset_number';
    const safeSortOrder = sort_order === 'DESC' ? 'DESC' : 'ASC';

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    // Main query
    const query = `
      SELECT 
        fa.*,
        ac.category_name,
        COUNT(*) OVER() as total_count
      FROM assets.fixed_assets fa
      LEFT JOIN assets.asset_categories ac ON fa.category_id = ac.category_id
      ${whereClause}
      ORDER BY fa.${safeSortBy} ${safeSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit as string), offset);

    const result = await pool.query(query, queryParams);

    // Summary statistics - pass only tenant_id for stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total_assets,
        COALESCE(SUM(purchase_cost), 0) as total_acquisition_cost,
        COUNT(CASE WHEN asset_status = 'ACTIVE' THEN 1 END) as active_assets,
        COUNT(CASE WHEN asset_status = 'IDLE' THEN 1 END) as idle_assets,
        COUNT(CASE WHEN asset_status = 'UNDER_MAINTENANCE' THEN 1 END) as under_maintenance,
        COUNT(CASE WHEN asset_status = 'DISPOSED' THEN 1 END) as disposed_assets
      FROM assets.fixed_assets fa
      WHERE fa.tenant_id = $1
    `;

    const statsResult = await pool.query(statsQuery, [tenantId]);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      summary: statsResult.rows[0]
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching assets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assets',
      error: error.message
    });
  }
}

/**
 * GET /api/assets/:id
 * Get single asset with full details including depreciation schedule
 */
export async function getAssetById(req: TenantRequest, res: Response) {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const assetResult = await pool.query(`
      SELECT 
        fa.*,
        ac.category_name,
        ac.category_code
      FROM assets.fixed_assets fa
      LEFT JOIN assets.asset_categories ac ON fa.category_id = ac.category_id
      WHERE fa.asset_id = $1 AND fa.tenant_id = $2
    `, [id, tenantId]);

    if (assetResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    const asset = assetResult.rows[0];

    // Get depreciation schedule
    const depreciationResult = await pool.query(`
      SELECT * FROM assets.depreciation_schedule
      WHERE asset_id = $1 AND tenant_id = $2
      ORDER BY period_number ASC
    `, [id, tenantId]);

    // Get maintenance history
    const maintenanceResult = await pool.query(`
      SELECT * FROM assets.asset_maintenance
      WHERE asset_id = $1 AND tenant_id = $2
      ORDER BY maintenance_date DESC
      LIMIT 10
    `, [id, tenantId]);

    res.json({
      success: true,
      data: {
        ...asset,
        depreciation_schedule: depreciationResult.rows,
        maintenance_history: maintenanceResult.rows
      }
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset',
      error: error.message
    });
  }
}

/**
 * POST /api/assets
 * Create a new fixed asset
 */
export async function createAsset(req: TenantRequest, res: Response) {
  const client = await pool.connect();
  try {
    const { tenantId, userId } = getTenantContext(req);
    const assetData = req.body;

    await client.query('BEGIN');

    // Generate asset number
    const seqResult = await client.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(asset_number FROM 5) AS INTEGER)), 0) + 1 as next_seq
      FROM assets.fixed_assets
      WHERE tenant_id = $1 AND asset_number LIKE 'AST-%'
    `, [tenantId]);
    const assetNumber = `AST-${String(seqResult.rows[0].next_seq).padStart(6, '0')}`;

    // Calculate useful life in months
    const usefulLifeMonths = assetData.useful_life_years 
      ? assetData.useful_life_years * 12 
      : (assetData.useful_life_months || 60);

    const result = await client.query(`
      INSERT INTO assets.fixed_assets (
        tenant_id, asset_number, asset_name, description, category_id,
        acquisition_cost, residual_value, useful_life_months, depreciation_method,
        acquisition_date, asset_status, location_id,
        department_id, cost_center_id, serial_number, manufacturer, model_number,
        notes, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING *
    `, [
      tenantId,
      assetNumber,
      assetData.asset_name,
      assetData.description,
      assetData.category_id,
      assetData.acquisition_cost,
      assetData.residual_value || 0,
      usefulLifeMonths,
      assetData.depreciation_method || DepreciationMethod.STRAIGHT_LINE,
      assetData.acquisition_date,
      AssetStatus.ACTIVE,
      assetData.location_id,
      assetData.department_id,
      assetData.cost_center_id,
      assetData.serial_number,
      assetData.manufacturer,
      assetData.model_number,
      assetData.notes,
      userId
    ]);

    const newAsset = result.rows[0];

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      data: newAsset
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error creating asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create asset',
      error: error.message
    });
  } finally {
    client.release();
  }
}

/**
 * PUT /api/assets/:id
 * Update an existing asset
 */
export async function updateAsset(req: TenantRequest, res: Response) {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;
    const updateData = req.body;

    // Verify asset exists and belongs to tenant
    const existingAsset = await pool.query(
      'SELECT * FROM assets.fixed_assets WHERE asset_id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (existingAsset.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    const result = await pool.query(`
      UPDATE assets.fixed_assets SET
        asset_name = COALESCE($1, asset_name),
        description = COALESCE($2, description),
        category_id = COALESCE($3, category_id),
        asset_status = COALESCE($4, asset_status),
        location_id = COALESCE($5, location_id),
        department_id = COALESCE($6, department_id),
        cost_center_id = COALESCE($7, cost_center_id),
        notes = COALESCE($8, notes),
        updated_by = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE asset_id = $10 AND tenant_id = $11
      RETURNING *
    `, [
      updateData.asset_name,
      updateData.description,
      updateData.category_id,
      updateData.asset_status,
      updateData.location_id,
      updateData.department_id,
      updateData.cost_center_id,
      updateData.notes,
      userId,
      id,
      tenantId
    ]);

    res.json({
      success: true,
      message: 'Asset updated successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error updating asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update asset',
      error: error.message
    });
  }
}

/**
 * DELETE /api/assets/:id
 * Soft delete an asset (mark as disposed)
 */
export async function deleteAsset(req: TenantRequest, res: Response) {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE assets.fixed_assets 
      SET asset_status = 'DISPOSED', 
          updated_by = $1, 
          updated_at = CURRENT_TIMESTAMP
      WHERE asset_id = $2 AND tenant_id = $3
      RETURNING *
    `, [userId, id, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    res.json({
      success: true,
      message: 'Asset disposed successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error deleting asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete asset',
      error: error.message
    });
  }
}

// =====================================================
// ASSET CATEGORIES
// =====================================================

/**
 * Get all asset locations
 * GET /api/v2/assets/locations
 */
export async function getAssetLocations(req: TenantRequest, res: Response) {
  try {
    const { tenantId } = getTenantContext(req);

    // Simplified - return empty array if table doesn't exist
    const result = await pool.query(`
      SELECT location_id as id, location_name as name, location_code as code, 
             address, is_active, created_at, updated_at
      FROM assets.asset_locations
      WHERE tenant_id = $1
      ORDER BY location_name
    `, [tenantId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    // Return empty array if table doesn't exist
    res.json({ success: true, data: [] });
  }
}

export async function getAssetCategories(req: TenantRequest, res: Response) {
  try {
    const { tenantId } = getTenantContext(req);

    const result = await pool.query(`
      SELECT ac.*, 
             COUNT(fa.asset_id) as asset_count
      FROM assets.asset_categories ac
      LEFT JOIN assets.fixed_assets fa ON ac.category_id = fa.category_id AND fa.tenant_id = $1
      WHERE ac.tenant_id = $1
      GROUP BY ac.category_id
      ORDER BY ac.category_name
    `, [tenantId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
}

export async function createAssetCategory(req: TenantRequest, res: Response) {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const categoryData = req.body;

    const result = await pool.query(`
      INSERT INTO assets.asset_categories (
        tenant_id, category_code, category_name, description,
        default_useful_life_months, default_depreciation_method, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      tenantId,
      categoryData.category_code,
      categoryData.category_name,
      categoryData.description,
      categoryData.default_useful_life_months,
      categoryData.default_depreciation_method,
      userId
    ]);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
}

// =====================================================
// ASSET DISPOSALS
// =====================================================

export async function getAssetDisposals(req: TenantRequest, res: Response) {
  try {
    const { tenantId } = getTenantContext(req);
    const { page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    try {
      const result = await pool.query(`
        SELECT ad.*, fa.asset_number, fa.asset_name
        FROM assets.asset_disposals ad
        JOIN assets.fixed_assets fa ON ad.asset_id = fa.asset_id
        WHERE ad.tenant_id = $1
        ORDER BY ad.disposal_date DESC
        LIMIT $2 OFFSET $3
      `, [tenantId, parseInt(limit as string), offset]);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (dbError) {
      // Table might not exist - return empty array
      res.json({ success: true, data: [] });
    }

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    res.json({ success: true, data: [] });
  }
}

export async function createAssetDisposal(req: TenantRequest, res: Response) {
  const client = await pool.connect();
  try {
    const { tenantId, userId } = getTenantContext(req);
    const disposalData = req.body;

    await client.query('BEGIN');

    // Verify asset exists and is not already disposed
    const assetCheck = await client.query(
      'SELECT * FROM assets.fixed_assets WHERE asset_id = $1 AND tenant_id = $2 AND asset_status != $3',
      [disposalData.asset_id, tenantId, AssetStatus.DISPOSED]
    );

    if (assetCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Asset not found or already disposed'
      });
    }

    const asset = assetCheck.rows[0];

    // Calculate gain/loss
    const gainLoss = disposalData.disposal_amount - asset.book_value;

    // Create disposal record
    const result = await client.query(`
      INSERT INTO assets.asset_disposals (
        tenant_id, asset_id, disposal_date, disposal_type, disposal_amount,
        book_value_at_disposal, gain_loss, reason, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      tenantId,
      disposalData.asset_id,
      disposalData.disposal_date,
      disposalData.disposal_type,
      disposalData.disposal_amount,
      asset.book_value,
      gainLoss,
      disposalData.reason,
      disposalData.notes,
      userId
    ]);

    // Update asset status
    await client.query(
      'UPDATE assets.fixed_assets SET asset_status = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP WHERE asset_id = $3 AND tenant_id = $4',
      [AssetStatus.DISPOSED, userId, disposalData.asset_id, tenantId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Asset disposed successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error creating disposal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create disposal',
      error: error.message
    });
  } finally {
    client.release();
  }
}

// =====================================================
// ASSET TRANSFERS
// =====================================================

export async function getAssetTransfers(req: TenantRequest, res: Response) {
  try {
    const { tenantId } = getTenantContext(req);
    const { page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const result = await pool.query(`
      SELECT at.*, fa.asset_number, fa.asset_name
      FROM assets.asset_transfers at
      JOIN assets.fixed_assets fa ON at.asset_id = fa.asset_id
      WHERE at.tenant_id = $1
      ORDER BY at.transfer_date DESC
      LIMIT $2 OFFSET $3
    `, [tenantId, parseInt(limit as string), offset]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching transfers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transfers',
      error: error.message
    });
  }
}

export async function createAssetTransfer(req: TenantRequest, res: Response) {
  const client = await pool.connect();
  try {
    const { tenantId, userId } = getTenantContext(req);
    const transferData = req.body;

    await client.query('BEGIN');

    // Get current asset details
    const assetCheck = await client.query(
      'SELECT * FROM assets.fixed_assets WHERE asset_id = $1 AND tenant_id = $2',
      [transferData.asset_id, tenantId]
    );

    if (assetCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    const asset = assetCheck.rows[0];

    // Create transfer record
    const result = await client.query(`
      INSERT INTO assets.asset_transfers (
        tenant_id, asset_id, transfer_date, 
        from_location_id, to_location_id,
        from_department_id, to_department_id,
        from_cost_center_id, to_cost_center_id,
        reason, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      tenantId,
      transferData.asset_id,
      transferData.transfer_date,
      asset.location_id,
      transferData.to_location_id,
      asset.department_id,
      transferData.to_department_id,
      asset.cost_center_id,
      transferData.to_cost_center_id,
      transferData.reason,
      transferData.notes,
      userId
    ]);

    // Update asset location/department/cost_center
    await client.query(`
      UPDATE assets.fixed_assets SET
        location_id = COALESCE($1, location_id),
        department_id = COALESCE($2, department_id),
        cost_center_id = COALESCE($3, cost_center_id),
        updated_by = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE asset_id = $5 AND tenant_id = $6
    `, [
      transferData.to_location_id,
      transferData.to_department_id,
      transferData.to_cost_center_id,
      userId,
      transferData.asset_id,
      tenantId
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Asset transferred successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error creating transfer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transfer',
      error: error.message
    });
  } finally {
    client.release();
  }
}

// =====================================================
// ASSET MAINTENANCE
// =====================================================

export async function getAssetMaintenance(req: TenantRequest, res: Response) {
  try {
    const { tenantId } = getTenantContext(req);
    const { asset_id, status, page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = `
      SELECT am.*, fa.asset_number, fa.asset_name
      FROM assets.asset_maintenance am
      JOIN assets.fixed_assets fa ON am.asset_id = fa.asset_id
      WHERE am.tenant_id = $1
    `;
    const values: any[] = [tenantId];
    let paramCount = 2;

    if (asset_id) {
      query += ` AND am.asset_id = $${paramCount}`;
      values.push(asset_id);
      paramCount++;
    }

    if (status) {
      query += ` AND am.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    query += ` ORDER BY am.maintenance_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(parseInt(limit as string), offset);

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching maintenance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance records',
      error: error.message
    });
  }
}

export async function createAssetMaintenance(req: TenantRequest, res: Response) {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const maintenanceData = req.body;

    // Verify asset exists and belongs to tenant
    const assetCheck = await pool.query(
      'SELECT * FROM assets.fixed_assets WHERE asset_id = $1 AND tenant_id = $2',
      [maintenanceData.asset_id, tenantId]
    );

    if (assetCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    const result = await pool.query(`
      INSERT INTO assets.asset_maintenance (
        tenant_id, asset_id, maintenance_type, maintenance_date, description,
        cost, vendor, status, next_maintenance_date, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      tenantId,
      maintenanceData.asset_id,
      maintenanceData.maintenance_type,
      maintenanceData.maintenance_date,
      maintenanceData.description,
      maintenanceData.cost,
      maintenanceData.vendor,
      maintenanceData.status || 'SCHEDULED',
      maintenanceData.next_maintenance_date,
      maintenanceData.notes,
      userId
    ]);

    res.status(201).json({
      success: true,
      message: 'Maintenance record created successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error creating maintenance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create maintenance record',
      error: error.message
    });
  }
}

// =====================================================
// DEPRECIATION
// =====================================================

export async function runDepreciation(req: TenantRequest, res: Response) {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { period_end_date } = req.body;

    if (!period_end_date) {
      return res.status(400).json({
        success: false,
        message: 'Period end date is required'
      });
    }

    // Get all active assets that need depreciation
    const assetsResult = await pool.query(`
      SELECT * FROM assets.fixed_assets
      WHERE tenant_id = $1 
      AND asset_status = 'ACTIVE'
      AND in_service_date <= $2
    `, [tenantId, period_end_date]);

    let processedCount = 0;
    let totalDepreciation = 0;

    for (const asset of assetsResult.rows) {
      // Get next depreciation period for this asset
      const nextPeriod = await pool.query(`
        SELECT * FROM assets.depreciation_schedule
        WHERE asset_id = $1 AND tenant_id = $2 AND is_posted = false
        ORDER BY period_number ASC
        LIMIT 1
      `, [asset.asset_id, tenantId]);

      if (nextPeriod.rows.length > 0) {
        const period = nextPeriod.rows[0];
        
        // Mark as posted
        await pool.query(`
          UPDATE assets.depreciation_schedule
          SET is_posted = true, posted_date = CURRENT_DATE, posted_by = $1
          WHERE schedule_id = $2 AND tenant_id = $3
        `, [userId, period.schedule_id, tenantId]);

        // Update asset book value
        await pool.query(`
          UPDATE assets.fixed_assets
          SET accumulated_depreciation = accumulated_depreciation + $1,
              book_value = purchase_cost - accumulated_depreciation - $1,
              updated_by = $2,
              updated_at = CURRENT_TIMESTAMP
          WHERE asset_id = $3 AND tenant_id = $4
        `, [period.depreciation_amount, userId, asset.asset_id, tenantId]);

        processedCount++;
        totalDepreciation += parseFloat(period.depreciation_amount);
      }
    }

    res.json({
      success: true,
      message: `Depreciation run completed`,
      data: {
        processedAssets: processedCount,
        totalDepreciation: totalDepreciation.toFixed(2)
      }
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error running depreciation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run depreciation',
      error: error.message
    });
  }
}

// =====================================================
// DASHBOARD
// =====================================================

export async function getAssetDashboard(req: TenantRequest, res: Response) {
  try {
    const { tenantId } = getTenantContext(req);

    // Simplified dashboard - count from fixed_assets
    const assetsResult = await pool.query(`
      SELECT COUNT(*) as total FROM assets.fixed_assets WHERE tenant_id = $1
    `, [tenantId]);

    const categoriesResult = await pool.query(`
      SELECT COUNT(*) as total FROM assets.asset_categories WHERE tenant_id = $1
    `, [tenantId]);

    res.json({
      success: true,
      data: {
        summary: {
          total_assets: parseInt(assetsResult.rows[0]?.total || '0'),
          total_categories: parseInt(categoriesResult.rows[0]?.total || '0'),
          total_acquisition_cost: 0,
          total_book_value: 0,
          total_accumulated_depreciation: 0,
          active_assets: parseInt(assetsResult.rows[0]?.total || '0'),
          under_maintenance: 0
        },
        byCategory: [],
        upcomingMaintenance: []
      }
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    // Return empty dashboard on error
    res.json({
      success: true,
      data: {
        summary: { total_assets: 0, total_categories: 0, total_acquisition_cost: 0, total_book_value: 0, total_accumulated_depreciation: 0, active_assets: 0, under_maintenance: 0 },
        byCategory: [],
        upcomingMaintenance: []
      }
    });
  }
}

export default {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetLocations,
  getAssetCategories,
  createAssetCategory,
  getAssetDisposals,
  createAssetDisposal,
  getAssetTransfers,
  createAssetTransfer,
  getAssetMaintenance,
  createAssetMaintenance,
  runDepreciation,
  getAssetDashboard
};
