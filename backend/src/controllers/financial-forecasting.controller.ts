import { Request, Response } from 'express';
import { query } from '../config/database';

/**
 * Financial Forecasting Controller
 * Handles budgets, budget vs actual analysis, variance reporting, and forecasting models
 */

// ==================== BUDGET SCENARIOS ====================

/**
 * Get all budget scenarios
 */
export async function getBudgetScenarios(req: Request, res: Response) {
  try {
    const { fiscal_year, status, scenario_type } = req.query;

    let queryText = `
      SELECT 
        id, name, description, scenario_type, fiscal_year,
        start_date, end_date, status, is_active,
        created_by, approved_by, approved_at, notes,
        created_at, updated_at
      FROM budget_scenarios
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

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
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget scenarios',
      error: error.message
    });
  }
}

/**
 * Create a new budget scenario
 */
export async function createBudgetScenario(req: Request, res: Response) {
  try {
    const {
      name,
      description,
      scenario_type = 'BASELINE',
      fiscal_year,
      start_date,
      end_date,
      is_active = false,
      created_by,
      notes
    } = req.body;

    // Validation
    if (!name || !fiscal_year || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, fiscal_year, start_date, end_date'
      });
    }

    const result = await query(
      `INSERT INTO budget_scenarios (
        name, description, scenario_type, fiscal_year,
        start_date, end_date, is_active, created_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [name, description, scenario_type, fiscal_year, start_date, end_date, is_active, created_by, notes]
    );

    res.status(201).json({
      success: true,
      message: 'Budget scenario created successfully',
      scenario: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating budget scenario:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create budget scenario',
      error: error.message
    });
  }
}

// ==================== BUDGETS ====================

/**
 * Get all budgets with optional filters
 */
export async function getBudgets(req: Request, res: Response) {
  try {
    const {
      scenario_id,
      fiscal_year,
      department,
      status,
      budget_type
    } = req.query;

    let queryText = `
      SELECT * FROM budget_summary
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (scenario_id) {
      queryText += ` AND id IN (SELECT id FROM budgets WHERE scenario_id = $${paramCount})`;
      params.push(scenario_id);
      paramCount++;
    }

    if (fiscal_year) {
      queryText += ` AND fiscal_year = $${paramCount}`;
      params.push(fiscal_year);
      paramCount++;
    }

    if (department) {
      queryText += ` AND department = $${paramCount}`;
      params.push(department);
      paramCount++;
    }

    if (status) {
      queryText += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    queryText += ` ORDER BY fiscal_year DESC, budget_code ASC`;

    const result = await query(queryText, params);

    res.json({
      success: true,
      count: result.rows.length,
      budgets: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budgets',
      error: error.message
    });
  }
}

/**
 * Get a single budget by ID with all its lines
 */
export async function getBudgetById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Get budget header
    const budgetResult = await query(
      `SELECT b.*, bs.name as scenario_name, bs.scenario_type
       FROM budgets b
       LEFT JOIN budget_scenarios bs ON b.scenario_id = bs.id
       WHERE b.id = $1`,
      [id]
    );

    if (budgetResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Get budget lines
    const linesResult = await query(
      `SELECT * FROM budget_lines
       WHERE budget_id = $1
       ORDER BY account_code ASC`,
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
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget',
      error: error.message
    });
  }
}

/**
 * Create a new budget
 */
export async function createBudget(req: Request, res: Response) {
  try {
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
      created_by,
      notes,
      lines = []
    } = req.body;

    // Validation
    if (!budget_code || !budget_name || !fiscal_year || !period_start || !period_end) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Start transaction
    const client = await (await import('../config/database')).pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert budget header
      const budgetResult = await client.query(
        `INSERT INTO budgets (
          scenario_id, budget_code, budget_name, description, budget_type,
          fiscal_year, period_start, period_end, department, cost_center_id,
          project_id, currency, created_by, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          scenario_id, budget_code, budget_name, description, budget_type,
          fiscal_year, period_start, period_end, department, cost_center_id,
          project_id, currency, created_by, notes
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
            line.month_1 || 0,
            line.month_2 || 0,
            line.month_3 || 0,
            line.month_4 || 0,
            line.month_5 || 0,
            line.month_6 || 0,
            line.month_7 || 0,
            line.month_8 || 0,
            line.month_9 || 0,
            line.month_10 || 0,
            line.month_11 || 0,
            line.month_12 || 0,
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

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Error creating budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create budget',
      error: error.message
    });
  }
}

/**
 * Update an existing budget
 */
export async function updateBudget(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      budget_name,
      description,
      department,
      status,
      notes,
      lines
    } = req.body;

    const client = await (await import('../config/database')).pool.connect();

    try {
      await client.query('BEGIN');

      // Update budget header
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (budget_name) {
        updates.push(`budget_name = $${paramCount}`);
        values.push(budget_name);
        paramCount++;
      }

      if (description !== undefined) {
        updates.push(`description = $${paramCount}`);
        values.push(description);
        paramCount++;
      }

      if (department) {
        updates.push(`department = $${paramCount}`);
        values.push(department);
        paramCount++;
      }

      if (status) {
        updates.push(`status = $${paramCount}`);
        values.push(status);
        paramCount++;
      }

      if (notes !== undefined) {
        updates.push(`notes = $${paramCount}`);
        values.push(notes);
        paramCount++;
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);

      values.push(id);

      if (updates.length > 0) {
        await client.query(
          `UPDATE budgets SET ${updates.join(', ')} WHERE id = $${paramCount}`,
          values
        );
      }

      // Update lines if provided
      if (lines && Array.isArray(lines)) {
        for (const line of lines) {
          if (line.id) {
            // Update existing line
            await client.query(
              `UPDATE budget_lines SET
                account_name = $1,
                line_description = $2,
                month_1 = $3, month_2 = $4, month_3 = $5, month_4 = $6,
                month_5 = $7, month_6 = $8, month_7 = $9, month_8 = $10,
                month_9 = $11, month_10 = $12, month_11 = $13, month_12 = $14,
                notes = $15,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $16 AND budget_id = $17`,
              [
                line.account_name,
                line.line_description,
                line.month_1 || 0, line.month_2 || 0, line.month_3 || 0, line.month_4 || 0,
                line.month_5 || 0, line.month_6 || 0, line.month_7 || 0, line.month_8 || 0,
                line.month_9 || 0, line.month_10 || 0, line.month_11 || 0, line.month_12 || 0,
                line.notes,
                line.id,
                id
              ]
            );
          }
        }

        // Recalculate budget total
        const totalResult = await client.query(
          `SELECT SUM(annual_total) as total FROM budget_lines WHERE budget_id = $1`,
          [id]
        );
        const total = totalResult.rows[0]?.total || 0;

        await client.query(
          `UPDATE budgets SET total_budget_amount = $1 WHERE id = $2`,
          [total, id]
        );
      }

      await client.query('COMMIT');

      // Fetch updated budget
      const result = await query(
        `SELECT b.*, bs.name as scenario_name
         FROM budgets b
         LEFT JOIN budget_scenarios bs ON b.scenario_id = bs.id
         WHERE b.id = $1`,
        [id]
      );

      res.json({
        success: true,
        message: 'Budget updated successfully',
        budget: result.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Error updating budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update budget',
      error: error.message
    });
  }
}

/**
 * Delete a budget
 */
export async function deleteBudget(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Check if budget can be deleted (not ACTIVE or APPROVED)
    const checkResult = await query(
      `SELECT status FROM budgets WHERE id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    const status = checkResult.rows[0].status;
    if (status === 'ACTIVE' || status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete ${status.toLowerCase()} budget. Please set status to DRAFT first.`
      });
    }

    // Delete budget (lines will be cascade deleted)
    await query(`DELETE FROM budgets WHERE id = $1`, [id]);

    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete budget',
      error: error.message
    });
  }
}

// ==================== BUDGET VS ACTUAL ====================

/**
 * Get budget vs actual comparison
 */
export async function getBudgetVsActual(req: Request, res: Response) {
  try {
    const { budget_id } = req.params;
    const { period_month, period_year } = req.query;

    // Get budget with lines
    const budgetResult = await query(
      `SELECT b.*, bs.name as scenario_name
       FROM budgets b
       LEFT JOIN budget_scenarios bs ON b.scenario_id = bs.id
       WHERE b.id = $1`,
      [budget_id]
    );

    if (budgetResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
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
            AND je.status = 'POSTED'
            AND je.posting_date BETWEEN $2 AND $3
          ), 0
        ) as actual_ytd
      FROM budget_lines bl
      WHERE bl.budget_id = $1
      ORDER BY bl.account_code
    `;

    const linesResult = await query(linesQuery, [
      budget_id,
      budget.period_start,
      budget.period_end
    ]);

    // Calculate variances
    const lines = linesResult.rows.map(line => {
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
    const totalBudgeted = lines.reduce((sum, line) => sum + parseFloat(line.annual_total || 0), 0);
    const totalActual = lines.reduce((sum, line) => sum + parseFloat(line.actual_ytd || 0), 0);
    const totalVariance = totalActual - totalBudgeted;
    const totalVariancePercentage = totalBudgeted !== 0
      ? (totalVariance / totalBudgeted) * 100
      : 0;

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
        over_budget_count: lines.filter(l => l.variance_status === 'OVER_BUDGET').length,
        under_budget_count: lines.filter(l => l.variance_status === 'UNDER_BUDGET').length,
        on_budget_count: lines.filter(l => l.variance_status === 'ON_BUDGET').length,
        critical_count: lines.filter(l => l.variance_severity === 'CRITICAL').length,
        warning_count: lines.filter(l => l.variance_severity === 'WARNING').length
      }
    });

  } catch (error: any) {
    console.error('Error fetching budget vs actual:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget vs actual comparison',
      error: error.message
    });
  }
}

/**
 * Get variance analysis (from view)
 */
export async function getVarianceAnalysis(req: Request, res: Response) {
  try {
    const { severity, status, budget_id } = req.query;

    let queryText = `SELECT * FROM variance_analysis WHERE 1=1`;
    const params: any[] = [];
    let paramCount = 1;

    if (severity) {
      queryText += ` AND variance_severity = $${paramCount}`;
      params.push(severity);
      paramCount++;
    }

    if (status) {
      queryText += ` AND variance_status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (budget_id) {
      queryText += ` AND budget_id = $${paramCount}`;
      params.push(budget_id);
      paramCount++;
    }

    queryText += ` ORDER BY ABS(variance_percentage) DESC`;

    const result = await query(queryText, params);

    res.json({
      success: true,
      count: result.rows.length,
      variances: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching variance analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch variance analysis',
      error: error.message
    });
  }
}

// ==================== FORECASTING ====================

/**
 * Generate forecast for an account (simple linear projection)
 */
export async function generateForecast(req: Request, res: Response) {
  try {
    const {
      account_code,
      historical_months = 12,
      forecast_months = 6,
      model_type = 'LINEAR'
    } = req.body;

    // Get historical data
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
        AND je.status = 'POSTED'
        AND je.posting_date >= CURRENT_DATE - INTERVAL '${historical_months} months'
      GROUP BY EXTRACT(YEAR FROM je.posting_date), EXTRACT(MONTH FROM je.posting_date)
      ORDER BY year, month`,
      [account_code]
    );

    if (historicalData.rows.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient historical data for forecasting (minimum 3 months required)'
      });
    }

    // Simple linear regression
    const data = historicalData.rows;
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    data.forEach((point, index) => {
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
    for (let i = 0; i < forecast_months; i++) {
      const x = n + i;
      const predictedValue = slope * x + intercept;
      
      forecasts.push({
        month: i + 1,
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
        slope,
        intercept
      },
      forecasts
    });

  } catch (error: any) {
    console.error('Error generating forecast:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate forecast',
      error: error.message
    });
  }
}

/**
 * Get dashboard summary for budget performance
 */
export async function getBudgetDashboard(req: Request, res: Response) {
  try {
    const { fiscal_year } = req.query;

    // Get budget summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT id) as total_budgets,
        COUNT(DISTINCT CASE WHEN status = 'ACTIVE' THEN id END) as active_budgets,
        SUM(total_budget_amount) as total_budgeted,
        SUM(total_actual_amount) as total_actual,
        SUM(total_variance) as total_variance
      FROM budgets
      WHERE fiscal_year = $1
    `;

    const summaryResult = await query(summaryQuery, [fiscal_year || new Date().getFullYear()]);

    // Get variance breakdown
    const varianceQuery = `
      SELECT 
        variance_severity,
        COUNT(*) as count,
        SUM(variance_amount) as total_variance
      FROM variance_analysis
      GROUP BY variance_severity
    `;

    const varianceResult = await query(varianceQuery);

    // Get top variances
    const topVariancesQuery = `
      SELECT * FROM variance_analysis
      ORDER BY ABS(variance_percentage) DESC
      LIMIT 10
    `;

    const topVariancesResult = await query(topVariancesQuery);

    res.json({
      success: true,
      summary: summaryResult.rows[0],
      variance_breakdown: varianceResult.rows,
      top_variances: topVariancesResult.rows
    });

  } catch (error: any) {
    console.error('Error fetching budget dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget dashboard',
      error: error.message
    });
  }
}
