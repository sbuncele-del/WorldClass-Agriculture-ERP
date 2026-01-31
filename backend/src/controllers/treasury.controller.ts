import { Request, Response } from 'express';
import { pool } from '../config/database';

/**
 * Treasury Management Controller
 * 
 * Cash management, investments, and treasury operations
 */

class TreasuryController {

  // ============================================================================
  // TREASURY ACCOUNTS
  // ============================================================================

  async getTreasuryAccounts(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      
      const query = `
        SELECT * FROM treasury_accounts
        WHERE tenant_id = $1 AND is_active = true
        ORDER BY account_type, account_name
      `;

      const result = await pool.query(query, [tenantId]);

      res.status(200).json({
        success: true,
        accounts: result.rows,
        total: result.rows.length
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch treasury accounts', error: error.message });
    }
  }

  async getCashPosition(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      
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

      res.status(200).json({
        success: true,
        positions: result.rows
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch cash position', error: error.message });
    }
  }

  // ============================================================================
  // CASH FORECASTING
  // ============================================================================

  async getCashForecasts(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const { startDate, endDate } = req.query;
      
      let whereConditions = ['tenant_id = $1'];
      let params: any[] = [tenantId];
      let paramIndex = 2;

      if (startDate) {
        whereConditions.push(`forecast_date >= $${paramIndex}`);
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereConditions.push(`forecast_date <= $${paramIndex}`);
        params.push(endDate);
        paramIndex++;
      }

      const query = `
        SELECT * FROM cash_forecasts
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY forecast_date DESC
      `;

      const result = await pool.query(query, params);

      res.status(200).json({
        success: true,
        forecasts: result.rows,
        total: result.rows.length
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch forecasts', error: error.message });
    }
  }

  async createCashForecast(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
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
        forecast: result.rows[0]
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to create forecast', error: error.message });
    }
  }

  // ============================================================================
  // INVESTMENTS
  // ============================================================================

  async getInvestments(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      
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

      res.status(200).json({
        success: true,
        investments: result.rows,
        total: result.rows.length
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch investments', error: error.message });
    }
  }

  async createInvestment(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const { investmentCode, investmentName, investmentType, provider, principalAmount, currency, interestRate, startDate, maturityDate } = req.body;

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
        investment: result.rows[0]
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to create investment', error: error.message });
    }
  }

  // ============================================================================
  // TREASURY TRANSACTIONS
  // ============================================================================

  async getTreasuryTransactions(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const { accountId, startDate, endDate, limit = 100, offset = 0 } = req.query;

      let whereConditions = ['tt.tenant_id = $1'];
      let params: any[] = [tenantId];
      let paramIndex = 2;

      if (accountId) {
        whereConditions.push(`tt.account_id = $${paramIndex}`);
        params.push(accountId);
        paramIndex++;
      }

      if (startDate) {
        whereConditions.push(`tt.transaction_date >= $${paramIndex}`);
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereConditions.push(`tt.transaction_date <= $${paramIndex}`);
        params.push(endDate);
        paramIndex++;
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

      params.push(limit, offset);

      const result = await pool.query(query, params);

      res.status(200).json({
        success: true,
        transactions: result.rows,
        total: result.rows.length
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch transactions', error: error.message });
    }
  }

  // ============================================================================
  // FX RATES
  // ============================================================================

  async getFXRates(req: Request, res: Response): Promise<void> {
    try {
      const { baseCurrency, targetCurrency } = req.query;

      let whereConditions = ['rate_date = CURRENT_DATE'];
      let params: any[] = [];
      let paramIndex = 1;

      if (baseCurrency) {
        whereConditions.push(`base_currency = $${paramIndex}`);
        params.push(baseCurrency);
        paramIndex++;
      }

      if (targetCurrency) {
        whereConditions.push(`target_currency = $${paramIndex}`);
        params.push(targetCurrency);
        paramIndex++;
      }

      const query = `
        SELECT * FROM fx_rates
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY base_currency, target_currency
      `;

      const result = await pool.query(query, params);

      res.status(200).json({
        success: true,
        rates: result.rows,
        total: result.rows.length
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch FX rates', error: error.message });
    }
  }

  // ============================================================================
  // PAYMENT ORDERS
  // ============================================================================

  async getPaymentOrders(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const { status } = req.query;

      let whereConditions = ['po.tenant_id = $1'];
      let params: any[] = [tenantId];
      let paramIndex = 2;

      if (status) {
        whereConditions.push(`po.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
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

      res.status(200).json({
        success: true,
        orders: result.rows,
        total: result.rows.length
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch payment orders', error: error.message });
    }
  }

  async createPaymentOrder(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const userId = (req as any).user?.userId;
      const { accountId, paymentType, beneficiaryName, beneficiaryAccount, amount, currency, paymentDate, reference } = req.body;

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
        order: result.rows[0]
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to create payment order', error: error.message });
    }
  }

  // ============================================================================
  // LIQUIDITY METRICS
  // ============================================================================

  async getLiquidityMetrics(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';

      const query = `
        SELECT * FROM liquidity_metrics
        WHERE tenant_id = $1
        ORDER BY metric_date DESC
        LIMIT 30
      `;

      const result = await pool.query(query, [tenantId]);

      res.status(200).json({
        success: true,
        metrics: result.rows,
        total: result.rows.length
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch liquidity metrics', error: error.message });
    }
  }

}

export default new TreasuryController();
