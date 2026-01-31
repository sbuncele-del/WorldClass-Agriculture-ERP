/**
 * Universal Journal Entry Model
 * Single source of truth for ALL financial transactions
 * Inspired by SAP's Universal Journal (ACDOCA)
 */

export enum JournalSource {
  MANUAL = 'MANUAL',               // Manual journal entry
  BANK_TRANSACTION = 'BANK_TRANSACTION',
  SALES_INVOICE = 'SALES_INVOICE',
  PURCHASE_INVOICE = 'PURCHASE_INVOICE',
  PAYMENT = 'PAYMENT',
  RECEIPT = 'RECEIPT',
  PAYROLL = 'PAYROLL',
  INVENTORY = 'INVENTORY',
  DEPRECIATION = 'DEPRECIATION',
  ADJUSTMENT = 'ADJUSTMENT',
  OPENING_BALANCE = 'OPENING_BALANCE',
  CLOSING = 'CLOSING',
  // Logistics integration sources
  LOGISTICS_TRIP = 'LOGISTICS_TRIP',
  LOGISTICS_FUEL = 'LOGISTICS_FUEL',
  LOGISTICS_DRIVER_PAY = 'LOGISTICS_DRIVER_PAY',
}

export enum JournalStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  POSTED = 'POSTED',
  REVERSED = 'REVERSED',
  REJECTED = 'REJECTED',
}

export interface JournalEntryHeader {
  id: string;
  journal_number: string;           // Auto-generated: JV-2025-00001
  journal_date: Date;               // Transaction date
  posting_date: Date;               // Period it posts to
  
  // Source
  source_type: JournalSource;
  source_document_id?: string;      // FK to invoice, payment, etc.
  source_document_number?: string;  // Display reference
  
  // Status
  status: JournalStatus;
  posted_at?: Date;
  posted_by?: string;
  
  // Description
  description: string;
  notes?: string;
  
  // Period
  fiscal_year: number;
  fiscal_period: number;            // 1-12 for monthly
  is_adjusting_entry: boolean;
  
  // Totals (must balance!)
  total_debit: number;
  total_credit: number;
  
  // Multi-currency
  currency_code: string;
  exchange_rate: number;            // To base currency
  
  // Reversing entry
  is_reversing: boolean;
  reverse_on_date?: Date;
  reversed_by_journal_id?: string;
  reverses_journal_id?: string;
  
  // Approvals
  requires_approval: boolean;
  approved_by?: string;
  approved_at?: Date;
  
  // Audit
  company_id: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by?: string;
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;         // FK to header
  line_number: number;              // Sequence
  
  // Account
  account_id: string;               // FK to Chart of Accounts
  account_code: string;             // Denormalized for performance
  account_name: string;             // Denormalized
  
  // Debit or Credit (only ONE should have value)
  debit_amount: number;             // 0 if credit line
  credit_amount: number;            // 0 if debit line
  
  // Multi-currency
  currency_code: string;
  exchange_rate: number;
  debit_amount_base: number;        // In company base currency
  credit_amount_base: number;
  
  // Dimensional Accounting (Multi-dimensional analysis)
  cost_center_id?: string;
  department_id?: string;
  project_id?: string;
  product_id?: string;
  location_id?: string;
  
  // Tax
  tax_code?: string;
  tax_amount?: number;
  is_tax_line: boolean;
  
  // Reconciliation
  is_reconciled: boolean;
  reconciled_at?: Date;
  reconciliation_id?: string;
  
  // Description
  line_description?: string;
  reference?: string;                // External reference
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

// SQL Schema
export const JOURNAL_ENTRY_TABLES_SQL = `
-- Journal Entry Header
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_number VARCHAR(50) NOT NULL UNIQUE,
  journal_date DATE NOT NULL,
  posting_date DATE NOT NULL,
  
  source_type VARCHAR(50) NOT NULL,
  source_document_id UUID,
  source_document_number VARCHAR(100),
  
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  posted_at TIMESTAMP WITH TIME ZONE,
  posted_by UUID,
  
  description TEXT NOT NULL,
  notes TEXT,
  
  fiscal_year INTEGER NOT NULL,
  fiscal_period INTEGER NOT NULL,
  is_adjusting_entry BOOLEAN NOT NULL DEFAULT false,
  
  total_debit DECIMAL(18, 2) NOT NULL,
  total_credit DECIMAL(18, 2) NOT NULL,
  
  currency_code VARCHAR(3) NOT NULL DEFAULT 'ZAR',
  exchange_rate DECIMAL(12, 6) NOT NULL DEFAULT 1.000000,
  
  is_reversing BOOLEAN NOT NULL DEFAULT false,
  reverse_on_date DATE,
  reversed_by_journal_id UUID,
  reverses_journal_id UUID,
  
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  company_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL,
  updated_by UUID,
  
  CONSTRAINT check_balanced CHECK (total_debit = total_credit),
  CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_reversed_by FOREIGN KEY (reversed_by_journal_id) REFERENCES journal_entries(id),
  CONSTRAINT fk_reverses FOREIGN KEY (reverses_journal_id) REFERENCES journal_entries(id)
);

-- Journal Entry Lines
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL,
  line_number INTEGER NOT NULL,
  
  account_id UUID NOT NULL,
  account_code VARCHAR(20) NOT NULL,
  account_name VARCHAR(200) NOT NULL,
  
  debit_amount DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
  credit_amount DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
  
  currency_code VARCHAR(3) NOT NULL DEFAULT 'ZAR',
  exchange_rate DECIMAL(12, 6) NOT NULL DEFAULT 1.000000,
  debit_amount_base DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
  credit_amount_base DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
  
  cost_center_id UUID,
  department_id UUID,
  project_id UUID,
  product_id UUID,
  location_id UUID,
  
  tax_code VARCHAR(20),
  tax_amount DECIMAL(18, 2),
  is_tax_line BOOLEAN NOT NULL DEFAULT false,
  
  is_reconciled BOOLEAN NOT NULL DEFAULT false,
  reconciled_at TIMESTAMP WITH TIME ZONE,
  reconciliation_id UUID,
  
  line_description TEXT,
  reference VARCHAR(100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_journal_entry FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
  CONSTRAINT fk_account FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
  CONSTRAINT check_debit_or_credit CHECK (
    (debit_amount > 0 AND credit_amount = 0) OR 
    (credit_amount > 0 AND debit_amount = 0) OR
    (debit_amount = 0 AND credit_amount = 0)
  )
);

-- Indexes for performance
CREATE INDEX idx_je_journal_number ON journal_entries(journal_number);
CREATE INDEX idx_je_journal_date ON journal_entries(journal_date);
CREATE INDEX idx_je_posting_date ON journal_entries(posting_date);
CREATE INDEX idx_je_status ON journal_entries(status);
CREATE INDEX idx_je_fiscal_period ON journal_entries(fiscal_year, fiscal_period);
CREATE INDEX idx_je_company ON journal_entries(company_id);
CREATE INDEX idx_je_source ON journal_entries(source_type, source_document_id);

CREATE INDEX idx_jel_journal_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX idx_jel_account ON journal_entry_lines(account_id);
CREATE INDEX idx_jel_cost_center ON journal_entry_lines(cost_center_id);
CREATE INDEX idx_jel_reconciled ON journal_entry_lines(is_reconciled);
`;

// Helper interface for creating journal entries
export interface CreateJournalEntryRequest {
  journal_date: string;
  description: string;
  source_type: JournalSource;
  lines: Array<{
    account_code: string;
    debit_amount?: number;
    credit_amount?: number;
    description?: string;
    cost_center_id?: string;
    tax_code?: string;
  }>;
  notes?: string;
  requires_approval?: boolean;
}

// Validation helper
export class JournalEntryValidator {
  static validateBalance(lines: JournalEntryLine[]): boolean {
    const totalDebit = lines.reduce((sum, line) => sum + line.debit_amount, 0);
    const totalCredit = lines.reduce((sum, line) => sum + line.credit_amount, 0);
    return Math.abs(totalDebit - totalCredit) < 0.01; // Allow for rounding
  }
  
  static validateAtLeastTwoLines(lines: JournalEntryLine[]): boolean {
    return lines.length >= 2;
  }
  
  static validateNoHeaderAccounts(_lines: JournalEntryLine[], _accounts: any[]): boolean {
    // Ensure no line uses a header account that can't receive postings
    return true; // Implementation would check against chart of accounts
  }
}
