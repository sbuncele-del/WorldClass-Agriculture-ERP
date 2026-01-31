/**
 * Chart of Accounts Templates
 * Pre-configured COA templates for different South African business types
 */

// Simplified interface for template accounts (subset of full ChartOfAccounts)
export interface TemplateAccount {
  code: string;
  name: string;
  account_type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  level: number;
  parent_code?: string;
  is_header?: boolean;
  normal_balance: 'DEBIT' | 'CREDIT';
  is_active?: boolean;
}

// ============================================
// TEMPLATE 1: STANDARD SMALL BUSINESS (GAAP)
// ============================================
export const TEMPLATE_SMALL_BUSINESS: TemplateAccount[] = [
  // 1000 - ASSETS
  { code: '1000', name: 'ASSETS', account_type: 'ASSET', level: 1, is_header: true, normal_balance: 'DEBIT', is_active: true },
  
  // 1100 - Current Assets
  { code: '1100', name: 'Current Assets', account_type: 'ASSET', level: 2, parent_code: '1000', is_header: true, normal_balance: 'DEBIT', is_active: true },
  { code: '1110', name: 'Cash on Hand', account_type: 'ASSET', level: 3, parent_code: '1100', normal_balance: 'DEBIT', is_active: true },
  { code: '1120', name: 'Bank - Checking Account', account_type: 'ASSET', level: 3, parent_code: '1100', normal_balance: 'DEBIT', is_active: true },
  { code: '1130', name: 'Bank - Savings Account', account_type: 'ASSET', level: 3, parent_code: '1100', normal_balance: 'DEBIT', is_active: true },
  { code: '1200', name: 'Accounts Receivable', account_type: 'ASSET', level: 3, parent_code: '1100', normal_balance: 'DEBIT', is_active: true },
  { code: '1210', name: 'Allowance for Doubtful Debts', account_type: 'ASSET', level: 3, parent_code: '1100', normal_balance: 'CREDIT', is_active: true },
  { code: '1300', name: 'Inventory', account_type: 'ASSET', level: 3, parent_code: '1100', normal_balance: 'DEBIT', is_active: true },
  { code: '1400', name: 'Prepaid Expenses', account_type: 'ASSET', level: 3, parent_code: '1100', normal_balance: 'DEBIT', is_active: true },
  
  // 1500 - Non-Current Assets
  { code: '1500', name: 'Non-Current Assets', account_type: 'ASSET', level: 2, parent_code: '1000', is_header: true, normal_balance: 'DEBIT', is_active: true },
  { code: '1510', name: 'Property, Plant & Equipment', account_type: 'ASSET', level: 3, parent_code: '1500', normal_balance: 'DEBIT', is_active: true },
  { code: '1520', name: 'Accumulated Depreciation - PPE', account_type: 'ASSET', level: 3, parent_code: '1500', normal_balance: 'CREDIT', is_active: true },
  { code: '1530', name: 'Motor Vehicles', account_type: 'ASSET', level: 3, parent_code: '1500', normal_balance: 'DEBIT', is_active: true },
  { code: '1540', name: 'Accumulated Depreciation - Vehicles', account_type: 'ASSET', level: 3, parent_code: '1500', normal_balance: 'CREDIT', is_active: true },
  { code: '1550', name: 'Computer Equipment', account_type: 'ASSET', level: 3, parent_code: '1500', normal_balance: 'DEBIT', is_active: true },
  { code: '1560', name: 'Accumulated Depreciation - Computers', account_type: 'ASSET', level: 3, parent_code: '1500', normal_balance: 'CREDIT', is_active: true },
  
  // 2000 - LIABILITIES
  { code: '2000', name: 'LIABILITIES', account_type: 'LIABILITY', level: 1, is_header: true, normal_balance: 'CREDIT', is_active: true },
  
  // 2100 - Current Liabilities
  { code: '2100', name: 'Current Liabilities', account_type: 'LIABILITY', level: 2, parent_code: '2000', is_header: true, normal_balance: 'CREDIT', is_active: true },
  { code: '2110', name: 'Accounts Payable', account_type: 'LIABILITY', level: 3, parent_code: '2100', normal_balance: 'CREDIT', is_active: true },
  { code: '2120', name: 'SARS - PAYE Payable', account_type: 'LIABILITY', level: 3, parent_code: '2100', normal_balance: 'CREDIT', is_active: true },
  { code: '2130', name: 'SARS - UIF Payable', account_type: 'LIABILITY', level: 3, parent_code: '2100', normal_balance: 'CREDIT', is_active: true },
  { code: '2140', name: 'SARS - VAT Payable', account_type: 'LIABILITY', level: 3, parent_code: '2100', normal_balance: 'CREDIT', is_active: true },
  { code: '2150', name: 'SARS - SDL Payable', account_type: 'LIABILITY', level: 3, parent_code: '2100', normal_balance: 'CREDIT', is_active: true },
  { code: '2160', name: 'Accrued Expenses', account_type: 'LIABILITY', level: 3, parent_code: '2100', normal_balance: 'CREDIT', is_active: true },
  { code: '2170', name: 'Short-term Loans', account_type: 'LIABILITY', level: 3, parent_code: '2100', normal_balance: 'CREDIT', is_active: true },
  
  // 2500 - Non-Current Liabilities
  { code: '2500', name: 'Non-Current Liabilities', account_type: 'LIABILITY', level: 2, parent_code: '2000', is_header: true, normal_balance: 'CREDIT', is_active: true },
  { code: '2510', name: 'Long-term Loans', account_type: 'LIABILITY', level: 3, parent_code: '2500', normal_balance: 'CREDIT', is_active: true },
  { code: '2520', name: 'Mortgage Payable', account_type: 'LIABILITY', level: 3, parent_code: '2500', normal_balance: 'CREDIT', is_active: true },
  
  // 3000 - EQUITY
  { code: '3000', name: 'EQUITY', account_type: 'EQUITY', level: 1, is_header: true, normal_balance: 'CREDIT', is_active: true },
  { code: '3100', name: "Owner's Capital", account_type: 'EQUITY', level: 2, parent_code: '3000', normal_balance: 'CREDIT', is_active: true },
  { code: '3200', name: "Owner's Drawings", account_type: 'EQUITY', level: 2, parent_code: '3000', normal_balance: 'DEBIT', is_active: true },
  { code: '3300', name: 'Retained Earnings', account_type: 'EQUITY', level: 2, parent_code: '3000', normal_balance: 'CREDIT', is_active: true },
  { code: '3400', name: 'Current Year Profit/Loss', account_type: 'EQUITY', level: 2, parent_code: '3000', normal_balance: 'CREDIT', is_active: true },
  
  // 4000 - REVENUE
  { code: '4000', name: 'REVENUE', account_type: 'REVENUE', level: 1, is_header: true, normal_balance: 'CREDIT', is_active: true },
  { code: '4100', name: 'Sales - Products', account_type: 'REVENUE', level: 2, parent_code: '4000', normal_balance: 'CREDIT', is_active: true },
  { code: '4200', name: 'Sales - Services', account_type: 'REVENUE', level: 2, parent_code: '4000', normal_balance: 'CREDIT', is_active: true },
  { code: '4300', name: 'Sales Returns', account_type: 'REVENUE', level: 2, parent_code: '4000', normal_balance: 'DEBIT', is_active: true },
  { code: '4400', name: 'Sales Discounts', account_type: 'REVENUE', level: 2, parent_code: '4000', normal_balance: 'DEBIT', is_active: true },
  { code: '4900', name: 'Other Income', account_type: 'REVENUE', level: 2, parent_code: '4000', normal_balance: 'CREDIT', is_active: true },
  
  // 5000 - COST OF SALES
  { code: '5000', name: 'COST OF SALES', account_type: 'EXPENSE', level: 1, is_header: true, normal_balance: 'DEBIT', is_active: true },
  { code: '5100', name: 'Cost of Goods Sold', account_type: 'EXPENSE', level: 2, parent_code: '5000', normal_balance: 'DEBIT', is_active: true },
  { code: '5200', name: 'Direct Labor', account_type: 'EXPENSE', level: 2, parent_code: '5000', normal_balance: 'DEBIT', is_active: true },
  { code: '5300', name: 'Direct Materials', account_type: 'EXPENSE', level: 2, parent_code: '5000', normal_balance: 'DEBIT', is_active: true },
  
  // 6000 - OPERATING EXPENSES
  { code: '6000', name: 'OPERATING EXPENSES', account_type: 'EXPENSE', level: 1, is_header: true, normal_balance: 'DEBIT', is_active: true },
  { code: '6100', name: 'Salaries & Wages', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6110', name: 'PAYE - Tax Expense', account_type: 'EXPENSE', level: 3, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6120', name: 'UIF - Employer Contribution', account_type: 'EXPENSE', level: 3, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6130', name: 'SDL - Skills Development Levy', account_type: 'EXPENSE', level: 3, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6200', name: 'Rent Expense', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6300', name: 'Utilities', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6310', name: 'Electricity', account_type: 'EXPENSE', level: 3, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6320', name: 'Water & Sewage', account_type: 'EXPENSE', level: 3, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6330', name: 'Telephone & Internet', account_type: 'EXPENSE', level: 3, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6400', name: 'Office Expenses', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6500', name: 'Marketing & Advertising', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6600', name: 'Insurance', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6700', name: 'Depreciation Expense', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6800', name: 'Bad Debts', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6900', name: 'Bank Charges', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6950', name: 'Professional Fees', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
];

// ============================================
// TEMPLATE 2: RETAIL BUSINESS
// ============================================
export const TEMPLATE_RETAIL: TemplateAccount[] = [
  // ASSETS
  { code: '1000', name: 'ASSETS', account_type: 'ASSET', level: 1, is_header: true, normal_balance: 'DEBIT', is_active: true },
  { code: '1100', name: 'Cash & Bank', account_type: 'ASSET', level: 2, parent_code: '1000', is_header: true, normal_balance: 'DEBIT', is_active: true },
  { code: '1110', name: 'Cash - Till 1', account_type: 'ASSET', level: 3, parent_code: '1100', normal_balance: 'DEBIT', is_active: true },
  { code: '1120', name: 'Cash - Till 2', account_type: 'ASSET', level: 3, parent_code: '1100', normal_balance: 'DEBIT', is_active: true },
  { code: '1130', name: 'Bank - Current Account', account_type: 'ASSET', level: 3, parent_code: '1100', normal_balance: 'DEBIT', is_active: true },
  { code: '1140', name: 'Card Payments - Pending', account_type: 'ASSET', level: 3, parent_code: '1100', normal_balance: 'DEBIT', is_active: true },
  { code: '1150', name: 'SnapScan/Zapper Clearing', account_type: 'ASSET', level: 3, parent_code: '1100', normal_balance: 'DEBIT', is_active: true },
  
  { code: '1200', name: 'Receivables', account_type: 'ASSET', level: 2, parent_code: '1000', is_header: true, normal_balance: 'DEBIT', is_active: true },
  { code: '1210', name: 'Trade Debtors', account_type: 'ASSET', level: 3, parent_code: '1200', normal_balance: 'DEBIT', is_active: true },
  { code: '1220', name: 'Layby Debtors', account_type: 'ASSET', level: 3, parent_code: '1200', normal_balance: 'DEBIT', is_active: true },
  
  { code: '1300', name: 'Inventory', account_type: 'ASSET', level: 2, parent_code: '1000', is_header: true, normal_balance: 'DEBIT', is_active: true },
  { code: '1310', name: 'Inventory - Retail Store', account_type: 'ASSET', level: 3, parent_code: '1300', normal_balance: 'DEBIT', is_active: true },
  { code: '1320', name: 'Inventory - Warehouse', account_type: 'ASSET', level: 3, parent_code: '1300', normal_balance: 'DEBIT', is_active: true },
  { code: '1330', name: 'Inventory - Damaged/Obsolete', account_type: 'ASSET', level: 3, parent_code: '1300', normal_balance: 'DEBIT', is_active: true },
  
  { code: '1500', name: 'Fixed Assets', account_type: 'ASSET', level: 2, parent_code: '1000', is_header: true, normal_balance: 'DEBIT', is_active: true },
  { code: '1510', name: 'Shop Fittings & Fixtures', account_type: 'ASSET', level: 3, parent_code: '1500', normal_balance: 'DEBIT', is_active: true },
  { code: '1520', name: 'Accumulated Depreciation - Fittings', account_type: 'ASSET', level: 3, parent_code: '1500', normal_balance: 'CREDIT', is_active: true },
  { code: '1530', name: 'POS Systems', account_type: 'ASSET', level: 3, parent_code: '1500', normal_balance: 'DEBIT', is_active: true },
  { code: '1540', name: 'Accumulated Depreciation - POS', account_type: 'ASSET', level: 3, parent_code: '1500', normal_balance: 'CREDIT', is_active: true },
  
  // LIABILITIES
  { code: '2000', name: 'LIABILITIES', account_type: 'LIABILITY', level: 1, is_header: true, normal_balance: 'CREDIT', is_active: true },
  { code: '2100', name: 'Trade Creditors', account_type: 'LIABILITY', level: 2, parent_code: '2000', normal_balance: 'CREDIT', is_active: true },
  { code: '2200', name: 'Layby Liability', account_type: 'LIABILITY', level: 2, parent_code: '2000', normal_balance: 'CREDIT', is_active: true },
  { code: '2300', name: 'Gift Cards Outstanding', account_type: 'LIABILITY', level: 2, parent_code: '2000', normal_balance: 'CREDIT', is_active: true },
  { code: '2400', name: 'SARS - VAT Output', account_type: 'LIABILITY', level: 2, parent_code: '2000', normal_balance: 'CREDIT', is_active: true },
  { code: '2410', name: 'SARS - VAT Input', account_type: 'LIABILITY', level: 2, parent_code: '2000', normal_balance: 'DEBIT', is_active: true },
  { code: '2500', name: 'SARS - PAYE', account_type: 'LIABILITY', level: 2, parent_code: '2000', normal_balance: 'CREDIT', is_active: true },
  
  // EQUITY
  { code: '3000', name: 'EQUITY', account_type: 'EQUITY', level: 1, is_header: true, normal_balance: 'CREDIT', is_active: true },
  { code: '3100', name: 'Share Capital', account_type: 'EQUITY', level: 2, parent_code: '3000', normal_balance: 'CREDIT', is_active: true },
  { code: '3200', name: 'Retained Earnings', account_type: 'EQUITY', level: 2, parent_code: '3000', normal_balance: 'CREDIT', is_active: true },
  { code: '3300', name: 'Current Profit/Loss', account_type: 'EQUITY', level: 2, parent_code: '3000', normal_balance: 'CREDIT', is_active: true },
  
  // REVENUE
  { code: '4000', name: 'REVENUE', account_type: 'REVENUE', level: 1, is_header: true, normal_balance: 'CREDIT', is_active: true },
  { code: '4100', name: 'Retail Sales - Cash', account_type: 'REVENUE', level: 2, parent_code: '4000', normal_balance: 'CREDIT', is_active: true },
  { code: '4200', name: 'Retail Sales - Card', account_type: 'REVENUE', level: 2, parent_code: '4000', normal_balance: 'CREDIT', is_active: true },
  { code: '4300', name: 'Retail Sales - Credit', account_type: 'REVENUE', level: 2, parent_code: '4000', normal_balance: 'CREDIT', is_active: true },
  { code: '4400', name: 'Layby Sales', account_type: 'REVENUE', level: 2, parent_code: '4000', normal_balance: 'CREDIT', is_active: true },
  { code: '4500', name: 'Gift Card Sales', account_type: 'REVENUE', level: 2, parent_code: '4000', normal_balance: 'CREDIT', is_active: true },
  { code: '4900', name: 'Sales Returns & Refunds', account_type: 'REVENUE', level: 2, parent_code: '4000', normal_balance: 'DEBIT', is_active: true },
  
  // COST OF SALES
  { code: '5000', name: 'COST OF SALES', account_type: 'EXPENSE', level: 1, is_header: true, normal_balance: 'DEBIT', is_active: true },
  { code: '5100', name: 'Cost of Goods Sold', account_type: 'EXPENSE', level: 2, parent_code: '5000', normal_balance: 'DEBIT', is_active: true },
  { code: '5200', name: 'Shrinkage & Theft', account_type: 'EXPENSE', level: 2, parent_code: '5000', normal_balance: 'DEBIT', is_active: true },
  { code: '5300', name: 'Stock Write-offs', account_type: 'EXPENSE', level: 2, parent_code: '5000', normal_balance: 'DEBIT', is_active: true },
  
  // EXPENSES
  { code: '6000', name: 'EXPENSES', account_type: 'EXPENSE', level: 1, is_header: true, normal_balance: 'DEBIT', is_active: true },
  { code: '6100', name: 'Salaries - Management', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6200', name: 'Wages - Sales Staff', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6300', name: 'Rent - Retail Space', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6400', name: 'Card Processing Fees', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6500', name: 'Marketing & Promotions', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6600', name: 'Security Services', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6700', name: 'Cleaning Services', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
];

// ============================================
// TEMPLATE 3: PROFESSIONAL SERVICES (Law, Accounting, Consulting)
// ============================================
export const TEMPLATE_PROFESSIONAL_SERVICES: TemplateAccount[] = [
  // ASSETS
  { code: '1000', name: 'ASSETS', account_type: 'ASSET', level: 1, is_header: true, normal_balance: 'DEBIT', is_active: true },
  { code: '1100', name: 'Bank - Trust Account', account_type: 'ASSET', level: 2, parent_code: '1000', normal_balance: 'DEBIT', is_active: true },
  { code: '1200', name: 'Bank - Business Account', account_type: 'ASSET', level: 2, parent_code: '1000', normal_balance: 'DEBIT', is_active: true },
  { code: '1300', name: 'Accounts Receivable - Clients', account_type: 'ASSET', level: 2, parent_code: '1000', normal_balance: 'DEBIT', is_active: true },
  { code: '1310', name: 'Unbilled Services (WIP)', account_type: 'ASSET', level: 2, parent_code: '1000', normal_balance: 'DEBIT', is_active: true },
  { code: '1400', name: 'Prepaid Professional Indemnity', account_type: 'ASSET', level: 2, parent_code: '1000', normal_balance: 'DEBIT', is_active: true },
  { code: '1500', name: 'Office Equipment', account_type: 'ASSET', level: 2, parent_code: '1000', normal_balance: 'DEBIT', is_active: true },
  { code: '1510', name: 'Accumulated Depreciation', account_type: 'ASSET', level: 2, parent_code: '1000', normal_balance: 'CREDIT', is_active: true },
  
  // LIABILITIES
  { code: '2000', name: 'LIABILITIES', account_type: 'LIABILITY', level: 1, is_header: true, normal_balance: 'CREDIT', is_active: true },
  { code: '2100', name: 'Trust Liabilities - Client Funds', account_type: 'LIABILITY', level: 2, parent_code: '2000', normal_balance: 'CREDIT', is_active: true },
  { code: '2200', name: 'Unearned Revenue - Retainers', account_type: 'LIABILITY', level: 2, parent_code: '2000', normal_balance: 'CREDIT', is_active: true },
  { code: '2300', name: 'SARS - PAYE', account_type: 'LIABILITY', level: 2, parent_code: '2000', normal_balance: 'CREDIT', is_active: true },
  { code: '2400', name: 'SARS - VAT', account_type: 'LIABILITY', level: 2, parent_code: '2000', normal_balance: 'CREDIT', is_active: true },
  { code: '2500', name: 'SARS - Provisional Tax', account_type: 'LIABILITY', level: 2, parent_code: '2000', normal_balance: 'CREDIT', is_active: true },
  
  // EQUITY
  { code: '3000', name: 'EQUITY', account_type: 'EQUITY', level: 1, is_header: true, normal_balance: 'CREDIT', is_active: true },
  { code: '3100', name: 'Partners Capital', account_type: 'EQUITY', level: 2, parent_code: '3000', normal_balance: 'CREDIT', is_active: true },
  { code: '3200', name: 'Partners Drawings', account_type: 'EQUITY', level: 2, parent_code: '3000', normal_balance: 'DEBIT', is_active: true },
  { code: '3300', name: 'Retained Earnings', account_type: 'EQUITY', level: 2, parent_code: '3000', normal_balance: 'CREDIT', is_active: true },
  
  // REVENUE
  { code: '4000', name: 'REVENUE', account_type: 'REVENUE', level: 1, is_header: true, normal_balance: 'CREDIT', is_active: true },
  { code: '4100', name: 'Professional Fees - Billable Hours', account_type: 'REVENUE', level: 2, parent_code: '4000', normal_balance: 'CREDIT', is_active: true },
  { code: '4200', name: 'Professional Fees - Fixed Fee', account_type: 'REVENUE', level: 2, parent_code: '4000', normal_balance: 'CREDIT', is_active: true },
  { code: '4300', name: 'Retainer Fees', account_type: 'REVENUE', level: 2, parent_code: '4000', normal_balance: 'CREDIT', is_active: true },
  { code: '4400', name: 'Consultation Fees', account_type: 'REVENUE', level: 2, parent_code: '4000', normal_balance: 'CREDIT', is_active: true },
  { code: '4500', name: 'Disbursements Recovered', account_type: 'REVENUE', level: 2, parent_code: '4000', normal_balance: 'CREDIT', is_active: true },
  
  // EXPENSES
  { code: '6000', name: 'EXPENSES', account_type: 'EXPENSE', level: 1, is_header: true, normal_balance: 'DEBIT', is_active: true },
  { code: '6100', name: 'Salaries - Professional Staff', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6200', name: 'Salaries - Administrative Staff', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6300', name: 'Professional Indemnity Insurance', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6400', name: 'Professional Development & CPD', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6500', name: 'Legal Research & Subscriptions', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6600', name: 'Office Rent', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6700', name: 'Client Disbursements', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6800', name: 'Marketing & Business Development', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
];

// ============================================
// TEMPLATE 4: MANUFACTURING
// ============================================
export const TEMPLATE_MANUFACTURING: TemplateAccount[] = [
  // ASSETS
  { code: '1000', name: 'ASSETS', account_type: 'ASSET', level: 1, is_header: true, normal_balance: 'DEBIT', is_active: true },
  { code: '1100', name: 'Cash & Bank', account_type: 'ASSET', level: 2, parent_code: '1000', normal_balance: 'DEBIT', is_active: true },
  { code: '1200', name: 'Accounts Receivable', account_type: 'ASSET', level: 2, parent_code: '1000', normal_balance: 'DEBIT', is_active: true },
  
  { code: '1300', name: 'Inventory', account_type: 'ASSET', level: 2, parent_code: '1000', is_header: true, normal_balance: 'DEBIT', is_active: true },
  { code: '1310', name: 'Raw Materials', account_type: 'ASSET', level: 3, parent_code: '1300', normal_balance: 'DEBIT', is_active: true },
  { code: '1320', name: 'Work in Progress (WIP)', account_type: 'ASSET', level: 3, parent_code: '1300', normal_balance: 'DEBIT', is_active: true },
  { code: '1330', name: 'Finished Goods', account_type: 'ASSET', level: 3, parent_code: '1300', normal_balance: 'DEBIT', is_active: true },
  { code: '1340', name: 'Packaging Materials', account_type: 'ASSET', level: 3, parent_code: '1300', normal_balance: 'DEBIT', is_active: true },
  { code: '1350', name: 'Spare Parts & Consumables', account_type: 'ASSET', level: 3, parent_code: '1300', normal_balance: 'DEBIT', is_active: true },
  
  { code: '1500', name: 'Property, Plant & Equipment', account_type: 'ASSET', level: 2, parent_code: '1000', is_header: true, normal_balance: 'DEBIT', is_active: true },
  { code: '1510', name: 'Factory Building', account_type: 'ASSET', level: 3, parent_code: '1500', normal_balance: 'DEBIT', is_active: true },
  { code: '1520', name: 'Production Machinery', account_type: 'ASSET', level: 3, parent_code: '1500', normal_balance: 'DEBIT', is_active: true },
  { code: '1530', name: 'Tools & Equipment', account_type: 'ASSET', level: 3, parent_code: '1500', normal_balance: 'DEBIT', is_active: true },
  { code: '1540', name: 'Accumulated Depreciation - Machinery', account_type: 'ASSET', level: 3, parent_code: '1500', normal_balance: 'CREDIT', is_active: true },
  
  // LIABILITIES
  { code: '2000', name: 'LIABILITIES', account_type: 'LIABILITY', level: 1, is_header: true, normal_balance: 'CREDIT', is_active: true },
  { code: '2100', name: 'Accounts Payable - Suppliers', account_type: 'LIABILITY', level: 2, parent_code: '2000', normal_balance: 'CREDIT', is_active: true },
  { code: '2200', name: 'Accrued Wages', account_type: 'LIABILITY', level: 2, parent_code: '2000', normal_balance: 'CREDIT', is_active: true },
  { code: '2300', name: 'SARS - PAYE', account_type: 'LIABILITY', level: 2, parent_code: '2000', normal_balance: 'CREDIT', is_active: true },
  { code: '2400', name: 'SARS - UIF', account_type: 'LIABILITY', level: 2, parent_code: '2000', normal_balance: 'CREDIT', is_active: true },
  { code: '2500', name: 'SARS - VAT', account_type: 'LIABILITY', level: 2, parent_code: '2000', normal_balance: 'CREDIT', is_active: true },
  
  // EQUITY
  { code: '3000', name: 'EQUITY', account_type: 'EQUITY', level: 1, is_header: true, normal_balance: 'CREDIT', is_active: true },
  { code: '3100', name: 'Share Capital', account_type: 'EQUITY', level: 2, parent_code: '3000', normal_balance: 'CREDIT', is_active: true },
  { code: '3200', name: 'Retained Earnings', account_type: 'EQUITY', level: 2, parent_code: '3000', normal_balance: 'CREDIT', is_active: true },
  
  // REVENUE
  { code: '4000', name: 'REVENUE', account_type: 'REVENUE', level: 1, is_header: true, normal_balance: 'CREDIT', is_active: true },
  { code: '4100', name: 'Sales - Finished Products', account_type: 'REVENUE', level: 2, parent_code: '4000', normal_balance: 'CREDIT', is_active: true },
  { code: '4200', name: 'Contract Manufacturing Revenue', account_type: 'REVENUE', level: 2, parent_code: '4000', normal_balance: 'CREDIT', is_active: true },
  
  // COST OF PRODUCTION
  { code: '5000', name: 'COST OF PRODUCTION', account_type: 'EXPENSE', level: 1, is_header: true, normal_balance: 'DEBIT', is_active: true },
  { code: '5100', name: 'Direct Materials', account_type: 'EXPENSE', level: 2, parent_code: '5000', normal_balance: 'DEBIT', is_active: true },
  { code: '5200', name: 'Direct Labor - Production', account_type: 'EXPENSE', level: 2, parent_code: '5000', normal_balance: 'DEBIT', is_active: true },
  { code: '5300', name: 'Manufacturing Overheads', account_type: 'EXPENSE', level: 2, parent_code: '5000', normal_balance: 'DEBIT', is_active: true },
  { code: '5310', name: 'Factory Utilities', account_type: 'EXPENSE', level: 3, parent_code: '5000', normal_balance: 'DEBIT', is_active: true },
  { code: '5320', name: 'Factory Maintenance', account_type: 'EXPENSE', level: 3, parent_code: '5000', normal_balance: 'DEBIT', is_active: true },
  { code: '5330', name: 'Quality Control', account_type: 'EXPENSE', level: 3, parent_code: '5000', normal_balance: 'DEBIT', is_active: true },
  { code: '5400', name: 'Depreciation - Production Equipment', account_type: 'EXPENSE', level: 2, parent_code: '5000', normal_balance: 'DEBIT', is_active: true },
  
  // OPERATING EXPENSES
  { code: '6000', name: 'OPERATING EXPENSES', account_type: 'EXPENSE', level: 1, is_header: true, normal_balance: 'DEBIT', is_active: true },
  { code: '6100', name: 'Salaries - Admin', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6200', name: 'Sales & Distribution', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
  { code: '6300', name: 'Research & Development', account_type: 'EXPENSE', level: 2, parent_code: '6000', normal_balance: 'DEBIT', is_active: true },
];

// ============================================
// TEMPLATE METADATA
// ============================================
export interface COATemplate {
  id: string;
  name: string;
  description: string;
  industry: string;
  accounts: TemplateAccount[];
  account_count: number;
  suitable_for: string[];
  compliance: string[];
}

export const COA_TEMPLATES: COATemplate[] = [
  {
    id: 'small-business',
    name: 'Small Business (GAAP)',
    description: 'Standard Chart of Accounts for small South African businesses. Suitable for general trading, services, and sole proprietors.',
    industry: 'General Business',
    accounts: TEMPLATE_SMALL_BUSINESS,
    account_count: TEMPLATE_SMALL_BUSINESS.length,
    suitable_for: ['Sole Proprietor', 'Close Corporation', 'Small Pty Ltd', 'General Trading', 'Service Business'],
    compliance: ['IFRS for SMEs', 'Companies Act 71 of 2008', 'SARS Tax Compliance', 'Basic VAT'],
  },
  {
    id: 'retail',
    name: 'Retail Business',
    description: 'Optimized for retail shops with multiple payment methods, layby, gift cards, and inventory management.',
    industry: 'Retail',
    accounts: TEMPLATE_RETAIL,
    account_count: TEMPLATE_RETAIL.length,
    suitable_for: ['Retail Store', 'Boutique', 'Supermarket', 'Online Retail', 'Multi-channel Retail'],
    compliance: ['IFRS', 'VAT Retail Scheme', 'Card Payment Reconciliation', 'POS Integration Ready'],
  },
  {
    id: 'professional-services',
    name: 'Professional Services',
    description: 'For law firms, accounting practices, consultancies with trust accounts, billable hours, and client disbursements.',
    industry: 'Professional Services',
    accounts: TEMPLATE_PROFESSIONAL_SERVICES,
    account_count: TEMPLATE_PROFESSIONAL_SERVICES.length,
    suitable_for: ['Law Firms', 'Accounting Firms', 'Consultancies', 'Engineering Firms', 'Architects'],
    compliance: ['Trust Account Regulations', 'Professional Body Requirements', 'Fidelity Fund Compliance', 'WIP Tracking'],
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    description: 'Complete cost accounting structure for manufacturers with raw materials, WIP, finished goods, and production overhead tracking.',
    industry: 'Manufacturing',
    accounts: TEMPLATE_MANUFACTURING,
    account_count: TEMPLATE_MANUFACTURING.length,
    suitable_for: ['Manufacturers', 'Contract Manufacturing', 'Food Production', 'Assembly Operations'],
    compliance: ['IFRS', 'Inventory Valuation', 'Cost Accounting', 'Production Costing'],
  },
];
