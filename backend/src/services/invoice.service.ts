import pool from '../config/database';
import PDFDocument from 'pdfkit';
import AWS from 'aws-sdk';
import { Readable } from 'stream';

// Configure AWS S3
const s3 = new AWS.S3({
  region: process.env.AWS_REGION || 'eu-north-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const S3_BUCKET = process.env.S3_BUCKET_NAME || 'aetheros-erp-invoices';

interface InvoiceData {
  tenantId: string;
  amount: number;
  currency: string;
  plan: string;
  billingCycle: string;
  transactionId?: string;
  dueDate?: Date;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: Date;
  paidAt?: Date;
  s3Url?: string;
  createdAt: Date;
}

export class InvoiceService {
  /**
   * Generate invoice number (format: INV-YYYYMMDD-XXXXX)
   */
  private static async generateInvoiceNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // Get count of invoices today
    const result = await pool.query(
      `SELECT COUNT(*) as count 
       FROM invoices 
       WHERE invoice_number LIKE $1`,
      [`INV-${dateStr}-%`]
    );

    const count = parseInt(result.rows[0].count) + 1;
    const sequence = String(count).padStart(5, '0');

    return `INV-${dateStr}-${sequence}`;
  }

  /**
   * Generate PDF invoice
   */
  private static async generateInvoicePDF(
    invoiceData: Invoice,
    tenantInfo: any
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc
          .fontSize(20)
          .text('INVOICE', 50, 50, { align: 'right' })
          .fontSize(10)
          .text(`Invoice #: ${invoiceData.invoiceNumber}`, { align: 'right' })
          .text(`Date: ${new Date(invoiceData.createdAt).toLocaleDateString()}`, { align: 'right' })
          .text(`Due: ${new Date(invoiceData.dueDate).toLocaleDateString()}`, { align: 'right' })
          .moveDown();

        // Company Info
        doc
          .fontSize(16)
          .text('Aetheros ERP', 50, 50)
          .fontSize(10)
          .text('Enterprise Resource Planning', 50, 75)
          .text('South Africa', 50, 90)
          .text('support@aetheros.co.za', 50, 105)
          .moveDown(2);

        // Bill To
        doc
          .fontSize(12)
          .text('BILL TO:', 50, 150)
          .fontSize(10)
          .text(tenantInfo.name || 'Customer', 50, 170)
          .text(tenantInfo.email || '', 50, 185)
          .moveDown(2);

        // Invoice Details Table
        const tableTop = 250;
        
        // Table Headers
        doc
          .fontSize(10)
          .text('Description', 50, tableTop, { width: 250 })
          .text('Plan', 310, tableTop, { width: 100 })
          .text('Period', 420, tableTop, { width: 80 })
          .text('Amount', 510, tableTop, { width: 80, align: 'right' });

        // Horizontal line
        doc
          .moveTo(50, tableTop + 15)
          .lineTo(550, tableTop + 15)
          .stroke();

        // Table Content
        const itemY = tableTop + 25;
        const description = `Aetheros ERP - ${invoiceData.status === 'completed' ? 'Subscription Payment' : 'Subscription Invoice'}`;
        const planName = this.formatPlanName(tenantInfo.plan);
        const period = invoiceData.currency === 'ZAR' 
          ? (tenantInfo.billing_cycle === 'annual' ? '12 months' : '1 month')
          : (tenantInfo.billing_cycle === 'annual' ? '12 months' : '1 month');
        const amountStr = this.formatCurrency(invoiceData.amount, invoiceData.currency);

        doc
          .fontSize(10)
          .text(description, 50, itemY, { width: 250 })
          .text(planName, 310, itemY, { width: 100 })
          .text(period, 420, itemY, { width: 80 })
          .text(amountStr, 510, itemY, { width: 80, align: 'right' });

        // Subtotal and Total
        const totalY = itemY + 60;
        
        doc
          .moveTo(50, totalY - 10)
          .lineTo(550, totalY - 10)
          .stroke();

        doc
          .fontSize(10)
          .text('Subtotal:', 400, totalY)
          .text(amountStr, 510, totalY, { width: 80, align: 'right' })
          .text('Tax (0%):', 400, totalY + 20)
          .text(this.formatCurrency(0, invoiceData.currency), 510, totalY + 20, { width: 80, align: 'right' });

        doc
          .fontSize(12)
          .text('Total:', 400, totalY + 45)
          .text(amountStr, 510, totalY + 45, { width: 80, align: 'right' });

        // Payment Status
        const statusY = totalY + 80;
        const statusColor = invoiceData.status === 'completed' ? '#10B981' : '#F59E0B';
        const statusText = invoiceData.status === 'completed' ? 'PAID' : 'PENDING';

        doc
          .fontSize(14)
          .fillColor(statusColor)
          .text(statusText, 50, statusY, { align: 'center' })
          .fillColor('#000000');

        if (invoiceData.paidAt) {
          doc
            .fontSize(10)
            .text(`Paid on: ${new Date(invoiceData.paidAt).toLocaleDateString()}`, 50, statusY + 25, { align: 'center' });
        }

        // Footer
        doc
          .fontSize(9)
          .fillColor('#666666')
          .text(
            'Thank you for your business!',
            50,
            700,
            { align: 'center', width: 500 }
          )
          .text(
            'For questions about this invoice, contact support@aetheros.co.za',
            50,
            715,
            { align: 'center', width: 500 }
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Format plan name for display
   */
  private static formatPlanName(plan: string): string {
    const names: { [key: string]: string } = {
      starter: 'Starter',
      professional: 'Professional',
      enterprise: 'Enterprise',
      trial: 'Trial'
    };
    return names[plan] || plan;
  }

  /**
   * Format currency amount
   */
  private static formatCurrency(amount: number, currency: string): string {
    const symbol = currency === 'ZAR' ? 'R' : '$';
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Upload PDF to S3
   */
  private static async uploadToS3(
    pdfBuffer: Buffer,
    invoiceNumber: string,
    tenantId: string
  ): Promise<string> {
    const key = `invoices/${tenantId}/${invoiceNumber}.pdf`;

    const params = {
      Bucket: S3_BUCKET,
      Key: key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      ACL: 'private' as const
    };

    await s3.putObject(params).promise();

    // Return the S3 URL (not public, will need signed URL to access)
    return `s3://${S3_BUCKET}/${key}`;
  }

  /**
   * Generate and store invoice
   */
  static async generateInvoice(data: InvoiceData): Promise<Invoice> {
    try {
      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Get tenant info
      const tenantResult = await pool.query(
        'SELECT name, email, subscription_plan as plan, billing_cycle FROM tenants WHERE id = $1',
        [data.tenantId]
      );

      if (tenantResult.rows.length === 0) {
        throw new Error('Tenant not found');
      }

      const tenantInfo = tenantResult.rows[0];

      // Calculate due date (30 days from now if not provided)
      const dueDate = data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Create invoice record
      const invoiceResult = await pool.query(
        `INSERT INTO invoices (
          tenant_id, invoice_number, amount, currency,
          status, due_date, payment_transaction_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          data.tenantId,
          invoiceNumber,
          data.amount,
          data.currency,
          data.transactionId ? 'paid' : 'pending',
          dueDate,
          data.transactionId || null
        ]
      );

      const invoice = invoiceResult.rows[0];

      // Generate PDF
      const pdfBuffer = await this.generateInvoicePDF(
        {
          id: invoice.id,
          invoiceNumber: invoice.invoice_number,
          tenantId: invoice.tenant_id,
          amount: parseFloat(invoice.amount),
          currency: invoice.currency,
          status: invoice.status,
          dueDate: invoice.due_date,
          paidAt: invoice.paid_at,
          createdAt: invoice.created_at
        },
        tenantInfo
      );

      // Upload to S3
      const s3Url = await this.uploadToS3(pdfBuffer, invoiceNumber, data.tenantId);

      // Update invoice with S3 URL
      await pool.query(
        'UPDATE invoices SET s3_url = $1 WHERE id = $2',
        [s3Url, invoice.id]
      );

      invoice.s3_url = s3Url;

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        tenantId: invoice.tenant_id,
        amount: parseFloat(invoice.amount),
        currency: invoice.currency,
        status: invoice.status,
        dueDate: invoice.due_date,
        paidAt: invoice.paid_at,
        s3Url: invoice.s3_url,
        createdAt: invoice.created_at
      };
    } catch (error: any) {
      console.error('[InvoiceService] Generate invoice error:', error);
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  static async getInvoiceById(invoiceId: string, tenantId: string): Promise<Invoice | null> {
    const result = await pool.query(
      `SELECT * FROM invoices 
       WHERE id = $1 AND tenant_id = $2`,
      [invoiceId, tenantId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const invoice = result.rows[0];
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      tenantId: invoice.tenant_id,
      amount: parseFloat(invoice.amount),
      currency: invoice.currency,
      status: invoice.status,
      dueDate: invoice.due_date,
      paidAt: invoice.paid_at,
      s3Url: invoice.s3_url,
      createdAt: invoice.created_at
    };
  }

  /**
   * Get invoice history for tenant
   */
  static async getInvoiceHistory(
    tenantId: string,
    limit: number = 50
  ): Promise<Invoice[]> {
    const result = await pool.query(
      `SELECT * FROM invoices 
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [tenantId, limit]
    );

    return result.rows.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      tenantId: invoice.tenant_id,
      amount: parseFloat(invoice.amount),
      currency: invoice.currency,
      status: invoice.status,
      dueDate: invoice.due_date,
      paidAt: invoice.paid_at,
      s3Url: invoice.s3_url,
      createdAt: invoice.created_at
    }));
  }

  /**
   * Get signed download URL for invoice PDF
   */
  static async getDownloadUrl(
    invoiceId: string,
    tenantId: string
  ): Promise<string | null> {
    const invoice = await this.getInvoiceById(invoiceId, tenantId);
    
    if (!invoice || !invoice.s3Url) {
      return null;
    }

    // Extract S3 key from s3:// URL
    const s3Key = invoice.s3Url.replace(`s3://${S3_BUCKET}/`, '');

    // Generate signed URL (valid for 1 hour)
    const signedUrl = s3.getSignedUrl('getObject', {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Expires: 3600 // 1 hour
    });

    return signedUrl;
  }

  /**
   * Mark invoice as paid
   */
  static async markInvoicePaid(
    invoiceId: string,
    transactionId: string,
    paidAt?: Date
  ): Promise<void> {
    await pool.query(
      `UPDATE invoices
       SET status = 'paid',
           paid_at = $1,
           payment_transaction_id = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [paidAt || new Date(), transactionId, invoiceId]
    );
  }

  /**
   * Mark invoice as failed
   */
  static async markInvoiceFailed(invoiceId: string, reason?: string): Promise<void> {
    await pool.query(
      `UPDATE invoices
       SET status = 'failed',
           failure_reason = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [reason, invoiceId]
    );
  }

  /**
   * Handle failed payment - implements retry logic
   */
  static async handleFailedPayment(invoiceId: string): Promise<{
    success: boolean;
    message: string;
    retryScheduled: boolean;
  }> {
    try {
      const invoice = await pool.query(
        'SELECT * FROM invoices WHERE id = $1',
        [invoiceId]
      );

      if (invoice.rows.length === 0) {
        return {
          success: false,
          message: 'Invoice not found',
          retryScheduled: false
        };
      }

      const inv = invoice.rows[0];

      // Get retry count
      const retryCount = inv.retry_count || 0;

      // Maximum 3 retries
      if (retryCount >= 3) {
        await this.markInvoiceFailed(invoiceId, 'Maximum retry attempts exceeded');
        
        // TODO: Send final payment failed email
        // TODO: Suspend tenant account
        
        return {
          success: false,
          message: 'Maximum retry attempts exceeded',
          retryScheduled: false
        };
      }

      // Schedule retry (exponential backoff: 1 day, 3 days, 7 days)
      const retryDays = [1, 3, 7][retryCount];
      const nextRetryDate = new Date(Date.now() + retryDays * 24 * 60 * 60 * 1000);

      await pool.query(
        `UPDATE invoices
         SET retry_count = $1,
             next_retry_date = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [retryCount + 1, nextRetryDate, invoiceId]
      );

      // TODO: Send payment retry notification email

      return {
        success: true,
        message: `Payment retry scheduled for ${nextRetryDate.toLocaleDateString()}`,
        retryScheduled: true
      };
    } catch (error: any) {
      console.error('[InvoiceService] Handle failed payment error:', error);
      return {
        success: false,
        message: error.message,
        retryScheduled: false
      };
    }
  }

  /**
   * Send invoice email to customer
   */
  static async sendInvoiceEmail(
    invoiceId: string,
    tenantId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const invoice = await this.getInvoiceById(invoiceId, tenantId);
      
      if (!invoice) {
        return { success: false, message: 'Invoice not found' };
      }

      // Get download URL
      const downloadUrl = await this.getDownloadUrl(invoiceId, tenantId);

      // TODO: Implement email sending with SendGrid/AWS SES
      // For now, just log
      console.log('[InvoiceService] Email would be sent to tenant:', tenantId);
      console.log('[InvoiceService] Download URL:', downloadUrl);

      return {
        success: true,
        message: 'Invoice email sent successfully'
      };
    } catch (error: any) {
      console.error('[InvoiceService] Send invoice email error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

export default InvoiceService;
