/**
 * Financial Forecasting Controller v2 - Tenant-Hardened
 * 
 * Budget and forecasting management with full multi-tenant isolation.
 * 
 * Features:
 * - Budget scenarios management
 * - Budget CRUD with line items
 * - Budget vs Actual analysis
 * - Variance reporting
 * - Forecast generation (linear regression)
 * - Dashboard analytics
 */

import { Request, Response } from 'express';
import { pool } from '../../config/database';

// Tenant-aware request type
interface TenantRequest extends Request {
  tenantId?: string;
  tenant?: { id: string };
  user?: { id: string; email: string; role: string };
}

/**
 * Get tenant ID from request
 */
function getTenantId(req: TenantRequest): string {
  const tenantId = req.tenantId || req.tenant?.id;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }
  return tenantId;
}

/**
 * Helper for tenant-scoped queries
 */
async function query(text: string, params: any[]): Promise<any> {
  return pool.query(text, params);
}

// =============================================================================
// BUDGET SCENARIOS
// =============================================================================

/**
 * GET /api/v2/financial/forecasting/scenarios
 * Get all budget scenarios for tenant
 */
export async function getBudgetScenarios(req: TenantRequest, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { fiscal_year, status, scenario_type } = req.query;

    let queryText = `
      SELECT 
        id, name, description, scenario_type, fiscal_year,
        start_date, end_date, status, is_active,
        created_by, approved_by, approved_at, notes,
        created_at, updated_at
      FROM budget_scenarios
      WHERE tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramCount = 2;

    if (fiscal_year) {
      queryText += ` AND fiscal_year = $${paramCount}`;
      params.push(fiscal_year);
      paramCount++;
    }

    if (status) {
      queryText += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (scenario_type) {
      queryText += ` AND scenario_type = $${paramCount}`;
      params.push(scenario_type);
      paramCount++;
    }

    queryText += ` ORDER BY fiscal_year DESC, name ASC`;

    const result = await query(queryText, params);

    res.json({
      success: true,
      count: result.rows.length,
      scenarios: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching budget scenarios:', error);
    res.status(error.message === 'Tenant context required' ? 401 : 500).json({
      success: false,
      message: 'Failed to fetch budget scenarios',
      error: error.message
    });
  }
}

/**
 * POST /api/v2/financial/forecasting/scenarios
 * Create a new budget scenario
 */
export async function createBudgetScenario(req: TenantRequest, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const userId = (req as any).user?.id;
    const {
      name,
      description,
      scenario_type = 'BASELINE',
      fiscal_year,
      start_date,
      end_date,
      is_active = false,
      notes
    } = req.body;

    if (!name || !fiscal_year || !start_date || !end_date) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: name, fiscal_year, start_date, end_date'
      });
      return;
    }

    const result = await query(
      `INSERT INTO budget_scenarios (
        tenant_id, name, description, scenario_type, fiscal_year,
        start_date, end_date, is_active, created_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [tenantId, name, description, scenario_type, fiscal_year, start_date, end_date, is_active, userId, notes]
    );

    res.status(201).json({
      success: true,
      message: 'Budget scenario created successfully',
      scenario: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating budget scenario:', error);
    res.status(error.message === 'Tenant context required' ? 401 : 500).json({
      success: false,
      message: 'Failed to create budget scenario',
      error: error.message
    });
  }
}

/**
 * GET /api/v2/financial/forecasting/scenarios/:id
 * Get a specific budget scenario
 */
export async function getBudgetScenario(req: TenantRequest, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    const result = await query(
      `SELECT * FROM budget_scenarios WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Budget scenario not found' });
      return;
    }

    res.json({ success: true, scenario: result.rows[0] });
  } catch (error: any) {
    console.error('Error fetching budget scenario:', error);
    res.status(error.message === 'Tenant context required' ? 401 : 500).json({
      success: false,
      message: 'Failed to fetch budget scenario',
      error: error.message
    });
  }
}

/**
 * PUT /api/v2/financial/forecasting/scenarios/:id
 * Update a budget scenario
 */
export async function updateBudgetScenario(req: TenantRequest, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const { name, description, status, is_active, notes } = req.body;

    const result = await query(
      `UPDATE budget_scenarios SET
        name = COALESCE($3, name),
        description = COALESCE($4, description),
        status = COALESCE($5, status),
        is_active = COALESCE($6, is_active),
        notes = COALESCE($7, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, name, description, status, is_active, notes]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Budget scenario not found' });
      return;
    }

    res.json({ success: true, message: 'Budget scenario updated', scenario: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating budget scenario:', error);
    res.status(error.message === 'Tenant context required' ? 401 : 500).json({
      success: false,
      message: 'Failed to update budget scenario',
      error: error.message
    });
  }
}

/**
 * DELETE /api/v2/financial/forecasting/scenarios/:id
 * Delete a budget scenario
 */
export async function deleteBudgetScenario(req: TenantRequest, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    const result = await query(
      `DELETE FROM budget_scenarios WHERE id = $1 AND tenant_id = $2 RETURNING id`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Budget scenario not found' });
      return;
    }

    res.json({ success: true, message: 'Budget scenario deleted' });
  } catch (error: any) {
    console.error('Error deleting budget scenario:', error);
    res.status(error.message === 'Tenant context required' ? 401 : 500).json({
      success: false,
      message: 'Failed to delete budget scenario',
      error: error.message
    });
  }
}

// =============================================================================
// BUDGETS
// =============================================================================

/**
 * GET /api/v2/financial/forecasting/budgets
 * Get all budgets with optional filters
 */
export async function getBudgets(req: TenantRequest, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { scenario_id, fiscal_year, department, status, budget_type } = req.query;

    let queryText = `
      SELECT b.*, bs.name as scenario_name
      FROM budgets b
      LEFT JOIN budget_scenarios bs ON b.scenario_id = bs.id
      WHERE b.tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramCount = 2;

    if (scenario_id) {
      queryText += ` AND b.scenario_id = $${paramCount}`;
      params.push(scenario_id);
      paramCount++;
    }

    if (fiscal_year) {
      queryText += ` AND b.fiscal_year = $${paramCount}`;
      params.push(fiscal_year);
      paramCount++;
    }

    if (department) {
      queryText += ` AND b.department = $${paramCount}`;
      params.push(department);
      paramCount++;
    }

    if (status) {
      queryText += ` AND b.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (budget_type) {
      queryText += ` AND b.budget_type = $${paramCount}`;
      params.push(budget_type);
      paramCount++;
    }

    queryText += ` ORDER BY b.fiscal_year DESC, b.budget_code ASC`;

    const result = await query(queryText, params);

    res.json({
      success: true,
      count: result.rows.length,
      budgets: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching budgets:', error);
    res.status(error.message === 'Tenant context required' ? 401 : 500).json({
      success: false,
      message: 'Failed to fetch budgets',
      error: error.message
    });
  }
}

/**
 * GET /api/v2/financial/forecasting/budgets/:id
 * Get a single budget by ID with all its lines
 */
export async function getBudgetById(req: TenantRequest, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    // Get budget header
    const budgetResult = await query(
      `SELECT b.*, bs.name as scenario_name, bs.scenario_type
       FROM budgets b
       LEFT JOIN budget_scenarios bs ON b.scenario_id = bs.id
       WHERE b.id = $1 AND b.tenant_id = $2`,
      [id, tenantId]
    );

    if (budgetResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Budget not found' });
      return;
    }

    // Get budget lines
    const linesResult = await query(
      `SELECT * FROM budget_lines WHERE budget_id = $1 ORDER BY account_code ASC`,
      [id]
    );

    res.json({
      success: true,
      budget: {
        ...budgetResult.rows[0],
        lines: linesResult.rows
      }
    });
  } catch (error: any) {
    console.error('Error fetching budget:', error);
    res.status(error.message === 'Tenant context required' ? 401 : 500).json({
      success: false,
      message: 'Failed to fetch budget',
      error: error.message
    });
  }
}

/**
 * POST /api/v2/financial/forecasting/budgets
 * Create a new budget with lines
 */
export async function createBudget(req: TenantRequest, res: Response): Promise<void> {
  const client = await pool.connect();
  
  try {
    const tenantId = getTenantId(req);
    const userId = (req as any).user?.id;
    const {
      scenario_id,
      budget_code,
      budget_name,
      description,
      budget_type = 'ANNUAL',
      fiscal_year,
      period_start,
      period_end,
      department,
      cost_center_id,
      project_id,
      currency = 'ZAR',
      notes,
      lines = []
    } = req.body;

    if (!budget_code || !budget_name || !fiscal_year || !period_start || !period_end) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    await client.query('BEGIN');

    // Insert budget header
    const budgetResult = await client.query(
      `INSERT INTO budgets (
        tenant_id, scenario_id, budget_code, budget_name, description, budget_type,
        fiscal_year, period_start, period_end, department, cost_center_id,
        project_id, currency, created_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        tenantId, scenario_id, budget_code, budget_name, description, budget_type,
        fiscal_year, period_start, period_end, department, cost_center_id,
        project_id, currency, userId, notes
      ]
    );

    const budget = budgetResult.rows[0];
    const budgetId = budget.id;

    // Insert budget lines
    const insertedLines = [];
    for (const line of lines) {
      const lineResult = await client.query(
        `INSERT INTO budget_lines (
          budget_id, account_code, account_name, line_description,
          period_type, month_1, month_2, month_3, month_4, month_5, month_6,
          month_7, month_8, month_9, month_10, month_11, month_12,
          allocation_method, is_recurring, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING *`,
        [
          budgetId,
          line.account_code,
          line.account_name,
          line.line_description || null,
          line.period_type || 'MONTHLY',
          line.month_1 || 0, line.month_2 || 0, line.month_3 || 0, line.month_4 || 0,
          line.month_5 || 0, line.month_6 || 0, line.month_7 || 0, line.month_8 || 0,
          line.month_9 || 0, line.month_10 || 0, line.month_11 || 0, line.month_12 || 0,
          line.allocation_method || 'MANUAL',
          line.is_recurring || false,
          line.notes || null
        ]
      );
      insertedLines.push(lineResult.rows[0]);
    }

    // Update budget total
    const total = insertedLines.reduce((sum, line) => sum + parseFloat(line.annual_total || 0), 0);
    await client.query(
      `UPDATE budgets SET total_budget_amount = $1 WHERE id = $2`,
      [total, budgetId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      budget: {
        ...budget,
        total_budget_amount: total,
        lines: insertedLines
      }
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating budget:', error);
    res.status(error.message === 'Tenant context required' ? 401 : 500).json({
      success: false,
      message: 'Failed to create budget',
      error: error.message
    });
  } finally {
    client.release();
  }
}

/**
 * PUT /api/v2/financial/forecasting/budgets/:id
 * Update an existing budget
 */
export async function updateBudget(req: TenantRequest, res: Response): Promise<void> {
  const client = await pool.connect();

  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const { budget_name, description, department, status, notes, lines } = req.body;

    await client.query('BEGIN');

    // Verify budget belongs to tenant
    const checkResult = await client.query(
      `SELECT id FROM budgets WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Budget not found' });
      return;
    }

    // Update budget header
    await client.query(
      `UPDATE budgets SET
        budget_name = COALESCE($3, budget_name),
        description = COALESCE($4, description),
        department = COALESCE($5, department),
        status = COALESCE($6, status),
        notes = COALESCE($7, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId, budget_name, description, department, status, notes]
    );

    // Update lines if provided
    if (lines && Array.isArray(lines)) {
      for (const line of lines) {
        if (line.id) {
          await client.query(
            `UPDATE budget_lines SET
              account_name = COALESCE($1, account_name),
              line_description = COALESCE($2, line_description),
              month_1 = COALESCE($3, month_1), month_2 = COALESCE($4, month_2),
              month_3 = COALESCE($5, month_3), month_4 = COALESCE($6, month_4),
              month_5 = COALESCE($7, month_5), month_6 = COALESCE($8, month_6),
              month_7 = COALESCE($9, month_7), month_8 = COALESCE($10, month_8),
              month_9 = COALESCE($11, month_9), month_10 = COALESCE($12, month_10),
              month_11 = COALESCE($13, month_11), month_12 = COALESCE($14, month_12),
              notes = COALESCE($15, notes),
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $16 AND budget_id = $17`,
            [
              line.account_name, line.line_description,
              line.month_1, line.month_2, line.month_3, line.month_4,
              line.month_5, line.month_6, line.month_7, line.month_8,
              line.month_9, line.month_10, line.month_11, line.month_12,
              line.notes, line.id, id
            ]
          );
        }
      }

      // Recalculate budget total
      const totalResult = await client.query(
        `SELECT COALESCE(SUM(annual_total), 0) as total FROM budget_lines WHERE budget_id = $1`,
        [id]
      );
      await client.query(
        `UPDATE budgets SET total_budget_amount = $1 WHERE id = $2`,
        [totalResult.rows[0].total, id]
      );
    }

    await client.query('COMMIT');

    // Fetch updated budget
    const result = await query(
      `SELECT b.*, bs.name as scenario_name
       FROM budgets b
       LEFT JOIN budget_scenarios bs ON b.scenario_id = bs.id
       WHERE b.id = $1 AND b.tenant_id = $2`,
      [id, tenantId]
    );

    res.json({
      success: true,
      message: 'Budget updated successfully',
      budget: result.rows[0]
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error updating budget:', error);
    res.status(error.message === 'Tenant context required' ? 401 : 500).json({
      success: false,
      message: 'Failed to update budget',
      error: error.message
    });
  } finally {
    client.release();
  }
}

/**
 * DELETE /api/v2/financial/forecasting/budgets/:id
 * Delete a budget
 */
export async function deleteBudget(req: TenantRequest, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    // Check if budget can be deleted
    const checkResult = await query(
      `SELECT status FROM budgets WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (checkResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Budget not found' });
      return;
    }

    const status = checkResult.rows[0].status;
    if (status === 'ACTIVE' || status === 'APPROVED') {
      res.status(400).json({
        success: false,
        message: `Cannot delete ${status.toLowerCase()} budget. Please set status to DRAFT first.`
      });
      return;
    }

    await query(`DELETE FROM budgets WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);

    res.json({ success: true, message: 'Budget deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting budget:', error);
    res.status(error.message === 'Tenant context required' ? 401 : 500).json({
      success: false,
      message: 'Failed to delete budget',
      error: error.message
    });
  }
}

// =============================================================================
// BUDGET VS ACTUAL ANALYSIS
// =============================================================================

/**
 * GET /api/v2/financial/forecasting/budgets/:budget_id/vs-actual
 * Get budget vs actual comparison
 */
export async function getBudgetVsActual(req: TenantRequest, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { budget_id } = req.params;

    // Get budget with lines
    const budgetResult = await query(
      `SELECT b.*, bs.name as scenario_name
       FROM budgets b
       LEFT JOIN budget_scenarios bs ON b.scenario_id = bs.id
       WHERE b.id = $1 AND b.tenant_id = $2`,
      [budget_id, tenantId]
    );

    if (budgetResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Budget not found' });
      return;
    }

    const budget = budgetResult.rows[0];

    // Get budget lines with actuals
    const linesQuery = `
      SELECT 
        bl.*,
        COALESCE(
          (SELECT SUM(CASE 
            WHEN jel.debit_amount > 0 THEN jel.debit_amount 
            ELSE -jel.credit_amount 
          END)
          FROM journal_entry_lines jel
          JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
          WHERE jel.account_code = bl.account_code
            AND je.tenant_id = $3
            AND je.status = 'POSTED'
            AND je.posting_date BETWEEN $2 AND $4
          ), 0
        ) as actual_ytd
      FROM budget_lines bl
      WHERE bl.budget_id = $1
      ORDER BY bl.account_code
    `;

    const linesResult = await query(linesQuery, [
      budget_id,
      budget.period_start,
      tenantId,
      budget.period_end
    ]);

    // Calculate variances
    const lines = linesResult.rows.map((line: any) => {
      const budgetedAmount = parseFloat(line.annual_total || 0);
      const actualAmount = parseFloat(line.actual_ytd || 0);
      const variance = actualAmount - budgetedAmount;
      const variancePercentage = budgetedAmount !== 0
        ? (variance / budgetedAmount) * 100
        : 0;

      return {
        ...line,
        actual_ytd: actualAmount,
        variance_ytd: variance,
        variance_percentage: variancePercentage,
        variance_status: variance > 0 ? 'OVER_BUDGET' : variance < 0 ? 'UNDER_BUDGET' : 'ON_BUDGET',
        variance_severity: Math.abs(variancePercentage) > 20 ? 'CRITICAL' : 
                          Math.abs(variancePercentage) > 10 ? 'WARNING' : 'NORMAL'
      };
    });

    // Calculate totals
    const totalBudgeted = lines.reduce((sum: number, line: any) => sum + parseFloat(line.annual_total || 0), 0);
    const totalActual = lines.reduce((sum: number, line: any) => sum + parseFloat(line.actual_ytd || 0), 0);
    const totalVariance = totalActual - totalBudgeted;
    const totalVariancePercentage = totalBudgeted !== 0 ? (totalVariance / totalBudgeted) * 100 : 0;

    res.json({
      success: true,
      budget: {
        ...budget,
        total_budgeted: totalBudgeted,
        total_actual: totalActual,
        total_variance: totalVariance,
        total_variance_percentage: totalVariancePercentage
      },
      lines,
      summary: {
        total_lines: lines.length,
        over_budget_count: lines.filter((l: any) => l.variance_status === 'OVER_BUDGET').length,
        under_budget_count: lines.filter((l: any) => l.variance_status === 'UNDER_BUDGET').length,
        on_budget_count: lines.filter((l: any) => l.variance_status === 'ON_BUDGET').length,
        critical_count: lines.filter((l: any) => l.variance_severity === 'CRITICAL').length,
        warning_count: lines.filter((l: any) => l.variance_severity === 'WARNING').length
      }
    });

  } catch (error: any) {
    console.error('Error fetching budget vs actual:', error);
    res.status(error.message === 'Tenant context required' ? 401 : 500).json({
      success: false,
      message: 'Failed to fetch budget vs actual comparison',
      error: error.message
    });
  }
}

/**
 * GET /api/v2/financial/forecasting/variance-analysis
 * Get variance analysis
 */
export async function getVarianceAnalysis(req: TenantRequest, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { severity, status, budget_id } = req.query;

    let queryText = `
      SELECT va.* FROM variance_analysis va
      JOIN budgets b ON va.budget_id = b.id
      WHERE b.tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramCount = 2;

    if (severity) {
      queryText += ` AND va.variance_severity = $${paramCount}`;
      params.push(severity);
      paramCount++;
    }

    if (status) {
      queryText += ` AND va.variance_status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (budget_id) {
      queryText += ` AND va.budget_id = $${paramCount}`;
      params.push(budget_id);
      paramCount++;
    }

    queryText += ` ORDER BY ABS(va.variance_percentage) DESC`;

    const result = await query(queryText, params);

    res.json({
      success: true,
      count: result.rows.length,
      variances: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching variance analysis:', error);
    res.status(error.message === 'Tenant context required' ? 401 : 500).json({
      success: false,
      message: 'Failed to fetch variance analysis',
      error: error.message
    });
  }
}

// =============================================================================
// FORECASTING
// =============================================================================

/**
 * POST /api/v2/financial/forecasting/generate
 * Generate forecast for an account using linear regression
 */
export async function generateForecast(req: TenantRequest, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const {
      account_code,
      historical_months = 12,
      forecast_months = 6,
      model_type = 'LINEAR'
    } = req.body;

    if (!account_code) {
      res.status(400).json({ success: false, message: 'Account code is required' });
      return;
    }

    // Get historical data (tenant-scoped)
    const historicalData = await query(
      `SELECT 
        EXTRACT(YEAR FROM je.posting_date) as year,
        EXTRACT(MONTH FROM je.posting_date) as month,
        SUM(CASE 
          WHEN jel.debit_amount > 0 THEN jel.debit_amount 
          ELSE -jel.credit_amount 
        END) as amount
      FROM journal_entry_lines jel
      JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
      WHERE jel.account_code = $1
        AND je.tenant_id = $2
        AND je.status = 'POSTED'
        AND je.posting_date >= CURRENT_DATE - INTERVAL '${parseInt(String(historical_months))} months'
      GROUP BY EXTRACT(YEAR FROM je.posting_date), EXTRACT(MONTH FROM je.posting_date)
      ORDER BY year, month`,
      [account_code, tenantId]
    );

    if (historicalData.rows.length < 3) {
      res.status(400).json({
        success: false,
        message: 'Insufficient historical data for forecasting (minimum 3 months required)'
      });
      return;
    }

    // Simple linear regression
    const data = historicalData.rows;
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    data.forEach((point: any, index: number) => {
      const x = index;
      const y = parseFloat(point.amount);
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate forecasts
    const forecasts = [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < forecast_months; i++) {
      const x = n + i;
      const predictedValue = slope * x + intercept;
      const forecastMonth = ((currentMonth + i) % 12) + 1;
      const forecastYear = currentYear + Math.floor((currentMonth + i) / 12);
      
      forecasts.push({
        period: i + 1,
        month: forecastMonth,
        year: forecastYear,
        predicted_value: Math.round(predictedValue * 100) / 100,
        model_type
      });
    }

    res.json({
      success: true,
      account_code,
      historical_months: n,
      forecast_months,
      model_type,
      model_parameters: {
        slope: Math.round(slope * 100) / 100,
        intercept: Math.round(intercept * 100) / 100
      },
      historical_data: data.map((d: any) => ({
        year: d.year,
        month: d.month,
        amount: parseFloat(d.amount)
      })),
      forecasts
    });

  } catch (error: any) {
    console.error('Error generating forecast:', error);
    res.status(error.message === 'Tenant context required' ? 401 : 500).json({
      success: false,
      message: 'Failed to generate forecast',
      error: error.message
    });
  }
}

// =============================================================================
// DASHBOARD
// =============================================================================

/**
 * GET /api/v2/financial/forecasting/dashboard
 * Get dashboard summary for budget performance
 */
export async function getBudgetDashboard(req: TenantRequest, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { fiscal_year } = req.query;
    const year = fiscal_year || new Date().getFullYear();

    // Get budget summary statistics
    const summaryResult = await query(`
      SELECT 
        COUNT(DISTINCT id) as total_budgets,
        COUNT(DISTINCT CASE WHEN status = 'ACTIVE' THEN id END) as active_budgets,
        COALESCE(SUM(total_budget_amount), 0) as total_budgeted,
        COALESCE(SUM(total_actual_amount), 0) as total_actual,
        COALESCE(SUM(total_variance), 0) as total_variance
      FROM budgets
      WHERE tenant_id = $1 AND fiscal_year = $2
    `, [tenantId, year]);

    // Get variance breakdown
    const varianceResult = await query(`
      SELECT 
        va.variance_severity,
        COUNT(*) as count,
        COALESCE(SUM(va.variance_amount), 0) as total_variance
      FROM variance_analysis va
      JOIN budgets b ON va.budget_id = b.id
      WHERE b.tenant_id = $1
      GROUP BY va.variance_severity
    `, [tenantId]);

    // Get top variances
    const topVariancesResult = await query(`
      SELECT va.* FROM variance_analysis va
      JOIN budgets b ON va.budget_id = b.id
      WHERE b.tenant_id = $1
      ORDER BY ABS(va.variance_percentage) DESC
      LIMIT 10
    `, [tenantId]);

    // Get budget status counts
    const statusResult = await query(`
      SELECT status, COUNT(*) as count
      FROM budgets
      WHERE tenant_id = $1 AND fiscal_year = $2
      GROUP BY status
    `, [tenantId, year]);

    res.json({
      success: true,
      fiscal_year: year,
      summary: summaryResult.rows[0],
      variance_breakdown: varianceResult.rows,
      top_variances: topVariancesResult.rows,
      status_breakdown: statusResult.rows
    });

  } catch (error: any) {
    console.error('Error fetching budget dashboard:', error);
    res.status(error.message === 'Tenant context required' ? 401 : 500).json({
      success: false,
      message: 'Failed to fetch budget dashboard',
      error: error.message
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // Scenarios
  getBudgetScenarios,
  createBudgetScenario,
  getBudgetScenario,
  updateBudgetScenario,
  deleteBudgetScenario,
  
  // Budgets
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  
  // Analysis
  getBudgetVsActual,
  getVarianceAnalysis,
  
  // Forecasting
  generateForecast,
  
  // Dashboard
  getBudgetDashboard
};
