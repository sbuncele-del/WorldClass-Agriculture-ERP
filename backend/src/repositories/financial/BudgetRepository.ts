/**
 * Budget Repository
 * 
 * Handles all database operations for budgets
 * with automatic tenant isolation.
 */

import { BaseRepository, TenantContext, PaginatedResult, PaginationOptions } from '../BaseRepository';

export type BudgetStatus = 'draft' | 'approved' | 'active' | 'closed';

export interface BudgetLine {
  id: string;
  budget_id: string;
  account_id: string;
  account_number?: string;
  account_name?: string;
  period_1?: number;
  period_2?: number;
  period_3?: number;
  period_4?: number;
  period_5?: number;
  period_6?: number;
  period_7?: number;
  period_8?: number;
  period_9?: number;
  period_10?: number;
  period_11?: number;
  period_12?: number;
  total_budget: number;
}

export interface Budget {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  fiscal_year_id?: string;
  start_date: Date;
  end_date: Date;
  status: BudgetStatus;
  total_budget: number;
  lines?: BudgetLine[];
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
}

export interface BudgetVsActual {
  account_id: string;
  account_number: string;
  account_name: string;
  budget_amount: number;
  actual_amount: number;
  variance: number;
  variance_percent: number;
}

export class BudgetRepository extends BaseRepository<Budget> {
  protected tableName = 'budgets';
  protected schema = 'financial';

  /**
   * Get budget with lines
   */
  async getBudgetWithLines(ctx: TenantContext, budgetId: string): Promise<Budget | null> {
    const budget = await this.findById(ctx, budgetId);
    if (!budget) return null;

    const linesSql = `
      SELECT bl.*, a.account_number, a.name as account_name
      FROM financial.budget_lines bl
      JOIN financial.accounts a ON a.id = bl.account_id
      WHERE bl.budget_id = $2 AND bl.tenant_id = $1
      ORDER BY a.account_number
    `;

    const lines = await this.rawQuery<BudgetLine>(ctx, linesSql, [budgetId]);
    return { ...budget, lines };
  }

  /**
   * Get active budget for current period
   */
  async getActiveBudget(ctx: TenantContext): Promise<Budget | null> {
    const sql = `
      SELECT * FROM ${this.fullTableName}
      WHERE tenant_id = $1 
        AND deleted_at IS NULL
        AND status = 'active'
        AND CURRENT_DATE BETWEEN start_date AND end_date
      LIMIT 1
    `;

    const result = await this.rawQuery<Budget>(ctx, sql);
    return result[0] || null;
  }

  /**
   * Get budget vs actual comparison
   */
  async getBudgetVsActual(
    ctx: TenantContext,
    budgetId: string,
    asOfDate?: Date
  ): Promise<BudgetVsActual[]> {
    const budget = await this.findById(ctx, budgetId);
    if (!budget) throw new Error('Budget not found');

    const sql = `
      SELECT 
        a.id as account_id,
        a.account_number,
        a.name as account_name,
        COALESCE(bl.total_budget, 0) as budget_amount,
        COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) as actual_amount,
        COALESCE(bl.total_budget, 0) - COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) as variance,
        CASE WHEN COALESCE(bl.total_budget, 0) = 0 THEN 0
          ELSE ((COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) / bl.total_budget) - 1) * 100
        END as variance_percent
      FROM financial.accounts a
      LEFT JOIN financial.budget_lines bl ON bl.account_id = a.id AND bl.budget_id = $2
      LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id AND jel.tenant_id = $1
      LEFT JOIN journal_entries je ON je.entry_id = jel.journal_entry_id 
        AND je.status = 'posted' 
        AND je.posting_date BETWEEN $3 AND $4
      WHERE a.tenant_id = $1 
        AND a.deleted_at IS NULL 
        AND a.is_header = false
        AND a.account_type IN ('expense', 'revenue')
      GROUP BY a.id, a.account_number, a.name, bl.total_budget
      HAVING COALESCE(bl.total_budget, 0) > 0 OR COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) != 0
      ORDER BY a.account_number
    `;

    return this.rawQuery(ctx, sql, [budgetId, budget.start_date, asOfDate || budget.end_date]);
  }

  /**
   * Approve budget
   */
  async approveBudget(ctx: TenantContext, budgetId: string): Promise<Budget | null> {
    return this.update(ctx, budgetId, { status: 'approved' });
  }

  /**
   * Activate budget
   */
  async activateBudget(ctx: TenantContext, budgetId: string): Promise<Budget | null> {
    return this.update(ctx, budgetId, { status: 'active' });
  }
}

// Singleton instance
export const budgetRepository = new BudgetRepository();
export default budgetRepository;
