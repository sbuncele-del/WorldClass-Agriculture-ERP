import { Pool, PoolClient } from 'pg';
import { 
  BankStatementLine, 
  BankReconciliationMatch, 
  MatchType,
  MatchStatus 
} from '../models/cash-management.model';

/**
 * Multi-Line Matching Service
 * Handles ONE-TO-MANY and MANY-TO-ONE reconciliation scenarios
 * 
 * Examples:
 * - ONE-TO-MANY: Single bank deposit R50,000 = 10 invoices (R5k each)
 * - MANY-TO-ONE: 5 payments totaling R20,000 = Single supplier invoice
 */

export interface MultiLineMatchGroup {
  id?: number;
  tenant_id: string;
  group_reference: string;
  match_type: 'ONE_TO_MANY' | 'MANY_TO_ONE';
  bank_statement_line_ids: number[];
  journal_entry_line_ids: number[];
  total_bank_amount: number;
  total_journal_amount: number;
  difference_amount: number;
  matched_by: number;
  matched_date: Date;
  status: MatchStatus;
  notes?: string;
}

export interface MatchCombination {
  bankLines: BankStatementLine[];
  journalLines: any[];
  totalBankAmount: number;
  totalJournalAmount: number;
  difference: number;
  confidence: number;
  matchType: 'ONE_TO_MANY' | 'MANY_TO_ONE';
}

export interface FindCombinationsOptions {
  maxBankLines?: number; // Default: 10
  maxJournalLines?: number; // Default: 50
  tolerance?: number; // Default: 0.01 (R0.01)
  maxDifference?: number; // Default: 100 (R100)
  dateRange?: number; // Days, default: 14
}

export class MultiLineMatchingService {
  constructor(private pool: Pool) {}

  /**
   * Find combinations of journal lines that match bank line(s)
   * Uses dynamic programming for efficient combination finding
   */
  async findMatchingCombinations(
    bankLineIds: number[],
    tenantId: string,
    options: FindCombinationsOptions = {}
  ): Promise<MatchCombination[]> {
    const {
      maxBankLines = 10,
      maxJournalLines = 50,
      tolerance = 0.01,
      maxDifference = 100,
      dateRange = 14
    } = options;

    const client = await this.pool.connect();
    try {
      // Get bank lines with details
      const bankLinesResult = await client.query(
        `SELECT bsl.*, bs.statement_date, ba.currency_code,
         COALESCE(bsl.debit_amount, bsl.credit_amount, 0) as amount
         FROM bank_statement_lines bsl
         JOIN bank_statements bs ON bsl.statement_id = bs.id
         JOIN bank_accounts ba ON bs.bank_account_id = ba.id
         WHERE bsl.id = ANY($1) 
         AND bsl.tenant_id = $2
         AND bsl.status = 'UNMATCHED'
         ORDER BY COALESCE(bsl.debit_amount, bsl.credit_amount, 0) DESC`,
        [bankLineIds, tenantId]
      );

      const bankLines: BankStatementLine[] = bankLinesResult.rows;

      if (bankLines.length === 0) {
        return [];
      }

      if (bankLines.length > maxBankLines) {
        throw new Error(`Too many bank lines. Maximum ${maxBankLines} allowed for multi-line matching.`);
      }

      // Calculate target amount and date range
      const targetAmount = bankLines.reduce((sum, line) => {
        const amt = parseFloat((line.debit_amount || line.credit_amount || 0).toString());
        return sum + amt;
      }, 0);
      const minDate = new Date(Math.min(...bankLines.map(l => new Date(l.transaction_date).getTime())));
      const maxDate = new Date(Math.max(...bankLines.map(l => new Date(l.transaction_date).getTime())));
      
      // Expand date range
      minDate.setDate(minDate.getDate() - dateRange);
      maxDate.setDate(maxDate.getDate() + dateRange);

      // Get unmatched journal lines in date range
      const journalLinesResult = await client.query(
        `SELECT 
          jel.id,
          jel.journal_entry_id,
          jel.account_code,
          jel.description,
          jel.debit_amount,
          jel.credit_amount,
          COALESCE(jel.debit_amount, 0) - COALESCE(jel.credit_amount, 0) as net_amount,
          je.entry_date,
          je.reference_number,
          je.description as journal_description
         FROM journal_entry_lines jel
         JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
         WHERE je.tenant_id = $1
         AND je.entry_date BETWEEN $2 AND $3
         AND je.status = 'POSTED'
         AND NOT EXISTS (
           SELECT 1 FROM bank_reconciliation_matches brm
           WHERE brm.journal_entry_line_id = jel.id
           AND brm.status = 'ACTIVE'
         )
         ORDER BY ABS(COALESCE(jel.debit_amount, 0) - COALESCE(jel.credit_amount, 0) - $4)
         LIMIT $5`,
        [tenantId, minDate, maxDate, targetAmount, maxJournalLines]
      );

      const journalLines = journalLinesResult.rows;

      // Find combinations using dynamic programming
      const combinations = this.findCombinations(
        bankLines,
        journalLines,
        targetAmount,
        tolerance,
        maxDifference
      );

      return combinations;

    } finally {
      client.release();
    }
  }

  /**
   * Dynamic programming algorithm to find combinations
   * Finds all subsets of journal lines that sum close to target amount
   */
  private findCombinations(
    bankLines: BankStatementLine[],
    journalLines: any[],
    targetAmount: number,
    tolerance: number,
    maxDifference: number
  ): MatchCombination[] {
    const combinations: MatchCombination[] = [];
    const totalBankAmount = bankLines.reduce((sum, line) => {
      const amt = parseFloat((line.debit_amount || line.credit_amount || 0).toString());
      return sum + amt;
    }, 0);

    // Convert to cents to avoid floating point issues
    const targetCents = Math.round(Math.abs(totalBankAmount) * 100);
    const toleranceCents = Math.round(tolerance * 100);
    const maxDiffCents = Math.round(maxDifference * 100);

    // Subset sum with dynamic programming
    const n = journalLines.length;
    const maxSize = Math.min(n, 20); // Limit combination size

    // Try all possible combinations (up to maxSize items)
    for (let size = 1; size <= maxSize; size++) {
      this.findCombinationsRecursive(
        journalLines,
        [],
        0,
        size,
        targetCents,
        toleranceCents,
        maxDiffCents,
        bankLines,
        totalBankAmount,
        combinations
      );

      // If we found exact or very close matches, stop searching
      if (combinations.some(c => Math.abs(c.difference) <= tolerance)) {
        break;
      }
    }

    // Sort by confidence (smallest difference = highest confidence)
    combinations.sort((a, b) => b.confidence - a.confidence);

    return combinations.slice(0, 10); // Return top 10 matches
  }

  /**
   * Recursive function to find combinations of specific size
   */
  private findCombinationsRecursive(
    journalLines: any[],
    currentCombination: any[],
    startIndex: number,
    targetSize: number,
    targetCents: number,
    toleranceCents: number,
    maxDiffCents: number,
    bankLines: BankStatementLine[],
    totalBankAmount: number,
    results: MatchCombination[]
  ): void {
    // Base case: combination is complete
    if (currentCombination.length === targetSize) {
      const sum = currentCombination.reduce(
        (total, line) => total + Math.round(Math.abs(parseFloat(line.net_amount)) * 100),
        0
      );

      const diffCents = Math.abs(sum - targetCents);

      // Check if within tolerance
      if (diffCents <= maxDiffCents) {
        const totalJournalAmount = sum / 100;
        const difference = Math.abs(totalBankAmount) - totalJournalAmount;
        
        // Calculate confidence (100% = exact match, decreases with difference)
        const confidence = Math.max(0, 100 - (Math.abs(difference) / Math.abs(totalBankAmount) * 100));

        results.push({
          bankLines,
          journalLines: currentCombination,
          totalBankAmount,
          totalJournalAmount,
          difference,
          confidence,
          matchType: bankLines.length === 1 ? 'ONE_TO_MANY' : 'MANY_TO_ONE'
        });
      }
      return;
    }

    // Recursive case: try adding each remaining journal line
    for (let i = startIndex; i < journalLines.length; i++) {
      currentCombination.push(journalLines[i]);
      this.findCombinationsRecursive(
        journalLines,
        currentCombination,
        i + 1,
        targetSize,
        targetCents,
        toleranceCents,
        maxDiffCents,
        bankLines,
        totalBankAmount,
        results
      );
      currentCombination.pop();
    }
  }

  /**
   * Create a multi-line match group
   */
  async createMultiLineMatch(
    combination: MatchCombination,
    tenantId: string,
    userId?: string,
    notes?: string
  ): Promise<MultiLineMatchGroup> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Generate group reference
      const groupReference = `MLM-${Date.now()}`;

      // Insert multi-line match group
      const groupResult = await client.query(
        `INSERT INTO multi_line_match_groups (
          tenant_id,
          group_reference,
          match_type,
          bank_statement_line_ids,
          journal_entry_line_ids,
          total_bank_amount,
          total_journal_amount,
          difference_amount,
          matched_by,
          matched_date,
          status,
          notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), 'ACTIVE', $10)
        RETURNING *`,
        [
          tenantId,
          groupReference,
          combination.matchType,
          combination.bankLines.map(l => l.id),
          combination.journalLines.map(l => l.id),
          combination.totalBankAmount,
          combination.totalJournalAmount,
          combination.difference,
          userId,
          notes
        ]
      );

      const group: MultiLineMatchGroup = groupResult.rows[0];

      // Create individual matches for each bank line
      for (const bankLine of combination.bankLines) {
        for (const journalLine of combination.journalLines) {
          await client.query(
            `INSERT INTO bank_reconciliation_matches (
              tenant_id,
              bank_statement_line_id,
              journal_entry_line_id,
              match_type,
              match_status,
              matched_by,
              matched_date,
              confidence_score,
              multi_line_group_reference,
              notes
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9)`,
            [
              tenantId,
              bankLine.id,
              journalLine.id,
              MatchType.MANUAL, // Multi-line matches are always manual
              MatchStatus.ACTIVE,
              userId,
              combination.confidence,
              groupReference,
              `Multi-line match: ${combination.matchType}`
            ]
          );
        }

        // Update bank line status
        await client.query(
          `UPDATE bank_statement_lines 
           SET status = 'MATCHED', updated_at = NOW()
           WHERE id = $1`,
          [bankLine.id]
        );
      }

      // If there's a difference, auto-post to bank charges
      if (Math.abs(combination.difference) > 0.01) {
        await this.createBankChargesJournal(
          combination,
          groupReference,
          tenantId,
          userId,
          client
        );
      }

      await client.query('COMMIT');

      return group;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Auto-post difference to Bank Charges account
   */
  private async createBankChargesJournal(
    combination: MatchCombination,
    groupReference: string,
    tenantId: string,
    userId: string | undefined,
    client: PoolClient
  ): Promise<void> {
    const difference = Math.abs(combination.difference);

    // Get bank charges account code (configurable) - with fallback if table doesn't exist
    let bankChargesAccount = '5100'; // Default: Bank Charges
    try {
      const settingsResult = await client.query(
        `SELECT setting_value FROM tenant_settings
         WHERE tenant_id = $1 AND setting_key = 'bank_charges_account_code'`,
        [tenantId]
      );
      if (settingsResult.rows[0]?.setting_value) {
        bankChargesAccount = settingsResult.rows[0].setting_value;
      }
    } catch (e) {
      // Table doesn't exist, use default
    }

    // Get bank account GL code
    const bankAccountResult = await client.query(
      `SELECT ba.gl_account_code
       FROM cash_bank_accounts ba
       JOIN cash_bank_statements bs ON ba.account_id = bs.account_id
       JOIN cash_bank_statement_lines bsl ON bs.statement_id = bsl.statement_id
       WHERE bsl.line_id = $1`,
      [combination.bankLines[0].id]
    );

    const bankGLCode = bankAccountResult.rows[0]?.gl_account_code || '1100';

    // Create journal for the difference
    const journalResult = await client.query(
      `INSERT INTO journal_entries (
        tenant_id,
        entry_date,
        reference_number,
        description,
        status,
        total_debit,
        total_credit,
        created_by
      ) VALUES ($1, NOW(), $2, $3, 'POSTED', $4, $4, $5)
      RETURNING id`,
      [
        tenantId,
        `BC-${groupReference}`,
        `Bank charges - Multi-line match difference`,
        difference,
        userId
      ]
    );

    const journalId = journalResult.rows[0].id;

    // Create journal lines (Debit: Bank Charges, Credit: Bank)
    await client.query(
      `INSERT INTO journal_entry_lines (
        journal_entry_id,
        account_code,
        description,
        debit_amount,
        credit_amount
      ) VALUES 
        ($1, $2, 'Bank charges', $3, NULL),
        ($1, $4, 'Bank charges', NULL, $3)`,
      [journalId, bankChargesAccount, difference, bankGLCode]
    );
  }

  /**
   * Unmatch a multi-line group
   */
  async unmatchMultiLineGroup(
    groupId: number,
    tenantId: string,
    userId?: string
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Get group details
      const groupResult = await client.query(
        `SELECT * FROM multi_line_match_groups
         WHERE id = $1 AND tenant_id = $2`,
        [groupId, tenantId]
      );

      if (groupResult.rows.length === 0) {
        throw new Error('Multi-line match group not found');
      }

      const group = groupResult.rows[0];

      // Deactivate all matches in this group
      await client.query(
        `UPDATE bank_reconciliation_matches
         SET match_status = 'UNMATCHED', unmatched_by = $1, unmatched_date = NOW()
         WHERE multi_line_group_reference = $2`,
        [userId, group.group_reference]
      );

      // Revert bank line statuses
      await client.query(
        `UPDATE bank_statement_lines
         SET status = 'UNMATCHED', updated_at = NOW()
         WHERE id = ANY($1)`,
        [group.bank_statement_line_ids]
      );

      // Update group status
      await client.query(
        `UPDATE multi_line_match_groups
         SET status = 'UNMATCHED', updated_at = NOW()
         WHERE id = $1`,
        [groupId]
      );

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
