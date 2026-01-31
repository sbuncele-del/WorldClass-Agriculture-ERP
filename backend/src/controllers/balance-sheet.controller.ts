import { Request, Response } from 'express';
import pool from '../config/database';

interface AccountBalance {
  account_code: string;
  account_name: string;
  amount: number;
  parent_code?: string;
}

interface BalanceSheetSection {
  title: string;
  accounts: AccountBalance[];
  subtotal: number;
}

interface ComparisonData {
  as_of_date: string;
  label: string;
  current_assets: number;
  non_current_assets: number;
  total_assets: number;
  current_liabilities: number;
  non_current_liabilities: number;
  total_liabilities: number;
  equity: number;
  total_liabilities_equity: number;
}

interface BalanceSheetData {
  as_of_date: string;
  label: string;
  current_assets: BalanceSheetSection;
  non_current_assets: BalanceSheetSection;
  total_assets: number;
  current_liabilities: BalanceSheetSection;
  non_current_liabilities: BalanceSheetSection;
  total_liabilities: number;
  equity: BalanceSheetSection;
  total_equity: number;
  total_liabilities_equity: number;
  is_balanced: boolean;
  variance: number;
  comparison?: ComparisonData;
}

export class BalanceSheetController {
  /**
   * Generate Balance Sheet
   * GET /api/financial/reports/balance-sheet
   */
  static async generateBalanceSheet(req: Request, res: Response): Promise<void> {
    try {
      const { as_of_date, compare_prior = false } = req.query;

      // Default to current date if not provided
      const asOfDate = (as_of_date as string) || new Date().toISOString().split('T')[0];
      const label = `As of ${new Date(asOfDate).toLocaleDateString('en-ZA', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })}`;

      // Fetch current assets (1000-1499)
      const currentAssets = await fetchBalanceSheetAccounts(asOfDate, '1000', '1499');

      // Fetch non-current assets (1500-1999)
      const nonCurrentAssets = await fetchBalanceSheetAccounts(asOfDate, '1500', '1999');

      // Fetch current liabilities (2000-2499)
      const currentLiabilities = await fetchBalanceSheetAccounts(asOfDate, '2000', '2499');

      // Fetch non-current liabilities (2500-2999)
      const nonCurrentLiabilities = await fetchBalanceSheetAccounts(asOfDate, '2500', '2999');

      // Fetch equity accounts (3000-3999)
      const equityAccounts = await fetchBalanceSheetAccounts(asOfDate, '3000', '3999');

      // Calculate retained earnings (Net Income YTD)
      const retainedEarnings = await calculateRetainedEarnings(asOfDate);
      
      // Add retained earnings to equity
      if (retainedEarnings !== 0) {
        equityAccounts.push({
          account_code: '3900',
          account_name: 'Retained Earnings (Current Year)',
          amount: retainedEarnings
        });
      }

      // Calculate totals
      const currentAssetsTotal = currentAssets.reduce((sum, acc) => sum + acc.amount, 0);
      const nonCurrentAssetsTotal = nonCurrentAssets.reduce((sum, acc) => sum + acc.amount, 0);
      const totalAssets = currentAssetsTotal + nonCurrentAssetsTotal;

      const currentLiabilitiesTotal = currentLiabilities.reduce((sum, acc) => sum + acc.amount, 0);
      const nonCurrentLiabilitiesTotal = nonCurrentLiabilities.reduce((sum, acc) => sum + acc.amount, 0);
      const totalLiabilities = currentLiabilitiesTotal + nonCurrentLiabilitiesTotal;

      const totalEquity = equityAccounts.reduce((sum, acc) => sum + acc.amount, 0);
      const totalLiabilitiesEquity = totalLiabilities + totalEquity;

      // Check if balanced
      const variance = totalAssets - totalLiabilitiesEquity;
      const isBalanced = Math.abs(variance) < 0.01; // Allow 1 cent variance for rounding

      const balanceSheet: BalanceSheetData = {
        as_of_date: asOfDate,
        label,
        current_assets: {
          title: 'Current Assets',
          accounts: currentAssets,
          subtotal: currentAssetsTotal
        },
        non_current_assets: {
          title: 'Non-Current Assets',
          accounts: nonCurrentAssets,
          subtotal: nonCurrentAssetsTotal
        },
        total_assets: totalAssets,
        current_liabilities: {
          title: 'Current Liabilities',
          accounts: currentLiabilities,
          subtotal: currentLiabilitiesTotal
        },
        non_current_liabilities: {
          title: 'Non-Current Liabilities',
          accounts: nonCurrentLiabilities,
          subtotal: nonCurrentLiabilitiesTotal
        },
        total_liabilities: totalLiabilities,
        equity: {
          title: 'Equity',
          accounts: equityAccounts,
          subtotal: totalEquity
        },
        total_equity: totalEquity,
        total_liabilities_equity: totalLiabilitiesEquity,
        is_balanced: isBalanced,
        variance
      };

      // Add comparison if requested
      if (compare_prior === 'true') {
        const priorDate = calculatePriorDate(asOfDate);
        const comparison = await generateComparisonData(priorDate);
        balanceSheet.comparison = comparison;
      }

      res.json({
        success: true,
        data: balanceSheet
      });

    } catch (error) {
      console.error('Error generating balance sheet:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate balance sheet',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Export Balance Sheet to PDF
   * POST /api/financial/reports/balance-sheet/export
   */
  static async exportToPDF(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implement PDF generation
      res.json({
        success: true,
        message: 'PDF export will be implemented in Phase 2',
        download_url: null
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export to PDF'
      });
    }
  }

  /**
   * Get account drill-down details
   * GET /api/financial/reports/balance-sheet/account/:accountCode
   */
  static async getAccountDetails(req: Request, res: Response): Promise<void> {
    try {
      const { accountCode } = req.params;
      const { as_of_date } = req.query;

      const asOfDate = (as_of_date as string) || new Date().toISOString().split('T')[0];

      const query = `
        SELECT 
          jel.journal_entry_id,
          je.journal_date,
          je.description as entry_description,
          jel.description as line_description,
          jel.debit_amount,
          jel.credit_amount,
          (jel.debit_amount - jel.credit_amount) as net_amount
        FROM journal_entry_lines jel
        INNER JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
        WHERE jel.account_code = $1
          AND je.journal_date <= $2
          AND je.is_posted = true
        ORDER BY je.journal_date, je.entry_id
      `;

      const result = await pool.query(query, [accountCode, asOfDate]);

      res.json({
        success: true,
        data: {
          account_code: accountCode,
          as_of_date: asOfDate,
          transactions: result.rows,
          total: result.rows.reduce((sum, row) => sum + parseFloat(row.net_amount), 0)
        }
      });

    } catch (error) {
      console.error('Error fetching account details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch account details'
      });
    }
  }

  /**
   * Get financial ratios
   * GET /api/financial/reports/balance-sheet/ratios
   */
  static async getFinancialRatios(req: Request, res: Response): Promise<void> {
    try {
      const { as_of_date } = req.query;
      const asOfDate = (as_of_date as string) || new Date().toISOString().split('T')[0];

      // Fetch balance sheet totals
      const currentAssets = await fetchBalanceSheetAccounts(asOfDate, '1000', '1499');
      const currentLiabilities = await fetchBalanceSheetAccounts(asOfDate, '2000', '2499');
      const totalAssets = await fetchBalanceSheetAccounts(asOfDate, '1000', '1999');
      const totalLiabilities = await fetchBalanceSheetAccounts(asOfDate, '2000', '2999');
      const equity = await fetchBalanceSheetAccounts(asOfDate, '3000', '3999');

      const currentAssetsTotal = currentAssets.reduce((sum, acc) => sum + acc.amount, 0);
      const currentLiabilitiesTotal = currentLiabilities.reduce((sum, acc) => sum + acc.amount, 0);
      const totalAssetsAmount = totalAssets.reduce((sum, acc) => sum + acc.amount, 0);
      const totalLiabilitiesAmount = totalLiabilities.reduce((sum, acc) => sum + acc.amount, 0);
      const totalEquity = equity.reduce((sum, acc) => sum + acc.amount, 0);

      // Calculate ratios
      const currentRatio = currentLiabilitiesTotal !== 0 
        ? currentAssetsTotal / currentLiabilitiesTotal 
        : 0;

      const quickRatio = currentLiabilitiesTotal !== 0
        ? (currentAssetsTotal - await getInventoryValue(asOfDate)) / currentLiabilitiesTotal
        : 0;

      const debtToEquityRatio = totalEquity !== 0
        ? totalLiabilitiesAmount / totalEquity
        : 0;

      const debtRatio = totalAssetsAmount !== 0
        ? totalLiabilitiesAmount / totalAssetsAmount
        : 0;

      const equityRatio = totalAssetsAmount !== 0
        ? totalEquity / totalAssetsAmount
        : 0;

      res.json({
        success: true,
        data: {
          as_of_date: asOfDate,
          liquidity: {
            current_ratio: currentRatio,
            quick_ratio: quickRatio,
            working_capital: currentAssetsTotal - currentLiabilitiesTotal
          },
          leverage: {
            debt_to_equity: debtToEquityRatio,
            debt_ratio: debtRatio,
            equity_ratio: equityRatio
          },
          summary: {
            total_assets: totalAssetsAmount,
            total_liabilities: totalLiabilitiesAmount,
            total_equity: totalEquity
          }
        }
      });

    } catch (error) {
      console.error('Error calculating financial ratios:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate financial ratios'
      });
    }
  }
}

/**
 * Helper function to fetch balance sheet accounts
 */
async function fetchBalanceSheetAccounts(
  as_of_date: string,
  account_start: string,
  account_end: string
): Promise<AccountBalance[]> {
  const query = `
    SELECT 
      coa.code as account_code,
      coa.name as account_name,
      coa.parent_account_id as parent_code,
      coa.normal_balance,
      COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) as balance
    FROM chart_of_accounts coa
    LEFT JOIN journal_entry_lines jel ON coa.code = jel.account_code
    LEFT JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
      AND je.journal_date <= $1
      AND je.is_posted = true
    WHERE coa.code BETWEEN $2 AND $3
      AND coa.is_active = true
    GROUP BY coa.code, coa.name, coa.parent_account_id, coa.normal_balance
    HAVING COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) != 0
    ORDER BY coa.code
  `;

  const result = await pool.query(query, [as_of_date, account_start, account_end]);

  return result.rows.map(row => ({
    account_code: row.account_code,
    account_name: row.account_name,
    parent_code: row.parent_code,
    amount: Math.abs(parseFloat(row.balance))
  }));
}

/**
 * Calculate retained earnings (accumulated net income)
 */
async function calculateRetainedEarnings(as_of_date: string): Promise<number> {
  // Get fiscal year start date (March 1st of the fiscal year)
  const asOfDateObj = new Date(as_of_date);
  const fiscalYearStart = asOfDateObj.getMonth() >= 2 
    ? new Date(asOfDateObj.getFullYear(), 2, 1)  // March this year
    : new Date(asOfDateObj.getFullYear() - 1, 2, 1);  // March last year

  // Calculate revenue (4000-4999)
  const revenueQuery = `
    SELECT COALESCE(SUM(jel.credit_amount - jel.debit_amount), 0) as revenue
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
    WHERE jel.account_code BETWEEN '4000' AND '4999'
      AND je.journal_date BETWEEN $1 AND $2
      AND je.is_posted = true
  `;

  // Calculate expenses (5000-8999)
  const expensesQuery = `
    SELECT COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) as expenses
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
    WHERE jel.account_code BETWEEN '5000' AND '8999'
      AND je.journal_date BETWEEN $1 AND $2
      AND je.is_posted = true
  `;

  const revenueResult = await pool.query(revenueQuery, [
    fiscalYearStart.toISOString().split('T')[0],
    as_of_date
  ]);

  const expensesResult = await pool.query(expensesQuery, [
    fiscalYearStart.toISOString().split('T')[0],
    as_of_date
  ]);

  const revenue = parseFloat(revenueResult.rows[0].revenue);
  const expenses = parseFloat(expensesResult.rows[0].expenses);

  return revenue - expenses;
}

/**
 * Calculate prior period date (1 year ago)
 */
function calculatePriorDate(current_date: string): string {
  const date = new Date(current_date);
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().split('T')[0];
}

/**
 * Generate comparison data for prior period
 */
async function generateComparisonData(prior_date: string): Promise<ComparisonData> {
  const currentAssets = await fetchBalanceSheetAccounts(prior_date, '1000', '1499');
  const nonCurrentAssets = await fetchBalanceSheetAccounts(prior_date, '1500', '1999');
  const currentLiabilities = await fetchBalanceSheetAccounts(prior_date, '2000', '2499');
  const nonCurrentLiabilities = await fetchBalanceSheetAccounts(prior_date, '2500', '2999');
  const equity = await fetchBalanceSheetAccounts(prior_date, '3000', '3999');

  const currentAssetsTotal = currentAssets.reduce((sum, acc) => sum + acc.amount, 0);
  const nonCurrentAssetsTotal = nonCurrentAssets.reduce((sum, acc) => sum + acc.amount, 0);
  const totalAssets = currentAssetsTotal + nonCurrentAssetsTotal;

  const currentLiabilitiesTotal = currentLiabilities.reduce((sum, acc) => sum + acc.amount, 0);
  const nonCurrentLiabilitiesTotal = nonCurrentLiabilities.reduce((sum, acc) => sum + acc.amount, 0);
  const totalLiabilities = currentLiabilitiesTotal + nonCurrentLiabilitiesTotal;

  const retainedEarnings = await calculateRetainedEarnings(prior_date);
  const totalEquity = equity.reduce((sum, acc) => sum + acc.amount, 0) + retainedEarnings;

  return {
    as_of_date: prior_date,
    label: `As of ${new Date(prior_date).toLocaleDateString('en-ZA', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })}`,
    current_assets: currentAssetsTotal,
    non_current_assets: nonCurrentAssetsTotal,
    total_assets: totalAssets,
    current_liabilities: currentLiabilitiesTotal,
    non_current_liabilities: nonCurrentLiabilitiesTotal,
    total_liabilities: totalLiabilities,
    equity: totalEquity,
    total_liabilities_equity: totalLiabilities + totalEquity
  };
}

/**
 * Get inventory value for quick ratio calculation
 */
async function getInventoryValue(as_of_date: string): Promise<number> {
  const query = `
    SELECT COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) as inventory
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
    WHERE jel.account_code BETWEEN '1200' AND '1299'
      AND je.journal_date <= $1
      AND je.is_posted = true
  `;

  const result = await pool.query(query, [as_of_date]);
  return Math.abs(parseFloat(result.rows[0].inventory));
}
