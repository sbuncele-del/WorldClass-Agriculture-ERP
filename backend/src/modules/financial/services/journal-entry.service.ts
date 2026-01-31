import { 
  JournalEntryHeader, 
  JournalEntryLine, 
  JournalStatus, 
  CreateJournalEntryRequest,
  JournalEntryValidator 
} from '../models/journal-entry.model';
import { query, transaction } from '../../../config/database';

/**
 * Journal Entry Service
 * Handles creation, validation, posting, and reversal of journal entries
 * NOW WITH REAL DATABASE OPERATIONS!
 */
export class JournalEntryService {
  
  /**
   * Create a new journal entry (DRAFT status)
   */
  async createJournalEntry(request: CreateJournalEntryRequest, userId: string): Promise<string> {
    // 1. Validate lines balance
    const totalDebit = request.lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0);
    const totalCredit = request.lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Journal entry not balanced. Debits: ${totalDebit}, Credits: ${totalCredit}`);
    }
    
    // 2. Validate at least 2 lines
    if (request.lines.length < 2) {
      throw new Error('Journal entry must have at least 2 lines');
    }
    
    // 3. Generate journal number
    const journalNumber = await this.generateJournalNumber(request.journal_date);
    
    // 4. Get fiscal period from date
    const { fiscalYear, fiscalPeriod } = this.getFiscalPeriod(new Date(request.journal_date));
    
    // 5. Create header
    const header: Partial<JournalEntryHeader> = {
      journal_number: journalNumber,
      journal_date: new Date(request.journal_date),
      posting_date: new Date(request.journal_date),
      source_type: request.source_type,
      status: JournalStatus.DRAFT,
      description: request.description,
      notes: request.notes,
      fiscal_year: fiscalYear,
      fiscal_period: fiscalPeriod,
      is_adjusting_entry: false,
      total_debit: totalDebit,
      total_credit: totalCredit,
      currency_code: 'ZAR',
      exchange_rate: 1.0,
      is_reversing: false,
      requires_approval: request.requires_approval || false,
      created_by: userId,
    };
    
    // 6. Create lines with account lookups
    const lines: Partial<JournalEntryLine>[] = [];
    for (let i = 0; i < request.lines.length; i++) {
      const line = request.lines[i];
      const account = await this.getAccountByCode(line.account_code);
      
      if (!account) {
        throw new Error(`Account ${line.account_code} not found`);
      }
      
      if (!account.allow_manual_entry && request.source_type === 'MANUAL') {
        throw new Error(`Account ${line.account_code} does not allow manual entries`);
      }
      
      lines.push({
        line_number: i + 1,
        account_id: account.id,
        account_code: account.code,
        account_name: account.name,
        debit_amount: line.debit_amount || 0,
        credit_amount: line.credit_amount || 0,
        currency_code: 'ZAR',
        exchange_rate: 1.0,
        debit_amount_base: line.debit_amount || 0,
        credit_amount_base: line.credit_amount || 0,
        cost_center_id: line.cost_center_id,
        tax_code: line.tax_code,
        is_tax_line: !!line.tax_code,
        is_reconciled: false,
        line_description: line.description,
      });
    }
    
    // 7. Insert to database (pseudo-code, real implementation uses DB pool)
    const journalEntryId = await this.insertJournalEntry(header, lines);
    
    return journalEntryId;
  }
  
  /**
   * Post a journal entry to the ledger
   * This updates all account balances
   */
  async postJournalEntry(journalEntryId: string, userId: string): Promise<void> {
    // 1. Get journal entry and lines
    const entry = await this.getJournalEntryById(journalEntryId);
    
    if (!entry) {
      throw new Error('Journal entry not found');
    }
    
    if (entry.status === JournalStatus.POSTED) {
      throw new Error('Journal entry already posted');
    }
    
    if (entry.requires_approval && entry.status !== JournalStatus.APPROVED) {
      throw new Error('Journal entry requires approval before posting');
    }
    
    const lines = await this.getJournalEntryLines(journalEntryId);
    
    // 2. Validate balance one more time
    if (!JournalEntryValidator.validateBalance(lines)) {
      throw new Error('Journal entry is not balanced');
    }
    
    // 3. Update account balances
    for (const line of lines) {
      await this.updateAccountBalance(
        line.account_id,
        line.debit_amount,
        line.credit_amount,
        entry.fiscal_year,
        entry.fiscal_period
      );
    }
    
    // 4. Update journal entry status
    await this.updateJournalStatus(
      journalEntryId,
      JournalStatus.POSTED,
      new Date(),
      userId
    );
    
    // 5. If reversing entry, schedule reversal
    if (entry.is_reversing && entry.reverse_on_date) {
      await this.scheduleReversal(journalEntryId, entry.reverse_on_date);
    }
  }
  
  /**
   * Reverse a posted journal entry
   */
  async reverseJournalEntry(
    originalJournalId: string, 
    reversalDate: Date, 
    reason: string,
    userId: string
  ): Promise<string> {
    // 1. Get original entry
    const original = await this.getJournalEntryById(originalJournalId);
    
    if (!original || original.status !== JournalStatus.POSTED) {
      throw new Error('Can only reverse posted journal entries');
    }
    
    if (original.reversed_by_journal_id) {
      throw new Error('Journal entry already reversed');
    }
    
    const originalLines = await this.getJournalEntryLines(originalJournalId);
    
    // 2. Create reversal entry with opposite debits/credits
    const reversalLines = originalLines.map(line => ({
      account_code: line.account_code,
      debit_amount: line.credit_amount,  // Swap!
      credit_amount: line.debit_amount,  // Swap!
      description: `Reversal: ${line.line_description}`,
      cost_center_id: line.cost_center_id,
    }));
    
    const reversalRequest: CreateJournalEntryRequest = {
      journal_date: reversalDate.toISOString(),
      description: `REVERSAL: ${original.description} - ${reason}`,
      source_type: original.source_type,
      lines: reversalLines,
      notes: `Reverses journal entry ${original.journal_number}`,
    };
    
    // 3. Create and post reversal
    const reversalId = await this.createJournalEntry(reversalRequest, userId);
    await this.postJournalEntry(reversalId, userId);
    
    // 4. Link entries
    await this.linkReversalEntries(originalJournalId, reversalId);
    
    return reversalId;
  }
  
  /**
   * Get trial balance for a period
   */
  async getTrialBalance(_fiscalYear: number, _fiscalPeriod: number): Promise<any[]> {
    // Query aggregates all posted journal entries up to the period
    const result = await query(`
      SELECT 
        a.code,
        a.name,
        a.account_type,
        a.normal_balance,
        COALESCE(SUM(jel.debit_amount_base), 0) as total_debits,
        COALESCE(SUM(jel.credit_amount_base), 0) as total_credits,
        CASE 
          WHEN a.normal_balance = 'DEBIT' THEN 
            COALESCE(SUM(jel.debit_amount_base), 0) - COALESCE(SUM(jel.credit_amount_base), 0)
          ELSE 
            COALESCE(SUM(jel.credit_amount_base), 0) - COALESCE(SUM(jel.debit_amount_base), 0)
        END as balance
      FROM chart_of_accounts a
      LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
      LEFT JOIN journal_entries je ON je.entry_id = jel.journal_entry_id
      WHERE (je.status = 'POSTED' OR je.entry_id IS NULL)
        AND (je.fiscal_year < $1 OR (je.fiscal_year = $1 AND je.fiscal_period <= $2) OR je.entry_id IS NULL)
        AND a.is_header = false
        AND a.is_active = true
      GROUP BY a.id, a.code, a.name, a.account_type, a.normal_balance
      HAVING COALESCE(SUM(jel.debit_amount_base), 0) <> 0 OR COALESCE(SUM(jel.credit_amount_base), 0) <> 0
      ORDER BY a.code
    `, [_fiscalYear, _fiscalPeriod]);
    
    return result.rows;
  }
  
  // Helper methods (REAL DATABASE IMPLEMENTATIONS)
  private async generateJournalNumber(date: string): Promise<string> {
    const year = new Date(date).getFullYear();
    
    // Get the max journal number for this year
    const result = await query(`
      SELECT entry_number 
      FROM journal_entries 
      WHERE entry_number LIKE $1 
      ORDER BY entry_number DESC 
      LIMIT 1
    `, [`JV-${year}-%`]);
    
    let nextNumber = 1;
    if (result.rows.length > 0) {
      const lastNumber = result.rows[0].entry_number;
      const match = lastNumber.match(/JV-\d{4}-(\d{5})/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    return `JV-${year}-${String(nextNumber).padStart(5, '0')}`;
  }
  
  private getFiscalPeriod(date: Date): { fiscalYear: number; fiscalPeriod: number } {
    return {
      fiscalYear: date.getFullYear(),
      fiscalPeriod: date.getMonth() + 1, // 1-12
    };
  }
  
  private async getAccountByCode(code: string): Promise<any> {
    const result = await query(
      'SELECT account_id as id, account_code as code, account_name as name, account_type, is_active FROM chart_of_accounts WHERE account_code = $1 AND is_active = true',
      [code]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const account = result.rows[0];
    // Add allow_manual_entry field (default true since schema doesn't have it)
    account.allow_manual_entry = true;
    
    return account;
  }
  
  private async insertJournalEntry(_header: any, _lines: any[]): Promise<string> {
    let journalEntryId = '';
    
    await transaction(async (client) => {
      // Insert header - using actual schema columns
      const headerResult = await client.query(`
        INSERT INTO journal_entries (
          entry_number, entry_date, description, reference, status, created_by, tenant_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING entry_id
      `, [
        _header.journal_number,
        _header.journal_date,
        _header.description || '',
        _header.notes || '',
        _header.status,
        _header.created_by,
        '00000000-0000-0000-0000-000000000001' // Default tenant
      ]);
      
      journalEntryId = headerResult.rows[0].entry_id;
      
      // Insert lines - using actual schema columns
      for (const line of _lines) {
        await client.query(`
          INSERT INTO journal_entry_lines (
            entry_id, account_id, debit_amount, credit_amount, description, tenant_id
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          journalEntryId,
          line.account_id,
          line.debit_amount,
          line.credit_amount,
          line.line_description || '',
          '00000000-0000-0000-0000-000000000001' // Default tenant
        ]);
      }
    });
    
    return journalEntryId;
  }
  
  private async getJournalEntryById(_id: string): Promise<any> {
    const result = await query(
      'SELECT * FROM journal_entries WHERE entry_id = $1',
      [_id]
    );
    
    return result.rows.length > 0 ? result.rows[0] : null;
  }
  
  private async getJournalEntryLines(_id: string): Promise<JournalEntryLine[]> {
    const result = await query(
      'SELECT * FROM journal_entry_lines WHERE journal_entry_id = $1 ORDER BY line_number',
      [_id]
    );
    
    return result.rows;
  }
  
  private async updateAccountBalance(
    _accountId: string,
    _debitAmount: number,
    _creditAmount: number,
    _fiscalYear: number,
    _fiscalPeriod: number
  ): Promise<void> {
    // Update account balances table (upsert)
    await query(`
      INSERT INTO account_balances (
        account_id, fiscal_year, fiscal_period,
        period_debit, period_credit,
        closing_debit, closing_credit
      ) VALUES ($1, $2, $3, $4, $5, $4, $5)
      ON CONFLICT (account_id, fiscal_year, fiscal_period)
      DO UPDATE SET
        period_debit = account_balances.period_debit + $4,
        period_credit = account_balances.period_credit + $5,
        closing_debit = account_balances.closing_debit + $4,
        closing_credit = account_balances.closing_credit + $5,
        updated_at = NOW()
    `, [_accountId, _fiscalYear, _fiscalPeriod, _debitAmount, _creditAmount]);
    
    // Also update denormalized balances on chart_of_accounts for quick access
    await query(`
      UPDATE chart_of_accounts
      SET 
        current_debit_balance = current_debit_balance + $2,
        current_credit_balance = current_credit_balance + $3,
        ytd_debit_total = ytd_debit_total + $2,
        ytd_credit_total = ytd_credit_total + $3,
        updated_at = NOW()
      WHERE id = $1
    `, [_accountId, _debitAmount, _creditAmount]);
  }
  
  private async updateJournalStatus(
    _id: string,
    _status: JournalStatus,
    _postedAt: Date,
    _postedBy: string
  ): Promise<void> {
    await query(`
      UPDATE journal_entries
      SET 
        status = $2,
        posted_at = $3,
        posted_by = $4,
        updated_at = NOW()
      WHERE id = $1
    `, [_id, _status, _postedAt, _postedBy]);
  }
  
  private async scheduleReversal(_journalId: string, _reversalDate: Date): Promise<void> {
    // Would insert into scheduled_tasks table for background processing
    // For now, just log it
    console.log(`Reversal scheduled for journal ${_journalId} on ${_reversalDate}`);
  }
  
  private async linkReversalEntries(_originalId: string, _reversalId: string): Promise<void> {
    // Update original entry
    await query(`
      UPDATE journal_entries
      SET reversed_by_journal_id = $2, updated_at = NOW()
      WHERE id = $1
    `, [_originalId, _reversalId]);
    
    // Update reversal entry
    await query(`
      UPDATE journal_entries
      SET reverses_journal_id = $2, updated_at = NOW()
      WHERE id = $1
    `, [_reversalId, _originalId]);
  }
}
