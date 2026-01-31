/**
 * Cash Management Service - Part 2: Matching Algorithms
 * 
 * Auto-matching logic for bank reconciliation
 * Matches bank statement lines against cash_transactions
 * 
 * REWRITTEN: December 2025 - To work with actual cash_* schema
 * UPDATED: January 2026 - GL Integration for journal entry creation
 */

import pool from '../../../config/database';
import {
  BankStatementLine,
  BankReconciliationRule,
  BankReconciliationMatch,
  SuggestedMatch,
  ReconciliationWorkspaceData,
  ReconciliationStatistics,
  CreateMatchDto,
  UnmatchDto,
  MatchType,
  StatementLineStatus,
  MatchStatus,
  RuleActionType,
  ReconciliationRuleType
} from '../models/cash-management.model';
import glIntegrationService from './gl-integration.service';

export class MatchingService {
  
  // ============================================================
  // AUTO-MATCHING ALGORITHMS
  // ============================================================
  
  /**
   * Run auto-matching for a bank statement
   * Matches bank statement lines against cash_transactions
   */
  async runAutoMatching(statementId: number, userId?: string, tenantId?: string): Promise<{
    matched: number;
    suggestions: SuggestedMatch[];
    autoCreated: number;
  }> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const client = await pool.connect();
    
    try {
      // Ensure statement belongs to tenant (via join with accounts)
      const stmtCheck = await client.query(`
        SELECT s.statement_id, s.account_id, a.tenant_id
        FROM cash_bank_statements s
        JOIN cash_bank_accounts a ON s.account_id = a.account_id
        WHERE s.statement_id = $1
      `, [statementId]);
      
      const stmt = stmtCheck.rows[0];
      if (!stmt || stmt.tenant_id !== tenantId) {
        throw new Error('Statement not found for tenant');
      }
      
      await client.query('BEGIN');
      
      // Get unmatched lines from this statement
      const linesResult = await client.query(`
        SELECT l.*, s.account_id
        FROM cash_bank_statement_lines l
        JOIN cash_bank_statements s ON l.statement_id = s.statement_id
        WHERE l.statement_id = $1 
        AND l.is_matched = false
        ORDER BY l.transaction_date ASC, l.line_number ASC
      `, [statementId]);
      
      const lines = linesResult.rows;
      
      // Get active rules for this tenant (ordered by priority)
      const rulesResult = await client.query(`
        SELECT * FROM cash_reconciliation_rules
        WHERE tenant_id = $1
        AND is_active = true
        ORDER BY priority DESC
      `, [tenantId]);
      
      const rules = rulesResult.rows;
      
      let matchedCount = 0;
      let autoCreatedCount = 0;
      const suggestions: SuggestedMatch[] = [];
      
      // Process each unmatched line
      for (const line of lines) {
        let matchedThisLine = false;
        
        // First, try exact matches by amount and date against cash_transactions
        const exactMatches = await this.findExactTransactionMatches(line, tenantId, client);
        
        if (exactMatches.length === 1 && exactMatches[0].confidence >= 90) {
          // Single high-confidence match - auto-match it
          await this.linkMatch(
            line.line_id, 
            exactMatches[0].transaction_id, 
            exactMatches[0].confidence,
            userId,
            client
          );
          matchedCount++;
          matchedThisLine = true;
        } else if (exactMatches.length > 0) {
          // Multiple potential matches - add as suggestions
          suggestions.push(...exactMatches.map(m => ({
            statement_line: line,
            transaction: m,
            confidence_score: m.confidence,
            rule_name: 'Exact Amount Match',
            match_reasons: m.reasons
          })));
        }
        
        // If not matched, try rule-based matching
        if (!matchedThisLine) {
          for (const rule of rules) {
            if (matchedThisLine) break;
            
            const ruleMatches = await this.applyRule(line, rule, tenantId, client);
            
            if (ruleMatches.length === 1 && ruleMatches[0].confidence >= 85 && rule.auto_approve) {
              // Auto-match with high confidence rule
              await this.linkMatch(
                line.line_id,
                ruleMatches[0].transaction_id,
                ruleMatches[0].confidence,
                userId,
                client
              );
              matchedCount++;
              matchedThisLine = true;
              
              // Update rule stats
              await client.query(`
                UPDATE cash_reconciliation_rules
                SET matches_count = COALESCE(matches_count, 0) + 1, 
                    last_matched = NOW()
                WHERE rule_id = $1
              `, [rule.rule_id]);
              
            } else if (ruleMatches.length > 0) {
              // Add as suggestions
              suggestions.push(...ruleMatches.map(m => ({
                statement_line: line,
                transaction: m,
                confidence_score: m.confidence,
                rule_name: rule.rule_name,
                match_reasons: m.reasons
              })));
            }
          }
        }
        
        // If still no match and rule allows auto-creation, create a new transaction
        if (!matchedThisLine) {
          for (const rule of rules) {
            if (matchedThisLine) break;
            
            if (this.ruleMatchesDescription(line, rule) && rule.create_transaction) {
              const newTxn = await this.createTransactionFromLine(line, rule, userId, client);
              if (newTxn) {
                await this.linkMatch(line.line_id, newTxn.transaction_id, 100, userId, client);
                matchedCount++;
                autoCreatedCount++;
                matchedThisLine = true;
              }
            }
          }
        }
      }
      
      // Update statement statistics
      await client.query(`
        UPDATE cash_bank_statements SET
          matched_lines = (
            SELECT COUNT(*) FROM cash_bank_statement_lines
            WHERE statement_id = $1 AND is_matched = true
          ),
          unmatched_lines = (
            SELECT COUNT(*) FROM cash_bank_statement_lines
            WHERE statement_id = $1 AND is_matched = false
          ),
          status = CASE
            WHEN (SELECT COUNT(*) FROM cash_bank_statement_lines WHERE statement_id = $1 AND is_matched = false) = 0
            THEN 'RECONCILED'
            ELSE 'IN_PROGRESS'
          END
        WHERE statement_id = $1
      `, [statementId]);
      
      await client.query('COMMIT');
      
      return {
        matched: matchedCount,
        suggestions,
        autoCreated: autoCreatedCount
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Find exact matches in cash_transactions by amount and approximate date
   */
  private async findExactTransactionMatches(
    line: any,
    tenantId: string,
    client: any
  ): Promise<any[]> {
    
    const lineAmount = Math.abs(line.debit_amount || 0) + Math.abs(line.credit_amount || 0);
    const isDebit = (line.debit_amount || 0) > 0;
    
    // Look for unreconciled transactions with matching amount
    const txnType = isDebit ? 'WITHDRAWAL' : 'DEPOSIT';
    
    // Date window: +/- 5 days
    const minDate = new Date(line.transaction_date);
    minDate.setDate(minDate.getDate() - 5);
    const maxDate = new Date(line.transaction_date);
    maxDate.setDate(maxDate.getDate() + 5);
    
    const result = await client.query(`
      SELECT t.*, a.account_name, a.account_number
      FROM cash_transactions t
      JOIN cash_bank_accounts a ON t.account_id = a.account_id
      WHERE t.tenant_id = $1
      AND t.account_id = $2
      AND t.is_reconciled = false
      AND ABS(t.amount - $3) < 0.01
      AND t.transaction_date BETWEEN $4 AND $5
      ORDER BY ABS(t.transaction_date - $6::date) ASC
      LIMIT 10
    `, [tenantId, line.account_id, lineAmount, minDate, maxDate, line.transaction_date]);
    
    return result.rows.map((txn: any) => {
      // Calculate confidence based on date proximity
      const dateDiff = Math.abs(
        new Date(line.transaction_date).getTime() - new Date(txn.transaction_date).getTime()
      ) / (1000 * 60 * 60 * 24);
      
      let confidence = 100 - (dateDiff * 5); // -5% per day difference
      
      // Boost confidence if reference matches
      if (line.reference && txn.reference && 
          line.reference.toLowerCase().includes(txn.reference.toLowerCase())) {
        confidence = Math.min(100, confidence + 20);
      }
      
      // Boost if description matches
      if (line.description && txn.description &&
          line.description.toLowerCase().includes(txn.description.toLowerCase())) {
        confidence = Math.min(100, confidence + 10);
      }
      
      return {
        transaction_id: txn.transaction_id,
        transaction_number: txn.transaction_number,
        transaction_date: txn.transaction_date,
        amount: txn.amount,
        description: txn.description,
        reference: txn.reference,
        payee_payer: txn.payee_payer,
        category: txn.category,
        confidence: Math.max(0, Math.round(confidence)),
        reasons: [
          `Exact amount match: R${lineAmount.toFixed(2)}`,
          `Date: ${new Date(txn.transaction_date).toLocaleDateString()} (${dateDiff.toFixed(0)} days difference)`,
          `Account: ${txn.account_name}`
        ]
      };
    });
  }
  
  /**
   * Apply a reconciliation rule to a statement line
   */
  private async applyRule(
    line: any,
    rule: any,
    tenantId: string,
    client: any
  ): Promise<any[]> {
    
    // Parse rule conditions (JSONB)
    const conditions = rule.conditions || {};
    
    // Check if rule matches this line
    if (!this.ruleMatchesDescription(line, rule)) {
      return [];
    }
    
    // If rule matches, find potential transactions
    const lineAmount = Math.abs(line.debit_amount || 0) + Math.abs(line.credit_amount || 0);
    const tolerance = conditions.amount_tolerance || 0.01;
    
    const result = await client.query(`
      SELECT t.*, a.account_name
      FROM cash_transactions t
      JOIN cash_bank_accounts a ON t.account_id = a.account_id
      WHERE t.tenant_id = $1
      AND t.account_id = $2
      AND t.is_reconciled = false
      AND ABS(t.amount - $3) <= $4
      ORDER BY t.transaction_date DESC
      LIMIT 5
    `, [tenantId, line.account_id, lineAmount, tolerance]);
    
    return result.rows.map((txn: any) => ({
      transaction_id: txn.transaction_id,
      transaction_number: txn.transaction_number,
      transaction_date: txn.transaction_date,
      amount: txn.amount,
      description: txn.description,
      reference: txn.reference,
      confidence: rule.auto_approve ? 90 : 70,
      reasons: [
        `Rule matched: ${rule.rule_name}`,
        `Amount: R${txn.amount.toFixed(2)}`,
        `Category: ${rule.auto_category || 'N/A'}`
      ]
    }));
  }
  
  /**
   * Check if a rule matches a statement line's description
   */
  private ruleMatchesDescription(line: any, rule: any): boolean {
    const conditions = rule.conditions || {};
    const description = (line.description || '').toLowerCase();
    
    // Check description_contains
    if (conditions.description_contains) {
      const keywords = Array.isArray(conditions.description_contains) 
        ? conditions.description_contains 
        : conditions.description_contains.split('|');
      
      const matches = keywords.some((kw: string) => 
        description.includes(kw.toLowerCase().trim())
      );
      if (!matches) return false;
    }
    
    // Check amount range
    const lineAmount = Math.abs(line.debit_amount || 0) + Math.abs(line.credit_amount || 0);
    
    if (conditions.amount_range) {
      const [min, max] = conditions.amount_range;
      if (lineAmount < min || lineAmount > max) return false;
    }
    
    if (conditions.min_amount && lineAmount < conditions.min_amount) return false;
    if (conditions.max_amount && lineAmount > conditions.max_amount) return false;
    
    // Check transaction type
    if (conditions.transaction_type) {
      const isDebit = (line.debit_amount || 0) > 0;
      const lineType = isDebit ? 'DEBIT' : 'CREDIT';
      if (conditions.transaction_type !== lineType) return false;
    }
    
    return true;
  }
  
  /**
   * Link a bank statement line to a cash transaction (create match)
   */
  private async linkMatch(
    lineId: number,
    transactionId: number,
    confidence: number,
    userId: string | undefined,
    client: any
  ): Promise<void> {
    // Update the bank statement line
    await client.query(`
      UPDATE cash_bank_statement_lines
      SET is_matched = true,
          matched_transaction_id = $1,
          match_confidence = $2,
          match_date = NOW(),
          matched_by = $3
      WHERE line_id = $4
    `, [transactionId, confidence, userId, lineId]);
    
    // Update the cash transaction
    await client.query(`
      UPDATE cash_transactions
      SET is_reconciled = true,
          reconciled_date = CURRENT_DATE,
          reconciled_by = $1,
          statement_line_id = $2,
          status = 'RECONCILED'
      WHERE transaction_id = $3
    `, [userId, lineId, transactionId]);
  }
  
  /**
   * Create a new cash transaction from a bank statement line
   */
  private async createTransactionFromLine(
    line: any,
    rule: any,
    userId: string | undefined,
    client: any
  ): Promise<any> {
    const lineAmount = Math.abs(line.debit_amount || 0) + Math.abs(line.credit_amount || 0);
    const isDebit = (line.debit_amount || 0) > 0;
    const txnType = isDebit ? 'WITHDRAWAL' : 'DEPOSIT';
    
    // Generate transaction number
    const txnNumber = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    // Get tenant from statement
    const stmtResult = await client.query(`
      SELECT a.tenant_id
      FROM cash_bank_statements s
      JOIN cash_bank_accounts a ON s.account_id = a.account_id
      WHERE s.statement_id = (
        SELECT statement_id FROM cash_bank_statement_lines WHERE line_id = $1
      )
    `, [line.line_id]);
    
    const tenantId = stmtResult.rows[0]?.tenant_id;
    
    const result = await client.query(`
      INSERT INTO cash_transactions (
        tenant_id, transaction_number, transaction_date, account_id,
        transaction_type, category, amount, payee_payer, reference,
        description, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'CLEARED', $11)
      RETURNING transaction_id
    `, [
      tenantId,
      txnNumber,
      line.transaction_date,
      line.account_id,
      txnType,
      rule.auto_category || 'GENERAL',
      lineAmount,
      line.payee_payer || line.description?.substring(0, 200),
      line.reference || txnNumber,
      line.description,
      userId
    ]);
    
    return result.rows[0];
  }
  
  // ============================================================
  // MANUAL MATCHING
  // ============================================================
  
  /**
   * Create a manual match between bank line and transaction
   */
  async createMatch(
    dto: CreateMatchDto | any,
    userId?: string,
    tenantId?: string,
    clientArg?: any
  ): Promise<BankReconciliationMatch> {
    if (!tenantId) throw new Error('Tenant ID is required');
    
    // Normalize parameter names
    const lineId = dto.bank_statement_line_id || dto.bankLineId || dto.lineId;
    const transactionId = dto.transaction_id || dto.transactionId;
    const notes = dto.notes || null;
    const matchType = dto.match_type || dto.matchType || 'MANUAL';
    
    const shouldRelease = !clientArg;
    const client = clientArg || await pool.connect();
    
    try {
      if (shouldRelease) await client.query('BEGIN');
      
      // Verify line belongs to tenant
      const lineResult = await client.query(`
        SELECT l.*, s.account_id, a.tenant_id
        FROM cash_bank_statement_lines l
        JOIN cash_bank_statements s ON l.statement_id = s.statement_id
        JOIN cash_bank_accounts a ON s.account_id = a.account_id
        WHERE l.line_id = $1
      `, [lineId]);
      
      const line = lineResult.rows[0];
      if (!line || line.tenant_id !== tenantId) {
        throw new Error('Bank statement line not found for tenant');
      }
      
      if (line.is_matched) {
        throw new Error('Bank statement line is already matched');
      }
      
      // Verify transaction exists and belongs to tenant
      const txnResult = await client.query(`
        SELECT * FROM cash_transactions WHERE transaction_id = $1 AND tenant_id = $2
      `, [transactionId, tenantId]);
      
      const txn = txnResult.rows[0];
      if (!txn) {
        throw new Error('Transaction not found for tenant');
      }
      
      if (txn.is_reconciled) {
        throw new Error('Transaction is already reconciled');
      }
      
      // Create the match record
      const matchResult = await client.query(`
        INSERT INTO bank_reconciliation_matches (
          bank_statement_line_id, transaction_id, match_type, 
          matched_by, statement_amount, transaction_amount, 
          status, notes, tenant_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        lineId,
        transactionId,
        matchType,
        userId,
        Math.abs(line.debit_amount || 0) + Math.abs(line.credit_amount || 0),
        txn.amount,
        'ACTIVE',
        notes,
        tenantId
      ]);
      
      // Link the match
      await this.linkMatch(lineId, transactionId, 100, userId, client);
      
      // Update statement stats
      await client.query(`
        UPDATE cash_bank_statements SET
          matched_lines = (
            SELECT COUNT(*) FROM cash_bank_statement_lines
            WHERE statement_id = $1 AND is_matched = true
          ),
          unmatched_lines = (
            SELECT COUNT(*) FROM cash_bank_statement_lines
            WHERE statement_id = $1 AND is_matched = false
          )
        WHERE statement_id = $1
      `, [line.statement_id]);
      
      if (shouldRelease) await client.query('COMMIT');
      
      return matchResult.rows[0];
      
    } catch (error) {
      if (shouldRelease) await client.query('ROLLBACK');
      throw error;
    } finally {
      if (shouldRelease) client.release();
    }
  }
  
  /**
   * Unmatch a transaction
   */
  async unmatch(dto: UnmatchDto, userId?: string, tenantId?: string): Promise<void> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get match details
      const matchResult = await client.query(
        'SELECT * FROM bank_reconciliation_matches WHERE id = $1 AND tenant_id = $2',
        [dto.match_id, tenantId]
      );
      
      const match = matchResult.rows[0];
      if (!match) {
        throw new Error('Match not found');
      }
      
      // Update match status
      await client.query(`
        UPDATE bank_reconciliation_matches
        SET status = 'UNMATCHED',
            unmatched_at = NOW(),
            unmatched_by = $1,
            unmatch_reason = $2
        WHERE id = $3 AND tenant_id = $4
      `, [userId, dto.unmatch_reason, dto.match_id, tenantId]);
      
      // Update bank statement line
      await client.query(`
        UPDATE cash_bank_statement_lines
        SET is_matched = false,
            matched_transaction_id = NULL,
            match_confidence = NULL,
            match_date = NULL,
            matched_by = NULL
        WHERE line_id = $1
      `, [match.bank_statement_line_id]);
      
      // Update cash transaction
      await client.query(`
        UPDATE cash_transactions
        SET is_reconciled = false,
            reconciled_date = NULL,
            reconciled_by = NULL,
            statement_line_id = NULL,
            status = 'CLEARED'
        WHERE transaction_id = $1
      `, [match.transaction_id]);
      
      // Update statement stats
      const stmtResult = await client.query(`
        SELECT statement_id FROM cash_bank_statement_lines WHERE line_id = $1
      `, [match.bank_statement_line_id]);
      
      if (stmtResult.rows[0]) {
        await client.query(`
          UPDATE cash_bank_statements SET
            matched_lines = (
              SELECT COUNT(*) FROM cash_bank_statement_lines
              WHERE statement_id = $1 AND is_matched = true
            ),
            unmatched_lines = (
              SELECT COUNT(*) FROM cash_bank_statement_lines
              WHERE statement_id = $1 AND is_matched = false
            ),
            status = 'IN_PROGRESS'
          WHERE statement_id = $1
        `, [stmtResult.rows[0].statement_id]);
      }
      
      await client.query('COMMIT');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // ============================================================
  // RECONCILIATION WORKSPACE
  // ============================================================
  
  /**
   * Get reconciliation workspace data for a statement
   */
  async getReconciliationWorkspace(statementId: number, tenantId?: string): Promise<ReconciliationWorkspaceData> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const client = await pool.connect();
    
    try {
      // Get statement with tenant check
      const statementResult = await client.query(`
        SELECT s.*, a.tenant_id, a.account_name, a.account_number
        FROM cash_bank_statements s
        JOIN cash_bank_accounts a ON s.account_id = a.account_id
        WHERE s.statement_id = $1
      `, [statementId]);
      
      const statement = statementResult.rows[0];
      if (!statement || statement.tenant_id !== tenantId) {
        throw new Error('Statement not found for tenant');
      }
      
      // Get all lines
      const linesResult = await client.query(`
        SELECT l.*, 
          t.transaction_number as matched_txn_number,
          t.description as matched_txn_description
        FROM cash_bank_statement_lines l
        LEFT JOIN cash_transactions t ON l.matched_transaction_id = t.transaction_id
        WHERE l.statement_id = $1 
        ORDER BY l.line_number
      `, [statementId]);
      
      const statement_lines = linesResult.rows;
      
      // Get unmatched lines
      const unmatchedLines = statement_lines.filter((l: any) => !l.is_matched);
      
      // Get unreconciled transactions for the period (potential matches)
      const txnsResult = await client.query(`
        SELECT t.*
        FROM cash_transactions t
        WHERE t.account_id = $1
        AND t.is_reconciled = false
        AND t.transaction_date BETWEEN $2 AND $3
        ORDER BY t.transaction_date DESC
      `, [statement.account_id, statement.period_from, statement.period_to]);
      
      const gl_transactions = txnsResult.rows;
      
      // Build suggested matches for unmatched lines
      const suggested_matches: SuggestedMatch[] = [];
      
      for (const line of unmatchedLines) {
        const matches = await this.findExactTransactionMatches(
          { ...line, account_id: statement.account_id },
          tenantId,
          client
        );
        
        for (const match of matches.slice(0, 3)) { // Top 3 suggestions per line
          suggested_matches.push({
            statement_line: line,
            transaction: match,
            confidence_score: match.confidence,
            rule_name: 'Amount Match',
            match_reasons: match.reasons
          });
        }
      }
      
      // Calculate statistics
      const matchedLines = statement_lines.filter((l: any) => l.is_matched);
      
      const statistics: ReconciliationStatistics = {
        total_lines: statement_lines.length,
        matched_lines: matchedLines.length,
        unmatched_lines: unmatchedLines.length,
        ignored_lines: 0, // We don't have is_ignored in our schema
        manual_entries_needed: unmatchedLines.length,
        total_matched_amount: matchedLines.reduce((sum: number, l: any) => 
          sum + Math.abs(l.debit_amount || 0) + Math.abs(l.credit_amount || 0), 0
        ),
        total_unmatched_amount: unmatchedLines.reduce((sum: number, l: any) => 
          sum + Math.abs(l.debit_amount || 0) + Math.abs(l.credit_amount || 0), 0
        ),
        reconciliation_percentage: statement_lines.length > 0
          ? (matchedLines.length / statement_lines.length) * 100
          : 0
      };
      
      return {
        statement,
        statement_lines,
        unmatched_lines: unmatchedLines,
        gl_transactions,
        suggested_matches,
        statistics
      };
      
    } finally {
      client.release();
    }
  }

  // ============================================================
  // DUPLICATE DETECTION
  // ============================================================

  /**
   * Check for duplicates before matching
   */
  async checkDuplicates(
    bankStatementLineId: number,
    transactionId: number,
    tenantId?: string
  ): Promise<{
    isDuplicate: boolean;
    warnings: string[];
    duplicateType?: 'BANK_LINE_MATCHED' | 'TRANSACTION_MATCHED' | 'SIMILAR_TRANSACTION';
    duplicateDetails?: any;
  }> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const client = await pool.connect();
    
    try {
      const warnings: string[] = [];
      let isDuplicate = false;
      let duplicateType: 'BANK_LINE_MATCHED' | 'TRANSACTION_MATCHED' | 'SIMILAR_TRANSACTION' | undefined;
      let duplicateDetails: any;

      // Check 1: Bank line already matched?
      const lineResult = await client.query(`
        SELECT l.*, t.transaction_number
        FROM cash_bank_statement_lines l
        LEFT JOIN cash_transactions t ON l.matched_transaction_id = t.transaction_id
        WHERE l.line_id = $1
      `, [bankStatementLineId]);

      if (lineResult.rows.length > 0 && lineResult.rows[0].is_matched) {
        const line = lineResult.rows[0];
        isDuplicate = true;
        duplicateType = 'BANK_LINE_MATCHED';
        duplicateDetails = line;
        warnings.push(
          `Bank statement line #${bankStatementLineId} is already matched ` +
          `to transaction ${line.transaction_number} ` +
          `on ${new Date(line.match_date).toLocaleDateString()}`
        );
      }

      // Check 2: Transaction already reconciled?
      const txnResult = await client.query(`
        SELECT t.*, l.line_id as matched_line_id
        FROM cash_transactions t
        LEFT JOIN cash_bank_statement_lines l ON t.statement_line_id = l.line_id
        WHERE t.transaction_id = $1 AND t.tenant_id = $2
      `, [transactionId, tenantId]);

      if (txnResult.rows.length > 0 && txnResult.rows[0].is_reconciled) {
        const txn = txnResult.rows[0];
        isDuplicate = true;
        duplicateType = 'TRANSACTION_MATCHED';
        duplicateDetails = txn;
        warnings.push(
          `Transaction ${txn.transaction_number} is already reconciled ` +
          `to bank line #${txn.matched_line_id} ` +
          `on ${new Date(txn.reconciled_date).toLocaleDateString()}`
        );
      }

      // Check 3: Similar transactions in recent period
      if (!isDuplicate) {
        const lineCheck = await client.query(`
          SELECT l.*, s.statement_date
          FROM cash_bank_statement_lines l
          JOIN cash_bank_statements s ON l.statement_id = s.statement_id
          WHERE l.line_id = $1
        `, [bankStatementLineId]);

        if (lineCheck.rows.length > 0) {
          const line = lineCheck.rows[0];
          const amount = Math.abs(line.debit_amount || 0) + Math.abs(line.credit_amount || 0);
          const statementDate = new Date(line.statement_date);
          const thirtyDaysAgo = new Date(statementDate);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const similarResult = await client.query(`
            SELECT l.line_id, l.description, 
              COALESCE(l.debit_amount, 0) + COALESCE(l.credit_amount, 0) as amount,
              l.reference, s.statement_date, l.is_matched,
              l.matched_transaction_id
            FROM cash_bank_statement_lines l
            JOIN cash_bank_statements s ON l.statement_id = s.statement_id
            JOIN cash_bank_accounts a ON s.account_id = a.account_id
            WHERE a.tenant_id = $1
            AND l.line_id != $2
            AND ABS(COALESCE(l.debit_amount, 0) + COALESCE(l.credit_amount, 0) - $3) < 0.01
            AND s.statement_date BETWEEN $4 AND $5
            ORDER BY s.statement_date DESC
            LIMIT 5
          `, [tenantId, bankStatementLineId, amount, thirtyDaysAgo, statementDate]);

          if (similarResult.rows.length > 0) {
            const similar = similarResult.rows[0];
            
            if (similar.matched_transaction_id === transactionId) {
              warnings.push(
                `Warning: Similar bank line #${similar.line_id} was already matched to this same transaction.`
              );
              duplicateType = 'SIMILAR_TRANSACTION';
              duplicateDetails = similar;
            } else if (similarResult.rows.length > 2) {
              warnings.push(
                `Info: Found ${similarResult.rows.length} similar transactions in the last 30 days. ` +
                `This might be a recurring payment.`
              );
            }
          }
        }
      }

      return {
        isDuplicate,
        warnings,
        duplicateType,
        duplicateDetails
      };

    } finally {
      client.release();
    }
  }

  /**
   * Find potential duplicate transactions
   */
  async findPotentialDuplicates(
    tenantId?: string,
    options: {
      dateRange?: number;
      amountTolerance?: number;
      includeMatched?: boolean;
    } = {}
  ): Promise<any[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const {
      dateRange = 30,
      amountTolerance = 0.01,
      includeMatched = false
    } = options;

    const client = await pool.connect();
    
    try {
      const statusFilter = includeMatched ? '' : `AND l1.is_matched = false`;

      const result = await client.query(`
        SELECT 
          l1.line_id as line1_id,
          l1.description as line1_description,
          COALESCE(l1.debit_amount, 0) + COALESCE(l1.credit_amount, 0) as line1_amount,
          l1.reference as line1_reference,
          s1.statement_date as line1_date,
          l1.is_matched as line1_matched,
          l2.line_id as line2_id,
          l2.description as line2_description,
          COALESCE(l2.debit_amount, 0) + COALESCE(l2.credit_amount, 0) as line2_amount,
          l2.reference as line2_reference,
          s2.statement_date as line2_date,
          l2.is_matched as line2_matched,
          ABS(s1.statement_date - s2.statement_date) as days_apart
        FROM cash_bank_statement_lines l1
        JOIN cash_bank_statements s1 ON l1.statement_id = s1.statement_id
        JOIN cash_bank_accounts a1 ON s1.account_id = a1.account_id
        JOIN cash_bank_statement_lines l2 ON l2.line_id > l1.line_id
        JOIN cash_bank_statements s2 ON l2.statement_id = s2.statement_id
        JOIN cash_bank_accounts a2 ON s2.account_id = a2.account_id
        WHERE a1.tenant_id = $1
        AND a2.tenant_id = $1
        ${statusFilter}
        AND ABS(
          (COALESCE(l1.debit_amount, 0) + COALESCE(l1.credit_amount, 0)) -
          (COALESCE(l2.debit_amount, 0) + COALESCE(l2.credit_amount, 0))
        ) <= $2
        AND ABS(s1.statement_date - s2.statement_date) <= $3
        ORDER BY s1.statement_date DESC
        LIMIT 100
      `, [tenantId, amountTolerance, dateRange]);

      // Calculate similarity scores
      const duplicates = result.rows.map(row => {
        const desc1 = (row.line1_description || '').toLowerCase();
        const desc2 = (row.line2_description || '').toLowerCase();
        
        const words1 = desc1.split(/\s+/).filter(w => w.length > 3);
        const words2 = desc2.split(/\s+/).filter(w => w.length > 3);
        const commonWords = words1.filter(w => words2.includes(w)).length;
        const descSimilarity = words1.length > 0 
          ? (commonWords / Math.max(words1.length, words2.length)) * 100
          : 0;

        const refSimilarity = row.line1_reference === row.line2_reference && 
          row.line1_reference?.length > 0 ? 100 : 0;

        const overall = (descSimilarity + refSimilarity) / 2;

        return {
          ...row,
          description_similarity: descSimilarity.toFixed(1),
          reference_similarity: refSimilarity,
          overall_similarity: overall.toFixed(1),
          is_likely_duplicate: overall > 70 && parseFloat(row.days_apart) <= 7
        };
      });

      return duplicates.filter(d => parseFloat(d.overall_similarity) > 50);

    } finally {
      client.release();
    }
  }

  // ============================================================
  // MATCH TO NEW TRANSACTION (Quick allocation with GL posting)
  // ============================================================

  /**
   * Match a bank line to a new transaction (for unrecognized items)
   * Creates transaction, links it, AND creates journal entry for GL
   * 
   * UPDATED January 2026: Now creates double-entry journal entries
   */
  async matchToNewTransaction(
    lineId: number,
    transactionData: {
      category?: string;
      description?: string;
      payee_payer?: string;
      reference?: string;
      skipGLPosting?: boolean; // For testing/migration
    },
    userId?: string,
    tenantId?: string
  ): Promise<any> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get line with account info
      const lineResult = await client.query(`
        SELECT l.*, s.account_id, a.tenant_id
        FROM cash_bank_statement_lines l
        JOIN cash_bank_statements s ON l.statement_id = s.statement_id
        JOIN cash_bank_accounts a ON s.account_id = a.account_id
        WHERE l.line_id = $1
      `, [lineId]);

      const line = lineResult.rows[0];
      if (!line || line.tenant_id !== tenantId) {
        throw new Error('Bank statement line not found for tenant');
      }

      if (line.is_matched) {
        throw new Error('Bank statement line is already matched');
      }

      // Create the transaction
      const lineAmount = Math.abs(line.debit_amount || 0) + Math.abs(line.credit_amount || 0);
      const isDebit = (line.debit_amount || 0) > 0;
      const txnType = isDebit ? 'WITHDRAWAL' : 'DEPOSIT';
      const txnNumber = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const category = transactionData.category || 'GENERAL';

      const txnResult = await client.query(`
        INSERT INTO cash_transactions (
          tenant_id, transaction_number, transaction_date, account_id,
          transaction_type, category, amount, payee_payer, reference,
          description, status, is_reconciled, reconciled_date, 
          reconciled_by, statement_line_id, created_by,
          posted_to_gl, journal_entry_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'RECONCILED', true, CURRENT_DATE, $11, $12, $11, false, NULL)
        RETURNING *
      `, [
        tenantId,
        txnNumber,
        line.transaction_date,
        line.account_id,
        txnType,
        category,
        lineAmount,
        transactionData.payee_payer || line.description?.substring(0, 200),
        transactionData.reference || line.reference || txnNumber,
        transactionData.description || line.description,
        userId,
        lineId
      ]);

      const newTxn = txnResult.rows[0];

      // ===== NEW: CREATE JOURNAL ENTRY FOR GL POSTING =====
      let journalEntry = null;
      if (!transactionData.skipGLPosting) {
        try {
          journalEntry = await glIntegrationService.createJournalEntry(
            {
              transaction_id: newTxn.transaction_id,
              transaction_date: new Date(line.transaction_date),
              transaction_type: txnType as 'DEPOSIT' | 'WITHDRAWAL',
              category: category,
              amount: lineAmount,
              description: transactionData.description || line.description || 'Bank transaction',
              reference: transactionData.reference || line.reference || txnNumber,
              account_id: line.account_id
            },
            userId || 'system',
            tenantId,
            client
          );
        } catch (glError: any) {
          // Log but don't fail - GL posting can be retried
          console.error('GL Posting warning (will continue):', glError.message);
          // Still update the transaction to indicate GL posting was attempted but failed
          await client.query(`
            UPDATE cash_transactions SET
              gl_posting_error = $1
            WHERE transaction_id = $2
          `, [glError.message, newTxn.transaction_id]);
        }
      }
      // ===== END GL POSTING =====

      // Update the bank statement line
      await client.query(`
        UPDATE cash_bank_statement_lines
        SET is_matched = true,
            matched_transaction_id = $1,
            match_confidence = 100,
            match_date = NOW(),
            matched_by = $2,
            confirmed_category = $3
        WHERE line_id = $4
      `, [newTxn.transaction_id, userId, category, lineId]);

      // Create match record
      await client.query(`
        INSERT INTO bank_reconciliation_matches (
          bank_statement_line_id, transaction_id, match_type,
          matched_by, statement_amount, transaction_amount,
          status, tenant_id
        ) VALUES ($1, $2, 'MANUAL', $3, $4, $5, 'ACTIVE', $6)
      `, [lineId, newTxn.transaction_id, userId, lineAmount, newTxn.amount, tenantId]);

      // Update statement stats and status
      await client.query(`
        UPDATE cash_bank_statements SET
          matched_lines = (
            SELECT COUNT(*) FROM cash_bank_statement_lines
            WHERE statement_id = $1 AND is_matched = true
          ),
          unmatched_lines = (
            SELECT COUNT(*) FROM cash_bank_statement_lines
            WHERE statement_id = $1 AND is_matched = false
          ),
          status = CASE
            WHEN (SELECT COUNT(*) FROM cash_bank_statement_lines WHERE statement_id = $1 AND is_matched = false) = 0
            THEN 'RECONCILED'
            ELSE 'IN_PROGRESS'
          END
        WHERE statement_id = $1
      `, [line.statement_id]);

      await client.query('COMMIT');

      // Re-fetch the transaction with GL info
      const updatedTxn = await pool.query(
        'SELECT * FROM cash_transactions WHERE transaction_id = $1',
        [newTxn.transaction_id]
      );

      return {
        line: lineId,
        transaction: updatedTxn.rows[0] || newTxn,
        journalEntry: journalEntry,
        message: journalEntry 
          ? `Successfully matched bank line to new transaction and posted to GL (${journalEntry.journalNumber})`
          : 'Successfully matched bank line to new transaction (GL posting skipped or failed)'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================================
  // GET AVAILABLE CATEGORIES
  // ============================================================

  /**
   * Get list of available categories with their GL mappings
   */
  getAvailableCategories(): { category: string; description: string; type: string }[] {
    return glIntegrationService.getAvailableCategories();
  }
}

export default new MatchingService();
