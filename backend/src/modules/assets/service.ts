/**
 * Asset Management Service
 * Handles fixed assets, depreciation, and revaluation
 */

import pool from '../../config/database';

export interface CreateAssetDto {
  asset_number?: string;
  asset_name: string;
  category_id: number;
  location_id: number;
  acquisition_date: string;
  depreciation_start_date: string;
  purchase_price: number;
  initial_cost: number;
  residual_value: number;
  depreciation_method: 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'UNITS_OF_PRODUCTION';
  useful_life_years: number;
  useful_life_months: number;
  asset_status?: string;
  acquisition_method: 'PURCHASE' | 'CASH' | 'DONATION' | 'TRANSFER' | 'LEASE' | 'CONSTRUCTION';
  supplier_id?: number;
  description?: string;
  serial_number?: string;
  tenant_id?: string;
}

export interface AssetRevaluationDto {
  asset_id: number;
  revaluation_date: string;
  previous_book_value: number;
  new_valuation: number;
  revaluation_surplus_deficit: number;
  valuation_method: string;
  valuer_name?: string;
  revaluation_reason: string;
  tenant_id?: string;
}

export interface AssetFilters {
  status?: string;
  category_id?: number;
  location_id?: number;
  search?: string;
}

export class AssetsService {
  
  /**
   * Create a new fixed asset
   */
  async createAsset(dto: CreateAssetDto, userId?: string): Promise<any> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const tenantId = dto.tenant_id || '00000000-0000-0000-0000-000000000001';
      
      // Generate asset number if not provided
      let assetNumber = dto.asset_number;
      if (!assetNumber) {
        const categoryPrefix = await client.query(
          'SELECT category_name FROM asset_categories WHERE category_id = $1',
          [dto.category_id]
        );
        const prefix = categoryPrefix.rows[0]?.category_name?.substring(0, 3).toUpperCase() || 'AST';
        
        const nextNum = await client.query(
          `SELECT COALESCE(MAX(CAST(SUBSTRING(asset_number FROM '[0-9]+$') AS INTEGER)), 0) + 1 as next_number
           FROM fixed_assets WHERE tenant_id = $1 AND asset_number LIKE $2`,
          [tenantId, `${prefix}-%`]
        );
        const nextNumber = nextNum.rows[0].next_number;
        assetNumber = `${prefix}-${new Date().getFullYear()}-${String(nextNumber).padStart(3, '0')}`;
      }
      
      const net_book_value = dto.purchase_price;
      const asset_status = dto.asset_status || 'ACTIVE';
      
      // Create asset
      const result = await client.query(
        `INSERT INTO fixed_assets (
          tenant_id, asset_number, asset_name, category_id, location_id,
          acquisition_date, depreciation_start_date, purchase_price, initial_cost,
          residual_value, depreciation_method, useful_life_years, useful_life_months,
          asset_status, acquisition_method, net_book_value, accumulated_depreciation,
          supplier_id, description, serial_number, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING *`,
        [
          tenantId, assetNumber, dto.asset_name, dto.category_id, dto.location_id,
          dto.acquisition_date, dto.depreciation_start_date, dto.purchase_price, dto.initial_cost,
          dto.residual_value, dto.depreciation_method, dto.useful_life_years, dto.useful_life_months,
          asset_status, dto.acquisition_method, net_book_value, 0,
          dto.supplier_id, dto.description, dto.serial_number, userId
        ]
      );
      
      await client.query('COMMIT');
      
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get asset by ID
   */
  async getAssetById(assetId: number, tenantId: string): Promise<any> {
    const result = await pool.query(
      `SELECT a.*, 
        c.category_name,
        l.location_name,
        s.name as supplier_name
       FROM fixed_assets a
       LEFT JOIN asset_categories c ON a.category_id = c.category_id
       LEFT JOIN asset_locations l ON a.location_id = l.location_id
       LEFT JOIN suppliers s ON a.supplier_id = s.id
       WHERE a.asset_id = $1 AND a.tenant_id = $2`,
      [assetId, tenantId]
    );
    
    return result.rows[0];
  }
  
  /**
   * List assets with filters
   */
  async listAssets(filters: AssetFilters, tenantId: string, page: number = 1, limit: number = 50): Promise<any> {
    const offset = (page - 1) * limit;
    const conditions: string[] = ['a.tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramCount = 1;
    
    if (filters.status) {
      conditions.push(`a.asset_status = $${++paramCount}`);
      params.push(filters.status);
    }
    
    if (filters.category_id) {
      conditions.push(`a.category_id = $${++paramCount}`);
      params.push(filters.category_id);
    }
    
    if (filters.location_id) {
      conditions.push(`a.location_id = $${++paramCount}`);
      params.push(filters.location_id);
    }
    
    if (filters.search) {
      conditions.push(`(a.asset_number ILIKE $${++paramCount} OR a.asset_name ILIKE $${paramCount})`);
      params.push(`%${filters.search}%`);
    }
    
    const whereClause = conditions.join(' AND ');
    
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM fixed_assets a WHERE ${whereClause}`,
      params
    );
    
    const dataResult = await pool.query(
      `SELECT a.*,
        c.category_name,
        l.location_name
       FROM fixed_assets a
       LEFT JOIN asset_categories c ON a.category_id = c.category_id
       LEFT JOIN asset_locations l ON a.location_id = l.location_id
       WHERE ${whereClause}
       ORDER BY a.asset_number DESC
       LIMIT $${++paramCount} OFFSET $${++paramCount}`,
      [...params, limit, offset]
    );
    
    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    };
  }
  
  /**
   * Calculate monthly depreciation
   */
  async calculateDepreciation(tenantId: string, month: string): Promise<any> {
    const result = await pool.query(
      'SELECT * FROM calculate_monthly_depreciation($1, $2)',
      [tenantId, month]
    );
    
    return result.rows[0];
  }
  
  /**
   * Create asset revaluation
   */
  async createRevaluation(dto: AssetRevaluationDto, userId?: string): Promise<any> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const tenantId = dto.tenant_id || '00000000-0000-0000-0000-000000000001';
      
      // Generate revaluation number
      const nextNum = await client.query(
        `SELECT COALESCE(MAX(CAST(SUBSTRING(revaluation_number FROM '[0-9]+$') AS INTEGER)), 0) + 1 as next_number
         FROM asset_revaluations`,
        []
      );
      const nextNumber = nextNum.rows[0].next_number;
      const revaluationNumber = `REV-${new Date().getFullYear()}-${String(nextNumber).padStart(3, '0')}`;
      
      // Create revaluation
      const result = await client.query(
        `INSERT INTO asset_revaluations (
          asset_id, revaluation_date, revaluation_number, previous_book_value,
          new_valuation, revaluation_surplus_deficit, valuation_method, 
          valuer_name, revaluation_reason, created_by, posted_to_gl
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          dto.asset_id, dto.revaluation_date, revaluationNumber, dto.previous_book_value,
          dto.new_valuation, dto.revaluation_surplus_deficit, dto.valuation_method,
          dto.valuer_name, dto.revaluation_reason, userId, false
        ]
      );
      
      await client.query('COMMIT');
      
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Approve revaluation (triggers GL posting)
   */
  async approveRevaluation(revaluationId: number, userId: string): Promise<any> {
    const result = await pool.query(
      `UPDATE asset_revaluations 
       SET approved_by = $1, approved_at = CURRENT_TIMESTAMP
       WHERE revaluation_id = $2
       RETURNING *`,
      [userId, revaluationId]
    );
    
    return result.rows[0];
  }
  
  /**
   * Get asset depreciation schedule
   */
  async getDepreciationSchedule(assetId: number, tenantId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM asset_depreciation_schedule
       WHERE asset_id = $1
       ORDER BY depreciation_date DESC`,
      [assetId]
    );
    
    return result.rows;
  }

  /**
   * List all depreciation schedules
   */
  async listDepreciationSchedules(tenantId: string, page: number = 1, limit: number = 50): Promise<any> {
    const offset = (page - 1) * limit;
    
    const result = await pool.query(
      `SELECT ads.*, fa.asset_name, fa.asset_number
       FROM asset_depreciation_schedule ads
       JOIN fixed_assets fa ON fa.asset_id = ads.asset_id
       WHERE fa.tenant_id = $1
       ORDER BY ads.depreciation_date DESC
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );
    
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM asset_depreciation_schedule ads
       JOIN fixed_assets fa ON fa.asset_id = ads.asset_id
       WHERE fa.tenant_id = $1`,
      [tenantId]
    );
    
    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      limit,
      pages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
    };
  }

  /**
   * List all asset disposals
   */
  async listDisposals(tenantId: string, page: number = 1, limit: number = 50): Promise<any> {
    const offset = (page - 1) * limit;
    
    const result = await pool.query(
      `SELECT ad.*, fa.asset_name, fa.asset_number
       FROM asset_disposals ad
       JOIN fixed_assets fa ON fa.asset_id = ad.asset_id
       WHERE fa.tenant_id = $1
       ORDER BY ad.disposal_date DESC
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );
    
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM asset_disposals ad
       JOIN fixed_assets fa ON fa.asset_id = ad.asset_id
       WHERE fa.tenant_id = $1`,
      [tenantId]
    );
    
    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      limit,
      pages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
    };
  }
}

export default new AssetsService();
