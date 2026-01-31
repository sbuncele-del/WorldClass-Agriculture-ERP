/**
 * Treasury Management Controller V2
 * 
 * Cash management and treasury operations:
 * - Treasury accounts & cash position
 * - Cash forecasting
 * - Investments & returns tracking
 * - FX rates
 * - Payment orders
 * - Liquidity metrics
 */

import { Request, Response } from 'express';
import { pool } from '../../config/database';

// Tenant-aware request type
interface TenantRequest extends Request {
  tenant?: { id: string };
  user?: { id: string; email: string; role: string; permissions: string[]; first_name?: string; last_name?: string };
}

// Extract tenant context with validation
function getTenantContext(req: TenantRequest): { tenantId: string; userId: string } {
  const tenantId = req.tenant?.id;
  const userId = req.user?.id;
  if (!tenantId) throw new Error('Tenant context required');
  if (!userId) throw new Error('User context required');
  return { tenantId, userId };
}

// ============================================================================
// TREASURY ACCOUNTS
// ============================================================================

/**
 * Get treasury accounts
 * GET /api/v2/treasury/accounts
 */
export async function getTreasuryAccounts(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);

    const query = `
      SELECT * FROM treasury_accounts
      WHERE tenant_id = $1 AND is_active = true
      ORDER BY account_type, account_name
    `;

    const result = await pool.query(query, [tenantId]);

    res.json({
      success: true,
      data: {
        accounts: result.rows,
        total: result.rows.length
      }
    });
  } catch (error: any) {
    console.error('[Treasury V2] Get accounts error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch treasury accounts' });
  }
}

/**
 * Get cash position
 * GET /api/v2/treasury/cash-position
 */
export async function getCashPosition(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);

    const query = `
      SELECT 
        SUM(current_balance) as total_cash,
        COUNT(*) as account_count,
        currency
      FROM treasury_accounts
      WHERE tenant_id = $1 AND is_active = true
      GROUP BY currency
    `;

    const result = await pool.query(query, [tenantId]);

    res.json({
      success: true,
      data: { positions: result.rows }
    });
  } catch (error: any) {
    console.error('[Treasury V2] Get cash position error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch cash position' });
  }
}

// ============================================================================
// CASH FORECASTING
// ============================================================================

/**
 * Get cash forecasts
 * GET /api/v2/treasury/forecasts
 */
export async function getCashForecasts(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { startDate, endDate } = req.query;

    const whereConditions = ['tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (startDate) {
      whereConditions.push(`forecast_date >= $${paramIndex++}`);
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push(`forecast_date <= $${paramIndex++}`);
      params.push(endDate);
    }

    const query = `
      SELECT * FROM cash_forecasts
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY forecast_date DESC
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        forecasts: result.rows,
        total: result.rows.length
      }
    });
  } catch (error: any) {
    console.error('[Treasury V2] Get forecasts error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch forecasts' });
  }
}

/**
 * Create cash forecast
 * POST /api/v2/treasury/forecasts
 */
export async function createCashForecast(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { forecastDate, forecastPeriod, openingBalance, projectedInflows, projectedOutflows } = req.body;

    const projectedBalance = parseFloat(openingBalance) + parseFloat(projectedInflows || 0) - parseFloat(projectedOutflows || 0);

    const query = `
      INSERT INTO cash_forecasts (
        tenant_id, forecast_date, forecast_period, opening_balance,
        projected_inflows, projected_outflows, projected_balance
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      tenantId, forecastDate, forecastPeriod, openingBalance,
      projectedInflows, projectedOutflows, projectedBalance
    ]);

    res.status(201).json({
      success: true,
      data: { forecast: result.rows[0] }
    });
  } catch (error: any) {
    console.error('[Treasury V2] Create forecast error:', error);
    res.status(500).json({ success: false, error: 'Failed to create forecast' });
  }
}

// ============================================================================
// INVESTMENTS
// ============================================================================

/**
 * Get investments
 * GET /api/v2/treasury/investments
 */
export async function getInvestments(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);

    const query = `
      SELECT 
        i.*,
        COALESCE(SUM(ir.return_amount), 0) as total_returns
      FROM investments i
      LEFT JOIN investment_returns ir ON i.investment_id = ir.investment_id
      WHERE i.tenant_id = $1
      GROUP BY i.investment_id
      ORDER BY i.start_date DESC
    `;

    const result = await pool.query(query, [tenantId]);

    res.json({
      success: true,
      data: {
        investments: result.rows,
        total: result.rows.length
      }
    });
  } catch (error: any) {
    console.error('[Treasury V2] Get investments error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch investments' });
  }
}

/**
 * Create investment
 * POST /api/v2/treasury/investments
 */
export async function createInvestment(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const {
      investmentCode, investmentName, investmentType, provider,
      principalAmount, currency, interestRate, startDate, maturityDate
    } = req.body;

    const query = `
      INSERT INTO investments (
        tenant_id, investment_code, investment_name, investment_type,
        provider, principal_amount, currency, interest_rate, start_date,
        maturity_date, current_value
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await pool.query(query, [
      tenantId, investmentCode, investmentName, investmentType,
      provider, principalAmount, currency, interestRate, startDate,
      maturityDate, principalAmount
    ]);

    res.status(201).json({
      success: true,
      data: { investment: result.rows[0] }
    });
  } catch (error: any) {
    console.error('[Treasury V2] Create investment error:', error);
    res.status(500).json({ success: false, error: 'Failed to create investment' });
  }
}

// ============================================================================
// TREASURY TRANSACTIONS
// ============================================================================

/**
 * Get treasury transactions
 * GET /api/v2/treasury/transactions
 */
export async function getTreasuryTransactions(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { accountId, startDate, endDate, limit = '100', offset = '0' } = req.query;

    const whereConditions = ['tt.tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (accountId) {
      whereConditions.push(`tt.account_id = $${paramIndex++}`);
      params.push(accountId);
    }

    if (startDate) {
      whereConditions.push(`tt.transaction_date >= $${paramIndex++}`);
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push(`tt.transaction_date <= $${paramIndex++}`);
      params.push(endDate);
    }

    const query = `
      SELECT 
        tt.*,
        ta.account_name
      FROM treasury_transactions tt
      JOIN treasury_accounts ta ON tt.account_id = ta.account_id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY tt.transaction_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        transactions: result.rows,
        total: result.rows.length
      }
    });
  } catch (error: any) {
    console.error('[Treasury V2] Get transactions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
}

// ============================================================================
// FX RATES
// ============================================================================

/**
 * Get FX rates
 * GET /api/v2/treasury/fx-rates
 */
export async function getFXRates(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { baseCurrency, targetCurrency } = req.query;

    const whereConditions = ['rate_date = CURRENT_DATE'];
    const params: any[] = [];
    let paramIndex = 1;

    if (baseCurrency) {
      whereConditions.push(`base_currency = $${paramIndex++}`);
      params.push(baseCurrency);
    }

    if (targetCurrency) {
      whereConditions.push(`target_currency = $${paramIndex++}`);
      params.push(targetCurrency);
    }

    const query = `
      SELECT * FROM fx_rates
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY base_currency, target_currency
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        rates: result.rows,
        total: result.rows.length
      }
    });
  } catch (error: any) {
    console.error('[Treasury V2] Get FX rates error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch FX rates' });
  }
}

// ============================================================================
// PAYMENT ORDERS
// ============================================================================

/**
 * Get payment orders
 * GET /api/v2/treasury/payment-orders
 */
export async function getPaymentOrders(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { status } = req.query;

    const whereConditions = ['po.tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (status) {
      whereConditions.push(`po.status = $${paramIndex++}`);
      params.push(status);
    }

    const query = `
      SELECT 
        po.*,
        ta.account_name
      FROM payment_orders po
      JOIN treasury_accounts ta ON po.account_id = ta.account_id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY po.payment_date DESC, po.created_at DESC
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        orders: result.rows,
        total: result.rows.length
      }
    });
  } catch (error: any) {
    console.error('[Treasury V2] Get payment orders error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment orders' });
  }
}

/**
 * Create payment order
 * POST /api/v2/treasury/payment-orders
 */
export async function createPaymentOrder(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const {
      accountId, paymentType, beneficiaryName, beneficiaryAccount,
      amount, currency, paymentDate, reference
    } = req.body;

    const query = `
      INSERT INTO payment_orders (
        tenant_id, account_id, payment_type, beneficiary_name,
        beneficiary_account, amount, currency, payment_date,
        reference, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await pool.query(query, [
      tenantId, accountId, paymentType, beneficiaryName,
      beneficiaryAccount, amount, currency, paymentDate,
      reference, userId
    ]);

    res.status(201).json({
      success: true,
      data: { order: result.rows[0] }
    });
  } catch (error: any) {
    console.error('[Treasury V2] Create payment order error:', error);
    res.status(500).json({ success: false, error: 'Failed to create payment order' });
  }
}

// ============================================================================
// LIQUIDITY METRICS
// ============================================================================

/**
 * Get liquidity metrics
 * GET /api/v2/treasury/liquidity-metrics
 */
export async function getLiquidityMetrics(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);

    const query = `
      SELECT * FROM liquidity_metrics
      WHERE tenant_id = $1
      ORDER BY metric_date DESC
      LIMIT 30
    `;

    const result = await pool.query(query, [tenantId]);

    res.json({
      success: true,
      data: {
        metrics: result.rows,
        total: result.rows.length
      }
    });
  } catch (error: any) {
    console.error('[Treasury V2] Get liquidity metrics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch liquidity metrics' });
  }
}

// ============================================================================
// TREASURY DASHBOARD
// ============================================================================

/**
 * Get treasury dashboard summary
 * GET /api/v2/treasury/dashboard
 */
export async function getTreasuryDashboard(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);

    // Return empty dashboard structure - tables will be created during full implementation
    res.json({
      success: true,
      data: {
        cash: { total_cash: 0, account_count: 0 },
        investments: { total_investment_value: 0, investment_count: 0 },
        pendingPayments: { pending_count: 0, pending_amount: 0 }
      }
    });
  } catch (error: any) {
    console.error('[Treasury V2] Get dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch treasury dashboard' });
  }
}
