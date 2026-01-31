import { query, transaction } from '../../config/database';
import { FeatureFlagService } from '../../services/feature-flag.service';
import { JournalEntryService } from '../financial/services/journal-entry.service';
import { JournalSource } from '../financial/models/journal-entry.model';

/**
 * Logistics Accounting Service
 * Creates journal entries for logistics transactions:
 * - Trip completion → Debit AR, Credit Revenue
 * - Fuel purchase → Debit Fuel Expense, Credit AP/Cash
 * - Driver payment → Debit Driver Wages, Credit Cash
 *
 * Feature flag: logistics_accounting_integration
 */

// Account code mapping for logistics transactions
const ACCOUNT_CODES = {
  // Revenue & Receivables
  ACCOUNTS_RECEIVABLE: '1200',
  DELIVERY_REVENUE: '4100',
  FREIGHT_REVENUE: '4110',

  // Expenses
  FUEL_EXPENSE: '5200',
  DRIVER_WAGES: '5300',
  VEHICLE_MAINTENANCE: '5400',
  TOLL_EXPENSE: '5210',

  // Liabilities & Cash
  ACCOUNTS_PAYABLE: '2100',
  CASH: '1100',
  BANK: '1110',
  WAGES_PAYABLE: '2300',
};

export interface JournalLineInput {
  account_code: string;
  debit_amount?: number;
  credit_amount?: number;
  description: string;
  cost_center_id?: string;
}

export interface TripAccountingData {
  trip_id: string;
  trip_number: string;
  customer_id?: string;
  customer_name?: string;
  revenue_amount: number;
  trip_date: Date;
}

export interface FuelAccountingData {
  transaction_id: string;
  vehicle_id: string;
  vehicle_registration?: string;
  driver_id?: string;
  driver_name?: string;
  fuel_station: string;
  litres: number;
  total_amount: number;
  payment_method: 'CASH' | 'CARD' | 'FUEL_CARD' | 'ACCOUNT';
  transaction_date: Date;
}

export interface DriverPaymentData {
  payment_id: string;
  driver_id: string;
  driver_name: string;
  payment_type: 'SALARY' | 'ALLOWANCE' | 'BONUS' | 'ADVANCE';
  gross_amount: number;
  deductions: number;
  net_amount: number;
  payment_date: Date;
  payment_method: 'CASH' | 'EFT';
}

export class LogisticsAccountingService {
  private journalService: JournalEntryService;

  constructor() {
    this.journalService = new JournalEntryService();
  }

  /**
   * Check if logistics accounting integration is enabled
   */
  async isEnabled(tenantId: string): Promise<boolean> {
    return FeatureFlagService.isEnabled(tenantId, 'logistics_accounting_integration');
  }

  /**
   * Create journal entry for trip completion (delivery revenue)
   * Debit: Accounts Receivable
   * Credit: Delivery Revenue
   */
  async recordTripRevenue(
    tenantId: string,
    data: TripAccountingData,
    userId: string
  ): Promise<{ journalEntryId: string; balanced: boolean } | null> {
    if (!(await this.isEnabled(tenantId))) {
      console.log('[LogisticsAccounting] Feature disabled, skipping trip revenue entry');
      return null;
    }

    if (data.revenue_amount <= 0) {
      console.log('[LogisticsAccounting] No revenue to record for trip', data.trip_number);
      return null;
    }

    const lines: JournalLineInput[] = [
      {
        account_code: ACCOUNT_CODES.ACCOUNTS_RECEIVABLE,
        debit_amount: data.revenue_amount,
        description: `Delivery revenue - Trip ${data.trip_number}${data.customer_name ? ` - ${data.customer_name}` : ''}`,
      },
      {
        account_code: ACCOUNT_CODES.DELIVERY_REVENUE,
        credit_amount: data.revenue_amount,
        description: `Delivery revenue - Trip ${data.trip_number}`,
      },
    ];

    const journalEntryId = await this.journalService.createJournalEntry(
      {
        journal_date: data.trip_date.toISOString(),
        description: `Trip completion revenue - ${data.trip_number}`,
        source_type: JournalSource.LOGISTICS_TRIP,
        lines,
        notes: `Auto-generated from logistics trip ${data.trip_id}`,
      },
      userId
    );

    // Auto-post the entry
    await this.journalService.postJournalEntry(journalEntryId, userId);

    // Link journal entry to trip
    await query(
      `UPDATE logistics.trips SET journal_entry_id = $1 WHERE trip_id = $2`,
      [journalEntryId, data.trip_id]
    );

    return { journalEntryId, balanced: true };
  }

  /**
   * Create journal entry for fuel purchase
   * Debit: Fuel Expense
   * Credit: Accounts Payable (ACCOUNT) / Cash (CASH/CARD)
   */
  async recordFuelPurchase(
    tenantId: string,
    data: FuelAccountingData,
    userId: string
  ): Promise<{ journalEntryId: string; balanced: boolean } | null> {
    if (!(await this.isEnabled(tenantId))) {
      console.log('[LogisticsAccounting] Feature disabled, skipping fuel entry');
      return null;
    }

    const creditAccount =
      data.payment_method === 'ACCOUNT' ? ACCOUNT_CODES.ACCOUNTS_PAYABLE : ACCOUNT_CODES.CASH;

    const lines: JournalLineInput[] = [
      {
        account_code: ACCOUNT_CODES.FUEL_EXPENSE,
        debit_amount: data.total_amount,
        description: `Fuel - ${data.vehicle_registration || data.vehicle_id} - ${data.fuel_station} (${data.litres}L)`,
      },
      {
        account_code: creditAccount,
        credit_amount: data.total_amount,
        description: `Fuel payment - ${data.fuel_station}`,
      },
    ];

    const journalEntryId = await this.journalService.createJournalEntry(
      {
        journal_date: data.transaction_date.toISOString(),
        description: `Fuel purchase - ${data.vehicle_registration || data.vehicle_id}`,
        source_type: JournalSource.LOGISTICS_FUEL,
        lines,
        notes: `Auto-generated from fuel transaction ${data.transaction_id}`,
      },
      userId
    );

    await this.journalService.postJournalEntry(journalEntryId, userId);

    // Link journal entry to fuel transaction
    await query(
      `UPDATE logistics.fuel_transactions SET journal_entry_id = $1 WHERE transaction_id = $2`,
      [journalEntryId, data.transaction_id]
    );

    return { journalEntryId, balanced: true };
  }

  /**
   * Create journal entry for driver payment
   * Debit: Driver Wages
   * Credit: Cash/Bank
   */
  async recordDriverPayment(
    tenantId: string,
    data: DriverPaymentData,
    userId: string
  ): Promise<{ journalEntryId: string; balanced: boolean } | null> {
    if (!(await this.isEnabled(tenantId))) {
      console.log('[LogisticsAccounting] Feature disabled, skipping driver payment entry');
      return null;
    }

    const creditAccount = data.payment_method === 'CASH' ? ACCOUNT_CODES.CASH : ACCOUNT_CODES.BANK;

    const lines: JournalLineInput[] = [
      {
        account_code: ACCOUNT_CODES.DRIVER_WAGES,
        debit_amount: data.gross_amount,
        description: `${data.payment_type} - ${data.driver_name}`,
      },
    ];

    // If there are deductions, credit Wages Payable
    if (data.deductions > 0) {
      lines.push({
        account_code: ACCOUNT_CODES.WAGES_PAYABLE,
        credit_amount: data.deductions,
        description: `Deductions - ${data.driver_name}`,
      });
    }

    lines.push({
      account_code: creditAccount,
      credit_amount: data.net_amount,
      description: `Driver payment - ${data.driver_name}`,
    });

    const journalEntryId = await this.journalService.createJournalEntry(
      {
        journal_date: data.payment_date.toISOString(),
        description: `Driver ${data.payment_type.toLowerCase()} - ${data.driver_name}`,
        source_type: JournalSource.LOGISTICS_DRIVER_PAY,
        lines,
        notes: `Auto-generated from driver payment ${data.payment_id}`,
      },
      userId
    );

    await this.journalService.postJournalEntry(journalEntryId, userId);

    return { journalEntryId, balanced: true };
  }

  /**
   * Validate that all logistics journal entries balance (Debits = Credits)
   */
  async validateAllEntriesBalance(tenantId: string): Promise<{
    total: number;
    balanced: number;
    unbalanced: { entry_id: string; entry_number: string; difference: number }[];
  }> {
    const result = await query(
      `SELECT 
         je.entry_id,
         je.entry_number,
         COALESCE(SUM(jel.debit_amount), 0) as total_debit,
         COALESCE(SUM(jel.credit_amount), 0) as total_credit,
         COALESCE(SUM(jel.debit_amount), 0) - COALESCE(SUM(jel.credit_amount), 0) as difference
       FROM journal_entries je
       LEFT JOIN journal_entry_lines jel ON je.entry_id = jel.entry_id
       WHERE je.tenant_id = $1
         AND je.description LIKE '%Trip%' OR je.description LIKE '%Fuel%' OR je.description LIKE '%Driver%'
       GROUP BY je.entry_id, je.entry_number
       HAVING ABS(COALESCE(SUM(jel.debit_amount), 0) - COALESCE(SUM(jel.credit_amount), 0)) > 0.01`,
      [tenantId]
    );

    const totalResult = await query(
      `SELECT COUNT(*) as total FROM journal_entries 
       WHERE tenant_id = $1 
         AND (description LIKE '%Trip%' OR description LIKE '%Fuel%' OR description LIKE '%Driver%')`,
      [tenantId]
    );

    const total = parseInt(totalResult.rows[0]?.total || '0');
    const unbalanced = result.rows.map((r) => ({
      entry_id: r.entry_id,
      entry_number: r.entry_number,
      difference: parseFloat(r.difference),
    }));

    return {
      total,
      balanced: total - unbalanced.length,
      unbalanced,
    };
  }

  /**
   * Get P&L impact from logistics transactions
   */
  async getPLImpact(
    tenantId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<{
    revenue: { delivery: number; freight: number; total: number };
    expenses: { fuel: number; wages: number; maintenance: number; tolls: number; total: number };
    netIncome: number;
  }> {
    // Revenue accounts
    const revenueResult = await query(
      `SELECT 
         coa.account_code,
         COALESCE(SUM(jel.credit_amount), 0) - COALESCE(SUM(jel.debit_amount), 0) as balance
       FROM journal_entry_lines jel
       JOIN journal_entries je ON je.entry_id = jel.entry_id
       JOIN chart_of_accounts coa ON coa.account_id = jel.account_id
       WHERE je.tenant_id = $1
         AND je.entry_date BETWEEN $2 AND $3
         AND je.status = 'POSTED'
         AND coa.account_code IN ($4, $5)
       GROUP BY coa.account_code`,
      [tenantId, dateFrom, dateTo, ACCOUNT_CODES.DELIVERY_REVENUE, ACCOUNT_CODES.FREIGHT_REVENUE]
    );

    // Expense accounts
    const expenseResult = await query(
      `SELECT 
         coa.account_code,
         COALESCE(SUM(jel.debit_amount), 0) - COALESCE(SUM(jel.credit_amount), 0) as balance
       FROM journal_entry_lines jel
       JOIN journal_entries je ON je.entry_id = jel.entry_id
       JOIN chart_of_accounts coa ON coa.account_id = jel.account_id
       WHERE je.tenant_id = $1
         AND je.entry_date BETWEEN $2 AND $3
         AND je.status = 'POSTED'
         AND coa.account_code IN ($4, $5, $6, $7)
       GROUP BY coa.account_code`,
      [
        tenantId,
        dateFrom,
        dateTo,
        ACCOUNT_CODES.FUEL_EXPENSE,
        ACCOUNT_CODES.DRIVER_WAGES,
        ACCOUNT_CODES.VEHICLE_MAINTENANCE,
        ACCOUNT_CODES.TOLL_EXPENSE,
      ]
    );

    const revenueMap = Object.fromEntries(revenueResult.rows.map((r) => [r.account_code, parseFloat(r.balance)]));
    const expenseMap = Object.fromEntries(expenseResult.rows.map((r) => [r.account_code, parseFloat(r.balance)]));

    const revenue = {
      delivery: revenueMap[ACCOUNT_CODES.DELIVERY_REVENUE] || 0,
      freight: revenueMap[ACCOUNT_CODES.FREIGHT_REVENUE] || 0,
      total: 0,
    };
    revenue.total = revenue.delivery + revenue.freight;

    const expenses = {
      fuel: expenseMap[ACCOUNT_CODES.FUEL_EXPENSE] || 0,
      wages: expenseMap[ACCOUNT_CODES.DRIVER_WAGES] || 0,
      maintenance: expenseMap[ACCOUNT_CODES.VEHICLE_MAINTENANCE] || 0,
      tolls: expenseMap[ACCOUNT_CODES.TOLL_EXPENSE] || 0,
      total: 0,
    };
    expenses.total = expenses.fuel + expenses.wages + expenses.maintenance + expenses.tolls;

    return {
      revenue,
      expenses,
      netIncome: revenue.total - expenses.total,
    };
  }

  /**
   * Get audit trail for logistics journal entries
   */
  async getAuditTrail(
    tenantId: string,
    options: { limit?: number; offset?: number; source_type?: string } = {}
  ): Promise<{
    entries: Array<{
      entry_id: string;
      entry_number: string;
      entry_date: Date;
      description: string;
      source_type: string;
      status: string;
      total_debit: number;
      total_credit: number;
      created_by: string;
      created_at: Date;
      posted_at: Date | null;
    }>;
    total: number;
  }> {
    const { limit = 50, offset = 0, source_type } = options;

    const sourceFilter = source_type
      ? `AND (je.description LIKE '%${source_type}%' OR je.notes LIKE '%${source_type}%')`
      : `AND (je.description LIKE '%Trip%' OR je.description LIKE '%Fuel%' OR je.description LIKE '%Driver%')`;

    const countResult = await query(
      `SELECT COUNT(*) as total FROM journal_entries je
       WHERE je.tenant_id = $1 ${sourceFilter}`,
      [tenantId]
    );

    const result = await query(
      `SELECT 
         je.entry_id,
         je.entry_number,
         je.entry_date,
         je.description,
         'LOGISTICS' as source_type,
         je.status,
         COALESCE(SUM(jel.debit_amount), 0) as total_debit,
         COALESCE(SUM(jel.credit_amount), 0) as total_credit,
         je.created_by,
         je.created_at,
         je.posted_at
       FROM journal_entries je
       LEFT JOIN journal_entry_lines jel ON je.entry_id = jel.entry_id
       WHERE je.tenant_id = $1 ${sourceFilter}
       GROUP BY je.entry_id, je.entry_number, je.entry_date, je.description, je.status, je.created_by, je.created_at, je.posted_at
       ORDER BY je.created_at DESC
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );

    return {
      entries: result.rows,
      total: parseInt(countResult.rows[0]?.total || '0'),
    };
  }
}

export default LogisticsAccountingService;
