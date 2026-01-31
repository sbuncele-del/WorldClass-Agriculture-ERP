/**
 * Dashboard Controller V2 - Tenant-Hardened
 * 
 * Multi-tenant secure dashboard with financial KPIs,
 * metrics, and real-time data visualization.
 */

import { Response } from 'express';
import pool from '../config/database';
import { TenantRequest } from '../types';

// Helper to extract tenant context
function getTenantContext(req: TenantRequest): { tenantId: string; userId?: string } {
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }
  return { tenantId, userId: req.user?.id };
}

export class DashboardControllerV2 {
  /**
   * Get dashboard statistics
   * GET /api/v2/dashboard/stats
   */
  static async getDashboardStats(req: TenantRequest, res: Response): Promise<void> {
    const client = await pool.connect();
    try {
      const { tenantId } = getTenantContext(req);

      // Get current/active period
      const periodQuery = `
        SELECT fiscal_year_id, period_number, period_name, start_date, end_date, status
        FROM fiscal_periods
        WHERE tenant_id = $1 AND status IN ('OPEN', 'CLOSED')
        ORDER BY start_date DESC
        LIMIT 1
      `;
      const periodResult = await client.query(periodQuery, [tenantId]);
      const currentPeriod = periodResult.rows[0] || null;

      // Get financial summary - tenant filtering via journal_entries join
      const financialQuery = `
        SELECT 
          SUM(CASE WHEN coa.account_type = 'REVENUE' THEN jel.credit_amount - jel.debit_amount ELSE 0 END) as total_revenue,
          SUM(CASE WHEN coa.account_type = 'EXPENSE' THEN jel.debit_amount - jel.credit_amount ELSE 0 END) as total_expenses
        FROM journal_entry_lines jel
        JOIN chart_of_accounts coa ON jel.account_id = coa.account_id AND coa.tenant_id = $1
        JOIN journal_entries je ON jel.journal_entry_id = je.journal_entry_id AND je.tenant_id = $1
        WHERE je.status = 'POSTED'
          ${currentPeriod ? `AND je.posting_date >= $2 AND je.posting_date <= $3` : ''}
      `;

      const financialParams = currentPeriod
        ? [tenantId, currentPeriod.start_date, currentPeriod.end_date]
        : [tenantId];
      const financialResult = await client.query(financialQuery, financialParams);
      const financial = financialResult.rows[0];

      const totalRevenue = parseFloat(financial?.total_revenue || '0');
      const totalExpenses = parseFloat(financial?.total_expenses || '0');
      const netProfit = totalRevenue - totalExpenses;

      // Get account balances - tenant filtering via journal_entries join
      const balancesQuery = `
        SELECT 
          SUM(CASE WHEN coa.account_type = 'ASSET' THEN jel.debit_amount - jel.credit_amount ELSE 0 END) as total_assets,
          SUM(CASE WHEN coa.account_type = 'LIABILITY' THEN jel.credit_amount - jel.debit_amount ELSE 0 END) as total_liabilities,
          SUM(CASE WHEN coa.account_type = 'EQUITY' THEN jel.credit_amount - jel.debit_amount ELSE 0 END) as total_equity
        FROM journal_entry_lines jel
        JOIN chart_of_accounts coa ON jel.account_id = coa.account_id AND coa.tenant_id = $1
        JOIN journal_entries je ON jel.journal_entry_id = je.journal_entry_id AND je.tenant_id = $1
        WHERE je.status = 'POSTED'
      `;
      const balancesResult = await client.query(balancesQuery, [tenantId]);
      const balances = balancesResult.rows[0];

      // Get recent activity counts
      const activityQuery = `
        SELECT
          (SELECT COUNT(*) FROM journal_entries WHERE tenant_id = $1 AND status = 'DRAFT') as draft_entries,
          (SELECT COUNT(*) FROM journal_entries WHERE tenant_id = $1 AND status = 'PENDING') as pending_entries,
          (SELECT COUNT(*) FROM journal_entries WHERE tenant_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days') as recent_entries
      `;
      const activityResult = await client.query(activityQuery, [tenantId]);
      const activity = activityResult.rows[0];

      res.json({
        success: true,
        data: {
          current_period: currentPeriod,
          financial_summary: {
            total_revenue: totalRevenue,
            total_expenses: totalExpenses,
            net_profit: netProfit,
            profit_margin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
          },
          balances: {
            total_assets: parseFloat(balances?.total_assets || '0'),
            total_liabilities: parseFloat(balances?.total_liabilities || '0'),
            total_equity: parseFloat(balances?.total_equity || '0')
          },
          activity: {
            draft_entries: parseInt(activity?.draft_entries || '0'),
            pending_entries: parseInt(activity?.pending_entries || '0'),
            recent_entries: parseInt(activity?.recent_entries || '0')
          }
        }
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Dashboard] Stats error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
    } finally {
      client.release();
    }
  }

  /**
   * Get revenue trend
   * GET /api/v2/dashboard/revenue-trend
   */
  static async getRevenueTrend(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { months = 12 } = req.query;

      const query = `
        SELECT 
          DATE_TRUNC('month', je.journal_date) as month,
          SUM(jel.credit_amount - jel.debit_amount) as revenue
        FROM journal_entry_lines jel
        JOIN chart_of_accounts coa ON jel.account_id = coa.account_id AND coa.tenant_id = $1
        JOIN journal_entries je ON jel.journal_entry_id = je.journal_entry_id AND je.tenant_id = $1
        WHERE jel.tenant_id = $1
          AND je.status = 'POSTED'
          AND coa.account_type = 'REVENUE'
          AND je.journal_date >= CURRENT_DATE - INTERVAL '${parseInt(months as string)} months'
        GROUP BY DATE_TRUNC('month', je.journal_date)
        ORDER BY month
      `;

      const result = await pool.query(query, [tenantId]);

      res.json({
        success: true,
        data: result.rows.map(row => ({
          month: row.month,
          revenue: parseFloat(row.revenue)
        }))
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Dashboard] Revenue trend error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch revenue trend' });
    }
  }

  /**
   * Get expense breakdown
   * GET /api/v2/dashboard/expense-breakdown
   */
  static async getExpenseBreakdown(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { period = 'month' } = req.query;

      let dateFilter = "AND je.journal_date >= DATE_TRUNC('month', CURRENT_DATE)";
      if (period === 'quarter') {
        dateFilter = "AND je.journal_date >= DATE_TRUNC('quarter', CURRENT_DATE)";
      } else if (period === 'year') {
        dateFilter = "AND je.journal_date >= DATE_TRUNC('year', CURRENT_DATE)";
      }

      const query = `
        SELECT 
          coa.account_code,
          coa.account_name,
          SUM(jel.debit_amount - jel.credit_amount) as amount
        FROM journal_entry_lines jel
        JOIN chart_of_accounts coa ON jel.account_id = coa.account_id AND coa.tenant_id = $1
        JOIN journal_entries je ON jel.journal_entry_id = je.journal_entry_id AND je.tenant_id = $1
        WHERE jel.tenant_id = $1
          AND je.status = 'POSTED'
          AND coa.account_type = 'EXPENSE'
          ${dateFilter}
        GROUP BY coa.account_code, coa.account_name
        HAVING SUM(jel.debit_amount - jel.credit_amount) > 0
        ORDER BY amount DESC
        LIMIT 10
      `;

      const result = await pool.query(query, [tenantId]);

      res.json({
        success: true,
        data: result.rows.map(row => ({
          account_code: row.account_code,
          account_name: row.account_name,
          amount: parseFloat(row.amount)
        }))
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Dashboard] Expense breakdown error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch expense breakdown' });
    }
  }

  /**
   * Get recent journal entries
   * GET /api/v2/dashboard/recent-entries
   */
  static async getRecentEntries(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { limit = 10 } = req.query;

      const query = `
        SELECT 
          je.journal_entry_id,
          je.entry_number,
          je.journal_date,
          je.description,
          je.status,
          je.source_type,
          je.created_at,
          COALESCE(SUM(jel.debit_amount), 0) as total_amount
        FROM journal_entries je
        LEFT JOIN journal_entry_lines jel ON je.journal_entry_id = jel.journal_entry_id AND jel.tenant_id = $1
        WHERE je.tenant_id = $1
        GROUP BY je.journal_entry_id
        ORDER BY je.created_at DESC
        LIMIT $2
      `;

      const result = await pool.query(query, [tenantId, limit]);

      res.json({
        success: true,
        data: result.rows
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Dashboard] Recent entries error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch recent entries' });
    }
  }

  /**
   * Get cash position
   * GET /api/v2/dashboard/cash-position
   */
  static async getCashPosition(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);

      const query = `
        SELECT 
          coa.account_code,
          coa.account_name,
          SUM(jel.debit_amount - jel.credit_amount) as balance
        FROM journal_entry_lines jel
        JOIN chart_of_accounts coa ON jel.account_id = coa.account_id AND coa.tenant_id = $1
        JOIN journal_entries je ON jel.journal_entry_id = je.journal_entry_id AND je.tenant_id = $1
        WHERE jel.tenant_id = $1
          AND je.status = 'POSTED'
          AND (coa.account_name ILIKE '%cash%' OR coa.account_name ILIKE '%bank%')
        GROUP BY coa.account_code, coa.account_name
        ORDER BY balance DESC
      `;

      const result = await pool.query(query, [tenantId]);

      const totalCash = result.rows.reduce((sum, row) => sum + parseFloat(row.balance), 0);

      res.json({
        success: true,
        data: {
          total_cash: totalCash,
          accounts: result.rows.map(row => ({
            account_code: row.account_code,
            account_name: row.account_name,
            balance: parseFloat(row.balance)
          }))
        }
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Dashboard] Cash position error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch cash position' });
    }
  }

  /**
   * Get AR/AP aging summary
   * GET /api/v2/dashboard/aging-summary
   */
  static async getAgingSummary(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);

      // Simplified aging - real implementation would join with invoices
      const arQuery = `
        SELECT 
          SUM(CASE WHEN jel.debit_amount - jel.credit_amount > 0 THEN jel.debit_amount - jel.credit_amount ELSE 0 END) as total
        FROM journal_entry_lines jel
        JOIN chart_of_accounts coa ON jel.account_id = coa.account_id AND coa.tenant_id = $1
        JOIN journal_entries je ON jel.journal_entry_id = je.journal_entry_id AND je.tenant_id = $1
        WHERE jel.tenant_id = $1
          AND je.status = 'POSTED'
          AND coa.account_name ILIKE '%receivable%'
      `;
      const arResult = await pool.query(arQuery, [tenantId]);

      const apQuery = `
        SELECT 
          SUM(CASE WHEN jel.credit_amount - jel.debit_amount > 0 THEN jel.credit_amount - jel.debit_amount ELSE 0 END) as total
        FROM journal_entry_lines jel
        JOIN chart_of_accounts coa ON jel.account_id = coa.account_id AND coa.tenant_id = $1
        JOIN journal_entries je ON jel.journal_entry_id = je.journal_entry_id AND je.tenant_id = $1
        WHERE jel.tenant_id = $1
          AND je.status = 'POSTED'
          AND coa.account_name ILIKE '%payable%'
      `;
      const apResult = await pool.query(apQuery, [tenantId]);

      res.json({
        success: true,
        data: {
          accounts_receivable: {
            total: parseFloat(arResult.rows[0]?.total || '0')
          },
          accounts_payable: {
            total: parseFloat(apResult.rows[0]?.total || '0')
          }
        }
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Dashboard] Aging summary error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch aging summary' });
    }
  }

  /**
   * Get KPI metrics
   * GET /api/v2/dashboard/kpis
   */
  static async getKPIs(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);

      // Get various KPIs
      const kpiQuery = `
        WITH current_period AS (
          SELECT start_date, end_date
          FROM fiscal_periods
          WHERE tenant_id = $1 AND status = 'OPEN'
          ORDER BY start_date DESC
          LIMIT 1
        ),
        financials AS (
          SELECT 
            SUM(CASE WHEN coa.account_type = 'REVENUE' THEN jel.credit_amount - jel.debit_amount ELSE 0 END) as revenue,
            SUM(CASE WHEN coa.account_type = 'EXPENSE' THEN jel.debit_amount - jel.credit_amount ELSE 0 END) as expenses,
            SUM(CASE WHEN coa.account_type = 'ASSET' THEN jel.debit_amount - jel.credit_amount ELSE 0 END) as assets,
            SUM(CASE WHEN coa.account_type = 'LIABILITY' THEN jel.credit_amount - jel.debit_amount ELSE 0 END) as liabilities
          FROM journal_entry_lines jel
          JOIN chart_of_accounts coa ON jel.account_id = coa.account_id AND coa.tenant_id = $1
          JOIN journal_entries je ON jel.journal_entry_id = je.journal_entry_id AND je.tenant_id = $1
          WHERE jel.tenant_id = $1 AND je.status = 'POSTED'
        )
        SELECT * FROM financials
      `;

      const result = await pool.query(kpiQuery, [tenantId]);
      const data = result.rows[0] || {};

      const revenue = parseFloat(data.revenue || '0');
      const expenses = parseFloat(data.expenses || '0');
      const assets = parseFloat(data.assets || '0');
      const liabilities = parseFloat(data.liabilities || '0');

      res.json({
        success: true,
        data: {
          profit_margin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0,
          current_ratio: liabilities > 0 ? assets / liabilities : 0,
          debt_to_equity: (assets - liabilities) > 0 ? liabilities / (assets - liabilities) : 0,
          return_on_assets: assets > 0 ? ((revenue - expenses) / assets) * 100 : 0
        }
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Dashboard] KPIs error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch KPIs' });
    }
  }
}

export default DashboardControllerV2;
