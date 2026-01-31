/**
 * Integration Service - Business-to-Accounting Bridge
 * 
 * This service automates the posting of business transactions to the General Ledger.
 * It creates journal entries from:
 * - Sales Invoices → Revenue & Accounts Receivable
 * - Purchase Bills → Expenses & Accounts Payable
 * - Inventory Movements → Cost of Goods Sold
 * - Payroll Runs → Salary Expenses & Liabilities
 * - Asset Depreciation → Depreciation Expense & Accumulated Depreciation
 * 
 * Each posting follows GAAP/IFRS standards and creates a proper audit trail.
 */

import { query, transaction } from '../config/database';
import { JournalEntryService } from '../modules/financial/services/journal-entry.service';
import { JournalSource } from '../modules/financial/models/journal-entry.model';

// Standard Chart of Accounts codes (South African GAAP aligned)
const GL_ACCOUNTS = {
  // Assets
  ACCOUNTS_RECEIVABLE: '1100',
  INVENTORY: '1200',
  FIXED_ASSETS: '1500',
  ACCUMULATED_DEPRECIATION: '1550',
  BANK: '1000',
  PETTY_CASH: '1010',
  
  // Liabilities
  ACCOUNTS_PAYABLE: '2100',
  VAT_OUTPUT: '2200',
  VAT_INPUT: '2210',
  SALARIES_PAYABLE: '2300',
  PAYE_PAYABLE: '2310',
  UIF_PAYABLE: '2320',
  
  // Revenue
  SALES_REVENUE: '4000',
  SERVICE_REVENUE: '4100',
  OTHER_INCOME: '4500',
  
  // Cost of Sales
  COST_OF_GOODS_SOLD: '5000',
  DIRECT_LABOUR: '5100',
  
  // Operating Expenses
  SALARY_EXPENSE: '6000',
  DEPRECIATION_EXPENSE: '6100',
  RENT_EXPENSE: '6200',
  UTILITIES_EXPENSE: '6300',
  OFFICE_SUPPLIES: '6400',
  PROFESSIONAL_FEES: '6500',
  FUEL_EXPENSE: '6600',
  MAINTENANCE_EXPENSE: '6700',
};

export interface PostingResult {
  success: boolean;
  journalEntryId?: string;
  journalNumber?: string;
  message: string;
  details?: any;
}

export interface InvoiceForPosting {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  invoice_date: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  lines: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    vat_rate?: number;
    gl_account_code?: string;
  }>;
}

export interface BillForPosting {
  id: string;
  bill_number: string;
  supplier_id: string;
  supplier_name: string;
  bill_date: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  lines: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    vat_rate?: number;
    expense_account_code?: string;
  }>;
}

export interface PayrollForPosting {
  id: string;
  period_name: string;
  pay_date: string;
  total_gross: number;
  total_paye: number;
  total_uif_employee: number;
  total_uif_employer: number;
  total_net: number;
  department_breakdown?: Array<{
    department_id: string;
    department_name: string;
    amount: number;
  }>;
}

export class IntegrationService {
  private journalService: JournalEntryService;

  constructor() {
    this.journalService = new JournalEntryService();
  }

  /**
   * Post a Sales Invoice to the General Ledger
   * Creates: DR Accounts Receivable, CR Revenue, CR VAT Output
   */
  async postSalesInvoiceToGL(
    tenantId: string,
    invoice: InvoiceForPosting,
    userId: string
  ): Promise<PostingResult> {
    try {
      // Check if already posted
      const existingPosting = await query(
        `SELECT id FROM gl_postings WHERE tenant_id = $1 AND source_type = 'SALES_INVOICE' AND source_id = $2`,
        [tenantId, invoice.id]
      );

      if (existingPosting.rows.length > 0) {
        return {
          success: false,
          message: 'Invoice already posted to GL'
        };
      }

      // Build journal entry lines
      const journalLines = [];

      // DR Accounts Receivable (full amount including VAT)
      journalLines.push({
        account_code: GL_ACCOUNTS.ACCOUNTS_RECEIVABLE,
        debit_amount: invoice.total_amount,
        credit_amount: 0,
        description: `AR - Invoice ${invoice.invoice_number} - ${invoice.customer_name}`
      });

      // CR Revenue (subtotal excluding VAT)
      // If lines have specific GL accounts, use them; otherwise use default revenue
      const revenueByAccount: Record<string, number> = {};
      for (const line of invoice.lines) {
        const accountCode = line.gl_account_code || GL_ACCOUNTS.SALES_REVENUE;
        revenueByAccount[accountCode] = (revenueByAccount[accountCode] || 0) + line.line_total;
      }

      for (const [accountCode, amount] of Object.entries(revenueByAccount)) {
        journalLines.push({
          account_code: accountCode,
          debit_amount: 0,
          credit_amount: amount,
          description: `Revenue - Invoice ${invoice.invoice_number}`
        });
      }

      // CR VAT Output (if applicable)
      if (invoice.vat_amount > 0) {
        journalLines.push({
          account_code: GL_ACCOUNTS.VAT_OUTPUT,
          debit_amount: 0,
          credit_amount: invoice.vat_amount,
          description: `VAT Output - Invoice ${invoice.invoice_number}`
        });
      }

      // Create journal entry via service
      const journalEntryId = await this.journalService.createJournalEntry({
        journal_date: invoice.invoice_date,
        source_type: JournalSource.SALES_INVOICE,
        description: `Sales Invoice ${invoice.invoice_number} - ${invoice.customer_name}`,
        notes: `Auto-posted from Sales module`,
        lines: journalLines,
        requires_approval: false
      }, userId);

      // Post the journal entry
      await this.journalService.postJournalEntry(journalEntryId, userId);

      // Record the posting link
      await query(
        `INSERT INTO gl_postings (tenant_id, source_type, source_id, journal_entry_id, posted_by, posted_at)
         VALUES ($1, 'SALES_INVOICE', $2, $3, $4, NOW())`,
        [tenantId, invoice.id, journalEntryId, userId]
      );

      // Update invoice status to reflect GL posting
      await query(
        `UPDATE sales_invoices SET gl_posted = true, gl_posted_at = NOW(), gl_journal_id = $1 
         WHERE id = $2 AND tenant_id = $3`,
        [journalEntryId, invoice.id, tenantId]
      );

      return {
        success: true,
        journalEntryId,
        message: `Invoice ${invoice.invoice_number} posted to GL successfully`
      };

    } catch (error) {
      console.error('Error posting sales invoice to GL:', error);
      return {
        success: false,
        message: `Failed to post invoice: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Post a Purchase Bill to the General Ledger
   * Creates: DR Expense/Inventory, DR VAT Input, CR Accounts Payable
   */
  async postPurchaseBillToGL(
    tenantId: string,
    bill: BillForPosting,
    userId: string
  ): Promise<PostingResult> {
    try {
      // Check if already posted
      const existingPosting = await query(
        `SELECT id FROM gl_postings WHERE tenant_id = $1 AND source_type = 'PURCHASE_BILL' AND source_id = $2`,
        [tenantId, bill.id]
      );

      if (existingPosting.rows.length > 0) {
        return {
          success: false,
          message: 'Bill already posted to GL'
        };
      }

      // Build journal entry lines
      const journalLines = [];

      // DR Expenses (group by expense account)
      const expensesByAccount: Record<string, number> = {};
      for (const line of bill.lines) {
        const accountCode = line.expense_account_code || GL_ACCOUNTS.OFFICE_SUPPLIES;
        expensesByAccount[accountCode] = (expensesByAccount[accountCode] || 0) + line.line_total;
      }

      for (const [accountCode, amount] of Object.entries(expensesByAccount)) {
        journalLines.push({
          account_code: accountCode,
          debit_amount: amount,
          credit_amount: 0,
          description: `Expense - Bill ${bill.bill_number} - ${bill.supplier_name}`
        });
      }

      // DR VAT Input (if applicable)
      if (bill.vat_amount > 0) {
        journalLines.push({
          account_code: GL_ACCOUNTS.VAT_INPUT,
          debit_amount: bill.vat_amount,
          credit_amount: 0,
          description: `VAT Input - Bill ${bill.bill_number}`
        });
      }

      // CR Accounts Payable (full amount including VAT)
      journalLines.push({
        account_code: GL_ACCOUNTS.ACCOUNTS_PAYABLE,
        debit_amount: 0,
        credit_amount: bill.total_amount,
        description: `AP - Bill ${bill.bill_number} - ${bill.supplier_name}`
      });

      // Create journal entry
      const journalEntryId = await this.journalService.createJournalEntry({
        journal_date: bill.bill_date,
        source_type: JournalSource.PURCHASE_INVOICE,
        description: `Purchase Bill ${bill.bill_number} - ${bill.supplier_name}`,
        notes: `Auto-posted from Purchase module`,
        lines: journalLines,
        requires_approval: false
      }, userId);

      // Post the journal entry
      await this.journalService.postJournalEntry(journalEntryId, userId);

      // Record the posting link
      await query(
        `INSERT INTO gl_postings (tenant_id, source_type, source_id, journal_entry_id, posted_by, posted_at)
         VALUES ($1, 'PURCHASE_BILL', $2, $3, $4, NOW())`,
        [tenantId, bill.id, journalEntryId, userId]
      );

      // Update bill status
      await query(
        `UPDATE purchase_invoices SET gl_posted = true, gl_posted_at = NOW(), gl_journal_id = $1 
         WHERE id = $2 AND tenant_id = $3`,
        [journalEntryId, bill.id, tenantId]
      );

      return {
        success: true,
        journalEntryId,
        message: `Bill ${bill.bill_number} posted to GL successfully`
      };

    } catch (error) {
      console.error('Error posting purchase bill to GL:', error);
      return {
        success: false,
        message: `Failed to post bill: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Post a Payroll Run to the General Ledger
   * Creates: DR Salary Expense, CR PAYE Payable, CR UIF Payable, CR Salaries Payable
   */
  async postPayrollToGL(
    tenantId: string,
    payroll: PayrollForPosting,
    userId: string
  ): Promise<PostingResult> {
    try {
      // Check if already posted
      const existingPosting = await query(
        `SELECT id FROM gl_postings WHERE tenant_id = $1 AND source_type = 'PAYROLL' AND source_id = $2`,
        [tenantId, payroll.id]
      );

      if (existingPosting.rows.length > 0) {
        return {
          success: false,
          message: 'Payroll already posted to GL'
        };
      }

      const journalLines = [];

      // DR Salary Expense (gross amount)
      journalLines.push({
        account_code: GL_ACCOUNTS.SALARY_EXPENSE,
        debit_amount: payroll.total_gross,
        credit_amount: 0,
        description: `Salary Expense - ${payroll.period_name}`
      });

      // DR UIF Employer Contribution (employer portion)
      journalLines.push({
        account_code: GL_ACCOUNTS.SALARY_EXPENSE,
        debit_amount: payroll.total_uif_employer,
        credit_amount: 0,
        description: `UIF Employer Contribution - ${payroll.period_name}`
      });

      // CR PAYE Payable
      journalLines.push({
        account_code: GL_ACCOUNTS.PAYE_PAYABLE,
        debit_amount: 0,
        credit_amount: payroll.total_paye,
        description: `PAYE Payable - ${payroll.period_name}`
      });

      // CR UIF Payable (employee + employer)
      const totalUIF = payroll.total_uif_employee + payroll.total_uif_employer;
      journalLines.push({
        account_code: GL_ACCOUNTS.UIF_PAYABLE,
        debit_amount: 0,
        credit_amount: totalUIF,
        description: `UIF Payable - ${payroll.period_name}`
      });

      // CR Salaries Payable (net pay)
      journalLines.push({
        account_code: GL_ACCOUNTS.SALARIES_PAYABLE,
        debit_amount: 0,
        credit_amount: payroll.total_net,
        description: `Net Salaries Payable - ${payroll.period_name}`
      });

      // Create journal entry
      const journalEntryId = await this.journalService.createJournalEntry({
        journal_date: payroll.pay_date,
        source_type: JournalSource.PAYROLL,
        description: `Payroll Run - ${payroll.period_name}`,
        notes: `Auto-posted from HR/Payroll module`,
        lines: journalLines,
        requires_approval: true // Payroll typically requires approval
      }, userId);

      // Record the posting link
      await query(
        `INSERT INTO gl_postings (tenant_id, source_type, source_id, journal_entry_id, posted_by, posted_at)
         VALUES ($1, 'PAYROLL', $2, $3, $4, NOW())`,
        [tenantId, payroll.id, journalEntryId, userId]
      );

      return {
        success: true,
        journalEntryId,
        message: `Payroll ${payroll.period_name} journal created (pending approval)`
      };

    } catch (error) {
      console.error('Error posting payroll to GL:', error);
      return {
        success: false,
        message: `Failed to post payroll: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Post Inventory Movement to GL (for COGS on sales)
   * Creates: DR Cost of Goods Sold, CR Inventory
   */
  async postInventoryCOGSToGL(
    tenantId: string,
    movementData: {
      id: string;
      movement_date: string;
      item_name: string;
      quantity: number;
      unit_cost: number;
      total_cost: number;
      reference_type: string;
      reference_number: string;
    },
    userId: string
  ): Promise<PostingResult> {
    try {
      const journalLines = [
        {
          account_code: GL_ACCOUNTS.COST_OF_GOODS_SOLD,
          debit_amount: movementData.total_cost,
          credit_amount: 0,
          description: `COGS - ${movementData.item_name} (${movementData.quantity} units)`
        },
        {
          account_code: GL_ACCOUNTS.INVENTORY,
          debit_amount: 0,
          credit_amount: movementData.total_cost,
          description: `Inventory reduction - ${movementData.item_name}`
        }
      ];

      const journalEntryId = await this.journalService.createJournalEntry({
        journal_date: movementData.movement_date,
        source_type: JournalSource.INVENTORY,
        description: `COGS - ${movementData.reference_type} ${movementData.reference_number}`,
        notes: `Auto-posted from Inventory module`,
        lines: journalLines,
        requires_approval: false
      }, userId);

      await this.journalService.postJournalEntry(journalEntryId, userId);

      return {
        success: true,
        journalEntryId,
        message: `COGS posted for ${movementData.item_name}`
      };

    } catch (error) {
      console.error('Error posting inventory COGS:', error);
      return {
        success: false,
        message: `Failed to post COGS: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Record a payment received against an invoice
   * Creates: DR Bank, CR Accounts Receivable
   */
  async postPaymentReceivedToGL(
    tenantId: string,
    payment: {
      id: string;
      payment_date: string;
      amount: number;
      invoice_number: string;
      customer_name: string;
      bank_account_code?: string;
      payment_reference: string;
    },
    userId: string
  ): Promise<PostingResult> {
    try {
      const journalLines = [
        {
          account_code: payment.bank_account_code || GL_ACCOUNTS.BANK,
          debit_amount: payment.amount,
          credit_amount: 0,
          description: `Payment received - ${payment.customer_name} - Ref: ${payment.payment_reference}`
        },
        {
          account_code: GL_ACCOUNTS.ACCOUNTS_RECEIVABLE,
          debit_amount: 0,
          credit_amount: payment.amount,
          description: `AR reduction - Invoice ${payment.invoice_number}`
        }
      ];

      const journalEntryId = await this.journalService.createJournalEntry({
        journal_date: payment.payment_date,
        source_type: JournalSource.RECEIPT,
        description: `Payment received from ${payment.customer_name}`,
        notes: `Invoice: ${payment.invoice_number}, Ref: ${payment.payment_reference}`,
        lines: journalLines,
        requires_approval: false
      }, userId);

      await this.journalService.postJournalEntry(journalEntryId, userId);

      return {
        success: true,
        journalEntryId,
        message: `Payment of R${payment.amount.toFixed(2)} posted to GL`
      };

    } catch (error) {
      console.error('Error posting payment received:', error);
      return {
        success: false,
        message: `Failed to post payment: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Record a payment made to supplier
   * Creates: DR Accounts Payable, CR Bank
   */
  async postPaymentMadeToGL(
    tenantId: string,
    payment: {
      id: string;
      payment_date: string;
      amount: number;
      bill_number: string;
      supplier_name: string;
      bank_account_code?: string;
      payment_reference: string;
    },
    userId: string
  ): Promise<PostingResult> {
    try {
      const journalLines = [
        {
          account_code: GL_ACCOUNTS.ACCOUNTS_PAYABLE,
          debit_amount: payment.amount,
          credit_amount: 0,
          description: `AP reduction - Bill ${payment.bill_number}`
        },
        {
          account_code: payment.bank_account_code || GL_ACCOUNTS.BANK,
          debit_amount: 0,
          credit_amount: payment.amount,
          description: `Payment to ${payment.supplier_name} - Ref: ${payment.payment_reference}`
        }
      ];

      const journalEntryId = await this.journalService.createJournalEntry({
        journal_date: payment.payment_date,
        source_type: JournalSource.PAYMENT,
        description: `Payment to ${payment.supplier_name}`,
        notes: `Bill: ${payment.bill_number}, Ref: ${payment.payment_reference}`,
        lines: journalLines,
        requires_approval: false
      }, userId);

      await this.journalService.postJournalEntry(journalEntryId, userId);

      return {
        success: true,
        journalEntryId,
        message: `Payment of R${payment.amount.toFixed(2)} posted to GL`
      };

    } catch (error) {
      console.error('Error posting payment made:', error);
      return {
        success: false,
        message: `Failed to post payment: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get posting status for a document
   */
  async getPostingStatus(
    tenantId: string,
    sourceType: string,
    sourceId: string
  ): Promise<{ posted: boolean; journalEntryId?: string; postedAt?: Date }> {
    const result = await query(
      `SELECT journal_entry_id, posted_at FROM gl_postings 
       WHERE tenant_id = $1 AND source_type = $2 AND source_id = $3`,
      [tenantId, sourceType, sourceId]
    );

    if (result.rows.length > 0) {
      return {
        posted: true,
        journalEntryId: result.rows[0].journal_entry_id,
        postedAt: result.rows[0].posted_at
      };
    }

    return { posted: false };
  }

  /**
   * Reverse a GL posting (creates reversing journal entry)
   */
  async reversePosting(
    tenantId: string,
    sourceType: string,
    sourceId: string,
    reason: string,
    userId: string
  ): Promise<PostingResult> {
    try {
      const posting = await query(
        `SELECT journal_entry_id FROM gl_postings 
         WHERE tenant_id = $1 AND source_type = $2 AND source_id = $3`,
        [tenantId, sourceType, sourceId]
      );

      if (posting.rows.length === 0) {
        return {
          success: false,
          message: 'No posting found to reverse'
        };
      }

      const journalEntryId = posting.rows[0].journal_entry_id;
      
      // Create reversing entry
      const reversingEntryId = await this.journalService.reverseJournalEntry(
        journalEntryId,
        new Date(),
        reason,
        userId
      );

      // Mark original posting as reversed
      await query(
        `UPDATE gl_postings SET reversed = true, reversed_at = NOW(), reversed_by = $1, 
         reversing_journal_id = $2 WHERE journal_entry_id = $3 AND tenant_id = $4`,
        [userId, reversingEntryId, journalEntryId, tenantId]
      );

      return {
        success: true,
        journalEntryId: reversingEntryId,
        message: 'Posting reversed successfully'
      };

    } catch (error) {
      console.error('Error reversing posting:', error);
      return {
        success: false,
        message: `Failed to reverse posting: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const integrationService = new IntegrationService();
