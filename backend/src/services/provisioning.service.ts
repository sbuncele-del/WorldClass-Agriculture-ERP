import { pool as sharedPool } from '../config/database';
import { ConflictError, NotFoundError } from '../types';

// Use shared pool from config/database.ts - single pool for entire application
function getPool() {
  return sharedPool;
}

interface ProvisioningData {
  tenantId: string;
  country?: string;
  industry?: string;
  financialYearEnd?: string;
  currency?: string;
}

export class ProvisioningService {
  /**
   * Complete tenant provisioning after signup
   * Creates chart of accounts, sample data, and sends welcome email
   */
  static async provisionNewTenant(data: ProvisioningData): Promise<void> {
    const {
      tenantId,
      country = 'ZA',
      industry = 'general',
      financialYearEnd = '02-28',
      currency = 'ZAR'
    } = data;

    const client = await getPool().connect();

    try {
      await client.query('BEGIN');

      // 1. Create chart of accounts based on industry
      await this.createChartOfAccounts(client, tenantId, country, industry);

      // 2. Create default tax rates (South Africa)
      if (country === 'ZA') {
        await this.createSouthAfricanTaxRates(client, tenantId);
      }

      // 3. Create default financial periods (current year)
      await this.createFinancialPeriods(client, tenantId, financialYearEnd);

      // 4. Create default payment terms
      await this.createDefaultPaymentTerms(client, tenantId);

      // 5. Create default document numbering
      await this.createDocumentNumbering(client, tenantId);

      // 6. Update tenant settings
      await client.query(
        `UPDATE tenants 
         SET settings = settings || $2::jsonb
         WHERE id = $1`,
        [
          tenantId,
          JSON.stringify({
            provisioned: true,
            provisioned_at: new Date().toISOString(),
            country,
            industry,
            financial_year_end: financialYearEnd,
            currency
          })
        ]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create Chart of Accounts based on industry template
   */
  private static async createChartOfAccounts(
    client: any,
    tenantId: string,
    country: string,
    industry: string
  ): Promise<void> {
    // Get template based on industry
    const template = this.getChartOfAccountsTemplate(country, industry);

    for (const account of template) {
      await client.query(
        `INSERT INTO chart_of_accounts (
          tenant_id, code, name, type, subtype, category,
          parent_code, is_active, allow_transactions, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (tenant_id, code) DO NOTHING`,
        [
          tenantId,
          account.code,
          account.name,
          account.type,
          account.subtype,
          account.category,
          account.parent_code || null,
          true,
          account.allow_transactions !== false,
          account.description || null
        ]
      );
    }
  }

  /**
   * Get Chart of Accounts template
   */
  private static getChartOfAccountsTemplate(country: string, industry: string): any[] {
    // South African Chart of Accounts templates
    if (country === 'ZA') {
      const baseTemplate = this.getSouthAfricanBaseTemplate();
      
      switch (industry) {
        case 'manufacturing':
          return [...baseTemplate, ...this.getManufacturingAccounts()];
        case 'retail':
          return [...baseTemplate, ...this.getRetailAccounts()];
        case 'services':
          return [...baseTemplate, ...this.getServicesAccounts()];
        case 'construction':
          return [...baseTemplate, ...this.getConstructionAccounts()];
        default:
          return baseTemplate;
      }
    }

    // Default international template
    return this.getInternationalTemplate();
  }

  /**
   * South African Base Chart of Accounts
   */
  private static getSouthAfricanBaseTemplate(): any[] {
    return [
      // ==================== ASSETS (1000-1999) ====================
      // Current Assets (1000-1499)
      { code: '1000', name: 'Assets', type: 'asset', subtype: 'current', category: 'header', allow_transactions: false },
      { code: '1100', name: 'Current Assets', type: 'asset', subtype: 'current', category: 'header', parent_code: '1000', allow_transactions: false },
      
      // Bank Accounts
      { code: '1110', name: 'Bank Accounts', type: 'asset', subtype: 'current', category: 'bank', parent_code: '1100', allow_transactions: false },
      { code: '1111', name: 'Standard Bank - Current', type: 'asset', subtype: 'current', category: 'bank', parent_code: '1110' },
      { code: '1112', name: 'FNB - Business Account', type: 'asset', subtype: 'current', category: 'bank', parent_code: '1110' },
      { code: '1113', name: 'Nedbank - Cheque Account', type: 'asset', subtype: 'current', category: 'bank', parent_code: '1110' },
      { code: '1115', name: 'Petty Cash', type: 'asset', subtype: 'current', category: 'cash', parent_code: '1110' },
      
      // Accounts Receivable
      { code: '1200', name: 'Accounts Receivable', type: 'asset', subtype: 'current', category: 'receivable', parent_code: '1100', allow_transactions: false },
      { code: '1210', name: 'Trade Debtors', type: 'asset', subtype: 'current', category: 'receivable', parent_code: '1200' },
      { code: '1220', name: 'Provision for Bad Debts', type: 'asset', subtype: 'current', category: 'receivable', parent_code: '1200' },
      { code: '1230', name: 'VAT Input', type: 'asset', subtype: 'current', category: 'tax', parent_code: '1200', description: 'VAT paid on purchases' },
      
      // Inventory
      { code: '1300', name: 'Inventory', type: 'asset', subtype: 'current', category: 'inventory', parent_code: '1100', allow_transactions: false },
      { code: '1310', name: 'Raw Materials', type: 'asset', subtype: 'current', category: 'inventory', parent_code: '1300' },
      { code: '1320', name: 'Work in Progress', type: 'asset', subtype: 'current', category: 'inventory', parent_code: '1300' },
      { code: '1330', name: 'Finished Goods', type: 'asset', subtype: 'current', category: 'inventory', parent_code: '1300' },
      { code: '1340', name: 'Stock Obsolescence', type: 'asset', subtype: 'current', category: 'inventory', parent_code: '1300' },
      
      // Other Current Assets
      { code: '1400', name: 'Other Current Assets', type: 'asset', subtype: 'current', category: 'other', parent_code: '1100', allow_transactions: false },
      { code: '1410', name: 'Prepaid Expenses', type: 'asset', subtype: 'current', category: 'prepaid', parent_code: '1400' },
      { code: '1420', name: 'Deposits Paid', type: 'asset', subtype: 'current', category: 'deposit', parent_code: '1400' },
      { code: '1430', name: 'Staff Loans', type: 'asset', subtype: 'current', category: 'loan', parent_code: '1400' },
      
      // Fixed Assets (1500-1999)
      { code: '1500', name: 'Fixed Assets', type: 'asset', subtype: 'fixed', category: 'header', parent_code: '1000', allow_transactions: false },
      
      // Property, Plant & Equipment
      { code: '1510', name: 'Land and Buildings', type: 'asset', subtype: 'fixed', category: 'property', parent_code: '1500', allow_transactions: false },
      { code: '1511', name: 'Land - Cost', type: 'asset', subtype: 'fixed', category: 'property', parent_code: '1510' },
      { code: '1512', name: 'Buildings - Cost', type: 'asset', subtype: 'fixed', category: 'property', parent_code: '1510' },
      { code: '1513', name: 'Buildings - Accumulated Depreciation', type: 'asset', subtype: 'fixed', category: 'depreciation', parent_code: '1510' },
      
      { code: '1520', name: 'Vehicles', type: 'asset', subtype: 'fixed', category: 'vehicle', parent_code: '1500', allow_transactions: false },
      { code: '1521', name: 'Vehicles - Cost', type: 'asset', subtype: 'fixed', category: 'vehicle', parent_code: '1520' },
      { code: '1522', name: 'Vehicles - Accumulated Depreciation', type: 'asset', subtype: 'fixed', category: 'depreciation', parent_code: '1520' },
      
      { code: '1530', name: 'Office Equipment', type: 'asset', subtype: 'fixed', category: 'equipment', parent_code: '1500', allow_transactions: false },
      { code: '1531', name: 'Office Equipment - Cost', type: 'asset', subtype: 'fixed', category: 'equipment', parent_code: '1530' },
      { code: '1532', name: 'Office Equipment - Accumulated Depreciation', type: 'asset', subtype: 'fixed', category: 'depreciation', parent_code: '1530' },
      
      { code: '1540', name: 'Computer Equipment', type: 'asset', subtype: 'fixed', category: 'equipment', parent_code: '1500', allow_transactions: false },
      { code: '1541', name: 'Computer Equipment - Cost', type: 'asset', subtype: 'fixed', category: 'equipment', parent_code: '1540' },
      { code: '1542', name: 'Computer Equipment - Accumulated Depreciation', type: 'asset', subtype: 'fixed', category: 'depreciation', parent_code: '1540' },
      
      { code: '1550', name: 'Furniture and Fittings', type: 'asset', subtype: 'fixed', category: 'equipment', parent_code: '1500', allow_transactions: false },
      { code: '1551', name: 'Furniture - Cost', type: 'asset', subtype: 'fixed', category: 'equipment', parent_code: '1550' },
      { code: '1552', name: 'Furniture - Accumulated Depreciation', type: 'asset', subtype: 'fixed', category: 'depreciation', parent_code: '1550' },

      // ==================== LIABILITIES (2000-2999) ====================
      // Current Liabilities (2000-2499)
      { code: '2000', name: 'Liabilities', type: 'liability', subtype: 'current', category: 'header', allow_transactions: false },
      { code: '2100', name: 'Current Liabilities', type: 'liability', subtype: 'current', category: 'header', parent_code: '2000', allow_transactions: false },
      
      // Accounts Payable
      { code: '2110', name: 'Accounts Payable', type: 'liability', subtype: 'current', category: 'payable', parent_code: '2100', allow_transactions: false },
      { code: '2111', name: 'Trade Creditors', type: 'liability', subtype: 'current', category: 'payable', parent_code: '2110' },
      { code: '2115', name: 'VAT Output', type: 'liability', subtype: 'current', category: 'tax', parent_code: '2110', description: 'VAT collected on sales' },
      
      // Payroll Liabilities
      { code: '2200', name: 'Payroll Liabilities', type: 'liability', subtype: 'current', category: 'payroll', parent_code: '2100', allow_transactions: false },
      { code: '2210', name: 'PAYE Payable', type: 'liability', subtype: 'current', category: 'tax', parent_code: '2200' },
      { code: '2220', name: 'UIF Payable', type: 'liability', subtype: 'current', category: 'tax', parent_code: '2200' },
      { code: '2230', name: 'SDL Payable', type: 'liability', subtype: 'current', category: 'tax', parent_code: '2200' },
      { code: '2240', name: 'Pension/Provident Fund Payable', type: 'liability', subtype: 'current', category: 'payroll', parent_code: '2200' },
      { code: '2250', name: 'Medical Aid Payable', type: 'liability', subtype: 'current', category: 'payroll', parent_code: '2200' },
      
      // Other Current Liabilities
      { code: '2300', name: 'Other Current Liabilities', type: 'liability', subtype: 'current', category: 'other', parent_code: '2100', allow_transactions: false },
      { code: '2310', name: 'Accrued Expenses', type: 'liability', subtype: 'current', category: 'accrued', parent_code: '2300' },
      { code: '2320', name: 'Deferred Income', type: 'liability', subtype: 'current', category: 'deferred', parent_code: '2300' },
      { code: '2330', name: 'Customer Deposits', type: 'liability', subtype: 'current', category: 'deposit', parent_code: '2300' },
      
      // Long-term Liabilities (2500-2999)
      { code: '2500', name: 'Long-term Liabilities', type: 'liability', subtype: 'long_term', category: 'header', parent_code: '2000', allow_transactions: false },
      { code: '2510', name: 'Bank Loans', type: 'liability', subtype: 'long_term', category: 'loan', parent_code: '2500' },
      { code: '2520', name: 'Vehicle Finance', type: 'liability', subtype: 'long_term', category: 'loan', parent_code: '2500' },
      { code: '2530', name: 'Shareholders Loans', type: 'liability', subtype: 'long_term', category: 'loan', parent_code: '2500' },

      // ==================== EQUITY (3000-3999) ====================
      { code: '3000', name: 'Equity', type: 'equity', subtype: 'equity', category: 'header', allow_transactions: false },
      { code: '3100', name: 'Share Capital', type: 'equity', subtype: 'equity', category: 'capital', parent_code: '3000' },
      { code: '3200', name: 'Retained Earnings', type: 'equity', subtype: 'equity', category: 'retained', parent_code: '3000' },
      { code: '3300', name: 'Current Year Earnings', type: 'equity', subtype: 'equity', category: 'current', parent_code: '3000' },
      { code: '3400', name: 'Drawings', type: 'equity', subtype: 'equity', category: 'drawings', parent_code: '3000' },

      // ==================== REVENUE (4000-4999) ====================
      { code: '4000', name: 'Revenue', type: 'revenue', subtype: 'operating', category: 'header', allow_transactions: false },
      { code: '4100', name: 'Sales Revenue', type: 'revenue', subtype: 'operating', category: 'sales', parent_code: '4000', allow_transactions: false },
      { code: '4110', name: 'Sales - Products', type: 'revenue', subtype: 'operating', category: 'sales', parent_code: '4100' },
      { code: '4120', name: 'Sales - Services', type: 'revenue', subtype: 'operating', category: 'sales', parent_code: '4100' },
      { code: '4130', name: 'Sales Returns', type: 'revenue', subtype: 'operating', category: 'sales', parent_code: '4100' },
      { code: '4140', name: 'Sales Discounts', type: 'revenue', subtype: 'operating', category: 'sales', parent_code: '4100' },
      
      { code: '4200', name: 'Other Revenue', type: 'revenue', subtype: 'other', category: 'other', parent_code: '4000', allow_transactions: false },
      { code: '4210', name: 'Interest Income', type: 'revenue', subtype: 'other', category: 'interest', parent_code: '4200' },
      { code: '4220', name: 'Rental Income', type: 'revenue', subtype: 'other', category: 'rental', parent_code: '4200' },
      { code: '4230', name: 'Foreign Exchange Gain', type: 'revenue', subtype: 'other', category: 'forex', parent_code: '4200' },

      // ==================== COST OF SALES (5000-5999) ====================
      { code: '5000', name: 'Cost of Sales', type: 'expense', subtype: 'cost_of_sales', category: 'header', allow_transactions: false },
      { code: '5100', name: 'Direct Costs', type: 'expense', subtype: 'cost_of_sales', category: 'direct', parent_code: '5000', allow_transactions: false },
      { code: '5110', name: 'Purchases - Materials', type: 'expense', subtype: 'cost_of_sales', category: 'materials', parent_code: '5100' },
      { code: '5120', name: 'Purchases - Finished Goods', type: 'expense', subtype: 'cost_of_sales', category: 'goods', parent_code: '5100' },
      { code: '5130', name: 'Direct Labour', type: 'expense', subtype: 'cost_of_sales', category: 'labour', parent_code: '5100' },
      { code: '5140', name: 'Subcontractors', type: 'expense', subtype: 'cost_of_sales', category: 'subcontractor', parent_code: '5100' },
      { code: '5150', name: 'Freight Inwards', type: 'expense', subtype: 'cost_of_sales', category: 'freight', parent_code: '5100' },

      // ==================== OPERATING EXPENSES (6000-6999) ====================
      { code: '6000', name: 'Operating Expenses', type: 'expense', subtype: 'operating', category: 'header', allow_transactions: false },
      
      // Staff Costs
      { code: '6100', name: 'Staff Costs', type: 'expense', subtype: 'operating', category: 'staff', parent_code: '6000', allow_transactions: false },
      { code: '6110', name: 'Salaries and Wages', type: 'expense', subtype: 'operating', category: 'staff', parent_code: '6100' },
      { code: '6120', name: 'UIF Expense', type: 'expense', subtype: 'operating', category: 'staff', parent_code: '6100' },
      { code: '6130', name: 'SDL Expense', type: 'expense', subtype: 'operating', category: 'staff', parent_code: '6100' },
      { code: '6140', name: 'Pension/Provident Fund', type: 'expense', subtype: 'operating', category: 'staff', parent_code: '6100' },
      { code: '6150', name: 'Medical Aid', type: 'expense', subtype: 'operating', category: 'staff', parent_code: '6100' },
      { code: '6160', name: 'Staff Training', type: 'expense', subtype: 'operating', category: 'staff', parent_code: '6100' },
      { code: '6170', name: 'Staff Recruitment', type: 'expense', subtype: 'operating', category: 'staff', parent_code: '6100' },
      
      // Premises Costs
      { code: '6200', name: 'Premises Costs', type: 'expense', subtype: 'operating', category: 'premises', parent_code: '6000', allow_transactions: false },
      { code: '6210', name: 'Rent', type: 'expense', subtype: 'operating', category: 'premises', parent_code: '6200' },
      { code: '6220', name: 'Electricity', type: 'expense', subtype: 'operating', category: 'utilities', parent_code: '6200' },
      { code: '6230', name: 'Water and Rates', type: 'expense', subtype: 'operating', category: 'utilities', parent_code: '6200' },
      { code: '6240', name: 'Property Insurance', type: 'expense', subtype: 'operating', category: 'insurance', parent_code: '6200' },
      { code: '6250', name: 'Security', type: 'expense', subtype: 'operating', category: 'premises', parent_code: '6200' },
      { code: '6260', name: 'Cleaning', type: 'expense', subtype: 'operating', category: 'premises', parent_code: '6200' },
      
      // Vehicle Costs
      { code: '6300', name: 'Vehicle Costs', type: 'expense', subtype: 'operating', category: 'vehicle', parent_code: '6000', allow_transactions: false },
      { code: '6310', name: 'Fuel', type: 'expense', subtype: 'operating', category: 'vehicle', parent_code: '6300' },
      { code: '6320', name: 'Vehicle Maintenance', type: 'expense', subtype: 'operating', category: 'vehicle', parent_code: '6300' },
      { code: '6330', name: 'Vehicle Insurance', type: 'expense', subtype: 'operating', category: 'insurance', parent_code: '6300' },
      { code: '6340', name: 'Vehicle License', type: 'expense', subtype: 'operating', category: 'vehicle', parent_code: '6300' },
      
      // Marketing & Advertising
      { code: '6400', name: 'Marketing and Advertising', type: 'expense', subtype: 'operating', category: 'marketing', parent_code: '6000', allow_transactions: false },
      { code: '6410', name: 'Advertising', type: 'expense', subtype: 'operating', category: 'marketing', parent_code: '6400' },
      { code: '6420', name: 'Website Costs', type: 'expense', subtype: 'operating', category: 'marketing', parent_code: '6400' },
      { code: '6430', name: 'Marketing Materials', type: 'expense', subtype: 'operating', category: 'marketing', parent_code: '6400' },
      
      // Administrative
      { code: '6500', name: 'Administrative Expenses', type: 'expense', subtype: 'operating', category: 'admin', parent_code: '6000', allow_transactions: false },
      { code: '6510', name: 'Telephone and Internet', type: 'expense', subtype: 'operating', category: 'communication', parent_code: '6500' },
      { code: '6520', name: 'Postage and Courier', type: 'expense', subtype: 'operating', category: 'communication', parent_code: '6500' },
      { code: '6530', name: 'Printing and Stationery', type: 'expense', subtype: 'operating', category: 'office', parent_code: '6500' },
      { code: '6540', name: 'Software Subscriptions', type: 'expense', subtype: 'operating', category: 'technology', parent_code: '6500' },
      { code: '6550', name: 'Bank Charges', type: 'expense', subtype: 'operating', category: 'banking', parent_code: '6500' },
      { code: '6560', name: 'Legal and Professional Fees', type: 'expense', subtype: 'operating', category: 'professional', parent_code: '6500' },
      { code: '6570', name: 'Accounting Fees', type: 'expense', subtype: 'operating', category: 'professional', parent_code: '6500' },
      { code: '6580', name: 'Audit Fees', type: 'expense', subtype: 'operating', category: 'professional', parent_code: '6500' },
      
      // Depreciation
      { code: '6600', name: 'Depreciation', type: 'expense', subtype: 'operating', category: 'depreciation', parent_code: '6000', allow_transactions: false },
      { code: '6610', name: 'Depreciation - Buildings', type: 'expense', subtype: 'operating', category: 'depreciation', parent_code: '6600' },
      { code: '6620', name: 'Depreciation - Vehicles', type: 'expense', subtype: 'operating', category: 'depreciation', parent_code: '6600' },
      { code: '6630', name: 'Depreciation - Equipment', type: 'expense', subtype: 'operating', category: 'depreciation', parent_code: '6600' },
      
      // Other Expenses
      { code: '6700', name: 'Other Expenses', type: 'expense', subtype: 'operating', category: 'other', parent_code: '6000', allow_transactions: false },
      { code: '6710', name: 'Insurance - General', type: 'expense', subtype: 'operating', category: 'insurance', parent_code: '6700' },
      { code: '6720', name: 'Bad Debts', type: 'expense', subtype: 'operating', category: 'bad_debt', parent_code: '6700' },
      { code: '6730', name: 'Donations', type: 'expense', subtype: 'operating', category: 'donation', parent_code: '6700' },
      { code: '6740', name: 'Licenses and Permits', type: 'expense', subtype: 'operating', category: 'regulatory', parent_code: '6700' },
      
      // Financial Expenses
      { code: '6800', name: 'Financial Expenses', type: 'expense', subtype: 'other', category: 'financial', parent_code: '6000', allow_transactions: false },
      { code: '6810', name: 'Interest Expense', type: 'expense', subtype: 'other', category: 'interest', parent_code: '6800' },
      { code: '6820', name: 'Foreign Exchange Loss', type: 'expense', subtype: 'other', category: 'forex', parent_code: '6800' },
    ];
  }

  /**
   * Additional accounts for Manufacturing industry
   */
  private static getManufacturingAccounts(): any[] {
    return [
      { code: '1350', name: 'Production Supplies', type: 'asset', subtype: 'current', category: 'inventory', parent_code: '1300' },
      { code: '1360', name: 'Packaging Materials', type: 'asset', subtype: 'current', category: 'inventory', parent_code: '1300' },
      { code: '1560', name: 'Machinery and Equipment', type: 'asset', subtype: 'fixed', category: 'equipment', parent_code: '1500', allow_transactions: false },
      { code: '1561', name: 'Machinery - Cost', type: 'asset', subtype: 'fixed', category: 'equipment', parent_code: '1560' },
      { code: '1562', name: 'Machinery - Accumulated Depreciation', type: 'asset', subtype: 'fixed', category: 'depreciation', parent_code: '1560' },
      { code: '5160', name: 'Manufacturing Overhead', type: 'expense', subtype: 'cost_of_sales', category: 'overhead', parent_code: '5100' },
      { code: '5170', name: 'Factory Supplies', type: 'expense', subtype: 'cost_of_sales', category: 'supplies', parent_code: '5100' },
      { code: '6640', name: 'Depreciation - Machinery', type: 'expense', subtype: 'operating', category: 'depreciation', parent_code: '6600' },
    ];
  }

  /**
   * Additional accounts for Retail industry
   */
  private static getRetailAccounts(): any[] {
    return [
      { code: '1350', name: 'Merchandise Inventory', type: 'asset', subtype: 'current', category: 'inventory', parent_code: '1300' },
      { code: '5180', name: 'Shrinkage and Theft', type: 'expense', subtype: 'cost_of_sales', category: 'shrinkage', parent_code: '5100' },
      { code: '6440', name: 'Store Displays', type: 'expense', subtype: 'operating', category: 'marketing', parent_code: '6400' },
      { code: '6450', name: 'Point of Sale Expenses', type: 'expense', subtype: 'operating', category: 'technology', parent_code: '6500' },
    ];
  }

  /**
   * Additional accounts for Services industry
   */
  private static getServicesAccounts(): any[] {
    return [
      { code: '1440', name: 'Unbilled Services', type: 'asset', subtype: 'current', category: 'receivable', parent_code: '1400' },
      { code: '4150', name: 'Consulting Fees', type: 'revenue', subtype: 'operating', category: 'services', parent_code: '4100' },
      { code: '4160', name: 'Retainer Fees', type: 'revenue', subtype: 'operating', category: 'services', parent_code: '4100' },
      { code: '5190', name: 'Project Costs', type: 'expense', subtype: 'cost_of_sales', category: 'project', parent_code: '5100' },
      { code: '6180', name: 'Professional Development', type: 'expense', subtype: 'operating', category: 'staff', parent_code: '6100' },
    ];
  }

  /**
   * Additional accounts for Construction industry
   */
  private static getConstructionAccounts(): any[] {
    return [
      { code: '1360', name: 'Construction in Progress', type: 'asset', subtype: 'current', category: 'inventory', parent_code: '1300' },
      { code: '1450', name: 'Retention Receivable', type: 'asset', subtype: 'current', category: 'receivable', parent_code: '1400' },
      { code: '2340', name: 'Retention Payable', type: 'liability', subtype: 'current', category: 'payable', parent_code: '2300' },
      { code: '5200', name: 'Site Costs', type: 'expense', subtype: 'cost_of_sales', category: 'site', parent_code: '5000', allow_transactions: false },
      { code: '5210', name: 'Building Materials', type: 'expense', subtype: 'cost_of_sales', category: 'materials', parent_code: '5200' },
      { code: '5220', name: 'Equipment Rental', type: 'expense', subtype: 'cost_of_sales', category: 'rental', parent_code: '5200' },
      { code: '6270', name: 'Site Security', type: 'expense', subtype: 'operating', category: 'premises', parent_code: '6200' },
    ];
  }

  /**
   * International (Generic) Chart of Accounts Template
   */
  private static getInternationalTemplate(): any[] {
    // Simplified international template
    return this.getSouthAfricanBaseTemplate(); // Use SA template as base for now
  }

  /**
   * Create South African Tax Rates
   */
  private static async createSouthAfricanTaxRates(client: any, tenantId: string): Promise<void> {
    const taxRates = [
      { code: 'VAT15', name: 'VAT - Standard Rate (15%)', rate: 15.00, type: 'VAT', is_default: true },
      { code: 'VAT0', name: 'VAT - Zero Rated (0%)', rate: 0.00, type: 'VAT', is_default: false },
      { code: 'EXEMPT', name: 'VAT - Exempt', rate: 0.00, type: 'VAT', is_default: false },
    ];

    for (const tax of taxRates) {
      await client.query(
        `INSERT INTO tax_rates (tenant_id, code, name, rate, type, is_default, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT (tenant_id, code) DO NOTHING`,
        [tenantId, tax.code, tax.name, tax.rate, tax.type, tax.is_default]
      );
    }
  }

  /**
   * Create Financial Periods for current year
   */
  private static async createFinancialPeriods(
    client: any,
    tenantId: string,
    financialYearEnd: string
  ): Promise<void> {
    const currentYear = new Date().getFullYear();
    const [endMonth, endDay] = financialYearEnd.split('-').map(Number);
    
    // Determine financial year start
    let yearStart: Date;
    let yearEnd: Date;
    
    const today = new Date();
    const yearEndDate = new Date(currentYear, endMonth - 1, endDay);
    
    if (today > yearEndDate) {
      // Current financial year started this year
      yearStart = new Date(currentYear, endMonth - 1, endDay + 1);
      yearEnd = new Date(currentYear + 1, endMonth - 1, endDay);
    } else {
      // Current financial year started last year
      yearStart = new Date(currentYear - 1, endMonth - 1, endDay + 1);
      yearEnd = yearEndDate;
    }

    // Create 12 monthly periods
    for (let i = 0; i < 12; i++) {
      const periodStart = new Date(yearStart);
      periodStart.setMonth(periodStart.getMonth() + i);
      
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setDate(0); // Last day of month
      
      const periodName = periodStart.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
      const periodCode = periodStart.toISOString().slice(0, 7); // YYYY-MM
      
      await client.query(
        `INSERT INTO financial_periods (
          tenant_id, code, name, start_date, end_date, status, period_number
        ) VALUES ($1, $2, $3, $4, $5, 'open', $6)
        ON CONFLICT (tenant_id, code) DO NOTHING`,
        [tenantId, periodCode, periodName, periodStart, periodEnd, i + 1]
      );
    }
  }

  /**
   * Create Default Payment Terms
   */
  private static async createDefaultPaymentTerms(client: any, tenantId: string): Promise<void> {
    const paymentTerms = [
      { code: 'IMMEDIATE', name: 'Immediate/Cash', days: 0, is_default: true },
      { code: 'NET7', name: 'Net 7 Days', days: 7, is_default: false },
      { code: 'NET30', name: 'Net 30 Days', days: 30, is_default: false },
      { code: 'NET60', name: 'Net 60 Days', days: 60, is_default: false },
      { code: 'NET90', name: 'Net 90 Days', days: 90, is_default: false },
      { code: 'EOM', name: 'End of Month', days: 30, is_default: false },
    ];

    for (const term of paymentTerms) {
      await client.query(
        `INSERT INTO payment_terms (tenant_id, code, name, days, is_default, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (tenant_id, code) DO NOTHING`,
        [tenantId, term.code, term.name, term.days, term.is_default]
      );
    }
  }

  /**
   * Create Document Numbering Sequences
   */
  private static async createDocumentNumbering(client: any, tenantId: string): Promise<void> {
    const sequences = [
      { type: 'invoice', prefix: 'INV', next_number: 1, padding: 5 },
      { type: 'quote', prefix: 'QTE', next_number: 1, padding: 5 },
      { type: 'purchase_order', prefix: 'PO', next_number: 1, padding: 5 },
      { type: 'credit_note', prefix: 'CN', next_number: 1, padding: 5 },
      { type: 'debit_note', prefix: 'DN', next_number: 1, padding: 5 },
      { type: 'journal_entry', prefix: 'JE', next_number: 1, padding: 5 },
    ];

    for (const seq of sequences) {
      await client.query(
        `INSERT INTO document_sequences (tenant_id, document_type, prefix, next_number, padding)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (tenant_id, document_type) DO NOTHING`,
        [tenantId, seq.type, seq.prefix, seq.next_number, seq.padding]
      );
    }
  }
}

export default ProvisioningService;
