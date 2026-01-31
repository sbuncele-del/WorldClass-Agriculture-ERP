/**
 * Forecasting Controller V2
 * Tenant-hardened API for financial forecasting and budgeting
 * 
 * Features:
 * - Budget scenarios
 * - Budgets with monthly line items
 * - Budget vs Actual variance
 * - Financial forecasting
 */

import { Response } from 'express';
import { TenantRequest } from '../types';
import { pool } from '../config/database';

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
// BUDGET SCENARIOS
// ============================================================================

/**
 * Get all budget scenarios
 */
export const getBudgetScenarios = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    const result = await pool.query(
      `SELECT * FROM budget_scenarios 
       WHERE tenant_id = $1 
       ORDER BY is_active DESC, created_at DESC`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get budget scenarios error:', error);
    res.status(500).json({ success: false, error: 'Failed to get budget scenarios' });
  }
};

/**
 * Create budget scenario
 */
export const createBudgetScenario = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { name, description, fiscalYear, isActive } = req.body;

    if (!name || !fiscalYear) {
      return res.status(400).json({ success: false, error: 'Name and fiscal year are required' });
    }

    // If setting as active, deactivate other scenarios for same year
    if (isActive) {
      await pool.query(
        `UPDATE budget_scenarios SET is_active = false 
         WHERE tenant_id = $1 AND fiscal_year = $2`,
        [tenantId, fiscalYear]
      );
    }

    const result = await pool.query(
      `INSERT INTO budget_scenarios 
        (tenant_id, name, description, fiscal_year, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [tenantId, name, description, fiscalYear, isActive || false, userId]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Budget scenario created'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Create budget scenario error:', error);
    res.status(500).json({ success: false, error: 'Failed to create budget scenario' });
  }
};

/**
 * Update budget scenario
 */
export const updateBudgetScenario = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    // Verify ownership
    const existing = await pool.query(
      `SELECT * FROM budget_scenarios WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Budget scenario not found' });
    }

    // If setting as active, deactivate other scenarios
    if (isActive) {
      await pool.query(
        `UPDATE budget_scenarios SET is_active = false 
         WHERE tenant_id = $1 AND fiscal_year = $2 AND id != $3`,
        [tenantId, existing.rows[0].fiscal_year, id]
      );
    }

    const result = await pool.query(
      `UPDATE budget_scenarios SET
        name = COALESCE($3, name),
        description = COALESCE($4, description),
        is_active = COALESCE($5, is_active),
        updated_by = $6,
        updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [id, tenantId, name, description, isActive, userId]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Budget scenario updated'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update budget scenario error:', error);
    res.status(500).json({ success: false, error: 'Failed to update budget scenario' });
  }
};

/**
 * Delete budget scenario
 */
export const deleteBudgetScenario = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    // Check for associated budgets
    const budgetCheck = await pool.query(
      `SELECT id FROM budgets WHERE scenario_id = $1 AND tenant_id = $2 LIMIT 1`,
      [id, tenantId]
    );

    if (budgetCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete scenario with associated budgets'
      });
    }

    const result = await pool.query(
      `DELETE FROM budget_scenarios WHERE id = $1 AND tenant_id = $2 RETURNING id`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Budget scenario not found' });
    }

    res.json({
      success: true,
      message: 'Budget scenario deleted'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Delete budget scenario error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete budget scenario' });
  }
};

// ============================================================================
// BUDGETS
// ============================================================================

/**
 * Get budgets for a scenario
 */
export const getBudgets = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { scenarioId } = req.query;

    let query = `
      SELECT 
        b.*,
        bs.name as scenario_name,
        a.account_number,
        a.account_name,
        d.name as department_name
      FROM budgets b
      JOIN budget_scenarios bs ON b.scenario_id = bs.id
      LEFT JOIN accounts a ON b.account_id = a.id
      LEFT JOIN departments d ON b.department_id = d.id
      WHERE b.tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (scenarioId) {
      query += ` AND b.scenario_id = $2`;
      params.push(scenarioId);
    }

    query += ` ORDER BY a.account_number, d.name`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get budgets error:', error);
    res.status(500).json({ success: false, error: 'Failed to get budgets' });
  }
};

/**
 * Get budget by ID with monthly lines
 */
export const getBudgetById = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    // Get budget
    const budgetResult = await pool.query(
      `SELECT 
        b.*,
        bs.name as scenario_name,
        a.account_number,
        a.account_name,
        d.name as department_name
       FROM budgets b
       JOIN budget_scenarios bs ON b.scenario_id = bs.id
       LEFT JOIN accounts a ON b.account_id = a.id
       LEFT JOIN departments d ON b.department_id = d.id
       WHERE b.id = $1 AND b.tenant_id = $2`,
      [id, tenantId]
    );

    if (budgetResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Budget not found' });
    }

    // Get monthly lines
    const linesResult = await pool.query(
      `SELECT * FROM budget_lines 
       WHERE budget_id = $1 
       ORDER BY period_month`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...budgetResult.rows[0],
        lines: linesResult.rows
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get budget by ID error:', error);
    res.status(500).json({ success: false, error: 'Failed to get budget' });
  }
};

/**
 * Create budget with monthly lines
 */
export const createBudget = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { scenarioId, accountId, departmentId, description, monthlyAmounts } = req.body;

    if (!scenarioId || !accountId) {
      return res.status(400).json({ success: false, error: 'Scenario ID and Account ID are required' });
    }

    // Verify scenario belongs to tenant
    const scenarioCheck = await pool.query(
      `SELECT id FROM budget_scenarios WHERE id = $1 AND tenant_id = $2`,
      [scenarioId, tenantId]
    );

    if (scenarioCheck.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Budget scenario not found' });
    }

    // Verify account belongs to tenant
    const accountCheck = await pool.query(
      `SELECT id FROM accounts WHERE id = $1 AND tenant_id = $2`,
      [accountId, tenantId]
    );

    if (accountCheck.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Account not found' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Calculate annual total
      const annualAmount = monthlyAmounts?.reduce((sum: number, val: number) => sum + (val || 0), 0) || 0;

      // Create budget
      const budgetResult = await client.query(
        `INSERT INTO budgets 
          (tenant_id, scenario_id, account_id, department_id, description, annual_amount, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [tenantId, scenarioId, accountId, departmentId, description, annualAmount, userId]
      );

      const budgetId = budgetResult.rows[0].id;

      // Create monthly lines (12 months)
      if (monthlyAmounts && Array.isArray(monthlyAmounts)) {
        for (let month = 1; month <= 12; month++) {
          const amount = monthlyAmounts[month - 1] || 0;
          await client.query(
            `INSERT INTO budget_lines 
              (budget_id, period_month, amount)
             VALUES ($1, $2, $3)`,
            [budgetId, month, amount]
          );
        }
      }

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        data: budgetResult.rows[0],
        message: 'Budget created'
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Create budget error:', error);
    res.status(500).json({ success: false, error: 'Failed to create budget' });
  }
};

/**
 * Update budget
 */
export const updateBudget = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;
    const { description, monthlyAmounts } = req.body;

    // Verify ownership
    const existing = await pool.query(
      `SELECT * FROM budgets WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Budget not found' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update budget
      let annualAmount = existing.rows[0].annual_amount;
      if (monthlyAmounts && Array.isArray(monthlyAmounts)) {
        annualAmount = monthlyAmounts.reduce((sum: number, val: number) => sum + (val || 0), 0);
      }

      await client.query(
        `UPDATE budgets SET
          description = COALESCE($3, description),
          annual_amount = $4,
          updated_by = $5,
          updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId, description, annualAmount, userId]
      );

      // Update monthly lines if provided
      if (monthlyAmounts && Array.isArray(monthlyAmounts)) {
        for (let month = 1; month <= 12; month++) {
          const amount = monthlyAmounts[month - 1] || 0;
          await client.query(
            `INSERT INTO budget_lines (budget_id, period_month, amount)
             VALUES ($1, $2, $3)
             ON CONFLICT (budget_id, period_month) DO UPDATE SET amount = $3`,
            [id, month, amount]
          );
        }
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Budget updated'
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update budget error:', error);
    res.status(500).json({ success: false, error: 'Failed to update budget' });
  }
};

/**
 * Delete budget
 */
export const deleteBudget = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete lines first
      await client.query(`DELETE FROM budget_lines WHERE budget_id = $1`, [id]);

      // Delete budget
      const result = await client.query(
        `DELETE FROM budgets WHERE id = $1 AND tenant_id = $2 RETURNING id`,
        [id, tenantId]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Budget not found' });
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Budget deleted'
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Delete budget error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete budget' });
  }
};

// ============================================================================
// BUDGET VS ACTUAL
// ============================================================================

/**
 * Get budget vs actual variance
 */
export const getBudgetVsActual = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { scenarioId, startDate, endDate, departmentId } = req.query;

    if (!scenarioId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Scenario ID, start date, and end date are required'
      });
    }

    let query = `
      WITH budget_data AS (
        SELECT 
          b.account_id,
          a.account_number,
          a.account_name,
          a.account_type,
          COALESCE(SUM(bl.amount), 0) as budget_amount
        FROM budgets b
        JOIN accounts a ON b.account_id = a.id
        LEFT JOIN budget_lines bl ON b.id = bl.budget_id 
          AND bl.period_month >= EXTRACT(MONTH FROM $3::date)
          AND bl.period_month <= EXTRACT(MONTH FROM $4::date)
        WHERE b.tenant_id = $1 
          AND b.scenario_id = $2
    `;
    const params: any[] = [tenantId, scenarioId, startDate, endDate];
    let paramIndex = 5;

    if (departmentId) {
      query += ` AND b.department_id = $${paramIndex}`;
      params.push(departmentId);
      paramIndex++;
    }

    query += `
        GROUP BY b.account_id, a.account_number, a.account_name, a.account_type
      ),
      actual_data AS (
        SELECT 
          gl.account_id,
          COALESCE(SUM(gl.debit - gl.credit), 0) as actual_amount
        FROM general_ledger gl
        WHERE gl.tenant_id = $1
          AND gl.transaction_date >= $3::date
          AND gl.transaction_date <= $4::date
        GROUP BY gl.account_id
      )
      SELECT 
        bd.account_number,
        bd.account_name,
        bd.account_type,
        bd.budget_amount,
        COALESCE(ad.actual_amount, 0) as actual_amount,
        (COALESCE(ad.actual_amount, 0) - bd.budget_amount) as variance_amount,
        CASE WHEN bd.budget_amount = 0 THEN 0 
             ELSE ROUND(((COALESCE(ad.actual_amount, 0) - bd.budget_amount) / bd.budget_amount * 100)::numeric, 2)
        END as variance_percent
      FROM budget_data bd
      LEFT JOIN actual_data ad ON bd.account_id = ad.account_id
      ORDER BY bd.account_number
    `;

    const result = await pool.query(query, params);

    // Calculate totals
    const totals = result.rows.reduce((acc, row) => ({
      budgetTotal: acc.budgetTotal + Number(row.budget_amount),
      actualTotal: acc.actualTotal + Number(row.actual_amount),
      varianceTotal: acc.varianceTotal + Number(row.variance_amount)
    }), { budgetTotal: 0, actualTotal: 0, varianceTotal: 0 });

    res.json({
      success: true,
      data: {
        lines: result.rows,
        totals,
        variancePercent: totals.budgetTotal === 0 ? 0 : 
          Math.round((totals.varianceTotal / totals.budgetTotal * 100) * 100) / 100
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get budget vs actual error:', error);
    res.status(500).json({ success: false, error: 'Failed to get budget vs actual' });
  }
};

/**
 * Get variance analysis by department
 */
export const getVarianceByDepartment = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { scenarioId, startDate, endDate } = req.query;

    if (!scenarioId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Scenario ID, start date, and end date are required'
      });
    }

    const result = await pool.query(
      `WITH budget_by_dept AS (
        SELECT 
          b.department_id,
          d.name as department_name,
          COALESCE(SUM(bl.amount), 0) as budget_amount
        FROM budgets b
        LEFT JOIN departments d ON b.department_id = d.id
        LEFT JOIN budget_lines bl ON b.id = bl.budget_id 
          AND bl.period_month >= EXTRACT(MONTH FROM $3::date)
          AND bl.period_month <= EXTRACT(MONTH FROM $4::date)
        WHERE b.tenant_id = $1 AND b.scenario_id = $2
        GROUP BY b.department_id, d.name
      ),
      actual_by_dept AS (
        SELECT 
          gl.department_id,
          COALESCE(SUM(gl.debit - gl.credit), 0) as actual_amount
        FROM general_ledger gl
        WHERE gl.tenant_id = $1
          AND gl.transaction_date >= $3::date
          AND gl.transaction_date <= $4::date
        GROUP BY gl.department_id
      )
      SELECT 
        COALESCE(bd.department_name, 'Unassigned') as department_name,
        bd.budget_amount,
        COALESCE(ad.actual_amount, 0) as actual_amount,
        (COALESCE(ad.actual_amount, 0) - bd.budget_amount) as variance_amount,
        CASE WHEN bd.budget_amount = 0 THEN 0 
             ELSE ROUND(((COALESCE(ad.actual_amount, 0) - bd.budget_amount) / bd.budget_amount * 100)::numeric, 2)
        END as variance_percent
      FROM budget_by_dept bd
      LEFT JOIN actual_by_dept ad ON bd.department_id = ad.department_id
      ORDER BY bd.department_name`,
      [tenantId, scenarioId, startDate, endDate]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get variance by department error:', error);
    res.status(500).json({ success: false, error: 'Failed to get variance by department' });
  }
};

/**
 * Get monthly trend comparison
 */
export const getMonthlyTrend = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { scenarioId, year, accountId } = req.query;

    if (!scenarioId || !year) {
      return res.status(400).json({
        success: false,
        error: 'Scenario ID and year are required'
      });
    }

    let budgetQuery = `
      SELECT 
        bl.period_month,
        SUM(bl.amount) as budget_amount
      FROM budget_lines bl
      JOIN budgets b ON bl.budget_id = b.id
      WHERE b.tenant_id = $1 AND b.scenario_id = $2
    `;
    const budgetParams: any[] = [tenantId, scenarioId];

    if (accountId) {
      budgetQuery += ` AND b.account_id = $3`;
      budgetParams.push(accountId);
    }

    budgetQuery += ` GROUP BY bl.period_month ORDER BY bl.period_month`;

    let actualQuery = `
      SELECT 
        EXTRACT(MONTH FROM gl.transaction_date)::int as period_month,
        SUM(gl.debit - gl.credit) as actual_amount
      FROM general_ledger gl
      WHERE gl.tenant_id = $1
        AND EXTRACT(YEAR FROM gl.transaction_date) = $2
    `;
    const actualParams: any[] = [tenantId, year];

    if (accountId) {
      actualQuery += ` AND gl.account_id = $3`;
      actualParams.push(accountId);
    }

    actualQuery += ` GROUP BY EXTRACT(MONTH FROM gl.transaction_date) ORDER BY period_month`;

    const [budgetResult, actualResult] = await Promise.all([
      pool.query(budgetQuery, budgetParams),
      pool.query(actualQuery, actualParams)
    ]);

    // Combine results
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const budgetMap = new Map(budgetResult.rows.map(r => [r.period_month, Number(r.budget_amount)]));
    const actualMap = new Map(actualResult.rows.map(r => [r.period_month, Number(r.actual_amount)]));

    const trend = months.map(month => ({
      month,
      budget: budgetMap.get(month) || 0,
      actual: actualMap.get(month) || 0,
      variance: (actualMap.get(month) || 0) - (budgetMap.get(month) || 0)
    }));

    res.json({
      success: true,
      data: trend
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get monthly trend error:', error);
    res.status(500).json({ success: false, error: 'Failed to get monthly trend' });
  }
};

export default {
  getBudgetScenarios,
  createBudgetScenario,
  updateBudgetScenario,
  deleteBudgetScenario,
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetVsActual,
  getVarianceByDepartment,
  getMonthlyTrend
};
