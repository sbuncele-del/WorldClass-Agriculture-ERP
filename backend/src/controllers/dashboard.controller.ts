import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * Dashboard Controller
 * Provides aggregated financial data for the executive dashboard
 */

// Get dashboard statistics (current period, financial summary, balances, activity)
export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    // Get current/active period
    const periodQuery = `
      SELECT 
        fiscal_year, 
        period_number, 
        period_name, 
        start_date, 
        end_date, 
        status
      FROM fiscal_periods
      WHERE status IN ('OPEN', 'CLOSED')
      ORDER BY start_date DESC
      LIMIT 1
    `;
    const periodResult = await client.query(periodQuery);
    const currentPeriod = periodResult.rows[0] || null;

    // Get financial summary (revenue and expenses)
    const financialQuery = `
      SELECT 
        SUM(CASE 
          WHEN coa.account_type = 'REVENUE' 
          THEN jel.credit_amount - jel.debit_amount 
          ELSE 0 
        END) as total_revenue,
        SUM(CASE 
          WHEN coa.account_type = 'EXPENSE' 
          THEN jel.debit_amount - jel.credit_amount 
          ELSE 0 
        END) as total_expenses,
        SUM(CASE 
          WHEN coa.account_type = 'REVENUE' 
          THEN jel.credit_amount - jel.debit_amount 
          ELSE 0 
        END) - SUM(CASE 
          WHEN coa.account_type = 'EXPENSE' 
          THEN jel.debit_amount - jel.credit_amount 
          ELSE 0 
        END) as net_profit
      FROM journal_entry_lines jel
      JOIN chart_of_accounts coa ON jel.account_id = coa.account_id
      JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
      WHERE je.status = 'POSTED'
        ${currentPeriod ? `AND je.posting_date >= $1 AND je.posting_date <= $2` : ''}
    `;
    
    const financialParams = currentPeriod 
      ? [currentPeriod.start_date, currentPeriod.end_date]
      : [];
    const financialResult = await client.query(financialQuery, financialParams);
    const financialSummary = financialResult.rows[0];

    // Get account balances (Assets, Liabilities, Equity)
    const balancesQuery = `
      SELECT 
        SUM(CASE 
          WHEN coa.account_type = 'ASSET' 
          THEN jel.debit_amount - jel.credit_amount 
          ELSE 0 
        END) as total_assets,
        SUM(CASE 
          WHEN coa.account_type = 'LIABILITY' 
          THEN jel.credit_amount - jel.debit_amount 
          ELSE 0 
        END) as total_liabilities,
        SUM(CASE 
          WHEN coa.account_type = 'EQUITY' 
          THEN jel.credit_amount - jel.debit_amount 
          ELSE 0 
        END) as total_equity
      FROM journal_entry_lines jel
      JOIN chart_of_accounts coa ON jel.account_id = coa.account_id
      JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
      WHERE je.status = 'POSTED'
    `;
    const balancesResult = await client.query(balancesQuery);
    const accountBalances = balancesResult.rows[0];

    // Get activity counts (total entries, posted entries, pending entries)
    const activityQuery = `
      SELECT 
        COUNT(*) as total_entries,
        SUM(CASE WHEN status = 'POSTED' THEN 1 ELSE 0 END) as posted_entries,
        SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END) as pending_entries
      FROM journal_entries
      ${currentPeriod ? `WHERE posting_date >= $1 AND posting_date <= $2` : ''}
    `;
    const activityParams = currentPeriod 
      ? [currentPeriod.start_date, currentPeriod.end_date]
      : [];
    const activityResult = await client.query(activityQuery, activityParams);
    const activity = activityResult.rows[0];

    res.json({
      current_period: currentPeriod,
      financial_summary: {
        total_revenue: parseFloat(financialSummary.total_revenue || 0),
        total_expenses: parseFloat(financialSummary.total_expenses || 0),
        net_profit: parseFloat(financialSummary.net_profit || 0)
      },
      account_balances: {
        total_assets: parseFloat(accountBalances.total_assets || 0),
        total_liabilities: parseFloat(accountBalances.total_liabilities || 0),
        total_equity: parseFloat(accountBalances.total_equity || 0)
      },
      activity: {
        total_entries: parseInt(activity.total_entries || 0),
        posted_entries: parseInt(activity.posted_entries || 0),
        pending_entries: parseInt(activity.pending_entries || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  } finally {
    client.release();
  }
};

// Get dimension breakdown (Cost Center or Department)
export const getDimensionBreakdown = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { dimensionType } = req.params; // 'cost-center' or 'department'
    const { type } = req.query; // 'expenses' or 'revenue'

    // Validate dimension type
    const validDimensions = ['cost-center', 'department', 'project', 'product', 'location'];
    if (!validDimensions.includes(dimensionType)) {
      res.status(400).json({ error: 'Invalid dimension type' });
      return;
    }

    // Validate analysis type
    if (type !== 'expenses' && type !== 'revenue') {
      res.status(400).json({ error: 'Type must be either "expenses" or "revenue"' });
      return;
    }

    // Map dimension type to table and column
    const dimensionMap: { [key: string]: { table: string; idColumn: string } } = {
      'cost-center': { table: 'cost_centers', idColumn: 'cost_center_id' },
      'department': { table: 'departments', idColumn: 'department_id' },
      'project': { table: 'projects', idColumn: 'project_id' },
      'product': { table: 'products', idColumn: 'product_id' },
      'location': { table: 'locations', idColumn: 'location_id' }
    };

    const dimension = dimensionMap[dimensionType];
    const accountType = type === 'expenses' ? 'EXPENSE' : 'REVENUE';
    const amountColumn = type === 'expenses' 
      ? 'jel.debit_amount - jel.credit_amount'
      : 'jel.credit_amount - jel.debit_amount';

    const query = `
      SELECT 
        d.code,
        d.name,
        SUM(${amountColumn}) as amount,
        COUNT(DISTINCT jel.journal_entry_id) as entry_count
      FROM journal_entry_lines jel
      JOIN ${dimension.table} d ON jel.${dimension.idColumn} = d.id
      JOIN chart_of_accounts coa ON jel.account_id = coa.account_id
      JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
      WHERE coa.account_type = $1
        AND je.status = 'POSTED'
        AND jel.${dimension.idColumn} IS NOT NULL
      GROUP BY d.id, d.code, d.name
      HAVING SUM(${amountColumn}) > 0
      ORDER BY amount DESC
      LIMIT 10
    `;

    const result = await client.query(query, [accountType]);
    
    // Calculate total for percentages
    const total = result.rows.reduce((sum, row) => sum + parseFloat(row.amount), 0);
    
    // Add percentage to each row
    const breakdown = result.rows.map(row => ({
      code: row.code,
      name: row.name,
      amount: parseFloat(row.amount),
      entry_count: parseInt(row.entry_count),
      percentage: total > 0 ? (parseFloat(row.amount) / total * 100).toFixed(2) : '0.00'
    }));

    res.json({
      dimension_type: dimensionType,
      analysis_type: type,
      total_amount: total,
      breakdown
    });
  } catch (error) {
    console.error('Error fetching dimension breakdown:', error);
    res.status(500).json({ error: 'Failed to fetch dimension breakdown' });
  } finally {
    client.release();
  }
};

// Get recent journal entries
export const getRecentEntries = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const query = `
      SELECT 
        je.entry_id,
        je.journal_number,
        je.posting_date,
        je.description,
        je.status,
        je.created_by,
        je.created_at,
        SUM(jel.debit_amount) as total_debit,
        SUM(jel.credit_amount) as total_credit,
        fp.period_name,
        fp.fiscal_year
      FROM journal_entries je
      LEFT JOIN journal_entry_lines jel ON je.entry_id = jel.journal_entry_id
      LEFT JOIN fiscal_periods fp ON je.posting_date >= fp.start_date 
        AND je.posting_date <= fp.end_date
      GROUP BY je.entry_id, fp.period_name, fp.fiscal_year
      ORDER BY je.created_at DESC
      LIMIT $1
    `;

    const result = await client.query(query, [limit]);
    
    const entries = result.rows.map(row => ({
      entry_id: row.entry_id,
      journal_number: row.journal_number,
      posting_date: row.posting_date,
      description: row.description,
      status: row.status,
      created_by: row.created_by,
      created_at: row.created_at,
      amount: parseFloat(row.total_debit || 0),
      period_name: row.period_name,
      fiscal_year: row.fiscal_year
    }));

    res.json(entries);
  } catch (error) {
    console.error('Error fetching recent entries:', error);
    res.status(500).json({ error: 'Failed to fetch recent entries' });
  } finally {
    client.release();
  }
};

// Get dashboard metrics for main dashboard
export const getDashboardMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId;

    if (!tenantId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const revenueQuery = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN created_at >= $2 THEN total_amount ELSE 0 END), 0) as current_revenue,
        COALESCE(SUM(CASE WHEN created_at >= $3 AND created_at <= $4 THEN total_amount ELSE 0 END), 0) as previous_revenue
      FROM invoices WHERE tenant_id = $1 AND status = 'paid'`,
      [tenantId, currentMonth, previousMonth, previousMonthEnd]
    );

    const salesQuery = await pool.query(
      `SELECT 
        COUNT(CASE WHEN created_at >= $2 THEN 1 END) as current_sales,
        COUNT(CASE WHEN created_at >= $3 AND created_at <= $4 THEN 1 END) as previous_sales
      FROM sales_orders WHERE tenant_id = $1 AND status != 'cancelled'`,
      [tenantId, currentMonth, previousMonth, previousMonthEnd]
    );

    const expensesQuery = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN created_at >= $2 THEN amount ELSE 0 END), 0) as current_expenses,
        COALESCE(SUM(CASE WHEN created_at >= $3 AND created_at <= $4 THEN amount ELSE 0 END), 0) as previous_expenses
      FROM expenses WHERE tenant_id = $1`,
      [tenantId, currentMonth, previousMonth, previousMonthEnd]
    );

    const revenue = revenueQuery.rows[0];
    const sales = salesQuery.rows[0];
    const expenses = expensesQuery.rows[0];

    const currentRevenue = parseFloat(revenue.current_revenue) || 0;
    const previousRevenue = parseFloat(revenue.previous_revenue) || 0;
    const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const currentSales = parseInt(sales.current_sales) || 0;
    const previousSales = parseInt(sales.previous_sales) || 0;
    const salesChange = previousSales > 0 ? ((currentSales - previousSales) / previousSales) * 100 : 0;

    const currentExpenses = parseFloat(expenses.current_expenses) || 0;
    const previousExpenses = parseFloat(expenses.previous_expenses) || 0;
    const expensesChange = previousExpenses > 0 ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 : 0;

    const currentProfit = currentRevenue - currentExpenses;
    const previousProfit = previousRevenue - previousExpenses;
    const profitChange = previousProfit > 0 ? ((currentProfit - previousProfit) / previousProfit) * 100 : 0;

    res.json({
      revenue: { current: currentRevenue, previous: previousRevenue, change: revenueChange },
      sales: { current: currentSales, previous: previousSales, change: salesChange },
      expenses: { current: currentExpenses, previous: previousExpenses, change: expensesChange },
      profit: { current: currentProfit, previous: previousProfit, change: profitChange },
    });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
};

// Get recent activity
export const getRecentActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!tenantId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const query = `
      (SELECT 'invoice' as type, id, invoice_number as title, total_amount as amount, created_at as date, status FROM invoices WHERE tenant_id = $1)
      UNION ALL
      (SELECT 'order' as type, id, order_number as title, total_amount as amount, created_at as date, status FROM sales_orders WHERE tenant_id = $1)
      UNION ALL
      (SELECT 'payment' as type, id, reference as title, amount, created_at as date, status FROM payments WHERE tenant_id = $1)
      ORDER BY date DESC LIMIT $2
    `;

    const result = await pool.query(query, [tenantId, limit]);
    const activity = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      amount: parseFloat(row.amount) || 0,
      date: row.date,
      status: row.status === 'paid' || row.status === 'completed' ? 'completed' : row.status === 'overdue' ? 'overdue' : 'pending',
    }));

    res.json(activity);
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
};

// Get inventory alerts
export const getInventoryAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId;

    if (!tenantId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const query = `
      SELECT p.id, p.name as product_name, COALESCE(i.quantity, 0) as current_stock, COALESCE(p.min_stock_level, 0) as min_stock
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.tenant_id = $1 AND p.track_inventory = true AND COALESCE(i.quantity, 0) <= COALESCE(p.min_stock_level, 0)
      ORDER BY CASE WHEN COALESCE(i.quantity, 0) = 0 THEN 1 WHEN COALESCE(i.quantity, 0) <= COALESCE(p.min_stock_level, 0) / 2 THEN 2 ELSE 3 END, COALESCE(i.quantity, 0) ASC
      LIMIT 10
    `;

    const result = await pool.query(query, [tenantId]);
    const alerts = result.rows.map(row => ({
      id: row.id,
      productName: row.product_name,
      currentStock: parseInt(row.current_stock) || 0,
      minStock: parseInt(row.min_stock) || 0,
      severity: row.current_stock === 0 || row.current_stock <= row.min_stock / 2 ? 'critical' : 'warning',
    }));

    res.json(alerts);
  } catch (error) {
    console.error('Get inventory alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory alerts' });
  }
};

// Get top products
export const getTopProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const limit = parseInt(req.query.limit as string) || 5;

    if (!tenantId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const query = `
      SELECT p.id, p.name, COUNT(soi.id) as sales, COALESCE(SUM(soi.quantity * soi.unit_price), 0) as revenue
      FROM products p
      INNER JOIN sales_order_items soi ON p.id = soi.product_id
      INNER JOIN sales_orders so ON soi.sales_order_id = so.id
      WHERE p.tenant_id = $1 AND so.created_at >= $2 AND so.status != 'cancelled'
      GROUP BY p.id, p.name
      ORDER BY revenue DESC LIMIT $3
    `;

    const result = await pool.query(query, [tenantId, thirtyDaysAgo, limit]);
    const topProducts = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      sales: parseInt(row.sales) || 0,
      revenue: parseFloat(row.revenue) || 0,
    }));

    res.json(topProducts);
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({ error: 'Failed to fetch top products' });
  }
};

// Dashboard Controller Class (for new Enterprise Dashboard)
export class DashboardController {
  /**
   * GET /api/dashboard/metrics
   * Get dashboard overview metrics for Enterprise Dashboard
   */
  static async getMetrics(req: any, res: Response): Promise<void> {
    try {
      if (!req.tenant || !req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // For new accounts, return zero values
      // In production, these would query actual data from database
      const metrics = {
        financial: {
          totalRevenue: 0,
          change: 0,
          status: 'success'
        },
        cashPosition: {
          totalCash: 0,
          change: 0,
          status: 'success'
        },
        sales: {
          totalSales: 0,
          change: 0,
          status: 'success'
        },
        inventory: {
          totalValue: 0,
          change: 0,
          status: 'success'
        },
        procurement: {
          totalValue: 0,
          change: 0,
          status: 'success'
        },
        production: {
          totalUnits: 0,
          capacity: 0,
          status: 'success'
        },
        employees: {
          totalCount: 1, // At least the admin user
          newThisMonth: 1,
          status: 'success'
        }
      };

      res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (error: any) {
      console.error('Error getting dashboard metrics:', error);
      res.status(500).json({ error: 'Failed to get dashboard metrics' });
    }
  }

  /**
   * GET /api/dashboard/tasks
   * Get pending tasks for the user
   */
  static async getTasks(req: any, res: Response): Promise<void> {
    try {
      if (!req.tenant || !req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Check if onboarding is complete
      const result = await pool.query(
        'SELECT onboarding_completed FROM tenants WHERE id = $1',
        [req.tenant.id]
      );

      const tasks = [];

      if (!result.rows[0]?.onboarding_completed) {
        tasks.push({
          id: 'onboarding-1',
          title: 'Complete company setup',
          module: 'System',
          priority: 'high',
          status: 'pending',
          dueDate: null,
          assignedTo: req.user.email
        });
      }

      res.status(200).json({
        success: true,
        data: tasks
      });
    } catch (error: any) {
      console.error('Error getting dashboard tasks:', error);
      res.status(500).json({ error: 'Failed to get dashboard tasks' });
    }
  }

  /**
   * GET /api/dashboard/alerts
   * Get system alerts and notifications
   */
  static async getAlerts(req: any, res: Response): Promise<void> {
    try {
      if (!req.tenant || !req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Get tenant info
      const result = await pool.query(
        'SELECT name, trial_ends_at, status FROM tenants WHERE id = $1',
        [req.tenant.id]
      );

      const tenant = result.rows[0];
      const alerts = [];

      // Welcome message for trial accounts
      if (tenant && tenant.status === 'trial') {
        const trialEndsAt = new Date(tenant.trial_ends_at);
        const daysLeft = Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        alerts.push({
          id: 'welcome',
          type: 'success',
          message: `Welcome to AetherOS ERP! Your 14-day trial is active with ${daysLeft} days remaining.`,
          module: 'System',
          timestamp: new Date().toISOString(),
          actionLabel: 'Learn More',
          actionLink: '/settings/subscription'
        });
      }

      res.status(200).json({
        success: true,
        data: alerts
      });
    } catch (error: any) {
      console.error('Error getting dashboard alerts:', error);
      res.status(500).json({ error: 'Failed to get dashboard alerts' });
    }
  }

  /**
   * GET /api/dashboard/executive
   * Get executive dashboard data with KPIs, charts, AI insights
   */
  static async getExecutiveDashboard(req: any, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || req.tenant?.id;
      const period = req.query.period || '30d';

      if (!tenantId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      let previousStartDate: Date;

      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          previousStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
          break;
        default: // 30d
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      }

      // Get revenue metrics
      const revenueQuery = await pool.query(
        `SELECT 
          COALESCE(SUM(CASE WHEN created_at >= $2 THEN total_amount ELSE 0 END), 0) as current_revenue,
          COALESCE(SUM(CASE WHEN created_at >= $3 AND created_at < $2 THEN total_amount ELSE 0 END), 0) as previous_revenue
         FROM invoices 
         WHERE tenant_id = $1 AND status IN ('paid', 'partial')`,
        [tenantId, startDate, previousStartDate]
      );

      // Get expenses metrics
      const expensesQuery = await pool.query(
        `SELECT 
          COALESCE(SUM(CASE WHEN created_at >= $2 THEN amount ELSE 0 END), 0) as current_expenses,
          COALESCE(SUM(CASE WHEN created_at >= $3 AND created_at < $2 THEN amount ELSE 0 END), 0) as previous_expenses
         FROM expenses 
         WHERE tenant_id = $1`,
        [tenantId, startDate, previousStartDate]
      );

      // Get cash flow metrics
      const cashFlowQuery = await pool.query(
        `SELECT 
          COALESCE(SUM(CASE WHEN transaction_date >= $2 THEN 
            CASE WHEN transaction_type = 'INFLOW' THEN amount ELSE -amount END 
          ELSE 0 END), 0) as current_cashflow,
          COALESCE(SUM(CASE WHEN transaction_date >= $3 AND transaction_date < $2 THEN 
            CASE WHEN transaction_type = 'INFLOW' THEN amount ELSE -amount END 
          ELSE 0 END), 0) as previous_cashflow
         FROM cash_transactions 
         WHERE tenant_id = $1`,
        [tenantId, startDate, previousStartDate]
      );

      const revenue = revenueQuery.rows[0];
      const expenses = expensesQuery.rows[0];
      const cashFlow = cashFlowQuery.rows[0];

      const currentRevenue = parseFloat(revenue.current_revenue) || 0;
      const previousRevenue = parseFloat(revenue.previous_revenue) || 0;
      const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      const currentExpenses = parseFloat(expenses.current_expenses) || 0;
      const previousExpenses = parseFloat(expenses.previous_expenses) || 0;
      const expensesChange = previousExpenses > 0 ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 : 0;

      const currentProfit = currentRevenue - currentExpenses;
      const previousProfit = previousRevenue - previousExpenses;
      const profitChange = previousProfit !== 0 ? ((currentProfit - previousProfit) / Math.abs(previousProfit)) * 100 : 0;

      const currentCashFlow = parseFloat(cashFlow.current_cashflow) || 0;
      const previousCashFlow = parseFloat(cashFlow.previous_cashflow) || 0;
      const cashFlowChange = previousCashFlow !== 0 ? ((currentCashFlow - previousCashFlow) / Math.abs(previousCashFlow)) * 100 : 0;

      // Generate sparkline data (last 7 data points)
      const generateSparkline = (current: number, previous: number) => {
        const diff = current - previous;
        const step = diff / 6;
        return Array.from({ length: 7 }, (_, i) => previous + step * i);
      };

      // Get revenue chart data (last 6 months)
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const chartQuery = await pool.query(
        `SELECT 
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month,
          COALESCE(SUM(total_amount), 0) as revenue
         FROM invoices 
         WHERE tenant_id = $1 AND created_at >= $2 AND status IN ('paid', 'partial')
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY DATE_TRUNC('month', created_at)`,
        [tenantId, sixMonthsAgo]
      );

      const expensesChartQuery = await pool.query(
        `SELECT 
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month,
          COALESCE(SUM(amount), 0) as expenses
         FROM expenses 
         WHERE tenant_id = $1 AND created_at >= $2
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY DATE_TRUNC('month', created_at)`,
        [tenantId, sixMonthsAgo]
      );

      const revenueChart = chartQuery.rows.map((row, i) => ({
        month: row.month,
        revenue: parseFloat(row.revenue),
        expenses: parseFloat(expensesChartQuery.rows[i]?.expenses || 0),
        profit: parseFloat(row.revenue) - parseFloat(expensesChartQuery.rows[i]?.expenses || 0),
      }));

      // Generate AI insights
      const aiInsights = [];
      
      if (revenueChange > 10) {
        aiInsights.push({
          id: '1',
          type: 'success',
          message: `Your revenue increased ${revenueChange.toFixed(1)}% this period - strong performance!`,
          priority: 1,
        });
      } else if (revenueChange < -10) {
        aiInsights.push({
          id: '1',
          type: 'warning',
          message: `Revenue declined ${Math.abs(revenueChange).toFixed(1)}% - review sales strategy`,
          priority: 1,
        });
      }

      if (expensesChange < -5) {
        aiInsights.push({
          id: '2',
          type: 'success',
          message: `Operating expenses down ${Math.abs(expensesChange).toFixed(1)}% - cost optimization working`,
          priority: 2,
        });
      }

      // Get alerts
      const alertsQuery = await pool.query(
        `SELECT 'Inventory' as type, 'Low stock on ' || COUNT(*) || ' products' as message, 'medium' as severity
         FROM products p
         LEFT JOIN inventory i ON p.id = i.product_id
         WHERE p.tenant_id = $1 AND COALESCE(i.quantity, 0) <= COALESCE(p.min_stock_level, 0)
         HAVING COUNT(*) > 0
         UNION ALL
         SELECT 'Receivables' as type, 'R' || COALESCE(SUM(total_amount), 0) || ' overdue invoices' as message, 'high' as severity
         FROM invoices
         WHERE tenant_id = $1 AND status = 'overdue' AND COALESCE(total_amount, 0) > 0
         LIMIT 5`,
        [tenantId]
      );

      const alerts = alertsQuery.rows.map((row, i) => ({
        id: `alert-${i}`,
        type: row.type,
        message: row.message,
        severity: row.severity,
        timestamp: new Date().toISOString(),
      }));

      // Get recent activity
      const activityQuery = await pool.query(
        `(SELECT 'invoice' as type, 'Invoice ' || invoice_number || ' created' as title, total_amount as amount, created_at as date, status 
          FROM invoices WHERE tenant_id = $1)
         UNION ALL
         (SELECT 'payment' as type, 'Payment received' as title, amount, created_at as date, 'completed' as status 
          FROM payments WHERE tenant_id = $1)
         ORDER BY date DESC LIMIT 10`,
        [tenantId]
      );

      const recentActivity = activityQuery.rows.map(row => ({
        id: `activity-${row.type}-${Math.random()}`,
        type: row.type,
        title: row.title,
        amount: parseFloat(row.amount) || 0,
        date: row.date,
        status: row.status,
      }));

      // Module health (mock for now)
      const moduleHealth = [
        { module: 'Sales', status: 'healthy', uptime: 99.9 },
        { module: 'Inventory', status: 'healthy', uptime: 99.5 },
        { module: 'Financial', status: 'healthy', uptime: 100 },
        { module: 'HR & Payroll', status: 'healthy', uptime: 99.2 },
      ];

      res.json({
        metrics: {
          revenue: {
            current: currentRevenue,
            previous: previousRevenue,
            change: revenueChange,
            sparkline: generateSparkline(currentRevenue, previousRevenue),
          },
          expenses: {
            current: currentExpenses,
            previous: previousExpenses,
            change: expensesChange,
            sparkline: generateSparkline(currentExpenses, previousExpenses),
          },
          profit: {
            current: currentProfit,
            previous: previousProfit,
            change: profitChange,
            sparkline: generateSparkline(currentProfit, previousProfit),
          },
          cashFlow: {
            current: currentCashFlow,
            previous: previousCashFlow,
            change: cashFlowChange,
            sparkline: generateSparkline(currentCashFlow, previousCashFlow),
          },
        },
        revenueChart,
        aiInsights,
        alerts,
        recentActivity,
        moduleHealth,
      });
    } catch (error) {
      console.error('Get executive dashboard error:', error);
      res.status(500).json({ error: 'Failed to fetch executive dashboard data' });
    }
  }
}

export default DashboardController;
