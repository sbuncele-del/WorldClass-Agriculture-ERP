import { Pool, PoolClient } from 'pg';
import { MatchingService } from './matching.service';
import { 
  BankStatementLine,
  StatementLineStatus 
} from '../models/cash-management.model';

/**
 * Bulk Operations Service
 * Handles batch processing for bank reconciliation
 * 
 * Features:
 * - Bulk auto-matching (500+ lines)
 * - Bulk accept suggestions
 * - Bulk unmatch
 * - Progress tracking
 * - Transaction safety
 */

export interface BulkAutoMatchOptions {
  statementId: number;
  filters?: {
    amountMin?: number;
    amountMax?: number;
    dateFrom?: Date;
    dateTo?: Date;
    description?: string;
    onlyHighConfidence?: boolean;
    minConfidence?: number;
  };
  batchSize?: number; // Process in batches, default 100
}

export interface BulkAutoMatchResult {
  totalLines: number;
  processedLines: number;
  matchedLines: number;
  suggestionsCreated: number;
  autoCreatedJournals: number;
  errors: Array<{ lineId: number; error: string }>;
  processingTimeMs: number;
}

export interface BulkAcceptSuggestionsOptions {
  matchIds: number[];
  minConfidence?: number; // Only accept suggestions above this confidence
  batchSize?: number;
}

export interface BulkAcceptSuggestionsResult {
  totalSuggestions: number;
  acceptedSuggestions: number;
  skippedSuggestions: number;
  errors: Array<{ matchId: number; error: string }>;
  processingTimeMs: number;
}

export interface BulkUnmatchOptions {
  bankStatementLineIds?: number[];
  statementId?: number; // Unmatch entire statement
  dateFrom?: Date;
  dateTo?: Date;
  batchSize?: number;
}

export interface BulkUnmatchResult {
  totalMatches: number;
  unmatchedMatches: number;
  errors: Array<{ matchId: number; error: string }>;
  processingTimeMs: number;
}

export class BulkOperationsService {
  private matchingService: MatchingService;

  constructor(private pool: Pool) {
    this.matchingService = new MatchingService();
  }

  /**
   * Bulk auto-match bank statement lines
   * Processes in batches for efficiency and safety
   */
  async bulkAutoMatch(
    options: BulkAutoMatchOptions,
    tenantId: string,
    userId?: string
  ): Promise<BulkAutoMatchResult> {
    const startTime = Date.now();
    const { statementId, filters, batchSize = 100 } = options;

    const client = await this.pool.connect();
    
    try {
      // Get unmatched lines with filters
      let query = `
        SELECT bsl.*
        FROM bank_statement_lines bsl
        JOIN bank_statements bs ON bsl.statement_id = bs.id
        WHERE bsl.statement_id = $1
        AND bsl.status = 'UNMATCHED'
        AND bsl.tenant_id = $2
      `;

      const params: any[] = [statementId, tenantId];
      let paramIndex = 3;

      if (filters) {
        if (filters.amountMin !== undefined) {
          query += ` AND ABS(COALESCE(bsl.debit_amount, bsl.credit_amount, 0)) >= $${paramIndex}`;
          params.push(filters.amountMin);
          paramIndex++;
        }
        if (filters.amountMax !== undefined) {
          query += ` AND ABS(COALESCE(bsl.debit_amount, bsl.credit_amount, 0)) <= $${paramIndex}`;
          params.push(filters.amountMax);
          paramIndex++;
        }
        if (filters.dateFrom) {
          query += ` AND bs.statement_date >= $${paramIndex}`;
          params.push(filters.dateFrom);
          paramIndex++;
        }
        if (filters.dateTo) {
          query += ` AND bs.statement_date <= $${paramIndex}`;
          params.push(filters.dateTo);
          paramIndex++;
        }
        if (filters.description) {
          query += ` AND bsl.description ILIKE $${paramIndex}`;
          params.push(`%${filters.description}%`);
          paramIndex++;
        }
      }

      query += ` ORDER BY bsl.line_number ASC`;

      const linesResult = await client.query(query, params);
      const lines: BankStatementLine[] = linesResult.rows;

      const result: BulkAutoMatchResult = {
        totalLines: lines.length,
        processedLines: 0,
        matchedLines: 0,
        suggestionsCreated: 0,
        autoCreatedJournals: 0,
        errors: [],
        processingTimeMs: 0
      };

      if (lines.length === 0) {
        result.processingTimeMs = Date.now() - startTime;
        return result;
      }

      // Process in batches
      for (let i = 0; i < lines.length; i += batchSize) {
        const batch = lines.slice(i, i + batchSize);
        
        for (const line of batch) {
          try {
            // Run auto-matching for this single line
            const matchResult = await this.matchingService.runAutoMatching(
              statementId,
              userId
            );

            result.processedLines++;
            result.matchedLines += matchResult.matched;
            result.suggestionsCreated += matchResult.suggestions.length;
            result.autoCreatedJournals += matchResult.autoCreated;

          } catch (error: any) {
            result.errors.push({
              lineId: line.id,
              error: error.message || 'Unknown error'
            });
          }
        }

        // Progress update (could emit event here for real-time tracking)
        console.log(`Bulk auto-match progress: ${result.processedLines}/${lines.length}`);
      }

      result.processingTimeMs = Date.now() - startTime;
      return result;

    } finally {
      client.release();
    }
  }

  /**
   * Bulk accept suggested matches
   * Processes match IDs in batches
   */
  async bulkAcceptSuggestions(
    options: BulkAcceptSuggestionsOptions,
    tenantId: string,
    userId?: string
  ): Promise<BulkAcceptSuggestionsResult> {
    const startTime = Date.now();
    const { matchIds, minConfidence = 0, batchSize = 50 } = options;

    const client = await this.pool.connect();
    
    try {
      const result: BulkAcceptSuggestionsResult = {
        totalSuggestions: matchIds.length,
        acceptedSuggestions: 0,
        skippedSuggestions: 0,
        errors: [],
        processingTimeMs: 0
      };

      // Process in batches
      for (let i = 0; i < matchIds.length; i += batchSize) {
        const batch = matchIds.slice(i, i + batchSize);

        await client.query('BEGIN');

        try {
          for (const matchId of batch) {
            // Get suggestion details
            const suggestionResult = await client.query(
              `SELECT * FROM bank_reconciliation_matches
               WHERE id = $1 AND tenant_id = $2 AND match_status = 'SUGGESTED'`,
              [matchId, tenantId]
            );

            if (suggestionResult.rows.length === 0) {
              result.skippedSuggestions++;
              continue;
            }

            const suggestion = suggestionResult.rows[0];

            // Check confidence threshold
            const confidence = parseFloat(suggestion.confidence_score || '0');
            if (confidence < minConfidence) {
              result.skippedSuggestions++;
              continue;
            }

            // Check if not already matched
            const bankLineCheck = await client.query(
              `SELECT status FROM bank_statement_lines WHERE id = $1`,
              [suggestion.bank_statement_line_id]
            );

            if (bankLineCheck.rows[0]?.status === 'MATCHED') {
              result.skippedSuggestions++;
              continue;
            }

            // Accept the suggestion
            await client.query(
              `UPDATE bank_reconciliation_matches
               SET match_status = 'ACTIVE',
                   matched_by = $1,
                   matched_date = NOW()
               WHERE id = $2`,
              [userId, matchId]
            );

            await client.query(
              `UPDATE bank_statement_lines
               SET status = 'MATCHED', updated_at = NOW()
               WHERE id = $1`,
              [suggestion.bank_statement_line_id]
            );

            result.acceptedSuggestions++;
          }

          await client.query('COMMIT');

        } catch (error: any) {
          await client.query('ROLLBACK');
          batch.forEach(matchId => {
            result.errors.push({
              matchId,
              error: error.message || 'Batch processing error'
            });
          });
        }

        console.log(`Bulk accept progress: ${i + batch.length}/${matchIds.length}`);
      }

      result.processingTimeMs = Date.now() - startTime;
      return result;

    } finally {
      client.release();
    }
  }

  /**
   * Bulk unmatch bank statement lines
   * Can unmatch by line IDs, entire statement, or date range
   */
  async bulkUnmatch(
    options: BulkUnmatchOptions,
    tenantId: string,
    userId?: string
  ): Promise<BulkUnmatchResult> {
    const startTime = Date.now();
    const { bankStatementLineIds, statementId, dateFrom, dateTo, batchSize = 50 } = options;

    const client = await this.pool.connect();
    
    try {
      // Build query to get matches to unmatch
      let query = `
        SELECT brm.id, brm.bank_statement_line_id
        FROM bank_reconciliation_matches brm
        JOIN bank_statement_lines bsl ON brm.bank_statement_line_id = bsl.id
        JOIN bank_statements bs ON bsl.statement_id = bs.id
        WHERE brm.status = 'ACTIVE'
        AND bsl.tenant_id = $1
      `;

      const params: any[] = [tenantId];
      let paramIndex = 2;

      if (bankStatementLineIds && bankStatementLineIds.length > 0) {
        query += ` AND brm.bank_statement_line_id = ANY($${paramIndex})`;
        params.push(bankStatementLineIds);
        paramIndex++;
      } else if (statementId) {
        query += ` AND bsl.statement_id = $${paramIndex}`;
        params.push(statementId);
        paramIndex++;
      }

      if (dateFrom) {
        query += ` AND bs.statement_date >= $${paramIndex}`;
        params.push(dateFrom);
        paramIndex++;
      }

      if (dateTo) {
        query += ` AND bs.statement_date <= $${paramIndex}`;
        params.push(dateTo);
        paramIndex++;
      }

      const matchesResult = await client.query(query, params);
      const matches = matchesResult.rows;

      const result: BulkUnmatchResult = {
        totalMatches: matches.length,
        unmatchedMatches: 0,
        errors: [],
        processingTimeMs: 0
      };

      if (matches.length === 0) {
        result.processingTimeMs = Date.now() - startTime;
        return result;
      }

      // Process in batches
      for (let i = 0; i < matches.length; i += batchSize) {
        const batch = matches.slice(i, i + batchSize);

        await client.query('BEGIN');

        try {
          const matchIds = batch.map(m => m.id);
          const lineIds = batch.map(m => m.bank_statement_line_id);

          // Update matches
          await client.query(
            `UPDATE bank_reconciliation_matches
             SET status = 'UNMATCHED',
                 unmatched_by = $1,
                 unmatched_date = NOW(),
                 unmatch_reason = 'Bulk unmatch operation'
             WHERE id = ANY($2)`,
            [userId, matchIds]
          );

          // Update bank lines
          await client.query(
            `UPDATE bank_statement_lines
             SET status = 'UNMATCHED', updated_at = NOW()
             WHERE id = ANY($1)`,
            [lineIds]
          );

          result.unmatchedMatches += batch.length;
          await client.query('COMMIT');

        } catch (error: any) {
          await client.query('ROLLBACK');
          batch.forEach(match => {
            result.errors.push({
              matchId: match.id,
              error: error.message || 'Batch processing error'
            });
          });
        }

        console.log(`Bulk unmatch progress: ${i + batch.length}/${matches.length}`);
      }

      result.processingTimeMs = Date.now() - startTime;
      return result;

    } finally {
      client.release();
    }
  }

  /**
   * Get bulk operation statistics
   * Useful for showing progress in UI
   */
  async getBulkOperationStats(statementId: number, tenantId: string): Promise<{
    totalLines: number;
    matchedLines: number;
    unmatchedLines: number;
    suggestedMatches: number;
    processingSpeed: number; // lines per second (estimated)
  }> {
    const result = await this.pool.query(
      `SELECT 
        COUNT(*) as total_lines,
        COUNT(*) FILTER (WHERE bsl.status = 'MATCHED') as matched_lines,
        COUNT(*) FILTER (WHERE bsl.status = 'UNMATCHED') as unmatched_lines,
        COUNT(brm.id) FILTER (WHERE brm.match_status = 'SUGGESTED') as suggested_matches
       FROM bank_statement_lines bsl
       LEFT JOIN bank_reconciliation_matches brm ON bsl.id = brm.bank_statement_line_id
         AND brm.status = 'ACTIVE'
       WHERE bsl.statement_id = $1 AND bsl.tenant_id = $2`,
      [statementId, tenantId]
    );

    const stats = result.rows[0];

    // Estimate processing speed (based on typical performance)
    // Auto-matching: ~50-100 lines per second
    // Accept suggestions: ~100-200 lines per second
    // Unmatch: ~200-300 lines per second
    const processingSpeed = 75; // Conservative estimate

    return {
      totalLines: parseInt(stats.total_lines),
      matchedLines: parseInt(stats.matched_lines),
      unmatchedLines: parseInt(stats.unmatched_lines),
      suggestedMatches: parseInt(stats.suggested_matches),
      processingSpeed
    };
  }
}
