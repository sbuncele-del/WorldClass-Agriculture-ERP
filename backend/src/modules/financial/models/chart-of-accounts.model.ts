/**
 * Chart of Accounts Model
 * The foundation of the financial system - defines all accounts
 */

export enum AccountType {
  // Balance Sheet Accounts
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  
  // Income Statement Accounts
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
  
  // Special Accounts
  CONTRA_ASSET = 'CONTRA_ASSET',
  CONTRA_LIABILITY = 'CONTRA_LIABILITY',
}

export enum AccountCategory {
  // Assets
  CURRENT_ASSET = 'CURRENT_ASSET',
  FIXED_ASSET = 'FIXED_ASSET',
  INTANGIBLE_ASSET = 'INTANGIBLE_ASSET',
  OTHER_ASSET = 'OTHER_ASSET',
  
  // Liabilities
  CURRENT_LIABILITY = 'CURRENT_LIABILITY',
  LONG_TERM_LIABILITY = 'LONG_TERM_LIABILITY',
  
  // Equity
  SHARE_CAPITAL = 'SHARE_CAPITAL',
  RETAINED_EARNINGS = 'RETAINED_EARNINGS',
  RESERVES = 'RESERVES',
  
  // Revenue
  OPERATING_REVENUE = 'OPERATING_REVENUE',
  OTHER_INCOME = 'OTHER_INCOME',
  
  // Expenses
  COST_OF_SALES = 'COST_OF_SALES',
  OPERATING_EXPENSE = 'OPERATING_EXPENSE',
  FINANCIAL_EXPENSE = 'FINANCIAL_EXPENSE',
  TAX_EXPENSE = 'TAX_EXPENSE',
}

export enum NormalBalance {
  DEBIT = 'DEBIT',   // Assets, Expenses
  CREDIT = 'CREDIT', // Liabilities, Equity, Revenue
}

export interface ChartOfAccounts {
  id: string;
  account_code: string;        // e.g., "1000", "2100", "4000"
  account_name: string;         // e.g., "Cash in Bank", "Accounts Payable"
  account_type: AccountType;
  account_category: AccountCategory;
  normal_balance: NormalBalance;
  
  // Hierarchy
  parent_account_id?: string;   // For sub-accounts
  level: number;                // 1 = main account, 2+ = sub-accounts
  is_header: boolean;           // Header accounts can't post transactions
  
  // Configuration
  is_active: boolean;
  is_system_account: boolean;   // Protected system accounts
  allow_manual_entry: boolean;  // Can users post directly?
  require_cost_center: boolean; // Force dimensional accounting
  
  // Multi-currency
  currency_code: string;        // Primary currency
  allow_foreign_currency: boolean;
  
  // Tax
  default_tax_code?: string;
  is_tax_relevant: boolean;
  
  // Reconciliation
  requires_reconciliation: boolean;
  
  // Balances (calculated fields)
  opening_balance: number;
  current_balance: number;
  
  // Metadata
  description?: string;
  company_id: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

// SQL Schema
export const CHART_OF_ACCOUNTS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_code VARCHAR(20) NOT NULL,
  account_name VARCHAR(200) NOT NULL,
  account_type VARCHAR(50) NOT NULL,
  account_category VARCHAR(50) NOT NULL,
  normal_balance VARCHAR(10) NOT NULL,
  
  parent_account_id UUID REFERENCES chart_of_accounts(id),
  level INTEGER NOT NULL DEFAULT 1,
  is_header BOOLEAN NOT NULL DEFAULT false,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system_account BOOLEAN NOT NULL DEFAULT false,
  allow_manual_entry BOOLEAN NOT NULL DEFAULT true,
  require_cost_center BOOLEAN NOT NULL DEFAULT false,
  
  currency_code VARCHAR(3) NOT NULL DEFAULT 'ZAR',
  allow_foreign_currency BOOLEAN NOT NULL DEFAULT false,
  
  default_tax_code VARCHAR(20),
  is_tax_relevant BOOLEAN NOT NULL DEFAULT false,
  
  requires_reconciliation BOOLEAN NOT NULL DEFAULT false,
  
  opening_balance DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
  current_balance DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
  
  description TEXT,
  company_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL,
  
  CONSTRAINT unique_account_code_per_company UNIQUE (company_id, account_code),
  CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX idx_coa_account_code ON chart_of_accounts(account_code);
CREATE INDEX idx_coa_account_type ON chart_of_accounts(account_type);
CREATE INDEX idx_coa_company ON chart_of_accounts(company_id);
CREATE INDEX idx_coa_parent ON chart_of_accounts(parent_account_id);
CREATE INDEX idx_coa_active ON chart_of_accounts(is_active) WHERE is_active = true;
`;

// Standard Chart of Accounts Template (South African)
export const STANDARD_COA_ZA = [
  // ASSETS (1000-1999)
  { code: '1000', name: 'Assets', type: 'ASSET', category: 'CURRENT_ASSET', is_header: true },
  { code: '1100', name: 'Current Assets', type: 'ASSET', category: 'CURRENT_ASSET', parent: '1000', is_header: true },
  { code: '1110', name: 'Cash and Cash Equivalents', type: 'ASSET', category: 'CURRENT_ASSET', parent: '1100' },
  { code: '1111', name: 'Petty Cash', type: 'ASSET', category: 'CURRENT_ASSET', parent: '1110' },
  { code: '1120', name: 'Bank - Current Account', type: 'ASSET', category: 'CURRENT_ASSET', parent: '1110', requires_reconciliation: true },
  { code: '1130', name: 'Bank - Savings Account', type: 'ASSET', category: 'CURRENT_ASSET', parent: '1110', requires_reconciliation: true },
  { code: '1200', name: 'Accounts Receivable', type: 'ASSET', category: 'CURRENT_ASSET', parent: '1100' },
  { code: '1210', name: 'Trade Debtors', type: 'ASSET', category: 'CURRENT_ASSET', parent: '1200', allow_manual_entry: false },
  { code: '1220', name: 'VAT Input', type: 'ASSET', category: 'CURRENT_ASSET', parent: '1200', is_tax_relevant: true },
  
  // LIABILITIES (2000-2999)
  { code: '2000', name: 'Liabilities', type: 'LIABILITY', category: 'CURRENT_LIABILITY', is_header: true },
  { code: '2100', name: 'Current Liabilities', type: 'LIABILITY', category: 'CURRENT_LIABILITY', parent: '2000', is_header: true },
  { code: '2110', name: 'Accounts Payable', type: 'LIABILITY', category: 'CURRENT_LIABILITY', parent: '2100' },
  { code: '2111', name: 'Trade Creditors', type: 'LIABILITY', category: 'CURRENT_LIABILITY', parent: '2110', allow_manual_entry: false },
  { code: '2120', name: 'VAT Output', type: 'LIABILITY', category: 'CURRENT_LIABILITY', parent: '2100', is_tax_relevant: true },
  { code: '2130', name: 'PAYE Payable', type: 'LIABILITY', category: 'CURRENT_LIABILITY', parent: '2100', is_tax_relevant: true },
  { code: '2140', name: 'UIF Payable', type: 'LIABILITY', category: 'CURRENT_LIABILITY', parent: '2100', is_tax_relevant: true },
  
  // EQUITY (3000-3999)
  { code: '3000', name: 'Equity', type: 'EQUITY', category: 'SHARE_CAPITAL', is_header: true },
  { code: '3100', name: 'Share Capital', type: 'EQUITY', category: 'SHARE_CAPITAL', parent: '3000' },
  { code: '3200', name: 'Retained Earnings', type: 'EQUITY', category: 'RETAINED_EARNINGS', parent: '3000', is_system_account: true },
  { code: '3900', name: 'Current Year Earnings', type: 'EQUITY', category: 'RETAINED_EARNINGS', parent: '3000', is_system_account: true },
  
  // REVENUE (4000-4999)
  { code: '4000', name: 'Revenue', type: 'REVENUE', category: 'OPERATING_REVENUE', is_header: true },
  { code: '4100', name: 'Sales Revenue', type: 'REVENUE', category: 'OPERATING_REVENUE', parent: '4000' },
  { code: '4110', name: 'Product Sales', type: 'REVENUE', category: 'OPERATING_REVENUE', parent: '4100' },
  { code: '4120', name: 'Service Revenue', type: 'REVENUE', category: 'OPERATING_REVENUE', parent: '4100' },
  { code: '4900', name: 'Other Income', type: 'REVENUE', category: 'OTHER_INCOME', parent: '4000' },
  
  // EXPENSES (5000-9999)
  { code: '5000', name: 'Cost of Sales', type: 'EXPENSE', category: 'COST_OF_SALES', is_header: true },
  { code: '5100', name: 'Cost of Goods Sold', type: 'EXPENSE', category: 'COST_OF_SALES', parent: '5000' },
  
  { code: '6000', name: 'Operating Expenses', type: 'EXPENSE', category: 'OPERATING_EXPENSE', is_header: true },
  { code: '6100', name: 'Salaries and Wages', type: 'EXPENSE', category: 'OPERATING_EXPENSE', parent: '6000' },
  { code: '6200', name: 'Rent Expense', type: 'EXPENSE', category: 'OPERATING_EXPENSE', parent: '6000' },
  { code: '6300', name: 'Utilities', type: 'EXPENSE', category: 'OPERATING_EXPENSE', parent: '6000' },
  { code: '6400', name: 'Office Supplies', type: 'EXPENSE', category: 'OPERATING_EXPENSE', parent: '6000' },
  { code: '6500', name: 'Professional Fees', type: 'EXPENSE', category: 'OPERATING_EXPENSE', parent: '6000' },
];
