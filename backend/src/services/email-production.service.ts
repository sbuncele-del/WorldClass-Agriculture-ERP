/**
 * Production Email Service
 * Supports: Resend, Amazon SES, SendGrid, Generic SMTP
 * Features: Retry logic, console fallback, rate limiting
 */

import nodemailer, { Transporter } from 'nodemailer';
// AWS SDK is dynamically imported only when SES is used
// import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import fs from 'fs';
import path from 'path';

// Types
interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

interface TemplateEmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  variables: Record<string, string>;
  from?: string;
}

type EmailProvider = 'resend' | 'ses' | 'sendgrid' | 'smtp' | 'console';

// Configuration
const EMAIL_PROVIDER: EmailProvider = (process.env.EMAIL_PROVIDER as EmailProvider) || 'smtp';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

class ProductionEmailService {
  private transporter: Transporter | null = null;
  private sesClient: any = null; // SESClient loaded dynamically
  private resendApiKey: string | null = null;
  private initialized = false;
  private provider: EmailProvider;

  constructor() {
    this.provider = this.detectProvider();
    this.initialize();
  }

  private detectProvider(): EmailProvider {
    // Auto-detect based on available credentials
    if (process.env.RESEND_API_KEY) return 'resend';
    if (process.env.SENDGRID_API_KEY) return 'sendgrid';
    if (process.env.AWS_SES_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID) return 'ses';
    if (process.env.SMTP_USER && process.env.SMTP_PASS) return 'smtp';
    return 'console'; // Fallback to console logging
  }

  private initialize(): void {
    try {
      switch (this.provider) {
        case 'resend':
          this.initializeResend();
          break;
        case 'ses':
          this.initializeSESAsync(); // Don't block constructor
          break;
        case 'sendgrid':
          this.initializeSendGrid();
          break;
        case 'smtp':
          this.initializeSMTP();
          break;
        default:
          console.log('📧 Email provider: Console (emails will be logged, not sent)');
      }
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.provider = 'console';
    }
  }

  private initializeResend(): void {
    this.resendApiKey = process.env.RESEND_API_KEY!;
    const fromDomain = process.env.RESEND_FROM_DOMAIN || 'siyabusaerp.co.za';
    console.log(`✅ Email provider: Resend (domain: ${fromDomain})`);
  }

  private async initializeSESAsync(): Promise<void> {
    try {
      const { SESClient } = await import('@aws-sdk/client-ses');
      this.sesClient = new SESClient({
        region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'eu-north-1',
        credentials: process.env.AWS_SES_ACCESS_KEY_ID ? {
          accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY!,
        } : undefined,
      });
      console.log('✅ Email provider: Amazon SES');
    } catch (error) {
      console.warn('⚠️ SES SDK not available, falling back to console');
      this.provider = 'console';
    }
  }

  // Keep old method for backwards compatibility (calls async version)
  private initializeSES(): void {
    this.initializeSESAsync();
  }

  private initializeSendGrid(): void {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
    console.log('✅ Email provider: SendGrid');
  }

  private initializeSMTP(): void {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify connection
    this.transporter.verify((error) => {
      if (error) {
        console.error('❌ SMTP connection failed:', error.message);
        this.provider = 'console';
      } else {
        console.log('✅ Email provider: SMTP (' + process.env.SMTP_HOST + ')');
      }
    });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getFromAddress(): string {
    const name = process.env.EMAIL_FROM_NAME || 'WorldClass ERP';
    const email = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@aetheros.co.za';
    return `"${name}" <${email}>`;
  }

  /**
   * Send email with retry logic
   */
  async send(options: EmailOptions): Promise<boolean> {
    const { to, subject, html, text, from, replyTo } = options;
    const recipients = Array.isArray(to) ? to : [to];

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        switch (this.provider) {
          case 'resend':
            await this.sendViaResend(recipients, subject, html, text, from, replyTo);
            break;
          case 'ses':
            await this.sendViaSES(recipients, subject, html, text, from);
            break;
          case 'sendgrid':
          case 'smtp':
            await this.sendViaSMTP(recipients, subject, html, text, from, replyTo);
            break;
          default:
            this.logToConsole(recipients, subject, html);
            return true;
        }

        console.log(`✅ Email sent to ${recipients.join(', ')}: ${subject}`);
        return true;

      } catch (error: any) {
        console.error(`❌ Email attempt ${attempt}/${MAX_RETRIES} failed:`, error.message);
        
        if (attempt < MAX_RETRIES) {
          await this.delay(RETRY_DELAY_MS * attempt);
        } else {
          // Final fallback: log to console
          console.error('📧 FALLBACK: Logging email to console after all retries failed');
          this.logToConsole(recipients, subject, html);
          return false;
        }
      }
    }
    return false;
  }

  private async sendViaResend(
    to: string[],
    subject: string,
    html: string,
    text?: string,
    from?: string,
    replyTo?: string
  ): Promise<void> {
    if (!this.resendApiKey) throw new Error('Resend API key not configured');

    const fromDomain = process.env.RESEND_FROM_DOMAIN || 'siyabusaerp.co.za';
    const fromName = process.env.EMAIL_FROM_NAME || 'WorldClass ERP';
    const fromEmail = process.env.EMAIL_FROM || `noreply@${fromDomain}`;
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || `${fromName} <${fromEmail}>`,
        to: to,
        subject: subject,
        html: html,
        text: text || this.htmlToText(html),
        reply_to: replyTo,
      }),
    });

    if (!response.ok) {
      const error = await response.json() as { message?: string };
      throw new Error(`Resend API error: ${error.message || response.statusText}`);
    }

    const result = await response.json() as { id: string };
    console.log(`📧 Resend email ID: ${result.id}`);
  }

  private async sendViaSES(
    to: string[],
    subject: string,
    html: string,
    text?: string,
    from?: string
  ): Promise<void> {
    if (!this.sesClient) throw new Error('SES client not initialized');

    // Dynamic import for SendEmailCommand
    const { SendEmailCommand } = await import('@aws-sdk/client-ses');
    
    const command = new SendEmailCommand({
      Source: from || this.getFromAddress(),
      Destination: { ToAddresses: to },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: html, Charset: 'UTF-8' },
          Text: { Data: text || this.htmlToText(html), Charset: 'UTF-8' },
        },
      },
    });

    await this.sesClient.send(command);
  }

  private async sendViaSMTP(
    to: string[],
    subject: string,
    html: string,
    text?: string,
    from?: string,
    replyTo?: string
  ): Promise<void> {
    if (!this.transporter) throw new Error('SMTP transporter not initialized');

    await this.transporter.sendMail({
      from: from || this.getFromAddress(),
      to: to.join(', '),
      subject,
      html,
      text: text || this.htmlToText(html),
      replyTo,
    });
  }

  private logToConsole(to: string[], subject: string, html: string): void {
    console.log('\n' + '='.repeat(60));
    console.log('📧 EMAIL (Console Mode)');
    console.log('='.repeat(60));
    console.log(`To: ${to.join(', ')}`);
    console.log(`Subject: ${subject}`);
    console.log('Body (first 500 chars):');
    console.log(this.htmlToText(html).substring(0, 500));
    console.log('='.repeat(60) + '\n');
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Load and send templated email
   */
  async sendTemplate(options: TemplateEmailOptions): Promise<boolean> {
    const { to, subject, template, variables, from } = options;

    try {
      const html = await this.loadTemplate(template, variables);
      return this.send({ to, subject, html, from });
    } catch (error: any) {
      console.error(`❌ Failed to send template email: ${error.message}`);
      return false;
    }
  }

  private async loadTemplate(templateName: string, variables: Record<string, string>): Promise<string> {
    const templatePath = path.join(__dirname, '../templates/email', `${templateName}.html`);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templateName}`);
    }

    let html = fs.readFileSync(templatePath, 'utf-8');

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return html;
  }

  // ============================================================
  // Convenience Methods for Common Emails
  // ============================================================

  async sendPasswordReset(email: string, resetUrl: string, userName: string): Promise<boolean> {
    return this.sendTemplate({
      to: email,
      subject: 'Reset Your Password - WorldClass ERP',
      template: 'reset-password',
      variables: {
        userName,
        resetUrl,
        expiryTime: '1 hour',
        companyName: 'WorldClass ERP',
      },
    });
  }

  async sendTripCompleted(
    email: string,
    tripDetails: { tripNumber: string; origin: string; destination: string; driver: string; completedAt: string }
  ): Promise<boolean> {
    return this.sendTemplate({
      to: email,
      subject: `Trip ${tripDetails.tripNumber} Completed - WorldClass ERP`,
      template: 'trip-completed',
      variables: {
        tripNumber: tripDetails.tripNumber,
        origin: tripDetails.origin,
        destination: tripDetails.destination,
        driverName: tripDetails.driver,
        completedAt: tripDetails.completedAt,
        dashboardUrl: `${process.env.FRONTEND_URL}/logistics/trips`,
      },
    });
  }

  async sendInvoiceNotification(
    email: string,
    invoiceDetails: { invoiceNumber: string; amount: string; dueDate: string; customerName: string }
  ): Promise<boolean> {
    return this.sendTemplate({
      to: email,
      subject: `Invoice ${invoiceDetails.invoiceNumber} - WorldClass ERP`,
      template: 'invoice-notification',
      variables: {
        invoiceNumber: invoiceDetails.invoiceNumber,
        amount: invoiceDetails.amount,
        dueDate: invoiceDetails.dueDate,
        customerName: invoiceDetails.customerName,
        viewUrl: `${process.env.FRONTEND_URL}/invoices/${invoiceDetails.invoiceNumber}`,
      },
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; provider: string; message: string }> {
    return {
      status: this.initialized ? 'ok' : 'degraded',
      provider: this.provider,
      message: this.initialized 
        ? `Email service ready (${this.provider})`
        : 'Email service running in console mode',
    };
  }
}

// Export singleton instance
export const emailService = new ProductionEmailService();
export default emailService;
