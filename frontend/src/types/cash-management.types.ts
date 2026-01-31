// Cash Management TypeScript Interfaces

export interface BankStatementLine {
  id: number;
  statement_id: number;
  transaction_date: string;
  value_date: string;
  description: string;
  reference: string;
  debit_amount: number | null;
  credit_amount: number | null;
  balance: number;
  is_matched: boolean;
  match_confidence: number | null;
  created_at: string;
}

export interface JournalEntryLine {
  id: number;
  journal_entry_id: number;
  account_id: number;
  account_code: string;
  account_name: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  transaction_date: string;
  is_matched: boolean;
}

export interface MultiLineMatchGroup {
  id: number;
  group_reference: string;
  match_type: 'ONE_TO_MANY' | 'MANY_TO_ONE';
  bank_statement_line_ids: number[];
  journal_entry_line_ids: number[];
  total_bank_amount: number;
  total_journal_amount: number;
  difference_amount: number;
  status: 'ACTIVE' | 'UNMATCHED' | 'REVERSED';
  matched_by: string;
  matched_date: string;
  notes?: string;
}

export interface MultiLineMatchCombination {
  journalLineIds: number[];
  totalAmount: number;
  difference: number;
  confidence: number;
  matchType: 'ONE_TO_MANY' | 'MANY_TO_ONE';
}

export interface PartialMatchRequest {
  bankStatementLineId: number;
  journalEntryLineId: number;
  differenceAmount: number;
  differenceReason: 'BANK_FEE' | 'FX_VARIANCE' | 'ROUNDING' | 'DISCOUNT' | 'INTEREST' | 'OTHER';
  differenceAccount?: number;
  notes?: string;
}

export interface PartialMatchSuggestion {
  journalLineId: number;
  amount: number;
  difference: number;
  percentageDifference: number;
  withinTolerance: boolean;
  suggestedReason: string;
  description: string;
  account_code: string;
  account_name: string;
  transaction_date: string;
}

export interface ToleranceSettings {
  amountTolerance: number;
  percentageTolerance: number;
  maxDifference: number;
}

export interface DuplicateCheck {
  isDuplicate: boolean;
  warnings: string[];
  duplicateType?: string;
  checks: {
    bankLineMatched: boolean;
    journalLineMatched: boolean;
    similarTransactionExists: boolean;
  };
}

export interface DuplicatePair {
  bankLine1: BankStatementLine;
  bankLine2: BankStatementLine;
  similarityScore: number;
  reasons: string[];
  likelyDuplicate: boolean;
}

export interface BulkAutoMatchRequest {
  statementId: number;
  minConfidence?: number;
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: string;
  dateTo?: string;
  descriptionFilter?: string;
  batchSize?: number;
}

export interface BulkOperationResult {
  totalLines: number;
  processedLines: number;
  matchedLines: number;
  suggestionsCreated: number;
  autoCreatedJournals: number;
  errors: string[];
  processingTimeMs: number;
}

export interface BulkStats {
  totalLines: number;
  matchedLines: number;
  unmatchedLines: number;
  estimatedAutoMatchTimeSeconds: number;
  estimatedAcceptTimeSeconds: number;
}

export interface BankAccount {
  id: number;
  account_name: string;
  account_number: string;
  bank_name: string;
  bank_code: string;
  account_type: string;
  currency: string;
  current_balance: number;
  is_active: boolean;
}

export interface BankStatement {
  id: number;
  bank_account_id: number;
  statement_date: string;
  opening_balance: number;
  closing_balance: number;
  total_debits: number;
  total_credits: number;
  line_count: number;
  matched_count: number;
  unmatched_count: number;
  status: string;
}
