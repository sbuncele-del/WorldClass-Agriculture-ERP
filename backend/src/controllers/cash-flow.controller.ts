import { Request, Response } from 'express';
import pool from '../config/database';

interface CashFlowItem {
  description: string;
  amount: number;
}

interface CashFlowSection {
  title: string;
  items: CashFlowItem[];
  subtotal: number;
}

interface CashFlowData {
  period: {
    start_date: string;
    end_date: string;
    label: string;
  };
  method: 'indirect' | 'direct';
  operating_activities: CashFlowSection;
  investing_activities: CashFlowSection;
  financing_activities: CashFlowSection;
  net_cash_flow: number;
  beginning_cash: number;
  ending_cash: number;
  cash_reconciliation: {
    balance_sheet_cash_beginning: number;
    balance_sheet_cash_ending: number;
    is_reconciled: boolean;
    variance: number;
  };
}

export class CashFlowController {
  /**
   * Generate Cash Flow Statement (Indirect Method)
   * GET /api/financial/reports/cash-flow
   */
  static async generateCashFlowStatement(req: Request, res: Response): Promise<void> {
    try {
      const { start_date, end_date, period = 'monthly', method = 'indirect' } = req.query;

      // Calculate date range
      const dateRange = calculateDateRange(period as string, start_date as string, end_date as string);

      let cashFlowData: CashFlowData;

      if (method === 'indirect') {
        cashFlowData = await generateIndirectMethod(dateRange);
      } else {
        cashFlowData = await generateDirectMethod(dateRange);
      }

      res.json({
        success: true,
        data: cashFlowData
      });

    } catch (error) {
      console.error('Error generating cash flow statement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate cash flow statement',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Export Cash Flow Statement to PDF
   * POST /api/financial/reports/cash-flow/export
   */
  static async exportToPDF(req: Request, res: Response): Promise<void> {
    try {
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
}

/**
 * Generate Cash Flow Statement using Indirect Method
 */
async function generateIndirectMethod(dateRange: any): Promise<CashFlowData> {
  // 1. Get Net Income for the period
  const netIncome = await calculateNetIncome(dateRange.start_date, dateRange.end_date);

  // 2. Calculate Operating Activities (Indirect Method)
  const operatingItems: CashFlowItem[] = [
    { description: 'Net Income', amount: netIncome }
  ];

  // Add back non-cash expenses
  const depreciation = await getDepreciation(dateRange.start_date, dateRange.end_date);
  if (depreciation !== 0) {
    operatingItems.push({ description: 'Add: Depreciation and Amortization', amount: depreciation });
  }

  // Changes in working capital
  const arChange = await getAccountChange(dateRange.start_date, dateRange.end_date, '1200', '1299');
  if (arChange !== 0) {
    operatingItems.push({ 
      description: arChange > 0 ? 'Decrease in Accounts Receivable' : 'Increase in Accounts Receivable', 
      amount: Math.abs(arChange) * (arChange > 0 ? 1 : -1)
    });
  }

  const inventoryChange = await getAccountChange(dateRange.start_date, dateRange.end_date, '1300', '1399');
  if (inventoryChange !== 0) {
    operatingItems.push({ 
      description: inventoryChange > 0 ? 'Decrease in Inventory' : 'Increase in Inventory', 
      amount: Math.abs(inventoryChange) * (inventoryChange > 0 ? 1 : -1)
    });
  }

  const apChange = await getAccountChange(dateRange.start_date, dateRange.end_date, '2100', '2199');
  if (apChange !== 0) {
    operatingItems.push({ 
      description: apChange < 0 ? 'Increase in Accounts Payable' : 'Decrease in Accounts Payable', 
      amount: Math.abs(apChange) * (apChange < 0 ? 1 : -1)
    });
  }

  const operatingSubtotal = operatingItems.reduce((sum, item) => sum + item.amount, 0);

  // 3. Calculate Investing Activities
  const investingItems: CashFlowItem[] = [];

  const ppe = await getAccountChange(dateRange.start_date, dateRange.end_date, '1500', '1599');
  if (ppe !== 0) {
    investingItems.push({ 
      description: ppe < 0 ? 'Purchase of Property, Plant & Equipment' : 'Sale of Property, Plant & Equipment', 
      amount: ppe 
    });
  }

  const investments = await getAccountChange(dateRange.start_date, dateRange.end_date, '1600', '1699');
  if (investments !== 0) {
    investingItems.push({ 
      description: investments < 0 ? 'Purchase of Investments' : 'Sale of Investments', 
      amount: investments 
    });
  }

  const investingSubtotal = investingItems.reduce((sum, item) => sum + item.amount, 0);

  // 4. Calculate Financing Activities
  const financingItems: CashFlowItem[] = [];

  const longTermDebt = await getAccountChange(dateRange.start_date, dateRange.end_date, '2500', '2599');
  if (longTermDebt !== 0) {
    financingItems.push({ 
      description: longTermDebt < 0 ? 'Proceeds from Long-term Debt' : 'Repayment of Long-term Debt', 
      amount: Math.abs(longTermDebt) * (longTermDebt < 0 ? 1 : -1)
    });
  }

  const equity = await getAccountChange(dateRange.start_date, dateRange.end_date, '3100', '3199');
  if (equity !== 0) {
    financingItems.push({ 
      description: equity < 0 ? 'Issuance of Share Capital' : 'Buyback of Shares', 
      amount: Math.abs(equity) * (equity < 0 ? 1 : -1)
    });
  }

  const dividends = await getDividends(dateRange.start_date, dateRange.end_date);
  if (dividends !== 0) {
    financingItems.push({ description: 'Dividends Paid', amount: -Math.abs(dividends) });
  }

  const financingSubtotal = financingItems.reduce((sum, item) => sum + item.amount, 0);

  // 5. Calculate net cash flow
  const netCashFlow = operatingSubtotal + investingSubtotal + financingSubtotal;

  // 6. Get beginning and ending cash balances
  const beginningCash = await getCashBalance(dateRange.start_date, true);
  const endingCash = await getCashBalance(dateRange.end_date, false);

  // 7. Reconcile
  const calculatedEndingCash = beginningCash + netCashFlow;
  const isReconciled = Math.abs(calculatedEndingCash - endingCash) < 0.01;
  const variance = endingCash - calculatedEndingCash;

  return {
    period: {
      start_date: dateRange.start_date,
      end_date: dateRange.end_date,
      label: dateRange.label
    },
    method: 'indirect',
    operating_activities: {
      title: 'Cash Flow from Operating Activities',
      items: operatingItems,
      subtotal: operatingSubtotal
    },
    investing_activities: {
      title: 'Cash Flow from Investing Activities',
      items: investingItems,
      subtotal: investingSubtotal
    },
    financing_activities: {
      title: 'Cash Flow from Financing Activities',
      items: financingItems,
      subtotal: financingSubtotal
    },
    net_cash_flow: netCashFlow,
    beginning_cash: beginningCash,
    ending_cash: endingCash,
    cash_reconciliation: {
      balance_sheet_cash_beginning: beginningCash,
      balance_sheet_cash_ending: endingCash,
      is_reconciled: isReconciled,
      variance: variance
    }
  };
}

/**
 * Generate Cash Flow Statement using Direct Method
 */
async function generateDirectMethod(dateRange: any): Promise<CashFlowData> {
  // Direct method shows actual cash receipts and payments
  const operatingItems: CashFlowItem[] = [];

  // Cash receipts from customers
  const cashReceipts = await getCashReceipts(dateRange.start_date, dateRange.end_date);
  if (cashReceipts !== 0) {
    operatingItems.push({ description: 'Cash Receipts from Customers', amount: cashReceipts });
  }

  // Cash payments to suppliers
  const cashPayments = await getCashPayments(dateRange.start_date, dateRange.end_date);
  if (cashPayments !== 0) {
    operatingItems.push({ description: 'Cash Payments to Suppliers', amount: -Math.abs(cashPayments) });
  }

  // Cash payments for operating expenses
  const operatingExpenses = await getOperatingExpensePayments(dateRange.start_date, dateRange.end_date);
  if (operatingExpenses !== 0) {
    operatingItems.push({ description: 'Cash Paid for Operating Expenses', amount: -Math.abs(operatingExpenses) });
  }

  // Interest and taxes
  const interestPaid = await getInterestPaid(dateRange.start_date, dateRange.end_date);
  if (interestPaid !== 0) {
    operatingItems.push({ description: 'Interest Paid', amount: -Math.abs(interestPaid) });
  }

  const taxesPaid = await getTaxesPaid(dateRange.start_date, dateRange.end_date);
  if (taxesPaid !== 0) {
    operatingItems.push({ description: 'Income Taxes Paid', amount: -Math.abs(taxesPaid) });
  }

  const operatingSubtotal = operatingItems.reduce((sum, item) => sum + item.amount, 0);

  // Investing and Financing activities remain the same as indirect method
  const investingItems: CashFlowItem[] = [];
  const ppe = await getAccountChange(dateRange.start_date, dateRange.end_date, '1500', '1599');
  if (ppe !== 0) {
    investingItems.push({ 
      description: ppe < 0 ? 'Purchase of Property, Plant & Equipment' : 'Sale of Property, Plant & Equipment', 
      amount: ppe 
    });
  }

  const investingSubtotal = investingItems.reduce((sum, item) => sum + item.amount, 0);

  const financingItems: CashFlowItem[] = [];
  const longTermDebt = await getAccountChange(dateRange.start_date, dateRange.end_date, '2500', '2599');
  if (longTermDebt !== 0) {
    financingItems.push({ 
      description: longTermDebt < 0 ? 'Proceeds from Long-term Debt' : 'Repayment of Long-term Debt', 
      amount: Math.abs(longTermDebt) * (longTermDebt < 0 ? 1 : -1)
    });
  }

  const financingSubtotal = financingItems.reduce((sum, item) => sum + item.amount, 0);

  const netCashFlow = operatingSubtotal + investingSubtotal + financingSubtotal;
  const beginningCash = await getCashBalance(dateRange.start_date, true);
  const endingCash = await getCashBalance(dateRange.end_date, false);
  const calculatedEndingCash = beginningCash + netCashFlow;
  const isReconciled = Math.abs(calculatedEndingCash - endingCash) < 0.01;
  const variance = endingCash - calculatedEndingCash;

  return {
    period: {
      start_date: dateRange.start_date,
      end_date: dateRange.end_date,
      label: dateRange.label
    },
    method: 'direct',
    operating_activities: {
      title: 'Cash Flow from Operating Activities',
      items: operatingItems,
      subtotal: operatingSubtotal
    },
    investing_activities: {
      title: 'Cash Flow from Investing Activities',
      items: investingItems,
      subtotal: investingSubtotal
    },
    financing_activities: {
      title: 'Cash Flow from Financing Activities',
      items: financingItems,
      subtotal: financingSubtotal
    },
    net_cash_flow: netCashFlow,
    beginning_cash: beginningCash,
    ending_cash: endingCash,
    cash_reconciliation: {
      balance_sheet_cash_beginning: beginningCash,
      balance_sheet_cash_ending: endingCash,
      is_reconciled: isReconciled,
      variance: variance
    }
  };
}

/**
 * Helper Functions
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
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        start_date: startOfMonth.toISOString().split('T')[0],
        end_date: endOfMonth.toISOString().split('T')[0],
        label: startOfMonth.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
      };
    }
    case 'quarterly': {
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
      const fiscalYearStart = now.getMonth() >= 2 
        ? new Date(now.getFullYear(), 2, 1)
        : new Date(now.getFullYear() - 1, 2, 1);
      const fiscalYearEnd = new Date(fiscalYearStart.getFullYear() + 1, 1, 28);
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

async function calculateNetIncome(start_date: string, end_date: string): Promise<number> {
  const revenueQuery = `
    SELECT COALESCE(SUM(jel.credit_amount - jel.debit_amount), 0) as revenue
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
    WHERE jel.account_code BETWEEN '4000' AND '4999'
      AND je.journal_date BETWEEN $1 AND $2
      AND je.is_posted = true
  `;

  const expensesQuery = `
    SELECT COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) as expenses
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
    WHERE jel.account_code BETWEEN '5000' AND '8999'
      AND je.journal_date BETWEEN $1 AND $2
      AND je.is_posted = true
  `;

  const revenueResult = await pool.query(revenueQuery, [start_date, end_date]);
  const expensesResult = await pool.query(expensesQuery, [start_date, end_date]);

  const revenue = parseFloat(revenueResult.rows[0].revenue);
  const expenses = parseFloat(expensesResult.rows[0].expenses);

  return revenue - expenses;
}

async function getDepreciation(start_date: string, end_date: string): Promise<number> {
  const query = `
    SELECT COALESCE(SUM(jel.debit_amount), 0) as depreciation
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
    WHERE jel.account_code BETWEEN '6500' AND '6599'
      AND je.journal_date BETWEEN $1 AND $2
      AND je.is_posted = true
  `;

  const result = await pool.query(query, [start_date, end_date]);
  return parseFloat(result.rows[0].depreciation);
}

async function getAccountChange(start_date: string, end_date: string, account_start: string, account_end: string): Promise<number> {
  // Get beginning balance (before start_date)
  const beginningQuery = `
    SELECT COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) as balance
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
    WHERE jel.account_code BETWEEN $1 AND $2
      AND je.journal_date < $3
      AND je.is_posted = true
  `;

  // Get ending balance (up to end_date)
  const endingQuery = `
    SELECT COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) as balance
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
    WHERE jel.account_code BETWEEN $1 AND $2
      AND je.journal_date <= $3
      AND je.is_posted = true
  `;

  const beginningResult = await pool.query(beginningQuery, [account_start, account_end, start_date]);
  const endingResult = await pool.query(endingQuery, [account_start, account_end, end_date]);

  const beginningBalance = parseFloat(beginningResult.rows[0].balance);
  const endingBalance = parseFloat(endingResult.rows[0].balance);

  // Return the change (decrease is positive cash flow, increase is negative)
  return beginningBalance - endingBalance;
}

async function getCashBalance(date: string, isBeginning: boolean): Promise<number> {
  const operator = isBeginning ? '<' : '<=';
  
  const query = `
    SELECT COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) as balance
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
    WHERE jel.account_code BETWEEN '1100' AND '1199'
      AND je.journal_date ${operator} $1
      AND je.is_posted = true
  `;

  const result = await pool.query(query, [date]);
  return Math.abs(parseFloat(result.rows[0].balance));
}

async function getDividends(start_date: string, end_date: string): Promise<number> {
  const query = `
    SELECT COALESCE(SUM(jel.debit_amount), 0) as dividends
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
    WHERE jel.account_code BETWEEN '3200' AND '3299'
      AND je.journal_date BETWEEN $1 AND $2
      AND je.is_posted = true
  `;

  const result = await pool.query(query, [start_date, end_date]);
  return parseFloat(result.rows[0].dividends);
}

// Direct method helper functions
async function getCashReceipts(start_date: string, end_date: string): Promise<number> {
  // Simplified: actual implementation would track cash receipts from sales
  const query = `
    SELECT COALESCE(SUM(jel.credit_amount), 0) as receipts
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
    WHERE jel.account_code BETWEEN '4000' AND '4999'
      AND je.journal_date BETWEEN $1 AND $2
      AND je.is_posted = true
  `;

  const result = await pool.query(query, [start_date, end_date]);
  return parseFloat(result.rows[0].receipts);
}

async function getCashPayments(start_date: string, end_date: string): Promise<number> {
  const query = `
    SELECT COALESCE(SUM(jel.debit_amount), 0) as payments
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
    WHERE jel.account_code BETWEEN '5000' AND '5999'
      AND je.journal_date BETWEEN $1 AND $2
      AND je.is_posted = true
  `;

  const result = await pool.query(query, [start_date, end_date]);
  return parseFloat(result.rows[0].payments);
}

async function getOperatingExpensePayments(start_date: string, end_date: string): Promise<number> {
  const query = `
    SELECT COALESCE(SUM(jel.debit_amount), 0) as expenses
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
    WHERE jel.account_code BETWEEN '6000' AND '6999'
      AND je.journal_date BETWEEN $1 AND $2
      AND je.is_posted = true
  `;

  const result = await pool.query(query, [start_date, end_date]);
  return parseFloat(result.rows[0].expenses);
}

async function getInterestPaid(start_date: string, end_date: string): Promise<number> {
  const query = `
    SELECT COALESCE(SUM(jel.debit_amount), 0) as interest
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
    WHERE jel.account_code BETWEEN '7500' AND '7599'
      AND je.journal_date BETWEEN $1 AND $2
      AND je.is_posted = true
  `;

  const result = await pool.query(query, [start_date, end_date]);
  return parseFloat(result.rows[0].interest);
}

async function getTaxesPaid(start_date: string, end_date: string): Promise<number> {
  const query = `
    SELECT COALESCE(SUM(jel.debit_amount), 0) as taxes
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
    WHERE jel.account_code BETWEEN '8000' AND '8999'
      AND je.journal_date BETWEEN $1 AND $2
      AND je.is_posted = true
  `;

  const result = await pool.query(query, [start_date, end_date]);
  return parseFloat(result.rows[0].taxes);
}
