/**
 * Bank Account Repository
 * 
 * Handles all database operations for bank accounts
 * with automatic tenant isolation.
 */

import { BaseRepository, TenantContext, PaginatedResult, PaginationOptions } from '../BaseRepository';

export interface BankAccount {
  id: string;
  tenant_id: string;
  name: string;
  account_number: string;
  bank_name: string;
  branch_code?: string;
  swift_code?: string;
  iban?: string;
  currency_code: string;
  gl_account_id?: string;
  current_balance: number;
  is_default: boolean;
  is_active: boolean;
  last_reconciled_date?: Date;
  last_reconciled_balance?: number;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
}

export class BankAccountRepository extends BaseRepository<BankAccount> {
  protected tableName = 'bank_accounts';
  protected schema = 'financial';

  /**
   * Get all active bank accounts
   */
  async getActiveAccounts(ctx: TenantContext): Promise<BankAccount[]> {
    const result = await this.findAll(ctx, { is_active: true });
    return result.data;
  }

  /**
   * Get default bank account
   */
  async getDefaultAccount(ctx: TenantContext): Promise<BankAccount | null> {
    return this.findOne(ctx, { is_default: true, is_active: true });
  }

  /**
   * Set default bank account
   */
  async setDefaultAccount(ctx: TenantContext, accountId: string): Promise<void> {
    const client = await this.beginTransaction();

    try {
      await client.query(`
        UPDATE ${this.fullTableName}
        SET is_default = false, updated_at = NOW()
        WHERE tenant_id = $1
      `, [ctx.tenantId]);

      await client.query(`
        UPDATE ${this.fullTableName}
        SET is_default = true, updated_at = NOW()
        WHERE tenant_id = $1 AND id = $2
      `, [ctx.tenantId, accountId]);

      await this.commitTransaction(client);
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }

  /**
   * Update balance after transaction
   */
  async updateBalance(ctx: TenantContext, accountId: string, amount: number): Promise<BankAccount | null> {
    const sql = `
      UPDATE ${this.fullTableName}
      SET current_balance = current_balance + $1, updated_at = NOW(), updated_by = $2
      WHERE id = $3 AND tenant_id = $4
      RETURNING *
    `;

    const result = await this.query<BankAccount>(sql, [amount, ctx.userId, accountId, ctx.tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Get total cash balance across all accounts
   */
  async getTotalBalance(ctx: TenantContext): Promise<{ currency_code: string; total: number }[]> {
    const sql = `
      SELECT currency_code, SUM(current_balance) as total
      FROM ${this.fullTableName}
      WHERE tenant_id = $1 AND deleted_at IS NULL AND is_active = true
      GROUP BY currency_code
    `;

    return this.rawQuery(ctx, sql);
  }

  /**
   * Record reconciliation
   */
  async recordReconciliation(
    ctx: TenantContext,
    accountId: string,
    reconcileDate: Date,
    reconcileBalance: number
  ): Promise<BankAccount | null> {
    return this.update(ctx, accountId, {
      last_reconciled_date: reconcileDate,
      last_reconciled_balance: reconcileBalance
    });
  }
}

// Singleton instance
export const bankAccountRepository = new BankAccountRepository();
export default bankAccountRepository;
