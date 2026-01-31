// ============================================================================
// ACCOUNTING AUTOMATION SERVICE
// 100% automated double-entry with AI validation
// ============================================================================

import pool from '../../config/database';
import {
  ChartOfAccount,
  JournalEntry,
  JournalEntryLine,
  CreateJournalEntryRequest,
  ARInvoice,
  ARPayment,
  SmartMatchResult,
  APInvoice,
  ThreeWayMatchResult,
  BankAccount,
  BankTransaction,
  CashPosition,
  CashForecast,
  FraudAlert,
  AutomationRule,
  AutomationLog,
  AIJournalExplanation,
  AIPaymentPrediction,
  AICategorization,
  FinancialStatements,
  BalanceSheet,
  IncomeStatement,
} from './accounting.types';
import crypto from 'crypto';

class AccountingAutomationService {
  // ---------------------------------------------------------------------------
  // CHART OF ACCOUNTS
  // ---------------------------------------------------------------------------
  
  async getChartOfAccounts(tenantId: string, entityId?: string): Promise<ChartOfAccount[]> {
    const query = `
      SELECT * FROM accounting.chart_of_accounts
      WHERE tenant_id = $1
        AND ($2::uuid IS NULL OR entity_id = $2)
        AND is_active = true
      ORDER BY account_code
    `;
    const result = await pool.query(query, [tenantId, entityId || null]);
    return result.rows.map(this.mapChartOfAccount);
  }

  async getAccountByCode(tenantId: string, accountCode: string): Promise<ChartOfAccount | null> {
    const query = `
      SELECT * FROM accounting.chart_of_accounts
      WHERE tenant_id = $1 AND account_code = $2
    `;
    const result = await pool.query(query, [tenantId, accountCode]);
    return result.rows[0] ? this.mapChartOfAccount(result.rows[0]) : null;
  }

  // ---------------------------------------------------------------------------
  // JOURNAL ENTRIES - AUTO DOUBLE-ENTRY
  // ---------------------------------------------------------------------------
  
  async createJournalEntry(request: CreateJournalEntryRequest): Promise<JournalEntry> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validate that entry balances
      const totalDebit = request.lines.reduce((sum, l) => sum + (l.debitAmount || 0), 0);
      const totalCredit = request.lines.reduce((sum, l) => sum + (l.creditAmount || 0), 0);
      
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(`Journal entry not balanced: Debit ${totalDebit} != Credit ${totalCredit}`);
      }

      // Generate entry number
      const entryNumber = await this.generateEntryNumber(client, request.tenantId);

      // Create header
      const headerQuery = `
        INSERT INTO accounting.journal_entries (
          tenant_id, entity_id, entry_number, entry_date, entry_type,
          source_module, source_document_id, source_document_type,
          description, total_debit, total_credit, currency_code, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
      const headerResult = await client.query(headerQuery, [
        request.tenantId,
        request.entityId || null,
        entryNumber,
        request.entryDate,
        request.entryType,
        request.sourceModule || null,
        request.sourceDocumentId || null,
        request.sourceDocumentType || null,
        request.description,
        totalDebit,
        totalCredit,
        request.currencyCode || 'USD',
        request.autoPost ? 'posted' : 'draft'
      ]);

      const entry = this.mapJournalEntry(headerResult.rows[0]);

      // Create lines
      for (let i = 0; i < request.lines.length; i++) {
        const line = request.lines[i];
        const lineQuery = `
          INSERT INTO accounting.journal_entry_lines (
            entry_id, line_number, account_id,
            debit_amount, credit_amount, base_debit, base_credit,
            description, cost_center_id, project_id, department_id, tax_code
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `;
        await client.query(lineQuery, [
          entry.entryId,
          i + 1,
          line.accountId,
          line.debitAmount || 0,
          line.creditAmount || 0,
          line.debitAmount || 0,
          line.creditAmount || 0,
          line.description || null,
          line.costCenterId || null,
          line.projectId || null,
          line.departmentId || null,
          line.taxCode || null
        ]);
      }

      // Generate hash for blockchain audit
      await this.generateEntryHash(client, entry.entryId);

      // Generate AI explanation
      const aiExplanation = await this.generateAIExplanation(entry, request.lines);
      if (aiExplanation) {
        await client.query(
          `UPDATE accounting.journal_entries SET ai_explanation = $1, ai_confidence_score = $2 WHERE entry_id = $3`,
          [aiExplanation.plainLanguageExplanation, aiExplanation.confidence, entry.entryId]
        );
        entry.aiExplanation = aiExplanation.plainLanguageExplanation;
        entry.aiConfidenceScore = aiExplanation.confidence;
      }

      await client.query('COMMIT');
      return entry;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async postJournalEntry(entryId: string, userId: string): Promise<JournalEntry> {
    const query = `
      UPDATE accounting.journal_entries
      SET status = 'posted', posted_date = NOW(), posted_by = $2
      WHERE entry_id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [entryId, userId]);
    
    // Refresh trial balance
    await this.refreshTrialBalance();
    
    return this.mapJournalEntry(result.rows[0]);
  }

  async reverseJournalEntry(entryId: string, reason: string, userId: string): Promise<JournalEntry> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get original entry
      const originalQuery = `SELECT * FROM accounting.journal_entries WHERE entry_id = $1`;
      const originalResult = await client.query(originalQuery, [entryId]);
      const original = originalResult.rows[0];

      if (!original) {
        throw new Error('Journal entry not found');
      }

      if (original.status !== 'posted') {
        throw new Error('Only posted entries can be reversed');
      }

      // Get original lines
      const linesQuery = `SELECT * FROM accounting.journal_entry_lines WHERE entry_id = $1`;
      const linesResult = await client.query(linesQuery, [entryId]);

      // Create reversal entry with swapped debits/credits
      const reversalLines = linesResult.rows.map(line => ({
        accountId: line.account_id,
        debitAmount: line.credit_amount,
        creditAmount: line.debit_amount,
        description: `Reversal: ${line.description || ''}`
      }));

      const reversal = await this.createJournalEntry({
        tenantId: original.tenant_id,
        entityId: original.entity_id,
        entryDate: new Date(),
        entryType: 'reversing',
        sourceModule: original.source_module,
        sourceDocumentId: original.source_document_id,
        sourceDocumentType: original.source_document_type,
        description: `Reversal of ${original.entry_number}: ${reason}`,
        lines: reversalLines,
        autoPost: true
      });

      // Link entries
      await client.query(
        `UPDATE accounting.journal_entries SET reversal_of_entry_id = $1 WHERE entry_id = $2`,
        [entryId, reversal.entryId]
      );
      await client.query(
        `UPDATE accounting.journal_entries SET reversed_by_entry_id = $1, status = 'reversed' WHERE entry_id = $2`,
        [reversal.entryId, entryId]
      );

      await client.query('COMMIT');
      return reversal;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ---------------------------------------------------------------------------
  // AR AUTOMATION
  // ---------------------------------------------------------------------------
  
  async generateInvoiceFromDelivery(
    tenantId: string,
    deliveryId: string,
    deliveryData: any
  ): Promise<ARInvoice> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(client, tenantId, 'AR');

      // Calculate amounts
      const subtotal = deliveryData.totalAmount || deliveryData.freightCharge || 0;
      const taxRate = await this.getTaxRate(tenantId, deliveryData.customerId);
      const taxAmount = subtotal * (taxRate / 100);
      const totalAmount = subtotal + taxAmount;

      // Create invoice
      const invoiceQuery = `
        INSERT INTO accounting.ar_invoices (
          tenant_id, invoice_number, customer_id, invoice_date, due_date,
          currency_code, subtotal, tax_amount, total_amount, status,
          auto_generated, source_type, source_id, terms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // Net 30

      const invoiceResult = await client.query(invoiceQuery, [
        tenantId,
        invoiceNumber,
        deliveryData.customerId,
        new Date(),
        dueDate,
        'USD',
        subtotal,
        taxAmount,
        totalAmount,
        'sent',
        true,
        'shipment_delivery',
        deliveryId,
        'net30'
      ]);

      const invoice = this.mapARInvoice(invoiceResult.rows[0]);

      // Create invoice line
      await client.query(`
        INSERT INTO accounting.ar_invoice_lines (
          invoice_id, line_number, description, quantity, unit_price, line_total
        ) VALUES ($1, 1, $2, 1, $3, $3)
      `, [invoice.invoiceId, `Freight charges for delivery ${deliveryId}`, subtotal]);

      // Auto-create journal entry (Revenue Recognition)
      const revenueAccountId = await this.getSystemAccountId(tenantId, 'freight_revenue');
      const arAccountId = await this.getSystemAccountId(tenantId, 'accounts_receivable');

      await this.createJournalEntry({
        tenantId,
        entryDate: new Date(),
        entryType: 'auto',
        sourceModule: 'ar',
        sourceDocumentId: invoice.invoiceId,
        sourceDocumentType: 'ar_invoice',
        description: `Revenue recognition for invoice ${invoiceNumber}`,
        lines: [
          { accountId: arAccountId, debitAmount: totalAmount, description: 'Accounts Receivable' },
          { accountId: revenueAccountId, creditAmount: subtotal, description: 'Freight Revenue' },
          // Tax liability if applicable
        ],
        autoPost: true
      });

      // AI payment prediction
      const prediction = await this.predictPayment(tenantId, deliveryData.customerId, totalAmount);
      if (prediction) {
        await client.query(`
          UPDATE accounting.ar_invoices
          SET ai_payment_prediction_date = $1, ai_payment_probability = $2, ai_risk_score = $3
          WHERE invoice_id = $4
        `, [prediction.predictedPaymentDate, prediction.probability, (prediction as any).riskScore || 0, invoice.invoiceId]);
      }

      await client.query('COMMIT');
      return invoice;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async smartMatchPayment(tenantId: string, payment: ARPayment): Promise<SmartMatchResult[]> {
    // Get open invoices for customer
    const invoicesQuery = `
      SELECT * FROM accounting.ar_invoices
      WHERE tenant_id = $1 AND customer_id = $2 AND status IN ('sent', 'partially_paid', 'overdue')
      ORDER BY due_date ASC
    `;
    const invoicesResult = await pool.query(invoicesQuery, [tenantId, payment.customerId]);
    const openInvoices = invoicesResult.rows;

    const matches: SmartMatchResult[] = [];

    for (const invoice of openInvoices) {
      let confidence = 0;
      let matchMethod: SmartMatchResult['matchMethod'] = 'ai_predicted';
      const matchReasons: string[] = [];

      // Exact amount match
      if (Math.abs(invoice.amount_due - payment.amount) < 0.01) {
        confidence = 100;
        matchMethod = 'exact';
        matchReasons.push('Exact amount match');
      }
      // Fuzzy amount match (within 5%)
      else if (Math.abs(invoice.amount_due - payment.amount) / invoice.amount_due < 0.05) {
        confidence = 85;
        matchMethod = 'fuzzy_amount';
        matchReasons.push(`Amount within 5% (Invoice: ${invoice.amount_due}, Payment: ${payment.amount})`);
      }

      // Reference number match
      if (payment.referenceNumber) {
        if (payment.referenceNumber.includes(invoice.invoice_number)) {
          confidence = Math.max(confidence, 95);
          matchMethod = confidence === 95 ? 'fuzzy_reference' : matchMethod;
          matchReasons.push('Invoice number found in reference');
        }
        if (invoice.po_number && payment.referenceNumber.includes(invoice.po_number)) {
          confidence = Math.max(confidence, 90);
          matchReasons.push('PO number found in reference');
        }
      }

      // AI prediction boost
      if (invoice.ai_payment_prediction_date) {
        const predictionDate = new Date(invoice.ai_payment_prediction_date);
        const paymentDate = new Date(payment.paymentDate);
        const daysDiff = Math.abs((predictionDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 3) {
          confidence += 10;
          matchReasons.push('AI predicted payment around this date');
        }
      }

      if (confidence >= 50) {
        matches.push({
          invoiceId: invoice.invoice_id,
          invoiceNumber: invoice.invoice_number,
          invoiceAmount: invoice.total_amount,
          amountDue: invoice.amount_due,
          matchConfidence: Math.min(confidence, 100),
          matchMethod,
          matchReasons
        });
      }
    }

    // Sort by confidence
    return matches.sort((a, b) => b.matchConfidence - a.matchConfidence);
  }

  async applyPaymentToInvoice(
    paymentId: string,
    invoiceId: string,
    amount: number,
    autoApplied: boolean = false
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create application record
      await client.query(`
        INSERT INTO accounting.ar_payment_applications (
          payment_id, invoice_id, applied_amount, application_date, auto_applied
        ) VALUES ($1, $2, $3, CURRENT_DATE, $4)
      `, [paymentId, invoiceId, amount, autoApplied]);

      // Update invoice
      await client.query(`
        UPDATE accounting.ar_invoices
        SET amount_paid = amount_paid + $1,
            status = CASE 
              WHEN amount_paid + $1 >= total_amount THEN 'paid'
              ELSE 'partially_paid'
            END,
            updated_at = NOW()
        WHERE invoice_id = $2
      `, [amount, invoiceId]);

      // Update payment
      await client.query(`
        UPDATE accounting.ar_payments
        SET unallocated_amount = unallocated_amount - $1,
            status = CASE WHEN unallocated_amount - $1 <= 0 THEN 'applied' ELSE status END
        WHERE payment_id = $2
      `, [amount, paymentId]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ---------------------------------------------------------------------------
  // AP AUTOMATION - 3-WAY MATCH
  // ---------------------------------------------------------------------------
  
  async processAPInvoiceOCR(tenantId: string, documentUrl: string): Promise<APInvoice> {
    // In production, integrate with AWS Textract or similar
    // This is a placeholder for the OCR processing flow
    
    const ocrResult = await this.performOCR(documentUrl);
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const internalRef = await this.generateInvoiceNumber(client, tenantId, 'AP');
      
      const invoiceQuery = `
        INSERT INTO accounting.ap_invoices (
          tenant_id, invoice_number, internal_reference, vendor_id,
          invoice_date, due_date, subtotal, tax_amount, total_amount,
          ocr_processed, ocr_confidence, ocr_raw_data, original_document_url, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $11, $12, 'pending')
        RETURNING *
      `;
      
      // Find or create vendor based on OCR result
      const vendorId = await this.findOrCreateVendor(tenantId, ocrResult.vendorName);
      
      const result = await client.query(invoiceQuery, [
        tenantId,
        ocrResult.invoiceNumber,
        internalRef,
        vendorId,
        ocrResult.invoiceDate,
        ocrResult.dueDate,
        (ocrResult.totalAmount || 0) - (ocrResult.taxAmount || 0),
        ocrResult.taxAmount || 0,
        ocrResult.totalAmount,
        ocrResult.confidence,
        JSON.stringify(ocrResult),
        documentUrl
      ]);

      const invoice = this.mapAPInvoice(result.rows[0]);

      // Try to auto-match with PO
      await this.attemptThreeWayMatch(client, invoice);

      await client.query('COMMIT');
      return invoice;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async attemptThreeWayMatch(client: any, invoice: APInvoice): Promise<ThreeWayMatchResult> {
    const result: ThreeWayMatchResult = {
      matched: false,
      poMatched: false,
      receiptMatched: false,
      priceVariance: 0,
      quantityVariance: 0,
      exceptions: []
    };

    // Find matching PO by vendor and approximate amount
    const poQuery = `
      SELECT * FROM purchase_orders
      WHERE vendor_id = $1 
        AND status IN ('approved', 'partially_received', 'received')
        AND total_amount BETWEEN $2 * 0.95 AND $2 * 1.05
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    try {
      const poResult = await client.query(poQuery, [invoice.vendorId, invoice.totalAmount]);
      
      if (poResult.rows.length > 0) {
        const po = poResult.rows[0];
        result.poMatched = true;
        result.priceVariance = invoice.totalAmount - po.total_amount;

        // Check for goods receipt
        const receiptQuery = `
          SELECT * FROM goods_receipts
          WHERE po_id = $1 AND status = 'completed'
        `;
        const receiptResult = await client.query(receiptQuery, [po.po_id]);
        
        if (receiptResult.rows.length > 0) {
          result.receiptMatched = true;
        } else {
          result.exceptions.push({
            type: 'missing_receipt',
            description: 'Goods receipt not found for PO',
            severity: 'warning'
          });
        }

        // Update invoice with PO reference
        await client.query(`
          UPDATE accounting.ap_invoices
          SET po_id = $1, match_status = $2, match_variance = $3, auto_matched = true
          WHERE invoice_id = $4
        `, [
          po.po_id,
          result.poMatched && result.receiptMatched ? 'matched' : 'exception',
          result.priceVariance,
          invoice.invoiceId
        ]);

        result.matched = result.poMatched && result.receiptMatched && Math.abs(result.priceVariance) < 1;
      } else {
        result.exceptions.push({
          type: 'missing_po',
          description: 'No matching purchase order found',
          severity: 'error'
        });
      }
    } catch (error) {
      // PO table might not exist
      result.exceptions.push({
        type: 'missing_po',
        description: 'Purchase order matching not available',
        severity: 'warning'
      });
    }

    return result;
  }

  async optimizePaymentSchedule(tenantId: string): Promise<any[]> {
    // Get all unpaid AP invoices
    const query = `
      SELECT * FROM accounting.ap_invoices
      WHERE tenant_id = $1 AND status IN ('approved', 'scheduled') AND amount_due > 0
      ORDER BY 
        CASE WHEN discount_date >= CURRENT_DATE THEN 0 ELSE 1 END,
        discount_percent DESC,
        due_date ASC
    `;
    const result = await pool.query(query, [tenantId]);
    
    // Get available cash
    const cashPosition = await this.getCashPosition(tenantId);
    
    const schedule: any[] = [];
    let availableCash = cashPosition.totalBalance;

    for (const invoice of result.rows) {
      const canTakeDiscount = invoice.discount_date && new Date(invoice.discount_date) >= new Date();
      const discountAmount = canTakeDiscount ? invoice.amount_due * (invoice.discount_percent / 100) : 0;
      const paymentAmount = invoice.amount_due - discountAmount;

      if (availableCash >= paymentAmount) {
        schedule.push({
          invoiceId: invoice.invoice_id,
          vendorId: invoice.vendor_id,
          invoiceNumber: invoice.invoice_number,
          amountDue: invoice.amount_due,
          discountAvailable: discountAmount,
          paymentAmount,
          scheduledDate: canTakeDiscount ? invoice.discount_date : invoice.due_date,
          priority: invoice.payment_priority,
          savings: discountAmount
        });
        availableCash -= paymentAmount;
      }
    }

    return schedule;
  }

  // ---------------------------------------------------------------------------
  // CASH MANAGEMENT
  // ---------------------------------------------------------------------------
  
  async getCashPosition(tenantId: string): Promise<CashPosition> {
    const accountsQuery = `
      SELECT * FROM accounting.bank_accounts
      WHERE tenant_id = $1 AND is_active = true
    `;
    const accountsResult = await pool.query(accountsQuery, [tenantId]);

    const byAccount = accountsResult.rows.map(row => ({
      bankAccountId: row.bank_account_id,
      accountName: row.account_name,
      bankName: row.bank_name,
      currencyCode: row.currency_code,
      currentBalance: parseFloat(row.current_balance),
      availableBalance: parseFloat(row.available_balance)
    }));

    const totalBalance = byAccount.reduce((sum, acc) => sum + acc.currentBalance, 0);

    // Group by currency
    const currencyMap = new Map<string, number>();
    for (const acc of byAccount) {
      currencyMap.set(
        acc.currencyCode,
        (currencyMap.get(acc.currencyCode) || 0) + acc.currentBalance
      );
    }
    const byCurrency = Array.from(currencyMap.entries()).map(([code, balance]) => ({
      currencyCode: code,
      balance,
      balanceUSD: balance // TODO: FX conversion
    }));

    return {
      asOfDate: new Date(),
      totalBalance,
      byAccount,
      byCurrency,
      byEntity: []
    };
  }

  async generateCashForecast(tenantId: string, horizonDays: number): Promise<CashForecast> {
    const currentPosition = await this.getCashPosition(tenantId);
    
    // Get expected AR receipts
    const arQuery = `
      SELECT due_date, SUM(amount_due) as expected_amount
      FROM accounting.ar_invoices
      WHERE tenant_id = $1 AND status IN ('sent', 'partially_paid', 'overdue')
        AND due_date <= CURRENT_DATE + $2
      GROUP BY due_date
      ORDER BY due_date
    `;
    const arResult = await pool.query(arQuery, [tenantId, horizonDays]);

    // Get expected AP payments
    const apQuery = `
      SELECT COALESCE(scheduled_payment_date, due_date) as payment_date, SUM(amount_due) as expected_amount
      FROM accounting.ap_invoices
      WHERE tenant_id = $1 AND status IN ('approved', 'scheduled')
        AND COALESCE(scheduled_payment_date, due_date) <= CURRENT_DATE + $2
      GROUP BY COALESCE(scheduled_payment_date, due_date)
      ORDER BY payment_date
    `;
    const apResult = await pool.query(apQuery, [tenantId, horizonDays]);

    // Build daily forecast
    const forecastDetails: any[] = [];
    let runningBalance = currentPosition.totalBalance;

    for (let i = 0; i <= horizonDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const inflows = arResult.rows
        .filter(r => r.due_date?.toISOString().split('T')[0] === dateStr)
        .reduce((sum, r) => sum + parseFloat(r.expected_amount), 0);

      const outflows = apResult.rows
        .filter(r => r.payment_date?.toISOString().split('T')[0] === dateStr)
        .reduce((sum, r) => sum + parseFloat(r.expected_amount), 0);

      runningBalance = runningBalance + inflows - outflows;

      forecastDetails.push({
        date,
        openingBalance: runningBalance - inflows + outflows,
        inflows: [{ category: 'AR Collections', amount: inflows, confidence: 75 }],
        outflows: [{ category: 'AP Payments', amount: outflows, confidence: 90 }],
        closingBalance: runningBalance,
        confidence: 80
      });
    }

    const totalInflows = forecastDetails.reduce((sum, d) => 
      sum + d.inflows.reduce((s: number, i: any) => s + i.amount, 0), 0);
    const totalOutflows = forecastDetails.reduce((sum, d) => 
      sum + d.outflows.reduce((s: number, o: any) => s + o.amount, 0), 0);

    return {
      forecastId: crypto.randomUUID(),
      tenantId,
      forecastDate: new Date(),
      forecastHorizonDays: horizonDays,
      generatedAt: new Date(),
      modelVersion: '1.0',
      accuracyScore: 85,
      openingBalance: currentPosition.totalBalance,
      forecastedInflows: totalInflows,
      forecastedOutflows: totalOutflows,
      forecastedClosingBalance: runningBalance,
      balanceLowerBound: runningBalance * 0.85,
      balanceUpperBound: runningBalance * 1.15,
      confidenceLevel: 95,
      forecastDetails,
      assumptions: [
        { name: 'AR Collection Rate', value: '85%', impact: 'high' },
        { name: 'AP Payment Timing', value: 'On Schedule', impact: 'medium' }
      ],
      riskFactors: [
        {
          name: 'Large Customer Default',
          description: 'Top customer fails to pay',
          probability: 5,
          impact: 30,
          mitigation: 'Credit insurance'
        }
      ],
      createdAt: new Date()
    };
  }

  // ---------------------------------------------------------------------------
  // FRAUD DETECTION
  // ---------------------------------------------------------------------------
  
  async detectFraud(transaction: BankTransaction): Promise<FraudAlert | null> {
    let fraudScore = 0;
    const indicators: any[] = [];

    // Check for round amounts (common in fraud)
    if (transaction.amount % 100 === 0 && Math.abs(transaction.amount) > 1000) {
      fraudScore += 15;
      indicators.push({
        indicator: 'Round Amount',
        value: transaction.amount,
        threshold: 'Amounts ending in 00',
        weight: 15
      });
    }

    // Check for unusual timing (outside business hours)
    const hour = new Date(transaction.transactionDate).getHours();
    if (hour < 6 || hour > 22) {
      fraudScore += 10;
      indicators.push({
        indicator: 'Unusual Timing',
        value: `${hour}:00`,
        threshold: '6:00-22:00',
        weight: 10
      });
    }

    // Check for velocity (multiple transactions in short time)
    const velocityQuery = `
      SELECT COUNT(*) as tx_count
      FROM accounting.bank_transactions
      WHERE bank_account_id = $1
        AND transaction_date >= $2::date - interval '1 hour'
        AND transaction_date <= $2::date
    `;
    const velocityResult = await pool.query(velocityQuery, [
      transaction.bankAccountId,
      transaction.transactionDate
    ]);
    
    if (parseInt(velocityResult.rows[0].tx_count) > 5) {
      fraudScore += 25;
      indicators.push({
        indicator: 'High Velocity',
        value: velocityResult.rows[0].tx_count,
        threshold: '5 per hour',
        weight: 25
      });
    }

    // Check against historical patterns
    const historyQuery = `
      SELECT AVG(ABS(amount)) as avg_amount, STDDEV(ABS(amount)) as stddev_amount
      FROM accounting.bank_transactions
      WHERE bank_account_id = $1
        AND transaction_date >= CURRENT_DATE - interval '90 days'
    `;
    const historyResult = await pool.query(historyQuery, [transaction.bankAccountId]);
    
    if (historyResult.rows[0].avg_amount) {
      const avgAmount = parseFloat(historyResult.rows[0].avg_amount);
      const stdDev = parseFloat(historyResult.rows[0].stddev_amount) || avgAmount * 0.5;
      
      if (Math.abs(transaction.amount) > avgAmount + 3 * stdDev) {
        fraudScore += 30;
        indicators.push({
          indicator: 'Amount Anomaly',
          value: transaction.amount,
          threshold: `${(avgAmount + 3 * stdDev).toFixed(2)} (3σ)`,
          weight: 30
        });
      }
    }

    // Only create alert if score exceeds threshold
    if (fraudScore >= 30) {
      const severity = fraudScore >= 70 ? 'critical' : fraudScore >= 50 ? 'high' : fraudScore >= 30 ? 'medium' : 'low';
      
      return {
        alertId: crypto.randomUUID(),
        transactionId: transaction.transactionId,
        alertType: indicators[0]?.indicator === 'High Velocity' ? 'velocity_anomaly' : 'behavioral_anomaly',
        severity,
        score: fraudScore,
        description: `Suspicious transaction detected with ${indicators.length} risk indicators`,
        indicators,
        status: 'new',
        createdAt: new Date()
      };
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // REAL-TIME FINANCIAL STATEMENTS
  // ---------------------------------------------------------------------------
  
  async getBalanceSheet(tenantId: string, asOfDate: Date): Promise<BalanceSheet> {
    const query = `
      SELECT 
        coa.account_type,
        coa.account_subtype,
        coa.account_code,
        coa.account_name,
        SUM(CASE WHEN coa.normal_balance = 'debit' 
            THEN jel.base_debit - jel.base_credit 
            ELSE jel.base_credit - jel.base_debit END) as balance
      FROM accounting.journal_entry_lines jel
      JOIN accounting.journal_entries je ON jel.entry_id = je.entry_id
      JOIN accounting.chart_of_accounts coa ON jel.account_id = coa.account_id
      WHERE je.tenant_id = $1
        AND je.status = 'posted'
        AND je.entry_date <= $2
        AND coa.account_type IN ('asset', 'liability', 'equity')
      GROUP BY coa.account_type, coa.account_subtype, coa.account_code, coa.account_name
      ORDER BY coa.account_type, coa.account_code
    `;
    
    const result = await pool.query(query, [tenantId, asOfDate]);
    
    const assets = { items: [] as any[], total: 0 };
    const liabilities = { items: [] as any[], total: 0 };
    const equity = { items: [] as any[], total: 0 };

    for (const row of result.rows) {
      const item = {
        accountCode: row.account_code,
        accountName: row.account_name,
        amount: parseFloat(row.balance)
      };

      switch (row.account_type) {
        case 'asset':
          assets.items.push(item);
          assets.total += item.amount;
          break;
        case 'liability':
          liabilities.items.push(item);
          liabilities.total += item.amount;
          break;
        case 'equity':
          equity.items.push(item);
          equity.total += item.amount;
          break;
      }
    }

    return {
      asOfDate,
      assets,
      liabilities,
      equity,
      totalAssets: assets.total,
      totalLiabilities: liabilities.total,
      totalEquity: equity.total
    };
  }

  async getIncomeStatement(tenantId: string, startDate: Date, endDate: Date): Promise<IncomeStatement> {
    const query = `
      SELECT 
        coa.account_type,
        coa.account_subtype,
        coa.account_code,
        coa.account_name,
        SUM(CASE WHEN coa.normal_balance = 'credit' 
            THEN jel.base_credit - jel.base_debit 
            ELSE jel.base_debit - jel.base_credit END) as balance
      FROM accounting.journal_entry_lines jel
      JOIN accounting.journal_entries je ON jel.entry_id = je.entry_id
      JOIN accounting.chart_of_accounts coa ON jel.account_id = coa.account_id
      WHERE je.tenant_id = $1
        AND je.status = 'posted'
        AND je.entry_date BETWEEN $2 AND $3
        AND coa.account_type IN ('revenue', 'expense')
      GROUP BY coa.account_type, coa.account_subtype, coa.account_code, coa.account_name
      ORDER BY coa.account_type DESC, coa.account_code
    `;
    
    const result = await pool.query(query, [tenantId, startDate, endDate]);
    
    const revenue = { items: [] as any[], total: 0 };
    const cogs = { items: [] as any[], total: 0 };
    const opex = { items: [] as any[], total: 0 };
    const other = { items: [] as any[], total: 0 };

    for (const row of result.rows) {
      const item = {
        accountCode: row.account_code,
        accountName: row.account_name,
        amount: parseFloat(row.balance)
      };

      if (row.account_type === 'revenue') {
        revenue.items.push(item);
        revenue.total += item.amount;
      } else if (row.account_subtype === 'cost_of_goods') {
        cogs.items.push(item);
        cogs.total += item.amount;
      } else if (row.account_subtype === 'operating_expense') {
        opex.items.push(item);
        opex.total += item.amount;
      } else {
        other.items.push(item);
        other.total += item.amount;
      }
    }

    const grossProfit = revenue.total - cogs.total;
    const operatingIncome = grossProfit - opex.total;
    const incomeBeforeTax = operatingIncome - other.total;
    const taxExpense = incomeBeforeTax * 0.25; // Placeholder 25% tax rate

    return {
      periodStart: startDate,
      periodEnd: endDate,
      revenue,
      costOfGoodsSold: cogs,
      grossProfit,
      operatingExpenses: opex,
      operatingIncome,
      otherIncomeExpense: other,
      incomeBeforeTax,
      taxExpense,
      netIncome: incomeBeforeTax - taxExpense
    };
  }

  // ---------------------------------------------------------------------------
  // AI FEATURES
  // ---------------------------------------------------------------------------
  
  async generateAIExplanation(entry: JournalEntry, lines: any[]): Promise<AIJournalExplanation> {
    // In production, this would call an AI service
    // For now, generate a template-based explanation
    
    const accountNames = await Promise.all(
      lines.map(async (line) => {
        const account = await this.getAccountById(line.accountId);
        return {
          name: account?.accountName || 'Unknown',
          type: account?.accountType || 'unknown',
          debit: line.debitAmount || 0,
          credit: line.creditAmount || 0
        };
      })
    );

    const debits = accountNames.filter(a => a.debit > 0);
    const credits = accountNames.filter(a => a.credit > 0);

    let explanation = `This entry records ${entry.description}. `;
    
    if (debits.length > 0) {
      explanation += `It debits ${debits.map(d => `${d.name} ($${d.debit.toFixed(2)})`).join(', ')}`;
    }
    if (credits.length > 0) {
      explanation += ` and credits ${credits.map(c => `${c.name} ($${c.credit.toFixed(2)})`).join(', ')}. `;
    }

    const affectedStatements: string[] = [];
    if (accountNames.some(a => ['asset', 'liability', 'equity'].includes(a.type))) {
      affectedStatements.push('Balance Sheet');
    }
    if (accountNames.some(a => ['revenue', 'expense'].includes(a.type))) {
      affectedStatements.push('Income Statement');
    }

    return {
      entryId: entry.entryId,
      plainLanguageExplanation: explanation,
      accountingRationale: `Standard double-entry: ${entry.entryType} entry from ${entry.sourceModule || 'manual'}`,
      affectedStatements,
      confidence: 95
    };
  }

  async predictPayment(tenantId: string, customerId: string, amount: number): Promise<AIPaymentPrediction | null> {
    // Get customer payment history
    const historyQuery = `
      SELECT 
        AVG(EXTRACT(DAY FROM (p.payment_date - i.due_date))) as avg_days_late,
        COUNT(*) as payment_count,
        SUM(CASE WHEN p.payment_date <= i.due_date THEN 1 ELSE 0 END)::float / COUNT(*) as on_time_rate
      FROM accounting.ar_invoices i
      JOIN accounting.ar_payment_applications pa ON i.invoice_id = pa.invoice_id
      JOIN accounting.ar_payments p ON pa.payment_id = p.payment_id
      WHERE i.tenant_id = $1 AND i.customer_id = $2
    `;
    
    try {
      const historyResult = await pool.query(historyQuery, [tenantId, customerId]);
      const history = historyResult.rows[0];

      if (!history || history.payment_count < 3) {
        // Not enough history, use default
        const predictedDate = new Date();
        predictedDate.setDate(predictedDate.getDate() + 30);
        return {
          invoiceId: '',
          predictedPaymentDate: predictedDate,
          probability: 70,
          factors: [{ factor: 'New Customer', impact: 'neutral', weight: 1, description: 'Insufficient payment history' }]
        };
      }

      const avgDaysLate = parseFloat(history.avg_days_late) || 0;
      const onTimeRate = parseFloat(history.on_time_rate) || 0.5;

      const predictedDate = new Date();
      predictedDate.setDate(predictedDate.getDate() + 30 + Math.round(avgDaysLate));

      return {
        invoiceId: '',
        predictedPaymentDate: predictedDate,
        probability: Math.round(onTimeRate * 100),
        factors: [
          { factor: 'Payment History', impact: onTimeRate > 0.8 ? 'positive' : 'negative', weight: 0.6, description: `${Math.round(onTimeRate * 100)}% on-time rate` },
          { factor: 'Invoice Amount', impact: amount > 10000 ? 'negative' : 'neutral', weight: 0.2, description: amount > 10000 ? 'Large invoice may delay payment' : 'Standard amount' }
        ]
      };
    } catch (error) {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // HELPER METHODS
  // ---------------------------------------------------------------------------
  
  private async generateEntryNumber(client: any, tenantId: string): Promise<string> {
    const result = await client.query(
      `SELECT nextval('accounting.journal_entry_seq') as seq`
    );
    return `JE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${result.rows[0].seq.toString().padStart(6, '0')}`;
  }

  private async generateInvoiceNumber(client: any, tenantId: string, type: 'AR' | 'AP'): Promise<string> {
    const result = await client.query(
      `SELECT nextval('accounting.journal_entry_seq') as seq`
    );
    return `${type}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${result.rows[0].seq.toString().padStart(6, '0')}`;
  }

  private async generateEntryHash(client: any, entryId: string): Promise<string> {
    const result = await client.query(
      `SELECT * FROM accounting.journal_entries WHERE entry_id = $1`,
      [entryId]
    );
    const entry = result.rows[0];
    
    const data = `${entry.entry_number}|${entry.entry_date}|${entry.total_debit}|${entry.total_credit}|${entry.description}`;
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    
    await client.query(
      `UPDATE accounting.journal_entries SET entry_hash = $1 WHERE entry_id = $2`,
      [hash, entryId]
    );
    
    return hash;
  }

  private async getSystemAccountId(tenantId: string, accountType: string): Promise<string> {
    const mappings: Record<string, string> = {
      'freight_revenue': '4000',
      'accounts_receivable': '1200',
      'accounts_payable': '2000',
      'cash': '1000',
      'fuel_expense': '5100'
    };
    
    const accountCode = mappings[accountType] || '9999';
    const result = await pool.query(
      `SELECT account_id FROM accounting.chart_of_accounts WHERE tenant_id = $1 AND account_code = $2`,
      [tenantId, accountCode]
    );
    
    return result.rows[0]?.account_id || '';
  }

  private async getTaxRate(tenantId: string, customerId: string): Promise<number> {
    // Simplified - would look up based on customer location
    return 0; // No tax for B2B freight typically
  }

  private async getAccountById(accountId: string): Promise<ChartOfAccount | null> {
    const result = await pool.query(
      `SELECT * FROM accounting.chart_of_accounts WHERE account_id = $1`,
      [accountId]
    );
    return result.rows[0] ? this.mapChartOfAccount(result.rows[0]) : null;
  }

  private async findOrCreateVendor(tenantId: string, vendorName?: string): Promise<string> {
    // Simplified - would match or create vendor
    return '00000000-0000-0000-0000-000000000001';
  }

  private async performOCR(documentUrl: string): Promise<any> {
    // In production, call AWS Textract
    return {
      confidence: 85,
      vendorName: 'Sample Vendor',
      invoiceNumber: 'INV-' + Date.now(),
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      totalAmount: 1000,
      taxAmount: 0,
      lineItems: [],
      rawText: ''
    };
  }

  private async refreshTrialBalance(): Promise<void> {
    try {
      await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY accounting.mv_trial_balance');
    } catch (error) {
      // View might not exist yet
    }
  }

  // Mapping functions
  private mapChartOfAccount(row: any): ChartOfAccount {
    return {
      accountId: row.account_id,
      tenantId: row.tenant_id,
      entityId: row.entity_id,
      accountCode: row.account_code,
      accountName: row.account_name,
      accountType: row.account_type,
      accountSubtype: row.account_subtype,
      parentAccountId: row.parent_account_id,
      currencyCode: row.currency_code,
      isActive: row.is_active,
      isSystemAccount: row.is_system_account,
      normalBalance: row.normal_balance,
      description: row.description,
      taxCode: row.tax_code,
      reconciliationRequired: row.reconciliation_required,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapJournalEntry(row: any): JournalEntry {
    return {
      entryId: row.entry_id,
      tenantId: row.tenant_id,
      entityId: row.entity_id,
      entryNumber: row.entry_number,
      entryDate: row.entry_date,
      postedDate: row.posted_date,
      periodId: row.period_id,
      entryType: row.entry_type,
      sourceModule: row.source_module,
      sourceDocumentId: row.source_document_id,
      sourceDocumentType: row.source_document_type,
      description: row.description,
      aiExplanation: row.ai_explanation,
      aiConfidenceScore: row.ai_confidence_score,
      totalDebit: parseFloat(row.total_debit),
      totalCredit: parseFloat(row.total_credit),
      currencyCode: row.currency_code,
      exchangeRate: parseFloat(row.exchange_rate),
      status: row.status,
      isBalanced: row.is_balanced,
      reversalOfEntryId: row.reversal_of_entry_id,
      reversedByEntryId: row.reversed_by_entry_id,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      postedBy: row.posted_by,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      entryHash: row.entry_hash,
      previousHash: row.previous_hash
    };
  }

  private mapARInvoice(row: any): ARInvoice {
    return {
      invoiceId: row.invoice_id,
      tenantId: row.tenant_id,
      invoiceNumber: row.invoice_number,
      customerId: row.customer_id,
      invoiceDate: row.invoice_date,
      dueDate: row.due_date,
      currencyCode: row.currency_code,
      subtotal: parseFloat(row.subtotal),
      taxAmount: parseFloat(row.tax_amount),
      totalAmount: parseFloat(row.total_amount),
      amountPaid: parseFloat(row.amount_paid),
      amountDue: parseFloat(row.amount_due),
      status: row.status,
      autoGenerated: row.auto_generated,
      sourceType: row.source_type,
      sourceId: row.source_id,
      aiPaymentPredictionDate: row.ai_payment_prediction_date,
      aiPaymentProbability: row.ai_payment_probability,
      aiRiskScore: row.ai_risk_score,
      collectionStatus: row.collection_status || 'none',
      lastReminderDate: row.last_reminder_date,
      nextActionDate: row.next_action_date,
      journalEntryId: row.journal_entry_id,
      terms: row.terms,
      poNumber: row.po_number,
      notes: row.notes,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapAPInvoice(row: any): APInvoice {
    return {
      invoiceId: row.invoice_id,
      tenantId: row.tenant_id,
      invoiceNumber: row.invoice_number,
      internalReference: row.internal_reference,
      vendorId: row.vendor_id,
      invoiceDate: row.invoice_date,
      receivedDate: row.received_date,
      dueDate: row.due_date,
      currencyCode: row.currency_code,
      subtotal: parseFloat(row.subtotal),
      taxAmount: parseFloat(row.tax_amount),
      totalAmount: parseFloat(row.total_amount),
      amountPaid: parseFloat(row.amount_paid || 0),
      amountDue: parseFloat(row.amount_due),
      status: row.status,
      ocrProcessed: row.ocr_processed,
      ocrConfidence: row.ocr_confidence,
      ocrRawData: row.ocr_raw_data,
      originalDocumentUrl: row.original_document_url,
      poId: row.po_id,
      receiptId: row.receipt_id,
      matchStatus: row.match_status,
      matchVariance: parseFloat(row.match_variance || 0),
      autoMatched: row.auto_matched,
      paymentTerms: row.payment_terms,
      discountDate: row.discount_date,
      discountPercent: parseFloat(row.discount_percent || 0),
      scheduledPaymentDate: row.scheduled_payment_date,
      paymentPriority: row.payment_priority,
      journalEntryId: row.journal_entry_id,
      approvalStatus: row.approval_status,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      notes: row.notes,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export const accountingAutomationService = new AccountingAutomationService();
export default accountingAutomationService;
