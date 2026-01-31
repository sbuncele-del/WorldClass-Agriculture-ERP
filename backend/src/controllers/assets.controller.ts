/**
 * Fixed Assets Controller
 * Handles CRUD operations for fixed assets, depreciation, disposals, transfers, and maintenance
 */

import { Request, Response } from 'express';
import pool from '../config/database';
import { DepreciationCalculator } from '../services/depreciation-calculator.service';
import {
  DepreciationMethod,
  AssetStatus,
  CreateFixedAssetDTO,
  UpdateFixedAssetDTO,
  CreateAssetDisposalDTO,
  CreateAssetTransferDTO,
  CreateAssetMaintenanceDTO
} from '../models/asset-management.model';

// =====================================================
// FIXED ASSETS CRUD
// =====================================================

/**
 * GET /api/assets
 * Get all fixed assets with filtering, pagination, and sorting
 */
export async function getAllAssets(req: Request, res: Response) {
  try {
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

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

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

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ') 
      : '';

    // Main query
    const query = `
      SELECT 
        fa.*,
        ac.category_name,
        COUNT(*) OVER() as total_count
      FROM assets.fixed_assets fa
      LEFT JOIN assets.asset_categories ac ON fa.category_id = ac.category_id
      ${whereClause}
      ORDER BY fa.${sort_by} ${sort_order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit as string), offset);

    const result = await pool.query(query, queryParams);

    // Summary statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_assets,
        SUM(purchase_cost) as total_acquisition_cost,
        COUNT(CASE WHEN asset_status = 'ACTIVE' THEN 1 END) as active_assets,
        COUNT(CASE WHEN asset_status = 'IDLE' THEN 1 END) as idle_assets,
        COUNT(CASE WHEN asset_status = 'UNDER_MAINTENANCE' THEN 1 END) as under_maintenance,
        COUNT(CASE WHEN asset_status = 'DISPOSED' THEN 1 END) as disposed_assets
      FROM assets.fixed_assets
      ${whereClause}
    `;

    const statsResult = await pool.query(statsQuery, queryParams.slice(0, -2));

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      summary: statsResult.rows[0]
    });

  } catch (error: any) {
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
export async function getAssetById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const assetResult = await pool.query(`
      SELECT 
        fa.*,
        ac.category_name,
        ac.category_code
      FROM assets.fixed_assets fa
      LEFT JOIN assets.asset_categories ac ON fa.category_id = ac.category_id
      WHERE fa.asset_id = $1
    `, [id]);

    if (assetResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    const asset = assetResult.rows[0];

    // Get depreciation schedule
    const scheduleResult = await pool.query(`
      SELECT * FROM assets.asset_depreciation_schedule
      WHERE asset_id = $1
      ORDER BY period_year DESC, period_month DESC
      LIMIT 12
    `, [id]);

    // Get recent maintenance
    const maintenanceResult = await pool.query(`
      SELECT * FROM assets.asset_maintenance
      WHERE asset_id = $1
      ORDER BY maintenance_date DESC
      LIMIT 5
    `, [id]);

    // Get transfer history
    const transfersResult = await pool.query(`
      SELECT * FROM assets.asset_transfers
      WHERE asset_id = $1
      ORDER BY transfer_date DESC
      LIMIT 5
    `, [id]);

    res.json({
      success: true,
      data: asset,
      depreciation_schedule: scheduleResult.rows,
      recent_maintenance: maintenanceResult.rows,
      transfer_history: transfersResult.rows
    });

  } catch (error: any) {
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
 * Create new fixed asset
 */
export async function createAsset(req: Request, res: Response) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const data: CreateFixedAssetDTO = req.body;

    // Generate asset number
    const numberResult = await client.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(asset_number FROM 5) AS INTEGER)), 0) + 1 as next_number
      FROM assets.fixed_assets
      WHERE asset_number LIKE 'AST-%'
    `);
    const asset_number = `AST-${String(numberResult.rows[0].next_number).padStart(5, '0')}`;

    // Insert asset
    const result = await client.query(`
      INSERT INTO assets.fixed_assets (
        asset_number, asset_name, description, category_id,
        acquisition_date, acquisition_method, vendor_id, vendor_name,
        purchase_order_id, invoice_number,
        acquisition_cost, installation_cost, improvement_cost,
        depreciation_method, useful_life_years, useful_life_units,
        residual_value, depreciation_rate, depreciation_start_date,
        serial_number, manufacturer, model_number, year_of_manufacture, warranty_expiry_date,
        location_id, location_name, department_id, cost_center_id,
        custodian_employee_id, custodian_name,
        asset_status, condition_rating,
        is_insured, insurance_policy_number, insurance_value, insurance_expiry_date,
        notes, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38
      )
      RETURNING *
    `, [
      asset_number, data.asset_name, data.description, data.category_id,
      data.acquisition_date, data.acquisition_method, data.vendor_id, data.vendor_name,
      data.purchase_order_id, data.invoice_number,
      data.acquisition_cost, data.installation_cost || 0, data.improvement_cost || 0,
      data.depreciation_method, data.useful_life_years, data.useful_life_units,
      data.residual_value || 0, data.depreciation_rate, data.depreciation_start_date,
      data.serial_number, data.manufacturer, data.model_number, data.year_of_manufacture, data.warranty_expiry_date,
      data.location_id, data.location_name, data.department_id, data.cost_center_id,
      data.custodian_employee_id, data.custodian_name,
      'ACTIVE', data.condition_rating || 'GOOD',
      data.is_insured || false, data.insurance_policy_number, data.insurance_value, data.insurance_expiry_date,
      data.notes, req.user?.user_id || 'system'
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
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
 * Update fixed asset
 */
export async function updateAsset(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data: UpdateFixedAssetDTO = req.body;

    const allowedFields = [
      'asset_name', 'description', 'category_id', 'location_id', 'location_name',
      'department_id', 'cost_center_id', 'custodian_employee_id', 'custodian_name',
      'asset_status', 'condition_rating', 'is_insured', 'insurance_policy_number',
      'insurance_value', 'insurance_expiry_date', 'notes'
    ];

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updates.push(`updated_at = NOW()`);
    updates.push(`updated_by = $${paramIndex++}`);
    values.push(req.user?.user_id || 'system');
    values.push(id);

    const result = await pool.query(`
      UPDATE fixed_assets
      SET ${updates.join(', ')}
      WHERE asset_id = $${paramIndex}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    res.json({
      success: true,
      message: 'Asset updated successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error updating asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update asset',
      error: error.message
    });
  }
}

/**
 * POST /api/assets/:id/depreciation/calculate
 * Calculate and save depreciation for a specific period
 */
export async function calculateDepreciation(req: Request, res: Response) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { period_year, period_month, units_produced } = req.body;

    if (!period_year || !period_month) {
      return res.status(400).json({
        success: false,
        message: 'period_year and period_month are required'
      });
    }

    // Get asset details
    const assetResult = await client.query(`
      SELECT * FROM assets.fixed_assets WHERE asset_id = $1
    `, [id]);

    if (assetResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    const asset = assetResult.rows[0];

    // Check if asset is depreciable
    if (asset.asset_status === 'DISPOSED' || asset.asset_status === 'WRITTEN_OFF') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Cannot depreciate disposed or written-off assets'
      });
    }

    // Check if depreciation already exists for this period
    const existingResult = await client.query(`
      SELECT * FROM assets.asset_depreciation_schedule
      WHERE asset_id = $1 AND period_year = $2 AND period_month = $3
    `, [id, period_year, period_month]);

    if (existingResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Depreciation already calculated for this period'
      });
    }

    // Get latest depreciation to calculate current accumulated depreciation
    const latestDepResult = await client.query(`
      SELECT accumulated_depreciation, closing_book_value 
      FROM assets.asset_depreciation_schedule
      WHERE asset_id = $1
      ORDER BY period_year DESC, period_month DESC
      LIMIT 1
    `, [id]);

    const accumulatedDep = latestDepResult.rows.length > 0 
      ? parseFloat(latestDepResult.rows[0].accumulated_depreciation)
      : 0;
    
    const currentBookValue = latestDepResult.rows.length > 0
      ? parseFloat(latestDepResult.rows[0].closing_book_value)
      : parseFloat(asset.purchase_cost);

    // Calculate depreciation
    const depreciationResult = DepreciationCalculator.calculateDepreciation(
      asset.depreciation_method as DepreciationMethod,
      {
        acquisition_cost: parseFloat(asset.purchase_cost),
        residual_value: parseFloat(asset.residual_value),
        useful_life_years: asset.useful_life_years,
        useful_life_units: asset.useful_life_units,
        depreciation_rate: asset.depreciation_rate,
        accumulated_depreciation: accumulatedDep,
        current_book_value: currentBookValue,
        period_year,
        period_month,
        units_produced_in_period: units_produced
      }
    );

    // Calculate period dates
    const period_start_date = new Date(period_year, period_month - 1, 1);
    const period_end_date = new Date(period_year, period_month, 0);

    // Insert depreciation schedule
    const scheduleResult = await client.query(`
      INSERT INTO assets.asset_depreciation_schedule (
        asset_id, period_year, period_month,
        opening_book_value, depreciation_amount, accumulated_depreciation, closing_book_value,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      id, period_year, period_month,
      currentBookValue,
      depreciationResult.depreciation_amount,
      depreciationResult.accumulated_depreciation,
      depreciationResult.closing_book_value,
      req.user?.user_id || 'system'
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Depreciation calculated successfully',
      data: scheduleResult.rows[0]
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error calculating depreciation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate depreciation',
      error: error.message
    });
  } finally {
    client.release();
  }
}

/**
 * POST /api/assets/depreciation/batch
 * Calculate depreciation for all active assets for a given period
 */
export async function batchCalculateDepreciation(req: Request, res: Response) {
  const client = await pool.connect();
  
  try {
    const { period_year, period_month } = req.body;

    if (!period_year || !period_month) {
      return res.status(400).json({
        success: false,
        message: 'period_year and period_month are required'
      });
    }

    // Get all active depreciable assets
    const assetsResult = await client.query(`
      SELECT * FROM assets.fixed_assets
      WHERE asset_status IN ('ACTIVE', 'IDLE')
      AND purchase_date <= $1
    `, [new Date(period_year, period_month - 1, 1)]);

    const results = {
      total_assets: assetsResult.rows.length,
      successful: 0,
      failed: 0,
      total_depreciation: 0,
      errors: [] as any[]
    };

    for (const asset of assetsResult.rows) {
      try {
        await client.query('BEGIN');

        // Check if already calculated
        const existing = await client.query(`
          SELECT 1 FROM assets.asset_depreciation_schedule
          WHERE asset_id = $1 AND period_year = $2 AND period_month = $3
        `, [asset.asset_id, period_year, period_month]);

        if (existing.rows.length > 0) {
          await client.query('ROLLBACK');
          continue; // Skip already calculated
        }

        // Get latest depreciation
        const latestDepResult = await client.query(`
          SELECT accumulated_depreciation, closing_book_value 
          FROM assets.asset_depreciation_schedule
          WHERE asset_id = $1
          ORDER BY period_year DESC, period_month DESC
          LIMIT 1
        `, [asset.asset_id]);

        const accumulatedDep = latestDepResult.rows.length > 0 
          ? parseFloat(latestDepResult.rows[0].accumulated_depreciation)
          : 0;
        
        const currentBookValue = latestDepResult.rows.length > 0
          ? parseFloat(latestDepResult.rows[0].closing_book_value)
          : parseFloat(asset.purchase_cost);

        // Calculate depreciation
        const depreciationResult = DepreciationCalculator.calculateDepreciation(
          asset.depreciation_method as DepreciationMethod,
          {
            acquisition_cost: parseFloat(asset.purchase_cost),
            residual_value: parseFloat(asset.residual_value),
            useful_life_years: asset.useful_life_years,
            useful_life_units: asset.useful_life_units,
            depreciation_rate: asset.depreciation_rate,
            accumulated_depreciation: accumulatedDep,
            current_book_value: currentBookValue,
            period_year,
            period_month
          }
        );

        // Insert schedule
        await client.query(`
          INSERT INTO assets.asset_depreciation_schedule (
            asset_id, period_year, period_month,
            opening_book_value, depreciation_amount, accumulated_depreciation, closing_book_value,
            created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          asset.asset_id, period_year, period_month,
          currentBookValue,
          depreciationResult.depreciation_amount,
          depreciationResult.accumulated_depreciation,
          depreciationResult.closing_book_value,
          req.user?.user_id || 'system'
        ]);

        await client.query('COMMIT');

        results.successful++;
        results.total_depreciation += depreciationResult.depreciation_amount;

      } catch (error: any) {
        await client.query('ROLLBACK');
        results.failed++;
        results.errors.push({
          asset_number: asset.asset_number,
          asset_name: asset.asset_name,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Batch depreciation completed`,
      results
    });

  } catch (error: any) {
    console.error('Error in batch depreciation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate batch depreciation',
      error: error.message
    });
  } finally {
    client.release();
  }
}

/**
 * Dispose of an asset - sale, scrapping, or write-off
 * IAS 16.67-72 compliant disposal workflow
 */
async function disposeAsset(req: Request, res: Response): Promise<void> {
  const client = await pool.connect();
  const { asset_id } = req.params;
  const {
    disposal_method, // 'sale' | 'scrapping' | 'write_off' | 'donation'
    disposal_date,
    disposal_proceeds = 0,
    disposal_costs = 0,
    buyer_name,
    buyer_contact,
    reason_for_disposal,
    approval_reference
  } = req.body;

  try {
    await client.query('BEGIN');

    // Get asset details
    const assetResult = await client.query(`
      SELECT 
        a.*,
        COALESCE((
          SELECT SUM(depreciation_amount) 
          FROM assets.asset_depreciation_schedule 
          WHERE asset_id = a.asset_id
        ), 0) as total_accumulated_depreciation
      FROM assets.fixed_assets a
      WHERE a.asset_id = $1 AND a.status != 'disposed'
    `, [asset_id]);

    if (assetResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Asset not found or already disposed' });
      return;
    }

    const asset = assetResult.rows[0];
    const carrying_amount = parseFloat(asset.purchase_cost) - parseFloat(asset.total_accumulated_depreciation);
    const net_proceeds = parseFloat(disposal_proceeds) - parseFloat(disposal_costs);
    const gain_loss = net_proceeds - carrying_amount;

    // Create disposal record
    const disposalResult = await client.query(`
      INSERT INTO assets.asset_disposals (
        asset_id, disposal_date, disposal_method,
        disposal_proceeds, disposal_costs, net_proceeds,
        carrying_amount_at_disposal, gain_loss_on_disposal,
        buyer_name, buyer_contact, reason_for_disposal,
        approval_reference, disposal_status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'completed', $13)
      RETURNING disposal_id
    `, [
      asset_id, disposal_date, disposal_method,
      disposal_proceeds, disposal_costs, net_proceeds,
      carrying_amount, gain_loss,
      buyer_name, buyer_contact, reason_for_disposal,
      approval_reference, req.user?.user_id || 'system'
    ]);

    // Update asset status
    await client.query(`
      UPDATE assets.fixed_assets
      SET status = 'disposed',
          disposal_date = $2,
          updated_at = NOW(),
          updated_by = $3
      WHERE asset_id = $1
    `, [asset_id, disposal_date, req.user?.user_id || 'system']);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Asset disposed successfully via ${disposal_method}`,
      disposal: {
        disposal_id: disposalResult.rows[0].disposal_id,
        asset_id,
        disposal_method,
        disposal_date,
        carrying_amount,
        net_proceeds,
        gain_loss,
        gain_loss_type: gain_loss >= 0 ? 'gain' : 'loss'
      },
      gl_posting_required: {
        debit_accumulated_depreciation: parseFloat(asset.total_accumulated_depreciation),
        debit_cash_or_receivable: net_proceeds > 0 ? net_proceeds : 0,
        debit_loss_on_disposal: gain_loss < 0 ? Math.abs(gain_loss) : 0,
        credit_asset: parseFloat(asset.purchase_cost),
        credit_gain_on_disposal: gain_loss > 0 ? gain_loss : 0
      }
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error disposing asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dispose asset',
      error: error.message
    });
  } finally {
    client.release();
  }
}

/**
 * Record asset revaluation - IAS 16.31-42
 * Revaluation model for property, plant and equipment
 */
async function createRevaluation(req: Request, res: Response): Promise<void> {
  const client = await pool.connect();
  const { asset_id } = req.params;
  const {
    valuation_date,
    fair_value,
    valuation_method, // 'market_value' | 'income_approach' | 'cost_approach'
    valuer_name,
    valuer_credentials,
    external_valuation_report,
    notes
  } = req.body;

  try {
    await client.query('BEGIN');

    // Get current asset details
    const assetResult = await client.query(`
      SELECT 
        a.*,
        COALESCE((
          SELECT SUM(depreciation_amount) 
          FROM assets.asset_depreciation_schedule 
          WHERE asset_id = a.asset_id
        ), 0) as accumulated_depreciation
      FROM assets.fixed_assets a
      WHERE a.asset_id = $1 AND a.status = 'active'
    `, [asset_id]);

    if (assetResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Active asset not found' });
      return;
    }

    const asset = assetResult.rows[0];
    const carrying_amount = parseFloat(asset.purchase_cost) - parseFloat(asset.accumulated_depreciation);
    const revaluation_surplus_or_deficit = parseFloat(fair_value) - carrying_amount;

    // Create valuation record
    const valuationResult = await client.query(`
      INSERT INTO assets.asset_valuations (
        asset_id, valuation_date, valuation_type,
        previous_value, new_value, adjustment_amount,
        valuation_method, valuer_name, valuer_credentials,
        external_report_reference, notes, created_by
      ) VALUES ($1, $2, 'revaluation', $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING valuation_id
    `, [
      asset_id, valuation_date, carrying_amount, fair_value,
      revaluation_surplus_or_deficit, valuation_method,
      valuer_name, valuer_credentials, external_valuation_report,
      notes, req.user?.user_id || 'system'
    ]);

    // Update asset with revalued amount
    await client.query(`
      UPDATE assets.fixed_assets
      SET purchase_cost = $2,
          last_valuation_date = $3,
          last_valuation_amount = $2,
          updated_at = NOW(),
          updated_by = $4
      WHERE asset_id = $1
    `, [asset_id, fair_value, valuation_date, req.user?.user_id || 'system']);

    // Reset accumulated depreciation for revalued amount (IAS 16.35)
    await client.query(`
      UPDATE assets.asset_depreciation_schedule
      SET is_reversal_entry = true
      WHERE asset_id = $1
    `, [asset_id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Asset revaluation recorded successfully',
      revaluation: {
        valuation_id: valuationResult.rows[0].valuation_id,
        asset_id,
        previous_carrying_amount: carrying_amount,
        new_fair_value: parseFloat(fair_value),
        revaluation_surplus_or_deficit,
        treatment: revaluation_surplus_or_deficit >= 0 ? 'credit_revaluation_reserve' : 'debit_profit_or_loss'
      },
      gl_posting_required: {
        // IAS 16.39-40 accounting treatment
        debit_asset: revaluation_surplus_or_deficit > 0 ? revaluation_surplus_or_deficit : 0,
        credit_revaluation_reserve: revaluation_surplus_or_deficit > 0 ? revaluation_surplus_or_deficit : 0,
        debit_profit_or_loss: revaluation_surplus_or_deficit < 0 ? Math.abs(revaluation_surplus_or_deficit) : 0,
        credit_asset: revaluation_surplus_or_deficit < 0 ? Math.abs(revaluation_surplus_or_deficit) : 0
      },
      ias16_reference: 'IAS 16.39-40'
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error recording revaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record revaluation',
      error: error.message
    });
  } finally {
    client.release();
  }
}

/**
 * Record asset impairment - IAS 36
 * Impairment testing and loss recognition
 */
async function createImpairment(req: Request, res: Response): Promise<void> {
  const client = await pool.connect();
  const { asset_id } = req.params;
  const {
    impairment_date,
    recoverable_amount,
    impairment_indicator, // 'market_value_decline' | 'obsolescence' | 'physical_damage' | 'economic_changes'
    fair_value_less_costs_to_sell,
    value_in_use,
    discount_rate_used,
    cash_flow_projections,
    external_evidence,
    notes
  } = req.body;

  try {
    await client.query('BEGIN');

    // Get current asset details
    const assetResult = await client.query(`
      SELECT 
        a.*,
        COALESCE((
          SELECT SUM(depreciation_amount) 
          FROM assets.asset_depreciation_schedule 
          WHERE asset_id = a.asset_id
        ), 0) as accumulated_depreciation
      FROM assets.fixed_assets a
      WHERE a.asset_id = $1 AND a.status = 'active'
    `, [asset_id]);

    if (assetResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Active asset not found' });
      return;
    }

    const asset = assetResult.rows[0];
    const carrying_amount = parseFloat(asset.purchase_cost) - parseFloat(asset.accumulated_depreciation);
    
    // IAS 36: Recoverable amount is higher of FVLCTS and VIU
    const calculated_recoverable = Math.max(
      parseFloat(fair_value_less_costs_to_sell || 0),
      parseFloat(value_in_use || 0)
    );
    const final_recoverable = recoverable_amount || calculated_recoverable;

    // Check if impairment exists
    if (carrying_amount <= final_recoverable) {
      await client.query('ROLLBACK');
      res.status(400).json({
        success: false,
        message: 'No impairment required - carrying amount does not exceed recoverable amount',
        carrying_amount,
        recoverable_amount: final_recoverable
      });
      return;
    }

    const impairment_loss = carrying_amount - final_recoverable;

    // Create impairment record
    const impairmentResult = await client.query(`
      INSERT INTO assets.asset_valuations (
        asset_id, valuation_date, valuation_type,
        previous_value, new_value, adjustment_amount,
        valuation_method, notes, created_by
      ) VALUES ($1, $2, 'impairment', $3, $4, $5, $6, $7, $8)
      RETURNING valuation_id
    `, [
      asset_id, impairment_date, carrying_amount, final_recoverable,
      -impairment_loss, // Negative for impairment
      `IAS 36 - ${impairment_indicator}`,
      JSON.stringify({
        impairment_indicator,
        fair_value_less_costs_to_sell,
        value_in_use,
        discount_rate_used,
        cash_flow_projections,
        external_evidence,
        notes
      }),
      req.user?.user_id || 'system'
    ]);

    // Update asset carrying amount
    await client.query(`
      UPDATE assets.fixed_assets
      SET impairment_loss = COALESCE(impairment_loss, 0) + $2,
          updated_at = NOW(),
          updated_by = $3
      WHERE asset_id = $1
    `, [asset_id, impairment_loss, req.user?.user_id || 'system']);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Asset impairment recorded successfully',
      impairment: {
        valuation_id: impairmentResult.rows[0].valuation_id,
        asset_id,
        carrying_amount_before: carrying_amount,
        recoverable_amount: final_recoverable,
        impairment_loss,
        carrying_amount_after: final_recoverable,
        impairment_indicator
      },
      gl_posting_required: {
        debit_impairment_loss: impairment_loss,
        credit_accumulated_impairment: impairment_loss
      },
      ias36_reference: 'IAS 36.59-64'
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error recording impairment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record impairment',
      error: error.message
    });
  } finally {
    client.release();
  }
}

/**
 * Get revaluation history for an asset
 */
async function getRevaluations(req: Request, res: Response): Promise<void> {
  const { asset_id } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        v.*,
        a.asset_number,
        a.asset_name
      FROM assets.asset_valuations v
      JOIN assets.fixed_assets a ON v.asset_id = a.asset_id
      WHERE v.asset_id = $1
      ORDER BY v.valuation_date DESC
    `, [asset_id]);

    res.json({
      success: true,
      asset_id,
      valuations: result.rows,
      total_count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching revaluations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revaluations',
      error: error.message
    });
  }
}

/**
 * Classify expenditure as capital or expense
 * IAS 16.7-14 recognition and subsequent expenditure
 */
async function classifyExpenditure(req: Request, res: Response): Promise<void> {
  const {
    acquisition_cost,
    expected_useful_life_years,
    is_tangible = true,
    provides_future_benefits,
    is_controlled_by_entity = true,
    cost_is_measurable = true,
    maintenance_nature,
    enhances_useful_life,
    enhances_capacity
  } = req.body;

  try {
    // Get entity thresholds
    const thresholdsResult = await pool.query(`
      SELECT setting_value
      FROM core.system_settings
      WHERE setting_key = 'asset_capitalization_thresholds'
      LIMIT 1
    `);

    const thresholds = thresholdsResult.rows[0]?.setting_value || {
      minimum_amount: 5000,
      minimum_useful_life_years: 1,
      low_value_asset_threshold: 2500
    };

    // IAS 16.7 Recognition criteria
    const meetsCriteria = {
      future_benefits: provides_future_benefits,
      measurable: cost_is_measurable,
      controlled: is_controlled_by_entity
    };

    let classification = {
      should_capitalize: false,
      classification: 'expense' as 'capital' | 'expense' | 'requires_review',
      reason: '',
      ias16_reference: ''
    };

    // Check recognition criteria
    if (!provides_future_benefits) {
      classification = {
        should_capitalize: false,
        classification: 'expense',
        reason: 'Does not provide probable future economic benefits',
        ias16_reference: 'IAS 16.7(a)'
      };
    } else if (!cost_is_measurable) {
      classification = {
        should_capitalize: false,
        classification: 'expense',
        reason: 'Cost cannot be measured reliably',
        ias16_reference: 'IAS 16.7(b)'
      };
    } else if (acquisition_cost < thresholds.low_value_asset_threshold) {
      classification = {
        should_capitalize: false,
        classification: 'expense',
        reason: `Below low-value threshold of R${thresholds.low_value_asset_threshold}`,
        ias16_reference: 'Entity policy'
      };
    } else if (expected_useful_life_years < thresholds.minimum_useful_life_years) {
      classification = {
        should_capitalize: false,
        classification: 'expense',
        reason: `Useful life less than ${thresholds.minimum_useful_life_years} year(s)`,
        ias16_reference: 'Entity policy'
      };
    } else if (acquisition_cost < thresholds.minimum_amount) {
      classification = {
        should_capitalize: false,
        classification: 'expense',
        reason: `Below capitalization threshold of R${thresholds.minimum_amount}`,
        ias16_reference: 'Entity policy'
      };
    } else if (maintenance_nature === 'repair') {
      classification = {
        should_capitalize: false,
        classification: 'expense',
        reason: 'Day-to-day servicing costs are expensed as incurred',
        ias16_reference: 'IAS 16.12'
      };
    } else if (maintenance_nature === 'improvement' && (enhances_useful_life || enhances_capacity)) {
      classification = {
        should_capitalize: true,
        classification: 'capital',
        reason: 'Improvement extends useful life or enhances capacity',
        ias16_reference: 'IAS 16.13'
      };
    } else if (maintenance_nature === 'replacement' && acquisition_cost >= thresholds.minimum_amount) {
      classification = {
        should_capitalize: true,
        classification: 'capital',
        reason: 'Major component replacement - capitalize and derecognize replaced part',
        ias16_reference: 'IAS 16.13'
      };
    } else {
      classification = {
        should_capitalize: true,
        classification: 'capital',
        reason: 'Meets IAS 16 recognition criteria',
        ias16_reference: 'IAS 16.7'
      };
    }

    res.json({
      success: true,
      input: {
        acquisition_cost,
        expected_useful_life_years,
        is_tangible,
        maintenance_nature
      },
      thresholds,
      recognition_criteria: meetsCriteria,
      classification,
      recommended_action: classification.should_capitalize
        ? 'Create asset record and set up depreciation schedule'
        : 'Record as expense in period incurred'
    });

  } catch (error: any) {
    console.error('Error classifying expenditure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to classify expenditure',
      error: error.message
    });
  }
}

/**
 * Post depreciation batch to GL
 */
async function postDepreciationToGL(req: Request, res: Response): Promise<void> {
  const client = await pool.connect();
  const { period_year, period_month, post_date } = req.body;

  try {
    await client.query('BEGIN');

    // Get all unposted depreciation for the period
    const depScheduleResult = await client.query(`
      SELECT 
        ds.*,
        a.asset_name,
        a.asset_number,
        c.depreciation_expense_gl_account_code,
        c.accumulated_depreciation_gl_account_code,
        c.category_name
      FROM assets.asset_depreciation_schedule ds
      JOIN assets.fixed_assets a ON ds.asset_id = a.asset_id
      LEFT JOIN assets.asset_categories c ON a.category_id = c.category_id
      WHERE ds.period_year = $1 
        AND ds.period_month = $2
        AND ds.journal_entry_id IS NULL
        AND ds.depreciation_amount > 0
    `, [period_year, period_month]);

    if (depScheduleResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(400).json({
        success: false,
        message: 'No unposted depreciation entries found for this period'
      });
      return;
    }

    // Calculate totals by GL account
    const accountTotals: Record<string, { expense: number; accumulated: number; assets: string[] }> = {};
    let totalDepreciation = 0;

    for (const entry of depScheduleResult.rows) {
      const expenseAccount = entry.depreciation_expense_gl_account_code || '7100'; // Default depreciation expense
      const accumulatedAccount = entry.accumulated_depreciation_gl_account_code || '1800'; // Default accumulated dep
      
      if (!accountTotals[entry.category_name || 'General']) {
        accountTotals[entry.category_name || 'General'] = {
          expense: 0,
          accumulated: 0,
          assets: []
        };
      }
      
      accountTotals[entry.category_name || 'General'].expense += parseFloat(entry.depreciation_amount);
      accountTotals[entry.category_name || 'General'].accumulated += parseFloat(entry.depreciation_amount);
      accountTotals[entry.category_name || 'General'].assets.push(entry.asset_number);
      totalDepreciation += parseFloat(entry.depreciation_amount);
    }

    // Create journal entry
    const journalResult = await client.query(`
      INSERT INTO accounting.journal_entries (
        journal_type, reference_number, entry_date,
        description, total_debit, total_credit,
        status, created_by
      ) VALUES (
        'depreciation', 
        $1,
        $2,
        $3,
        $4, $4,
        'posted',
        $5
      )
      RETURNING journal_entry_id
    `, [
      `DEP-${period_year}-${String(period_month).padStart(2, '0')}`,
      post_date || new Date().toISOString().split('T')[0],
      `Monthly depreciation for ${period_year}-${String(period_month).padStart(2, '0')}`,
      totalDepreciation,
      req.user?.user_id || 'system'
    ]);

    const journalEntryId = journalResult.rows[0].journal_entry_id;

    // Update depreciation schedule with journal entry reference
    await client.query(`
      UPDATE assets.asset_depreciation_schedule
      SET journal_entry_id = $1
      WHERE period_year = $2 AND period_month = $3 AND journal_entry_id IS NULL
    `, [journalEntryId, period_year, period_month]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Depreciation posted to GL successfully',
      journal_entry_id: journalEntryId,
      period: `${period_year}-${String(period_month).padStart(2, '0')}`,
      total_depreciation: totalDepreciation,
      entries_posted: depScheduleResult.rows.length,
      account_summary: accountTotals
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error posting depreciation to GL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post depreciation to GL',
      error: error.message
    });
  } finally {
    client.release();
  }
}

/**
 * Get depreciation schedule projection
 */
async function getDepreciationSchedule(req: Request, res: Response): Promise<void> {
  const { asset_id } = req.params;
  const { years = 5 } = req.query;

  try {
    // Get asset details
    const assetResult = await pool.query(`
      SELECT 
        a.*,
        COALESCE((
          SELECT SUM(depreciation_amount) 
          FROM assets.asset_depreciation_schedule 
          WHERE asset_id = a.asset_id
        ), 0) as accumulated_depreciation
      FROM assets.fixed_assets a
      WHERE a.asset_id = $1
    `, [asset_id]);

    if (assetResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Asset not found' });
      return;
    }

    const asset = assetResult.rows[0];
    const schedule = DepreciationCalculator.generateFullSchedule(
      asset.depreciation_method as DepreciationMethod,
      parseFloat(asset.purchase_cost),
      parseFloat(asset.residual_value || 0),
      parseInt(years as string) || asset.useful_life_years,
      asset.depreciation_rate
    );

    res.json({
      success: true,
      asset: {
        asset_id,
        asset_number: asset.asset_number,
        asset_name: asset.asset_name,
        purchase_cost: parseFloat(asset.purchase_cost),
        residual_value: parseFloat(asset.residual_value || 0),
        useful_life_years: asset.useful_life_years,
        depreciation_method: asset.depreciation_method,
        accumulated_depreciation: parseFloat(asset.accumulated_depreciation)
      },
      schedule
    });

  } catch (error: any) {
    console.error('Error generating depreciation schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate depreciation schedule',
      error: error.message
    });
  }
}

export default {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  calculateDepreciation,
  batchCalculateDepreciation,
  disposeAsset,
  createRevaluation,
  createImpairment,
  getRevaluations,
  classifyExpenditure,
  postDepreciationToGL,
  getDepreciationSchedule
};
