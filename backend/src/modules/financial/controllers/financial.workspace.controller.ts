import { Response } from 'express';
import { query } from '../../../config/database';
import { TenantRequest } from '../../../types';

// Ensure we consistently enforce tenant context for workspace data
function getTenantId(req: TenantRequest): string | null {
  return req.tenant?.id ?? null;
}

/**
 * Financial Workspace Controller
 * Provides aggregated data for the Financial Management dashboard
 */

/**
 * GET /api/financial/workspace
 * Returns all data needed for the Financial Management workspace dashboard
 */
export const getFinancialWorkspace = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant ID not found',
      });
    }

    // Parallel queries for performance
    const [
      accountBalances,
      recentTransactions,
      cashFlow,
      pendingReconciliations,
      financialSummary,
      recentJournalEntries,
    ] = await Promise.all([
      getAccountBalances(tenantId),
      getRecentTransactions(tenantId),
      getCashFlowData(tenantId),
      getPendingReconciliations(tenantId),
      getFinancialSummary(tenantId),
      getRecentJournalEntries(tenantId),
    ]);

    res.json({
      success: true,
      data: {
        summary: financialSummary,
        account_balances: accountBalances,
        recent_transactions: recentTransactions,
        cash_flow: cashFlow,
        pending_reconciliations: pendingReconciliations,
        recent_journal_entries: recentJournalEntries,
      },
    });
  } catch (error: any) {
    console.error('Financial workspace error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch financial workspace data',
    });
  }
};

/**
 * Get account balances grouped by type
 */
async function getAccountBalances(tenantId: string) {
  const result = await query(
    `
    SELECT 
      account_type,
      COUNT(*) as account_count,
      SUM(balance) as total_balance
    FROM chart_of_accounts
    WHERE tenant_id = $1 AND is_active = true
    GROUP BY account_type
    ORDER BY account_type
    `,
    [tenantId]
  );

  return result.rows.map((row) => ({
    account_type: row.account_type,
    account_count: Number(row.account_count) || 0,
    total_balance: Number(row.total_balance) || 0,
  }));
}

/**
 * Get recent transactions (last 10)
 */
async function getRecentTransactions(tenantId: string) {
  const result = await query(
    `
    SELECT 
      jel.id,
      je.journal_number,
      je.journal_date,
      jel.account_code,
      coa.account_name,
      jel.debit,
      jel.credit,
      je.description
    FROM journal_entry_lines jel
    JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
    JOIN chart_of_accounts coa ON jel.account_code = coa.account_code AND coa.tenant_id = $1
    WHERE je.tenant_id = $1 AND je.status = 'posted'
    ORDER BY je.journal_date DESC, je.created_at DESC
    LIMIT 10
    `,
    [tenantId]
  );

  return result.rows.map((row) => ({
    ...row,
    debit: Number(row.debit) || 0,
    credit: Number(row.credit) || 0,
  }));
}

/**
 * Get cash flow data for last 6 months
 */
async function getCashFlowData(tenantId: string) {
  const result = await query(
    `
    SELECT 
      DATE_TRUNC('month', je.journal_date) as month,
      SUM(CASE WHEN coa.account_type = 'Asset' THEN jel.debit - jel.credit ELSE 0 END) as cash_inflow,
      SUM(CASE WHEN coa.account_type = 'Liability' OR coa.account_type = 'Equity' 
           THEN jel.credit - jel.debit ELSE 0 END) as cash_outflow
    FROM journal_entry_lines jel
    JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
    JOIN chart_of_accounts coa ON jel.account_code = coa.account_code AND coa.tenant_id = $1
    WHERE je.tenant_id = $1 
      AND je.status = 'posted'
      AND je.journal_date >= NOW() - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', je.journal_date)
    ORDER BY month DESC
    `,
    [tenantId]
  );

  return result.rows.map((row) => ({
    month: row.month,
    cash_inflow: Number(row.cash_inflow) || 0,
    cash_outflow: Number(row.cash_outflow) || 0,
  }));
}

/**
 * Get pending reconciliations count
 */
async function getPendingReconciliations(tenantId: string) {
  const result = await query(
    `
    SELECT 
      COUNT(*) as pending_count,
      SUM(unreconciled_amount) as total_unreconciled
    FROM (
      SELECT 
        account_code,
        ABS(SUM(debit - credit)) as unreconciled_amount
      FROM journal_entry_lines jel
      JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
      WHERE je.tenant_id = $1 
        AND je.status = 'posted'
        AND jel.reconciled = false
      GROUP BY account_code
      HAVING ABS(SUM(debit - credit)) > 0
    ) as unreconciled_accounts
    `,
    [tenantId]
  );

  const row = result.rows[0];
  return {
    pending_count: Number(row?.pending_count) || 0,
    total_unreconciled: Number(row?.total_unreconciled) || 0,
  };
}

/**
 * Get financial summary metrics
 */
async function getFinancialSummary(tenantId: string) {
  const result = await query(
    `
    SELECT 
      SUM(CASE WHEN account_type = 'Asset' THEN balance ELSE 0 END) as total_assets,
      SUM(CASE WHEN account_type = 'Liability' THEN balance ELSE 0 END) as total_liabilities,
      SUM(CASE WHEN account_type = 'Equity' THEN balance ELSE 0 END) as total_equity,
      SUM(CASE WHEN account_type = 'Revenue' THEN balance ELSE 0 END) as total_revenue,
      SUM(CASE WHEN account_type = 'Expense' THEN balance ELSE 0 END) as total_expenses
    FROM chart_of_accounts
    WHERE tenant_id = $1 AND is_active = true
    `,
    [tenantId]
  );
  const summary = result.rows[0] || {};

  const totals = {
    total_assets: Number(summary.total_assets) || 0,
    total_liabilities: Number(summary.total_liabilities) || 0,
    total_equity: Number(summary.total_equity) || 0,
    total_revenue: Number(summary.total_revenue) || 0,
    total_expenses: Number(summary.total_expenses) || 0,
  };

  return {
    ...totals,
    net_profit: totals.total_revenue - totals.total_expenses,
  };
}

/**
 * Get recent journal entries (last 5)
 */
async function getRecentJournalEntries(tenantId: string) {
  const result = await query(
    `
    SELECT 
      id,
      journal_number,
      journal_date,
      description,
      status,
      total_debit,
      total_credit,
      created_at
    FROM journal_entries
    WHERE tenant_id = $1
    ORDER BY created_at DESC
    LIMIT 5
    `,
    [tenantId]
  );

  return result.rows;
}
