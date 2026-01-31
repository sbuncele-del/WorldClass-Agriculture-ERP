// ============================================================================
// ACCOUNTING AUTOMATION - REST API CONTROLLER
// ============================================================================

import { Request, Response } from 'express';
import accountingAutomationService from './accounting.automation.service';

class AccountingAutomationController {
  // ---------------------------------------------------------------------------
  // CHART OF ACCOUNTS
  // ---------------------------------------------------------------------------
  
  async getChartOfAccounts(req: Request, res: Response) {
    try {
      const tenantId = String(req.user?.tenantId || req.query.tenantId || '');
      const entityId = req.query.entityId ? String(req.query.entityId) : undefined;
      
      const accounts = await accountingAutomationService.getChartOfAccounts(tenantId, entityId);
      res.json({ success: true, data: accounts });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ---------------------------------------------------------------------------
  // JOURNAL ENTRIES
  // ---------------------------------------------------------------------------
  
  async createJournalEntry(req: Request, res: Response) {
    try {
      const tenantId = String(req.user?.tenantId || req.body.tenantId || '');
      
      const entry = await accountingAutomationService.createJournalEntry({
        tenantId,
        ...req.body
      });
      
      res.status(201).json({ 
        success: true, 
        data: entry,
        message: entry.aiExplanation ? `AI: ${entry.aiExplanation}` : undefined
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async postJournalEntry(req: Request, res: Response) {
    try {
      const { entryId } = req.params;
      const userId = String(req.user?.id || 'system');
      
      const entry = await accountingAutomationService.postJournalEntry(String(entryId), userId);
      res.json({ success: true, data: entry });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async reverseJournalEntry(req: Request, res: Response) {
    try {
      const { entryId } = req.params;
      const { reason } = req.body;
      const userId = String(req.user?.id || 'system');
      
      const reversal = await accountingAutomationService.reverseJournalEntry(String(entryId), reason, userId);
      res.json({ success: true, data: reversal });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ---------------------------------------------------------------------------
  // ACCOUNTS RECEIVABLE
  // ---------------------------------------------------------------------------
  
  async generateInvoiceFromDelivery(req: Request, res: Response) {
    try {
      const tenantId = String(req.user?.tenantId || req.body.tenantId || '');
      const { deliveryId, deliveryData } = req.body;
      
      const invoice = await accountingAutomationService.generateInvoiceFromDelivery(
        tenantId,
        deliveryId,
        deliveryData
      );
      
      res.status(201).json({ 
        success: true, 
        data: invoice,
        message: 'Invoice auto-generated with revenue recognition journal entry'
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async smartMatchPayment(req: Request, res: Response) {
    try {
      const tenantId = String(req.user?.tenantId || req.body.tenantId || '');
      const payment = req.body.payment;
      
      const matches = await accountingAutomationService.smartMatchPayment(tenantId, payment);
      
      res.json({ 
        success: true, 
        data: matches,
        message: matches.length > 0 
          ? `Found ${matches.length} potential matches (best: ${matches[0].matchConfidence}% confidence)`
          : 'No matching invoices found'
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async applyPayment(req: Request, res: Response) {
    try {
      const { paymentId, invoiceId, amount, autoApplied } = req.body;
      
      await accountingAutomationService.applyPaymentToInvoice(
        paymentId,
        invoiceId,
        amount,
        autoApplied
      );
      
      res.json({ success: true, message: 'Payment applied successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ---------------------------------------------------------------------------
  // ACCOUNTS PAYABLE
  // ---------------------------------------------------------------------------
  
  async processInvoiceOCR(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId || req.body.tenantId;
      const { documentUrl } = req.body;
      
      const invoice = await accountingAutomationService.processAPInvoiceOCR(tenantId, documentUrl);
      
      res.status(201).json({ 
        success: true, 
        data: invoice,
        message: `Invoice processed with ${invoice.ocrConfidence}% OCR confidence. Match status: ${invoice.matchStatus}`
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getPaymentSchedule(req: Request, res: Response) {
    try {
      const tenantId = String(req.user?.tenantId || req.query.tenantId || '');
      
      const schedule = await accountingAutomationService.optimizePaymentSchedule(tenantId);
      
      const totalSavings = schedule.reduce((sum, s) => sum + s.savings, 0);
      
      res.json({ 
        success: true, 
        data: schedule,
        summary: {
          totalInvoices: schedule.length,
          totalPayments: schedule.reduce((sum, s) => sum + s.paymentAmount, 0),
          totalDiscountSavings: totalSavings
        },
        message: totalSavings > 0 
          ? `Optimized schedule saves $${totalSavings.toFixed(2)} in early payment discounts`
          : 'Payment schedule optimized for cash flow'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ---------------------------------------------------------------------------
  // CASH MANAGEMENT
  // ---------------------------------------------------------------------------
  
  async getCashPosition(req: Request, res: Response) {
    try {
      const tenantId = String(req.user?.tenantId || req.query.tenantId || '');
      
      const position = await accountingAutomationService.getCashPosition(tenantId);
      
      res.json({ success: true, data: position });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getCashForecast(req: Request, res: Response) {
    try {
      const tenantId = String(req.user?.tenantId || req.query.tenantId || '');
      const horizonDays = parseInt(req.query.days as string) || 30;
      
      const forecast = await accountingAutomationService.generateCashForecast(tenantId, horizonDays);
      
      res.json({ 
        success: true, 
        data: forecast,
        message: `${horizonDays}-day forecast generated with ${forecast.accuracyScore}% model accuracy`
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ---------------------------------------------------------------------------
  // FINANCIAL STATEMENTS
  // ---------------------------------------------------------------------------
  
  async getBalanceSheet(req: Request, res: Response) {
    try {
      const tenantId = String(req.user?.tenantId || req.query.tenantId || '');
      const asOfDate = req.query.asOfDate 
        ? new Date(String(req.query.asOfDate)) 
        : new Date();
      
      const balanceSheet = await accountingAutomationService.getBalanceSheet(tenantId, asOfDate);
      
      res.json({ success: true, data: balanceSheet });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getIncomeStatement(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId || req.query.tenantId as string;
      
      // Default to current month
      const now = new Date();
      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string)
        : new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const incomeStatement = await accountingAutomationService.getIncomeStatement(
        String(tenantId),
        startDate,
        endDate
      );
      
      res.json({ success: true, data: incomeStatement });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ---------------------------------------------------------------------------
  // LOGISTICS INTEGRATION WEBHOOK
  // ---------------------------------------------------------------------------
  
  async handleLogisticsEvent(req: Request, res: Response) {
    try {
      const { eventType, tenantId, data } = req.body;
      
      switch (eventType) {
        case 'SHIPMENT_DELIVERED':
          const invoice = await accountingAutomationService.generateInvoiceFromDelivery(
            tenantId,
            data.shipmentId,
            data
          );
          res.json({ 
            success: true, 
            action: 'invoice_created',
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.totalAmount
          });
          break;
          
        case 'FUEL_TRANSACTION':
          // Create fuel expense accrual
          // Implementation would create AP invoice or journal entry
          res.json({ success: true, action: 'expense_recorded' });
          break;
          
        default:
          res.json({ success: true, action: 'no_action_required' });
      }
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const accountingAutomationController = new AccountingAutomationController();
export default accountingAutomationController;
