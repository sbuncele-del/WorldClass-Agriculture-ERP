import { Pool, PoolClient } from 'pg';
import { 
  BankStatementLine, 
  BankReconciliationMatch, 
  MatchType,
  MatchStatus 
} from '../models/cash-management.model';

/**
 * Partial Reconciliation Service
 * Handles amount differences in bank reconciliation
 * 
 * Examples:
 * - Bank fee: R10,000 sent, R9,950 received (R50 bank fee)
 * - FX difference: USD payment with exchange rate variance
 * - Rounding: R1,234.567 rounds to R1,234.57
 */

export enum DifferenceReason {
  BANK_FEE = 'BANK_FEE',
  FX_VARIANCE = 'FX_VARIANCE',
  ROUNDING = 'ROUNDING',
  DISCOUNT = 'DISCOUNT',
  INTEREST = 'INTEREST',
  OTHER = 'OTHER'
}

export interface PartialMatchRequest {
  bankStatementLineId: number;
  journalEntryLineId: number;
  differenceAmount: number;
  differenceReason: DifferenceReason;
  differenceAccountCode?: string; // GL account for posting difference
  notes?: string;
}

export interface PartialMatchResult {
  matchId: number;
  bankLineId: number;
  journalLineId: number;
  differenceJournalId?: number;
  differenceAmount: number;
  differenceReason: DifferenceReason;
  autoPosted: boolean;
}

export interface DifferenceAccountMapping {
  reason: DifferenceReason;
  defaultAccountCode: string;
  accountName: string;
}

export class PartialReconciliationService {
  constructor(private pool: Pool) {}

  /**
   * Get default GL accounts for difference reasons
   */
  private readonly DIFFERENCE_ACCOUNT_MAPPINGS: DifferenceAccountMapping[] = [
    { reason: DifferenceReason.BANK_FEE, defaultAccountCode: '5100', accountName: 'Bank Charges' },
    { reason: DifferenceReason.FX_VARIANCE, defaultAccountCode: '7900', accountName: 'Foreign Exchange Gain/Loss' },
    { reason: DifferenceReason.ROUNDING, defaultAccountCode: '7950', accountName: 'Rounding Adjustments' },
    { reason: DifferenceReason.DISCOUNT, defaultAccountCode: '6100', accountName: 'Discounts Received' },
    { reason: DifferenceReason.INTEREST, defaultAccountCode: '8100', accountName: 'Interest Income' },
    { reason: DifferenceReason.OTHER, defaultAccountCode: '7990', accountName: 'Miscellaneous Adjustments' }
  ];

  /**
   * Accept a partial match with amount difference
   * Auto-posts the difference to the appropriate GL account
   */
  async acceptPartialMatch(
    request: PartialMatchRequest,
    tenantId: string,
    userId?: string
  ): Promise<PartialMatchResult> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get bank statement line details
      const bankLineResult = await client.query(
        `SELECT bsl.*, bs.statement_date, ba.id as bank_account_id, ba.gl_account_code as bank_gl_code, ba.currency_code
         FROM bank_statement_lines bsl
         JOIN bank_statements bs ON bsl.statement_id = bs.id
         JOIN bank_accounts ba ON bs.bank_account_id = ba.id
         WHERE bsl.id = $1 AND bsl.tenant_id = $2`,
        [request.bankStatementLineId, tenantId]
      );

      if (bankLineResult.rows.length === 0) {
        throw new Error('Bank statement line not found');
      }

      const bankLine = bankLineResult.rows[0];

      if (bankLine.status === 'MATCHED') {
        throw new Error('Bank statement line is already matched');
      }

      // Get journal entry line details
      const journalLineResult = await client.query(
        `SELECT jel.*, je.entry_date, je.reference_number
         FROM journal_entry_lines jel
         JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
         WHERE jel.id = $1 AND je.tenant_id = $2`,
        [request.journalEntryLineId, tenantId]
      );

      if (journalLineResult.rows.length === 0) {
        throw new Error('Journal entry line not found');
      }

      const journalLine = journalLineResult.rows[0];

      // Check if journal line is already matched
      const existingMatchResult = await client.query(
        `SELECT id FROM bank_reconciliation_matches
         WHERE journal_entry_line_id = $1 AND status = 'ACTIVE'`,
        [request.journalEntryLineId]
      );

      if (existingMatchResult.rows.length > 0) {
        throw new Error('Journal entry line is already matched to another bank line');
      }

      // Validate difference amount
      const bankAmount = parseFloat((bankLine.debit_amount || bankLine.credit_amount || 0).toString());
      const journalAmount = parseFloat(journalLine.debit_amount || journalLine.credit_amount || '0');
      const actualDifference = Math.abs(Math.abs(bankAmount) - Math.abs(journalAmount));

      if (Math.abs(actualDifference - Math.abs(request.differenceAmount)) > 0.01) {
        throw new Error(`Difference amount mismatch. Expected: ${actualDifference.toFixed(2)}, Provided: ${Math.abs(request.differenceAmount).toFixed(2)}`);
      }

      // Create the main match
      const matchResult = await client.query(
        `INSERT INTO bank_reconciliation_matches (
          tenant_id,
          bank_statement_line_id,
          journal_entry_id,
          journal_entry_line_id,
          match_type,
          match_date,
          matched_by,
          statement_amount,
          journal_amount,
          status,
          notes
        ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, 'ACTIVE', $9)
        RETURNING id`,
        [
          tenantId,
          request.bankStatementLineId,
          journalLine.journal_entry_id,
          request.journalEntryLineId,
          MatchType.MANUAL,
          userId,
          bankAmount,
          journalAmount,
          `Partial match with ${request.differenceReason}: ${request.notes || ''}`
        ]
      );

      const matchId = matchResult.rows[0].id;

      // Update bank line status
      await client.query(
        `UPDATE bank_statement_lines 
         SET status = 'MATCHED', updated_at = NOW()
         WHERE id = $1`,
        [request.bankStatementLineId]
      );

      // Auto-post the difference
      let differenceJournalId: number | undefined;
      
      if (Math.abs(request.differenceAmount) > 0.01) {
        differenceJournalId = await this.createDifferenceJournal(
          bankLine,
          request,
          tenantId,
          userId,
          client
        );
      }

      await client.query('COMMIT');

      return {
        matchId,
        bankLineId: request.bankStatementLineId,
        journalLineId: request.journalEntryLineId,
        differenceJournalId,
        differenceAmount: request.differenceAmount,
        differenceReason: request.differenceReason,
        autoPosted: !!differenceJournalId
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create journal entry for the difference amount
   */
  private async createDifferenceJournal(
    bankLine: any,
    request: PartialMatchRequest,
    tenantId: string,
    userId: string | undefined,
    client: PoolClient
  ): Promise<number> {
    // Get difference account code
    const differenceAccountCode = request.differenceAccountCode || 
      this.DIFFERENCE_ACCOUNT_MAPPINGS.find(m => m.reason === request.differenceReason)?.defaultAccountCode ||
      '7990';

    // Determine if difference is debit or credit
    // If bank shows less than expected: expense (debit difference)
    // If bank shows more than expected: income (credit difference)
    const bankAmount = Math.abs(parseFloat((bankLine.debit_amount || bankLine.credit_amount || 0).toString()));
    const transactionType = bankLine.transaction_type || 'DEBIT';
    const differenceAmount = Math.abs(request.differenceAmount);

    let debitDifferenceAccount: boolean;
    let creditBankAccount: boolean;

    if (transactionType === 'DEBIT') {
      // Money out of bank
      // If bank shows R9,950 but we expected R10,000: R50 bank fee (debit expense, credit bank)
      debitDifferenceAccount = true;
      creditBankAccount = true;
    } else {
      // Money into bank
      // If bank shows R9,950 but we expected R10,000: R50 bank fee (debit bank, credit income)
      debitDifferenceAccount = false;
      creditBankAccount = false;
    }

    // Get account names
    const diffAccountResult = await client.query(
      `SELECT account_name FROM chart_of_accounts 
       WHERE account_code = $1 AND tenant_id = $2`,
      [differenceAccountCode, tenantId]
    );

    const diffAccountName = diffAccountResult.rows[0]?.account_name || 
      this.DIFFERENCE_ACCOUNT_MAPPINGS.find(m => m.reason === request.differenceReason)?.accountName ||
      'Adjustment';

    const bankAccountResult = await client.query(
      `SELECT account_name FROM chart_of_accounts 
       WHERE account_code = $1 AND tenant_id = $2`,
      [bankLine.bank_gl_code, tenantId]
    );

    const bankAccountName = bankAccountResult.rows[0]?.account_name || 'Bank Account';

    // Create journal entry
    const journalResult = await client.query(
      `INSERT INTO journal_entries (
        tenant_id,
        entry_date,
        reference_number,
        description,
        status,
        total_debit,
        total_credit,
        created_by,
        created_at
      ) VALUES ($1, $2, $3, $4, 'POSTED', $5, $5, $6, NOW())
      RETURNING id`,
      [
        tenantId,
        bankLine.statement_date,
        `DIFF-${bankLine.id}-${Date.now()}`,
        `${request.differenceReason.replace('_', ' ')} - ${request.notes || 'Reconciliation adjustment'}`,
        differenceAmount,
        userId
      ]
    );

    const journalId = journalResult.rows[0].id;

    // Create journal lines
    if (debitDifferenceAccount) {
      // Debit: Expense account, Credit: Bank
      await client.query(
        `INSERT INTO journal_entry_lines (
          journal_entry_id,
          account_code,
          description,
          debit_amount,
          credit_amount
        ) VALUES 
          ($1, $2, $3, $4, NULL),
          ($1, $5, $3, NULL, $4)`,
        [
          journalId,
          differenceAccountCode,
          `${diffAccountName} - Ref: ${bankLine.reference || bankLine.description}`,
          differenceAmount,
          bankLine.bank_gl_code
        ]
      );
    } else {
      // Debit: Bank, Credit: Income account
      await client.query(
        `INSERT INTO journal_entry_lines (
          journal_entry_id,
          account_code,
          description,
          debit_amount,
          credit_amount
        ) VALUES 
          ($1, $2, $3, $4, NULL),
          ($1, $5, $3, NULL, $4)`,
        [
          journalId,
          bankLine.bank_gl_code,
          `${diffAccountName} - Ref: ${bankLine.reference || bankLine.description}`,
          differenceAmount,
          differenceAccountCode
        ]
      );
    }

    return journalId;
  }

  /**
   * Get tolerance settings for partial matching
   */
  async getToleranceSettings(tenantId: string): Promise<{
    amountTolerance: number;
    percentageTolerance: number;
    maxDifference: number;
  }> {
    try {
      const result = await this.pool.query(
        `SELECT 
          COALESCE(amount_tolerance, 0.01) as amount_tolerance,
          COALESCE(percentage_tolerance, 0.5) as percentage_tolerance,
          COALESCE(max_difference, 100.00) as max_difference
         FROM tenant_settings 
         WHERE tenant_id = $1
         LIMIT 1`,
        [tenantId]
      );

      // If no settings found, return defaults
      if (result.rows.length === 0) {
        return {
          amountTolerance: 0.01,
          percentageTolerance: 0.5,
          maxDifference: 100.00
        };
      }

      return {
        amountTolerance: parseFloat(result.rows[0].amount_tolerance),
        percentageTolerance: parseFloat(result.rows[0].percentage_tolerance),
        maxDifference: parseFloat(result.rows[0].max_difference)
      };
    } catch (error) {
      // Table doesn't exist, return defaults
      return {
        amountTolerance: 0.01,
        percentageTolerance: 0.5,
        maxDifference: 100.00
      };
    }
  }

  /**
   * Check if a difference is within tolerance
   */
  async isWithinTolerance(
    amount1: number,
    amount2: number,
    tenantId: string
  ): Promise<{
    withinTolerance: boolean;
    difference: number;
    percentageDifference: number;
    reason: string;
  }> {
    const settings = await this.getToleranceSettings(tenantId);
    const difference = Math.abs(Math.abs(amount1) - Math.abs(amount2));
    const percentageDifference = (difference / Math.abs(amount1)) * 100;

    const withinAbsolute = difference <= settings.amountTolerance;
    const withinPercentage = percentageDifference <= settings.percentageTolerance;
    const withinMax = difference <= settings.maxDifference;

    const withinTolerance = (withinAbsolute || withinPercentage) && withinMax;

    let reason = '';
    if (!withinMax) {
      reason = `Difference R${difference.toFixed(2)} exceeds maximum R${settings.maxDifference.toFixed(2)}`;
    } else if (!withinAbsolute && !withinPercentage) {
      reason = `Difference R${difference.toFixed(2)} (${percentageDifference.toFixed(2)}%) exceeds tolerances`;
    } else {
      reason = 'Within tolerance';
    }

    return {
      withinTolerance,
      difference,
      percentageDifference,
      reason
    };
  }

  /**
   * Find potential partial matches for a bank line
   */
  async findPotentialPartialMatches(
    bankStatementLineId: number,
    tenantId: string
  ): Promise<any[]> {
    const client = await this.pool.connect();
    
    try {
      // Get bank line
      const bankLineResult = await client.query(
        `SELECT bsl.*, bs.statement_date
         FROM bank_statement_lines bsl
         JOIN bank_statements bs ON bsl.statement_id = bs.id
         WHERE bsl.id = $1 AND bsl.tenant_id = $2`,
        [bankStatementLineId, tenantId]
      );

      if (bankLineResult.rows.length === 0) {
        return [];
      }

      const bankLine = bankLineResult.rows[0];
      const bankAmount = Math.abs(parseFloat((bankLine.debit_amount || bankLine.credit_amount || 0).toString()));
      const settings = await this.getToleranceSettings(tenantId);

      // Find journal lines with amounts close to bank amount
      const minDate = new Date(bankLine.statement_date);
      const maxDate = new Date(bankLine.statement_date);
      minDate.setDate(minDate.getDate() - 14);
      maxDate.setDate(maxDate.getDate() + 14);

      const journalLinesResult = await client.query(
        `SELECT 
          jel.id,
          jel.journal_entry_id,
          jel.account_code,
          jel.description,
          jel.debit_amount,
          jel.credit_amount,
          COALESCE(jel.debit_amount, jel.credit_amount) as amount,
          ABS(ABS(COALESCE(jel.debit_amount, jel.credit_amount)) - $1) as difference,
          je.entry_date,
          je.reference_number,
          je.description as journal_description
         FROM journal_entry_lines jel
         JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
         WHERE je.tenant_id = $2
         AND je.entry_date BETWEEN $3 AND $4
         AND je.status = 'POSTED'
         AND ABS(ABS(COALESCE(jel.debit_amount, jel.credit_amount)) - $1) <= $5
         AND NOT EXISTS (
           SELECT 1 FROM bank_reconciliation_matches brm
           WHERE brm.journal_entry_line_id = jel.id
           AND brm.status = 'ACTIVE'
         )
         ORDER BY difference ASC
         LIMIT 20`,
        [bankAmount, tenantId, minDate, maxDate, settings.maxDifference]
      );

      // Enrich with tolerance check
      const matches = journalLinesResult.rows.map(line => {
        const difference = parseFloat(line.difference);
        const percentageDiff = (difference / bankAmount) * 100;

        return {
          ...line,
          bankAmount,
          difference,
          percentageDifference: percentageDiff,
          withinTolerance: difference <= settings.amountTolerance || percentageDiff <= settings.percentageTolerance,
          suggestedReason: this.suggestDifferenceReason(difference, percentageDiff)
        };
      });

      return matches;

    } finally {
      client.release();
    }
  }

  /**
   * Suggest a difference reason based on amount and percentage
   */
  private suggestDifferenceReason(difference: number, percentageDiff: number): DifferenceReason {
    if (difference < 0.05) {
      return DifferenceReason.ROUNDING;
    } else if (difference <= 100 && percentageDiff <= 1) {
      return DifferenceReason.BANK_FEE;
    } else if (percentageDiff > 2) {
      return DifferenceReason.FX_VARIANCE;
    } else {
      return DifferenceReason.OTHER;
    }
  }
}
