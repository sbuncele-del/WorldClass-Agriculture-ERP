/**
 * Journal Entry Repository
 * 
 * Handles all database operations for journal entries
 * with automatic tenant isolation.
 */

import { BaseRepository, TenantContext, PaginatedResult, PaginationOptions } from '../BaseRepository';

export type JournalEntryStatus = 'draft' | 'pending_approval' | 'posted' | 'reversed';
export type JournalType = 'general' | 'sales' | 'purchase' | 'cash' | 'adjustment' | 'closing';

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  account_number?: string;
  account_name?: string;
  description?: string;
  debit_amount: number;
  credit_amount: number;
  cost_center_id?: string;
  department_id?: string;
  project_id?: string;
  product_id?: string;
  location_id?: string;
}

export interface JournalEntry {
  id: string;
  tenant_id: string;
  entry_number: string;
  journal_type: JournalType;
  posting_date: Date;
  description: string;
  reference?: string;
  status: JournalEntryStatus;
  total_debit: number;
  total_credit: number;
  source_type?: string;  // 'INVOICE', 'PAYMENT', 'MANUAL', etc.
  source_id?: string;
  fiscal_year_id?: string;
  fiscal_period_id?: string;
  approved_by?: string;
  approved_at?: Date;
  posted_by?: string;
  posted_at?: Date;
  reverses_journal_id?: string;      // ID of the entry this reverses
  reversed_by_journal_id?: string;   // ID of the entry that reversed this
  is_reversing?: boolean;            // True if this is a reversal entry
  lines?: JournalEntryLine[];
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
}

export class JournalEntryRepository extends BaseRepository<JournalEntry> {
  protected tableName = 'journal_entries';
  protected schema = 'public';
  protected primaryKey = 'entry_id';
  protected softDelete = false;  // Table uses deleted_at now but we don't filter by it

  /**
   * Get entry with lines
   */
  async getEntryWithLines(ctx: TenantContext, entryId: string): Promise<JournalEntry | null> {
    const entry = await this.findById(ctx, entryId);
    if (!entry) return null;

    const linesSql = `
      SELECT jel.*, coa.account_code as account_number, coa.account_name as account_name
      FROM journal_entry_lines jel
      LEFT JOIN chart_of_accounts coa ON coa.account_id = jel.account_id
      WHERE jel.journal_entry_id = $2 AND jel.tenant_id = $1
      ORDER BY jel.line_number
    `;

    const lines = await this.rawQuery<JournalEntryLine>(ctx, linesSql, [entryId]);
    return { ...entry, lines };
  }

  /**
   * Create journal entry with lines
   */
  async createEntry(
    ctx: TenantContext,
    entryData: Partial<JournalEntry>,
    lines: Partial<JournalEntryLine>[]
  ): Promise<JournalEntry> {
    // Validate debits = credits (parseFloat to handle string values from DB)
    const totalDebit = lines.reduce((sum, l) => sum + parseFloat(String(l.debit_amount || 0)), 0);
    const totalCredit = lines.reduce((sum, l) => sum + parseFloat(String(l.credit_amount || 0)), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Journal entry must balance. Debits: ${totalDebit}, Credits: ${totalCredit}`);
    }

    const client = await this.beginTransaction();

    try {
      // Generate entry number
      const numResult = await client.query(`
        SELECT COALESCE(MAX(CAST(SUBSTRING(entry_number FROM '[0-9]+$') AS INTEGER)), 0) + 1 as next_num
        FROM ${this.fullTableName}
        WHERE tenant_id = $1
      `, [ctx.tenantId]);
      const entryNumber = `JE-${String(numResult.rows[0].next_num).padStart(6, '0')}`;

      // Create entry
      const entryResult = await client.query(`
        INSERT INTO ${this.fullTableName}
        (tenant_id, entry_number, journal_type, posting_date, description, reference,
         status, total_debit, total_credit, source_type, source_id, created_by, 
         reverses_journal_id, is_reversing)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `, [
        ctx.tenantId, entryNumber, entryData.journal_type || 'general',
        entryData.posting_date || new Date(), entryData.description,
        entryData.reference, entryData.status || 'draft',
        totalDebit, totalCredit, entryData.source_type || 'MANUAL', entryData.source_id, ctx.userId,
        entryData.reverses_journal_id || null, entryData.reverses_journal_id ? true : false
      ]);

      const entry = entryResult.rows[0];

      // Create lines
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        await client.query(`
          INSERT INTO journal_entry_lines
          (tenant_id, journal_entry_id, line_number, account_id, description,
           debit_amount, credit_amount, cost_center_id, department_id, project_id,
           product_id, location_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          ctx.tenantId, entry.entry_id, i + 1, line.account_id, line.description,
          line.debit_amount || 0, line.credit_amount || 0,
          line.cost_center_id || null, line.department_id || null, line.project_id || null,
          line.product_id || null, line.location_id || null
        ]);
      }

      await this.commitTransaction(client);
      return entry;
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }

  /**
   * Post a journal entry
   */
  async postEntry(ctx: TenantContext, entryId: string): Promise<JournalEntry | null> {
    const entry = await this.findById(ctx, entryId);
    if (!entry || entry.status !== 'draft') {
      throw new Error('Entry cannot be posted');
    }

    return this.update(ctx, entryId, {
      status: 'posted',
      posted_by: ctx.userId,
      posted_at: new Date()
    } as any);
  }

  /**
   * Reverse a posted journal entry
   */
  async reverseEntry(ctx: TenantContext, entryId: string, reversalDate: Date): Promise<JournalEntry> {
    const entry = await this.getEntryWithLines(ctx, entryId);
    if (!entry || entry.status !== 'posted') {
      throw new Error('Only posted entries can be reversed');
    }

    // Create reversal entry with swapped debits/credits
    const reversalLines = (entry.lines || []).map(line => ({
      account_id: line.account_id,
      description: `Reversal of ${entry.entry_number}: ${line.description || ''}`,
      debit_amount: line.credit_amount,
      credit_amount: line.debit_amount,
      cost_center_id: line.cost_center_id,
      project_id: line.project_id
    }));

    const reversalEntry = await this.createEntry(ctx, {
      journal_type: entry.journal_type,
      posting_date: reversalDate,
      description: `Reversal of ${entry.entry_number}`,
      reference: entry.reference,
      status: 'posted',
      reverses_journal_id: entryId
    }, reversalLines);

    // Mark original entry as reversed
    await this.update(ctx, entryId, { 
      status: 'reversed',
      reversed_by_journal_id: reversalEntry.id 
    } as any);

    return reversalEntry;
  }

  /**
   * Get entries by date range
   */
  async getEntriesByDateRange(
    ctx: TenantContext,
    startDate: Date,
    endDate: Date,
    status?: JournalEntryStatus,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<JournalEntry>> {
    const { page = 1, limit = 50 } = pagination || {};
    const offset = (page - 1) * limit;
    const params: any[] = [startDate, endDate];

    let conditions = 'posting_date BETWEEN $2 AND $3';
    let paramIndex = 4;

    if (status) {
      conditions += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const sql = `
      SELECT * FROM ${this.fullTableName}
      WHERE tenant_id = $1 AND deleted_at IS NULL AND ${conditions}
      ORDER BY posting_date DESC, entry_number DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const countSql = `
      SELECT COUNT(*) FROM ${this.fullTableName}
      WHERE tenant_id = $1 AND deleted_at IS NULL AND ${conditions}
    `;

    const [data, countResult] = await Promise.all([
      this.rawQuery<JournalEntry>(ctx, sql, params),
      this.rawQuery<{ count: string }>(ctx, countSql, params.slice(0, -2))
    ]);

    const total = parseInt(countResult[0]?.count || '0', 10);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Get account ledger (all entries for an account)
   */
  async getAccountLedger(
    ctx: TenantContext,
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    date: Date;
    entry_number: string;
    description: string;
    debit: number;
    credit: number;
    running_balance: number;
  }[]> {
    const sql = `
      WITH entries AS (
        SELECT 
          je.posting_date as date,
          je.entry_number,
          COALESCE(jel.description, je.description) as description,
          jel.debit_amount as debit,
          jel.credit_amount as credit
        FROM journal_entry_lines jel
        JOIN ${this.fullTableName} je ON je.entry_id = jel.journal_entry_id
        WHERE jel.tenant_id = $1 
          AND jel.account_id = $2
          AND je.status = 'posted'
          AND je.posting_date BETWEEN $3 AND $4
        ORDER BY je.posting_date, je.entry_number
      )
      SELECT 
        *,
        SUM(debit - credit) OVER (ORDER BY date, entry_number) as running_balance
      FROM entries
    `;

    return this.rawQuery(ctx, sql, [accountId, startDate, endDate]);
  }
}

// Singleton instance
export const journalEntryRepository = new JournalEntryRepository();
export default journalEntryRepository;
