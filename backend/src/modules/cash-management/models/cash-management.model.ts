/**
 * Cash Management Module - TypeScript Models
 * 
 * Type definitions and interfaces for:
 * - Banks
 * - Bank Accounts
 * - Bank Statements
 * - Bank Statement Lines
 * - Reconciliation Rules
 * - Reconciliation Matches
 */

// ============================================================
// ENUMS
// ============================================================

export enum BankAccountType {
  CURRENT = 'CURRENT',
  SAVINGS = 'SAVINGS',
  CREDIT_CARD = 'CREDIT_CARD',
  MONEY_MARKET = 'MONEY_MARKET'
}

export enum StatementImportSource {
  MANUAL = 'MANUAL',
  CSV = 'CSV',
  OFX = 'OFX',
  MT940 = 'MT940',
  API = 'API',
  EMAIL = 'EMAIL'
}

export enum StatementStatus {
  IMPORTED = 'IMPORTED',
  IN_PROGRESS = 'IN_PROGRESS',
  RECONCILED = 'RECONCILED',
  POSTED = 'POSTED'
}

export enum StatementLineTransactionType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
  FEE = 'FEE',
  INTEREST = 'INTEREST',
  TRANSFER = 'TRANSFER'
}

export enum StatementLineStatus {
  UNMATCHED = 'UNMATCHED',
  MATCHED = 'MATCHED',
  MANUAL_ENTRY = 'MANUAL_ENTRY',
  IGNORED = 'IGNORED'
}

export enum ReconciliationRuleType {
  EXACT_AMOUNT = 'EXACT_AMOUNT',
  REFERENCE_MATCH = 'REFERENCE_MATCH',
  PAYEE_MATCH = 'PAYEE_MATCH',
  DATE_RANGE = 'DATE_RANGE',
  KEYWORD = 'KEYWORD',
  COMBINED = 'COMBINED'
}

export enum MatchOperator {
  EQUALS = 'equals',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  REGEX = 'regex',
  RANGE = 'range'
}

export enum RuleActionType {
  AUTO_MATCH = 'AUTO_MATCH',
  SUGGEST_MATCH = 'SUGGEST_MATCH',
  CREATE_JOURNAL = 'CREATE_JOURNAL',
  FLAG_REVIEW = 'FLAG_REVIEW',
  IGNORE = 'IGNORE'
}

export enum MatchType {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
  SYSTEM = 'SYSTEM'
}

export enum MatchStatus {
  ACTIVE = 'ACTIVE',
  UNMATCHED = 'UNMATCHED',
  REVERSED = 'REVERSED'
}

// ============================================================
// INTERFACES
// ============================================================

export interface Bank {
  tenant_id: string;
  id: number;
  bank_code: string;
  bank_name: string;
  short_name: string;
  branch_code?: string;
  swift_code?: string;
  country_code: string;
  logo_url?: string;
  website_url?: string;
  support_phone?: string;
  statement_format?: string;
  is_active: boolean;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface BankAccount {
  tenant_id: string;
  id: number;
  bank_id: number;
  account_number: string;
  account_name: string;
  account_type: BankAccountType;
  currency_code: string;
  
  // GL Integration
  gl_account_code: string;
  
  // Balances
  opening_balance: number;
  opening_balance_date?: Date;
  current_balance: number;
  last_reconciled_balance: number;
  last_reconciled_date?: Date;
  
  // Statement Settings
  statement_day?: number;
  statement_email?: string;
  auto_import_enabled: boolean;
  
  // Status
  is_active: boolean;
  is_primary: boolean;
  notes?: string;
  
  // Audit
  created_by?: number;
  created_at: Date;
  updated_by?: number;
  updated_at: Date;
  
  // Virtual/Joined Fields
  bank?: Bank;
  gl_account_name?: string;
}

export interface BankStatement {
  tenant_id: string;
  id: number;
  bank_account_id: number;
  
  // Statement Details
  statement_number?: string;
  statement_date: Date;
  from_date: Date;
  to_date: Date;
  
  // Balances
  opening_balance: number;
  closing_balance: number;
  total_debits: number;
  total_credits: number;
  
  // Import Details
  import_source: StatementImportSource;
  import_filename?: string;
  import_date: Date;
  
  // Reconciliation Status
  status: StatementStatus;
  total_lines: number;
  matched_lines: number;
  unmatched_lines: number;
  
  // Period Linking
  fiscal_year_id?: number;
  accounting_period_id?: number;
  
  // Audit
  reconciled_by?: number;
  reconciled_at?: Date;
  posted_by?: number;
  posted_at?: Date;
  notes?: string;
  
  created_by?: number;
  created_at: Date;
  updated_at: Date;
  
  // Virtual/Joined Fields
  bank_account?: BankAccount;
  lines?: BankStatementLine[];
}

export interface BankStatementLine {
  tenant_id: string;
  id: number;
  bank_statement_id: number;
  
  // Transaction Details
  line_number: number;
  transaction_date: Date;
  value_date?: Date;
  transaction_type?: StatementLineTransactionType;
  
  // Amounts
  debit_amount: number;
  credit_amount: number;
  balance?: number;
  
  // Transaction Info
  description?: string;
  reference_number?: string;
  payee_payer?: string;
  
  // Bank Codes
  transaction_code?: string;
  bank_reference?: string;
  
  // Matching Status
  status: StatementLineStatus;
  matched_journal_entry_id?: number;
  matched_journal_line_id?: number;
  matched_at?: Date;
  matched_by?: number;
  
  // Matching Info
  matching_confidence?: number;
  matching_rule_id?: number;
  
  // Flags
  is_reconciled: boolean;
  requires_manual_review: boolean;
  is_ignored: boolean;
  
  notes?: string;
  created_at: Date;
  updated_at: Date;
  
  // Virtual/Joined Fields
  bank_statement?: BankStatement;
  matched_journal_entry?: any;
  matching_rule?: BankReconciliationRule;
}

export interface BankReconciliationRule {
  id: number;
  rule_name: string;
  description?: string;
  
  // Rule Type
  rule_type: ReconciliationRuleType;
  priority: number;
  
  // Matching Criteria
  match_field?: string;
  match_operator?: MatchOperator;
  match_value?: string;
  match_value_secondary?: string;
  
  // Amount Criteria
  min_amount?: number;
  max_amount?: number;
  amount_tolerance: number;
  
  // Date Criteria
  date_offset_days: number;
  
  // Transaction Type Filter
  transaction_type_filter?: StatementLineTransactionType;
  
  // Action
  action_type: RuleActionType;
  
  // Auto-Create Journal Entry
  auto_create_journal: boolean;
  default_account_code?: string;
  default_source_type: string;
  
  // Confidence
  confidence_score: number;
  
  // Status
  is_active: boolean;
  apply_to_all_accounts: boolean;
  specific_bank_account_id?: number;
  
  // Stats
  times_applied: number;
  last_applied_at?: Date;
  
  // Audit
  created_by?: number;
  created_at: Date;
  updated_by?: number;
  updated_at: Date;
  
  // Virtual/Joined Fields
  specific_bank_account?: BankAccount;
}

export interface BankReconciliationMatch {
  id: number;
  bank_statement_line_id: number;
  journal_entry_id: number;
  journal_entry_line_id?: number;
  
  // Match Details
  match_type: MatchType;
  match_date: Date;
  matched_by?: number;
  
  // If auto-matched
  rule_id?: number;
  confidence_score?: number;
  
  // Multi-line matching
  multi_line_group_reference?: string;
  
  // Amounts
  statement_amount: number;
  journal_amount: number;
  variance_amount: number; // Computed
  
  // Status
  status: MatchStatus;
  
  // Audit Trail
  unmatched_at?: Date;
  unmatched_by?: number;
  unmatch_reason?: string;
  
  notes?: string;
  created_at: Date;
  
  // Virtual/Joined Fields
  bank_statement_line?: BankStatementLine;
  journal_entry?: any;
  rule?: BankReconciliationRule;
}

// ============================================================
// CREATE/UPDATE DTOs
// ============================================================

export interface CreateBankAccountDto {
  bank_id: number;
  account_number: string;
  account_name: string;
  account_type: BankAccountType;
  currency_code?: string;
  gl_account_code: string;
  opening_balance?: number;
  opening_balance_date?: Date;
  statement_day?: number;
  statement_email?: string;
  auto_import_enabled?: boolean;
  is_active?: boolean;
  is_primary?: boolean;
  notes?: string;
}

export interface UpdateBankAccountDto extends Partial<CreateBankAccountDto> {
  id: number;
}

export interface CreateBankStatementDto {
  bank_account_id: number;
  statement_number?: string;
  statement_date: Date;
  from_date: Date;
  to_date: Date;
  opening_balance: number;
  closing_balance: number;
  import_source: StatementImportSource;
  import_filename?: string;
  notes?: string;
}

export interface ImportStatementLineDto {
  line_number: number;
  transaction_date: Date;
  value_date?: Date;
  transaction_type?: StatementLineTransactionType;
  debit_amount?: number;
  credit_amount?: number;
  balance?: number;
  description?: string;
  reference_number?: string;
  payee_payer?: string;
  transaction_code?: string;
  bank_reference?: string;
}

export interface CreateReconciliationRuleDto {
  rule_name: string;
  description?: string;
  rule_type: ReconciliationRuleType;
  priority?: number;
  match_field?: string;
  match_operator?: MatchOperator;
  match_value?: string;
  match_value_secondary?: string;
  min_amount?: number;
  max_amount?: number;
  amount_tolerance?: number;
  date_offset_days?: number;
  transaction_type_filter?: StatementLineTransactionType;
  action_type: RuleActionType;
  auto_create_journal?: boolean;
  default_account_code?: string;
  confidence_score?: number;
  is_active?: boolean;
  apply_to_all_accounts?: boolean;
  specific_bank_account_id?: number;
}

export interface UpdateReconciliationRuleDto extends Partial<CreateReconciliationRuleDto> {
  id: number;
}

export interface CreateMatchDto {
  bank_statement_line_id: number;
  journal_entry_id: number;
  journal_entry_line_id?: number;
  match_type: MatchType;
  rule_id?: number;
  confidence_score?: number;
  notes?: string;
}

export interface UnmatchDto {
  match_id: number;
  unmatch_reason: string;
}

// ============================================================
// QUERY/FILTER DTOs
// ============================================================

export interface BankStatementFilter {
  bank_account_id?: number;
  status?: StatementStatus;
  from_date?: Date;
  to_date?: Date;
  fiscal_year_id?: number;
  accounting_period_id?: number;
}

export interface StatementLineFilter {
  bank_statement_id?: number;
  status?: StatementLineStatus;
  transaction_type?: StatementLineTransactionType;
  min_amount?: number;
  max_amount?: number;
  from_date?: Date;
  to_date?: Date;
  is_reconciled?: boolean;
  requires_manual_review?: boolean;
}

export interface ReconciliationWorkspaceData {
  statement: BankStatement;
  statement_lines: BankStatementLine[];
  unmatched_lines: BankStatementLine[];
  gl_transactions: any[]; // Cash transactions for the period
  suggested_matches: SuggestedMatch[];
  statistics: ReconciliationStatistics;
}

export interface SuggestedMatch {
  statement_line: BankStatementLine;
  transaction?: any;        // Cash transaction (new matching)
  journal_entry?: any;      // Journal entry (legacy - optional)
  confidence_score: number;
  rule_name?: string;
  match_reasons: string[];
}

export interface ReconciliationStatistics {
  total_lines: number;
  matched_lines: number;
  unmatched_lines: number;
  ignored_lines: number;
  manual_entries_needed: number;
  total_matched_amount: number;
  total_unmatched_amount: number;
  reconciliation_percentage: number;
}

// ============================================================
// CSV IMPORT MAPPINGS
// ============================================================

export interface CSVColumnMapping {
  date_column: string;
  description_column: string;
  debit_column?: string;
  credit_column?: string;
  amount_column?: string; // If single amount column
  balance_column?: string;
  reference_column?: string;
  payee_column?: string;
  // Additional columns
  value_date_column?: string;
  transaction_type_column?: string;
  transaction_code_column?: string;
}

export interface BankStatementCSVRow {
  [key: string]: string;
}

export interface ParsedStatementLine extends ImportStatementLineDto {
  raw_data?: BankStatementCSVRow;
  parsing_errors?: string[];
}

// ============================================================
// SOUTH AFRICAN BANK PRESETS
// ============================================================

export const SA_BANK_CSV_PRESETS: Record<string, CSVColumnMapping> = {
  FNB: {
    date_column: 'Date',
    description_column: 'Description',
    amount_column: 'Amount',
    balance_column: 'Balance',
    reference_column: 'Reference'
  },
  ABSA: {
    date_column: 'Transaction Date',
    description_column: 'Description',
    debit_column: 'Debit',
    credit_column: 'Credit',
    balance_column: 'Balance'
  },
  NEDBANK: {
    date_column: 'Date',
    description_column: 'Description',
    debit_column: 'Debit',
    credit_column: 'Credit',
    balance_column: 'Running Balance'
  },
  STDBANK: {
    date_column: 'Date',
    description_column: 'Description',
    amount_column: 'Amount',
    balance_column: 'Balance',
    reference_column: 'Trans Ref No'
  },
  CAPITEC: {
    date_column: 'Date',
    description_column: 'Description',
    debit_column: 'Money Out',
    credit_column: 'Money In',
    balance_column: 'Balance'
  }
};
