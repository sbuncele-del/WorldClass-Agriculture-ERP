/**
 * Cash Management Service
 * 
 * Business logic for:
 * - Bank account management
 * - Statement import & CSV parsing
 * - Auto-matching algorithms
 * - Manual matching
 * - Rule management
 * - Reconciliation workspace
 */

import pool from '../../../config/database';
import {
  Bank,
  BankAccount,
  BankStatement,
  BankStatementLine,
  BankReconciliationRule,
  BankReconciliationMatch,
  CreateBankAccountDto,
  UpdateBankAccountDto,
  CreateBankStatementDto,
  ImportStatementLineDto,
  CreateReconciliationRuleDto,
  UpdateReconciliationRuleDto,
  CreateMatchDto,
  UnmatchDto,
  BankStatementFilter,
  StatementLineFilter,
  ReconciliationWorkspaceData,
  SuggestedMatch,
  ReconciliationStatistics,
  BankStatementCSVRow,
  ParsedStatementLine,
  CSVColumnMapping,
  SA_BANK_CSV_PRESETS,
  StatementStatus,
  StatementLineStatus,
  MatchType,
  RuleActionType,
  ReconciliationRuleType
} from '../models/cash-management.model';

export class BankReconciliationService {
  
  // ============================================================
  // BANK ACCOUNTS
  // ============================================================
  
  /**
   * Get all bank accounts with bank details
   */
  async getBankAccounts(includeInactive = false, tenantId?: string): Promise<BankAccount[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    
    // Try the detailed query first, fallback to simple query
    try {
      const query = `
        SELECT 
          ba.*,
          b.bank_name,
          b.bank_code as bank_short_name,
          b.logo_url as bank_logo_url
        FROM cash_bank_accounts ba
        INNER JOIN cash_banks b ON ba.bank_id = b.bank_id
        WHERE ba.tenant_id = $1
          AND (ba.is_active = true ${includeInactive ? 'OR ba.is_active = false' : ''})
        ORDER BY ba.is_primary DESC, ba.account_name ASC
      `;
      const result = await pool.query(query, [tenantId]);
      return result.rows;
    } catch (err: any) {
      // Fallback: try simpler bank_accounts table
      try {
        const simpleQuery = `
          SELECT 
            id, account_name, account_number, bank_name, 
            current_balance, currency, is_active, tenant_id,
            created_at, updated_at
          FROM bank_accounts 
          WHERE tenant_id = $1
            AND (is_active = true ${includeInactive ? 'OR is_active = false' : ''})
          ORDER BY account_name ASC
        `;
        const result = await pool.query(simpleQuery, [tenantId]);
        return result.rows;
      } catch (err2) {
        // Return empty array if no tables exist
        console.warn('Bank accounts tables not found, returning empty array');
        return [];
      }
    }
  }
  
  /**
   * Get single bank account by ID
   */
  async getBankAccountById(id: number, tenantId?: string): Promise<BankAccount | null> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const query = `
      SELECT 
        ba.*,
        b.bank_name,
        b.bank_code as bank_short_name
      FROM cash_bank_accounts ba
      INNER JOIN cash_banks b ON ba.bank_id = b.bank_id
      WHERE ba.account_id = $1 AND ba.tenant_id = $2
    `;
    
    const result = await pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }
  
  /**
   * Create new bank account
   */
  async createBankAccount(dto: CreateBankAccountDto, userId?: string, tenantId?: string): Promise<BankAccount> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // If this is primary, unset other primary accounts
      if (dto.is_primary) {
        await client.query('UPDATE cash_bank_accounts SET is_primary = false WHERE tenant_id = $1 AND is_primary = true', [tenantId]);
      }
      
      const query = `
        INSERT INTO cash_bank_accounts (
          bank_id, account_number, account_name, account_type, currency,
          gl_account_code, opening_balance, current_balance,
          is_active, is_primary, created_by, tenant_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      const values = [
        dto.bank_id,
        dto.account_number,
        dto.account_name,
        dto.account_type,
        dto.currency_code || 'ZAR',
        dto.gl_account_code,
        dto.opening_balance || 0,
        dto.opening_balance || 0, // Current balance starts as opening balance
        dto.is_active !== false,
        dto.is_primary || false,
        userId || null,
        tenantId
      ];
      
      const result = await client.query(query, values);
      await client.query('COMMIT');
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Update bank account
   */
  async updateBankAccount(dto: UpdateBankAccountDto, userId?: string, tenantId?: string): Promise<BankAccount> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // If setting as primary, unset others
      if (dto.is_primary) {
        await client.query('UPDATE cash_bank_accounts SET is_primary = false WHERE tenant_id = $1 AND account_id != $2', [tenantId, dto.id]);
      }
      
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;
      
      // Build dynamic update query
      const fields = ['account_name', 'account_type', 'gl_account_code', 
                     'is_active', 'is_primary'];
      
      fields.forEach(field => {
        if (dto[field as keyof UpdateBankAccountDto] !== undefined) {
          updates.push(`${field} = $${paramCount}`);
          values.push(dto[field as keyof UpdateBankAccountDto]);
          paramCount++;
        }
      });
      
      if (updates.length === 0) {
        throw new Error('No fields to update');
      }
      
      updates.push(`updated_at = NOW()`);
      updates.push(`updated_by = $${paramCount}`);
      values.push(userId || null);
      paramCount++;
      
      values.push(dto.id);
      
      const query = `
        UPDATE cash_bank_accounts
        SET ${updates.join(', ')}
        WHERE account_id = $${paramCount} AND tenant_id = $${paramCount + 1}
        RETURNING *
      `;
      
      const result = await client.query(query, [...values, tenantId]);
      await client.query('COMMIT');
      
      if (result.rows.length === 0) {
        throw new Error('Bank account not found');
      }
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // ============================================================
  // BANKS
  // ============================================================
  
  /**
   * Get all banks
   */
  async getBanks(activeOnly = true): Promise<Bank[]> {
    const query = `
      SELECT * FROM cash_banks
      WHERE is_active = true ${activeOnly ? '' : 'OR is_active = false'}
      ORDER BY bank_name ASC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }
  
  /**
   * Get CSV preset for a bank
   */
  getCSVPresetForBank(bankCode: string): CSVColumnMapping | null {
    return SA_BANK_CSV_PRESETS[bankCode] || null;
  }
  
  // ============================================================
  // STATEMENT IMPORT & CSV PARSING
  // ============================================================
  
  /**
   * Parse CSV data with column mapping
   */
  parseCSV(csvData: string, mapping: CSVColumnMapping): ParsedStatementLine[] {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file must have header row and at least one data row');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const parsedLines: ParsedStatementLine[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: BankStatementCSVRow = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        const parsedLine = this.parseStatementLine(row, mapping, i);
        parsedLines.push(parsedLine);
      } catch (error: any) {
        parsedLines.push({
          line_number: i,
          transaction_date: new Date(),
          debit_amount: 0,
          credit_amount: 0,
          parsing_errors: [error.message],
          raw_data: {}
        });
      }
    }
    
    return parsedLines;
  }
  
  /**
   * Parse single statement line from CSV row
   */
  private parseStatementLine(
    row: BankStatementCSVRow, 
    mapping: CSVColumnMapping, 
    lineNumber: number
  ): ParsedStatementLine {
    const errors: string[] = [];
    
    // Parse date
    let transactionDate: Date;
    try {
      const dateStr = row[mapping.date_column];
      transactionDate = new Date(dateStr);
      if (isNaN(transactionDate.getTime())) {
        throw new Error(`Invalid date: ${dateStr}`);
      }
    } catch (error: any) {
      errors.push(`Date parsing error: ${error.message}`);
      transactionDate = new Date();
    }
    
    // Parse amounts
    let debitAmount = 0;
    let creditAmount = 0;
    
    if (mapping.amount_column) {
      // Single amount column (positive = credit, negative = debit)
      const amountStr = row[mapping.amount_column].replace(/[R,\s]/g, '');
      const amount = parseFloat(amountStr);
      if (!isNaN(amount)) {
        if (amount >= 0) {
          creditAmount = amount;
        } else {
          debitAmount = Math.abs(amount);
        }
      }
    } else {
      // Separate debit/credit columns
      if (mapping.debit_column) {
        const debitStr = row[mapping.debit_column].replace(/[R,\s]/g, '');
        debitAmount = parseFloat(debitStr) || 0;
      }
      if (mapping.credit_column) {
        const creditStr = row[mapping.credit_column].replace(/[R,\s]/g, '');
        creditAmount = parseFloat(creditStr) || 0;
      }
    }
    
    // Parse balance (optional)
    let balance: number | undefined;
    if (mapping.balance_column) {
      const balanceStr = row[mapping.balance_column].replace(/[R,\s]/g, '');
      balance = parseFloat(balanceStr) || undefined;
    }
    
    // Parse value date (optional)
    let valueDate: Date | undefined;
    if (mapping.value_date_column) {
      try {
        valueDate = new Date(row[mapping.value_date_column]);
      } catch (error) {
        // Value date is optional
      }
    }
    
    return {
      line_number: lineNumber,
      transaction_date: transactionDate,
      value_date: valueDate,
      debit_amount: debitAmount,
      credit_amount: creditAmount,
      balance: balance,
      description: row[mapping.description_column] || '',
      reference_number: mapping.reference_column ? row[mapping.reference_column] : undefined,
      payee_payer: mapping.payee_column ? row[mapping.payee_column] : undefined,
      transaction_code: mapping.transaction_code_column ? row[mapping.transaction_code_column] : undefined,
      raw_data: row,
      parsing_errors: errors.length > 0 ? errors : undefined
    };
  }
  
  /**
   * Import bank statement with lines
   */
  async importStatement(
    dto: CreateBankStatementDto,
    lines: ParsedStatementLine[],
    userId?: string,
    tenantId?: string
  ): Promise<BankStatement> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Calculate totals
      const totalDebits = lines.reduce((sum, line) => sum + line.debit_amount, 0);
      const totalCredits = lines.reduce((sum, line) => sum + line.credit_amount, 0);
      
      // Verify balances match (opening + credits - debits = closing)
      const calculatedClosing = dto.opening_balance + totalCredits - totalDebits;
      const variance = Math.abs(calculatedClosing - dto.closing_balance);
      
      if (variance > 0.01) {
        console.warn(`Balance variance detected: R${variance.toFixed(2)}`);
      }
      
      // Insert statement
      const statementQuery = `
        INSERT INTO cash_bank_statements (
          account_id, statement_number, statement_date, period_from, period_to,
          opening_balance, closing_balance, total_debits, total_credits,
          import_source, status, total_lines, imported_by, tenant_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
      
      const statementValues = [
        dto.bank_account_id,
        dto.statement_number || null,
        dto.statement_date,
        dto.from_date,
        dto.to_date,
        dto.opening_balance,
        dto.closing_balance,
        totalDebits,
        totalCredits,
        dto.import_source,
        'IMPORTED',
        lines.length,
        userId || null,
        tenantId
      ];
      
      const statementResult = await client.query(statementQuery, statementValues);
      const statement = statementResult.rows[0];
      
      // Insert lines (tenant_id is on statement, not lines)
      for (const line of lines) {
        const lineQuery = `
          INSERT INTO cash_bank_statement_lines (
            statement_id, line_number, transaction_date, value_date,
            debit_amount, credit_amount, balance,
            description, reference, is_matched
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;
        
        const lineValues = [
          statement.statement_id,
          line.line_number,
          line.transaction_date,
          line.value_date || null,
          line.debit_amount,
          line.credit_amount,
          line.balance || null,
          line.description || '',
          line.reference_number || null,
          false
        ];
        
        await client.query(lineQuery, lineValues);
      }
      
      await client.query('COMMIT');
      
      return statement;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // ============================================================
  // STATEMENT & LINE QUERIES
  // ============================================================
  
  /**
   * Get statements with filters
   */
  async getStatements(filter: BankStatementFilter = {}, tenantId?: string): Promise<BankStatement[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    let query = `
      SELECT 
        s.*,
        ba.account_name,
        ba.account_number,
        b.bank_name
      FROM cash_bank_statements s
      INNER JOIN cash_bank_accounts ba ON s.account_id = ba.account_id
      INNER JOIN cash_banks b ON ba.bank_id = b.bank_id
      WHERE s.tenant_id = $1
    `;
    
    const params: any[] = [tenantId];
    let paramCount = 2;
    
    if (filter.bank_account_id) {
      query += ` AND s.bank_account_id = $${paramCount}`;
      params.push(filter.bank_account_id);
      paramCount++;
    }
    
    if (filter.status) {
      query += ` AND s.status = $${paramCount}`;
      params.push(filter.status);
      paramCount++;
    }
    
    if (filter.from_date) {
      query += ` AND s.statement_date >= $${paramCount}`;
      params.push(filter.from_date);
      paramCount++;
    }
    
    if (filter.to_date) {
      query += ` AND s.statement_date <= $${paramCount}`;
      params.push(filter.to_date);
      paramCount++;
    }
    
    query += ` ORDER BY s.statement_date DESC`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }
  
  /**
   * Get statement lines with filters
   */
  async getStatementLines(filter: StatementLineFilter = {}, tenantId?: string): Promise<BankStatementLine[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    let query = `
      SELECT l.*
      FROM cash_bank_statement_lines l
      INNER JOIN cash_bank_statements s ON l.statement_id = s.statement_id
      WHERE s.tenant_id = $1
    `;
    
    const params: any[] = [tenantId];
    let paramCount = 2;
    
    if (filter.bank_statement_id) {
      query += ` AND l.bank_statement_id = $${paramCount}`;
      params.push(filter.bank_statement_id);
      paramCount++;
    }
    
    if (filter.status) {
      query += ` AND l.status = $${paramCount}`;
      params.push(filter.status);
      paramCount++;
    }
    
    if (filter.is_reconciled !== undefined) {
      query += ` AND l.is_reconciled = $${paramCount}`;
      params.push(filter.is_reconciled);
      paramCount++;
    }
    
    if (filter.from_date) {
      query += ` AND l.transaction_date >= $${paramCount}`;
      params.push(filter.from_date);
      paramCount++;
    }
    
    if (filter.to_date) {
      query += ` AND l.transaction_date <= $${paramCount}`;
      params.push(filter.to_date);
      paramCount++;
    }
    
    if (filter.min_amount) {
      query += ` AND (l.debit_amount >= $${paramCount} OR l.credit_amount >= $${paramCount})`;
      params.push(filter.min_amount);
      paramCount++;
    }
    
    query += ` ORDER BY l.transaction_date DESC, l.line_number ASC`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }
  
  // ============================================================
  // RECONCILIATION RULES
  // ============================================================
  
  /**
   * Get all reconciliation rules
   */
  async getReconciliationRules(activeOnly = true, tenantId?: string): Promise<BankReconciliationRule[]> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const query = `
      SELECT r.*
      FROM cash_reconciliation_rules r
      WHERE r.tenant_id = $1
        AND (r.is_active = true ${activeOnly ? 'OR r.is_active = false' : ''})
      ORDER BY r.priority DESC, r.rule_name ASC
    `;
    
    const result = await pool.query(query, [tenantId]);
    return result.rows;
  }
  
  /**
   * Create reconciliation rule
   */
  async createReconciliationRule(dto: CreateReconciliationRuleDto, userId?: string, tenantId?: string): Promise<BankReconciliationRule> {
    if (!tenantId) throw new Error('Tenant ID is required');
    const query = `
      INSERT INTO cash_reconciliation_rules (
        rule_name, rule_description, priority, conditions,
        auto_category, auto_gl_account, create_transaction, auto_approve, is_active, created_by, tenant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const conditions = {
      match_field: dto.match_field,
      match_operator: dto.match_operator,
      match_value: dto.match_value,
      min_amount: dto.min_amount,
      max_amount: dto.max_amount,
      amount_tolerance: dto.amount_tolerance || 0.01,
      date_offset_days: dto.date_offset_days || 0
    };
    
    const values = [
      dto.rule_name,
      dto.description || null,
      dto.priority || 0,
      JSON.stringify(conditions),
      dto.action_type || null,
      dto.default_account_code || null,
      dto.auto_create_journal || false,
      false, // auto_approve
      dto.is_active !== false,
      userId || null,
      tenantId
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  
  // ============================================================
  // AUTO-MATCHING ALGORITHMS (Continued in next part)
  // ============================================================
}

export default new BankReconciliationService();
