/**
 * Account Repository (Chart of Accounts)
 * 
 * Handles all database operations for GL accounts
 * with automatic tenant isolation.
 */

import { BaseRepository, TenantContext, PaginatedResult, PaginationOptions } from '../BaseRepository';

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface Account {
  id: string;
  tenant_id: string;
  account_number: string;
  name: string;
  description?: string;
  account_type: AccountType;
  parent_id?: string;
  is_header: boolean;
  is_active: boolean;
  is_system: boolean;  // System accounts can't be deleted
  currency_code?: string;
  opening_balance?: number;
  current_balance?: number;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
}

export class AccountRepository extends BaseRepository<Account> {
  protected tableName = 'accounts';
  protected schema = 'financial';

  /**
   * Get chart of accounts tree
   */
  async getChartOfAccounts(ctx: TenantContext): Promise<Account[]> {
    // Simplified query - no recursive tree, just flat list
    const sql = `
      SELECT 
        account_id as id,
        tenant_id,
        code as account_number,
        name,
        description,
        account_type,
        parent_code as parent_id,
        normal_balance,
        is_active,
        is_header,
        current_balance as balance,
        created_at,
        updated_at
      FROM chart_of_accounts
      WHERE tenant_id = $1
      ORDER BY code
    `;

    return this.rawQuery(ctx, sql);
  }

  /**
   * Get accounts by type
   */
  async getAccountsByType(ctx: TenantContext, accountType: AccountType): Promise<Account[]> {
    return this.findBy(ctx, 'account_type', accountType);
  }

  /**
   * Get posting accounts only (non-header accounts)
   */
  async getPostingAccounts(ctx: TenantContext): Promise<Account[]> {
    const result = await this.findAll(ctx, { is_header: false, is_active: true });
    return result.data;
  }

  /**
   * Check if account number is unique
   */
  async isAccountNumberUnique(ctx: TenantContext, accountNumber: string, excludeId?: string): Promise<boolean> {
    const existing = await this.findOne(ctx, { account_number: accountNumber });
    if (!existing) return true;
    if (excludeId && existing.id === excludeId) return true;
    return false;
  }

  /**
   * Get account balance
   */
  async getAccountBalance(ctx: TenantContext, accountId: string, asOfDate?: Date): Promise<number> {
    const dateCondition = asOfDate ? 'AND je.posting_date <= $3' : '';
    const params: any[] = [accountId];
    if (asOfDate) params.push(asOfDate);

    const sql = `
      SELECT 
        COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) as balance
      FROM journal_entry_lines jel
      JOIN journal_entries je ON je.entry_id = jel.journal_entry_id
      WHERE jel.tenant_id = $1 AND jel.account_id = $2 AND je.status = 'posted' ${dateCondition}
    `;

    const result = await this.rawQuery(ctx, sql, params);
    return parseFloat(result[0]?.balance || '0');
  }

  /**
   * Get trial balance
   */
  async getTrialBalance(ctx: TenantContext, asOfDate: Date): Promise<{
    account_id: string;
    account_number: string;
    account_name: string;
    account_type: AccountType;
    debit_balance: number;
    credit_balance: number;
  }[]> {
    const sql = `
      SELECT 
        a.id as account_id,
        a.account_code as account_number,
        a.account_name as account_name,
        a.account_type,
        COALESCE(CASE WHEN SUM(COALESCE(jel.debit_amount, 0) - COALESCE(jel.credit_amount, 0)) > 0 
          THEN SUM(COALESCE(jel.debit_amount, 0) - COALESCE(jel.credit_amount, 0)) ELSE 0 END, 0) as debit_balance,
        COALESCE(CASE WHEN SUM(COALESCE(jel.debit_amount, 0) - COALESCE(jel.credit_amount, 0)) < 0 
          THEN ABS(SUM(COALESCE(jel.debit_amount, 0) - COALESCE(jel.credit_amount, 0))) ELSE 0 END, 0) as credit_balance
      FROM ${this.fullTableName} a
      LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id AND jel.tenant_id = a.tenant_id
      LEFT JOIN journal_entries je ON je.entry_id = jel.journal_entry_id AND je.tenant_id = a.tenant_id 
        AND je.status = 'posted' AND je.posting_date <= $2
      WHERE a.tenant_id = $1 AND a.deleted_at IS NULL AND a.is_header = false
      GROUP BY a.id, a.account_code, a.account_name, a.account_type
      HAVING COALESCE(SUM(COALESCE(jel.debit_amount, 0) - COALESCE(jel.credit_amount, 0)), 0) != 0
      ORDER BY a.account_code
    `;

    return this.rawQuery(ctx, sql, [asOfDate]);
  }
}

// Singleton instance
export const accountRepository = new AccountRepository();
export default accountRepository;
