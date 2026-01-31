import { Request, Response } from 'express';
import pool from '../config/database';

interface IncomeStatementParams {
  start_date?: string;
  end_date?: string;
  period?: 'monthly' | 'quarterly' | 'annual';
  compare_prior?: boolean;
}

interface AccountBalance {
  account_code: string;
  account_name: string;
  amount: number;
  parent_code?: string;
}

interface IncomeStatementSection {
  title: string;
  accounts: AccountBalance[];
  subtotal: number;
}

interface IncomeStatementData {
  period: {
    start_date: string;
    end_date: string;
    label: string;
  };
  revenue: IncomeStatementSection;
  cost_of_sales: IncomeStatementSection;
  gross_profit: number;
  operating_expenses: IncomeStatementSection;
  operating_profit: number;
  other_income: IncomeStatementSection;
  other_expenses: IncomeStatementSection;
  net_profit_before_tax: number;
  tax_expense: number;
  net_profit_after_tax: number;
  comparison?: {
    period: {
      start_date: string;
      end_date: string;
      label: string;
    };
    revenue_total: number;
    cogs_total: number;
    gross_profit: number;
    operating_expenses_total: number;
    operating_profit: number;
    net_profit: number;
  };
}

export class IncomeStatementController {
  /**
   * Generate Income Statement
   * GET /api/financial/reports/income-statement
   */
  static async generateIncomeStatement(req: Request, res: Response): Promise<void> {
    try {
      const { start_date, end_date, period = 'monthly', compare_prior = false } = req.query as IncomeStatementParams;

      // Calculate date range based on period
      const dateRange = calculateDateRange(period, start_date, end_date);

      // Fetch revenue accounts (4000-4999)
      const revenueAccounts = await fetchAccountBalances(
        dateRange.start_date,
        dateRange.end_date,
        '4000',
        '4999'
      );

      // Fetch cost of sales accounts (5000-5999)
      const cogsAccounts = await fetchAccountBalances(
        dateRange.start_date,
        dateRange.end_date,
        '5000',
        '5999'
      );

      // Fetch operating expense accounts (6000-6999)
      const expenseAccounts = await fetchAccountBalances(
        dateRange.start_date,
        dateRange.end_date,
        '6000',
        '6999'
      );

      // Fetch other income accounts (7000-7499)
      const otherIncomeAccounts = await fetchAccountBalances(
        dateRange.start_date,
        dateRange.end_date,
        '7000',
        '7499'
      );

      // Fetch other expense accounts (7500-7999)
      const otherExpenseAccounts = await fetchAccountBalances(
        dateRange.start_date,
        dateRange.end_date,
        '7500',
        '7999'
      );

      // Fetch tax expense accounts (8000-8999)
      const taxAccounts = await fetchAccountBalances(
        dateRange.start_date,
        dateRange.end_date,
        '8000',
        '8999'
      );

      // Calculate totals
      const revenueTotalAmount = revenueAccounts.reduce((sum, acc) => sum + acc.amount, 0);
      const cogsTotalAmount = cogsAccounts.reduce((sum, acc) => sum + acc.amount, 0);
      const grossProfit = revenueTotalAmount - cogsTotalAmount;

      const expenseTotalAmount = expenseAccounts.reduce((sum, acc) => sum + acc.amount, 0);
      const operatingProfit = grossProfit - expenseTotalAmount;

      const otherIncomeTotalAmount = otherIncomeAccounts.reduce((sum, acc) => sum + acc.amount, 0);
      const otherExpenseTotalAmount = otherExpenseAccounts.reduce((sum, acc) => sum + acc.amount, 0);
      const netProfitBeforeTax = operatingProfit + otherIncomeTotalAmount - otherExpenseTotalAmount;

      const taxExpense = taxAccounts.reduce((sum, acc) => sum + acc.amount, 0);
      const netProfitAfterTax = netProfitBeforeTax - taxExpense;

      const incomeStatement: IncomeStatementData = {
        period: {
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
          label: dateRange.label
        },
        revenue: {
          title: 'Revenue',
          accounts: revenueAccounts,
          subtotal: revenueTotalAmount
        },
        cost_of_sales: {
          title: 'Cost of Sales',
          accounts: cogsAccounts,
          subtotal: cogsTotalAmount
        },
        gross_profit: grossProfit,
        operating_expenses: {
          title: 'Operating Expenses',
          accounts: expenseAccounts,
          subtotal: expenseTotalAmount
        },
        operating_profit: operatingProfit,
        other_income: {
          title: 'Other Income',
          accounts: otherIncomeAccounts,
          subtotal: otherIncomeTotalAmount
        },
        other_expenses: {
          title: 'Other Expenses',
          accounts: otherExpenseAccounts,
          subtotal: otherExpenseTotalAmount
        },
        net_profit_before_tax: netProfitBeforeTax,
        tax_expense: taxExpense,
        net_profit_after_tax: netProfitAfterTax
      };

      // Add comparison if requested
      if (compare_prior) {
        const priorDateRange = calculatePriorPeriod(dateRange);
        const comparison = await generateComparisonData(priorDateRange);
        incomeStatement.comparison = comparison;
      }

      res.json({
        success: true,
        data: incomeStatement
      });

    } catch (error) {
      console.error('Error generating income statement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate income statement',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Export Income Statement to PDF
   * POST /api/financial/reports/income-statement/export
   */
  static async exportToPDF(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implement PDF generation using a library like PDFKit
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
   * GET /api/financial/reports/income-statement/account/:accountCode
   */
  static async getAccountDetails(req: Request, res: Response): Promise<void> {
    try {
      const { accountCode } = req.params;
      const { start_date, end_date } = req.query;

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
          AND je.journal_date BETWEEN $2 AND $3
          AND je.is_posted = true
        ORDER BY je.journal_date, je.entry_id
      `;

      const result = await pool.query(query, [accountCode, start_date, end_date]);

      res.json({
        success: true,
        data: {
          account_code: accountCode,
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
}

/**
 * Helper function to calculate date range based on period type
 */
function calculateDateRange(
  period: string,
  start_date?: string,
  end_date?: string
): { start_date: string; end_date: string; label: string } {
  const now = new Date();

  if (start_date && end_date) {
    return {
      start_date,
      end_date,
      label: `${start_date} to ${end_date}`
    };
  }

  switch (period) {
    case 'monthly': {
      // Current month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        start_date: startOfMonth.toISOString().split('T')[0],
        end_date: endOfMonth.toISOString().split('T')[0],
        label: startOfMonth.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
      };
    }
    case 'quarterly': {
      // Current quarter
      const quarter = Math.floor(now.getMonth() / 3);
      const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
      const endOfQuarter = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
      return {
        start_date: startOfQuarter.toISOString().split('T')[0],
        end_date: endOfQuarter.toISOString().split('T')[0],
        label: `Q${quarter + 1} ${now.getFullYear()}`
      };
    }
    case 'annual': {
      // SA fiscal year (March to February)
      const fiscalYearStart = now.getMonth() >= 2 
        ? new Date(now.getFullYear(), 2, 1)  // March this year
        : new Date(now.getFullYear() - 1, 2, 1);  // March last year
      const fiscalYearEnd = new Date(fiscalYearStart.getFullYear() + 1, 1, 28);  // Feb next year
      return {
        start_date: fiscalYearStart.toISOString().split('T')[0],
        end_date: fiscalYearEnd.toISOString().split('T')[0],
        label: `FY ${fiscalYearStart.getFullYear()}/${fiscalYearEnd.getFullYear()}`
      };
    }
    default:
      throw new Error('Invalid period type');
  }
}

/**
 * Helper function to fetch account balances for a range
 */
async function fetchAccountBalances(
  start_date: string,
  end_date: string,
  account_start: string,
  account_end: string
): Promise<AccountBalance[]> {
  const query = `
    SELECT 
      coa.code as account_code,
      coa.name as account_name,
      coa.parent_account_id as parent_code,
      COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) as amount
    FROM chart_of_accounts coa
    LEFT JOIN journal_entry_lines jel ON coa.code = jel.account_code
    LEFT JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
      AND je.journal_date BETWEEN $1 AND $2
      AND je.is_posted = true
    WHERE coa.code BETWEEN $3 AND $4
      AND coa.is_active = true
    GROUP BY coa.code, coa.name, coa.parent_account_id
    HAVING COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) != 0
    ORDER BY coa.code
  `;

  const result = await pool.query(query, [start_date, end_date, account_start, account_end]);

  return result.rows.map(row => ({
    account_code: row.account_code,
    account_name: row.account_name,
    parent_code: row.parent_code,
    amount: Math.abs(parseFloat(row.amount))  // Convert to positive for display
  }));
}

/**
 * Calculate prior period date range
 */
function calculatePriorPeriod(currentRange: { start_date: string; end_date: string; label: string }): 
  { start_date: string; end_date: string; label: string } {
  const start = new Date(currentRange.start_date);
  const end = new Date(currentRange.end_date);
  const duration = end.getTime() - start.getTime();

  const priorEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000); // Day before current start
  const priorStart = new Date(priorEnd.getTime() - duration);

  return {
    start_date: priorStart.toISOString().split('T')[0],
    end_date: priorEnd.toISOString().split('T')[0],
    label: `Prior Period`
  };
}

/**
 * Generate comparison data for prior period
 */
async function generateComparisonData(priorRange: { start_date: string; end_date: string; label: string }) {
  const revenue = await fetchAccountBalances(priorRange.start_date, priorRange.end_date, '4000', '4999');
  const cogs = await fetchAccountBalances(priorRange.start_date, priorRange.end_date, '5000', '5999');
  const expenses = await fetchAccountBalances(priorRange.start_date, priorRange.end_date, '6000', '6999');
  const otherIncome = await fetchAccountBalances(priorRange.start_date, priorRange.end_date, '7000', '7499');
  const otherExpenses = await fetchAccountBalances(priorRange.start_date, priorRange.end_date, '7500', '7999');
  const tax = await fetchAccountBalances(priorRange.start_date, priorRange.end_date, '8000', '8999');

  const revenueTotalAmount = revenue.reduce((sum, acc) => sum + acc.amount, 0);
  const cogsTotalAmount = cogs.reduce((sum, acc) => sum + acc.amount, 0);
  const grossProfit = revenueTotalAmount - cogsTotalAmount;
  const expenseTotalAmount = expenses.reduce((sum, acc) => sum + acc.amount, 0);
  const operatingProfit = grossProfit - expenseTotalAmount;
  const otherIncomeTotalAmount = otherIncome.reduce((sum, acc) => sum + acc.amount, 0);
  const otherExpenseTotalAmount = otherExpenses.reduce((sum, acc) => sum + acc.amount, 0);
  const taxExpense = tax.reduce((sum, acc) => sum + acc.amount, 0);
  const netProfit = operatingProfit + otherIncomeTotalAmount - otherExpenseTotalAmount - taxExpense;

  return {
    period: priorRange,
    revenue_total: revenueTotalAmount,
    cogs_total: cogsTotalAmount,
    gross_profit: grossProfit,
    operating_expenses_total: expenseTotalAmount,
    operating_profit: operatingProfit,
    net_profit: netProfit
  };
}
