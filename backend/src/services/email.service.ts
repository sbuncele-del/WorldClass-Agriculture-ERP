/**
 * Email Service
 * Core email sending functionality - delegates to production service when available
 */

import nodemailer from 'nodemailer';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import EmailPreferencesService from './email-preferences.service';

const readFile = promisify(fs.readFile);

// Check if production email service should be used (Resend, SES, SendGrid)
const USE_PRODUCTION_EMAIL = !!(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY || process.env.AWS_SES_ACCESS_KEY_ID);

// Email configuration for SMTP fallback
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
};

// Create transporter - only if email is enabled via SMTP
const EMAIL_ENABLED = process.env.ENABLE_EMAIL !== 'false' && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;

const transporter = EMAIL_ENABLED 
  ? nodemailer.createTransport(emailConfig)
  : null as any; // Dummy transporter when disabled

// Log which email provider is being used
if (USE_PRODUCTION_EMAIL) {
  console.log('📧 Email service: Using production provider (Resend/SES/SendGrid)');
} else if (EMAIL_ENABLED && transporter) {
  transporter.verify((error: any, success: any) => {
    if (error) {
      console.error('Email service configuration error:', error);
    } else {
      console.log('✅ Email service is ready to send messages');
    }
  });
} else {
  console.log('⚠️  Email service disabled (no credentials configured)');
}

/**
 * Email template loader
 * Loads and processes email templates with variable substitution
 * Falls back to inline HTML if template file not found
 */
async function loadTemplate(templateName: string, variables: Record<string, string>): Promise<string> {
  try {
    const templatePath = path.join(__dirname, '../templates/email', `${templateName}.html`);
    let template = await readFile(templatePath, 'utf-8');

    // Replace variables in template
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, variables[key]);
    });

    return template;
  } catch (error) {
    console.log(`Template file not found: ${templateName}, using fallback HTML`);
    
    // Return fallback inline HTML for common templates
    return generateFallbackTemplate(templateName, variables);
  }
}

/**
 * Generate fallback HTML when template file is missing
 */
function generateFallbackTemplate(templateName: string, variables: Record<string, string>): string {
  const companyName = variables.companyName || 'WorldClass ERP';
  const userName = variables.userName || variables.name || 'User';
  
  const templates: Record<string, string> = {
    'team-invitation': `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>You're Invited!</title></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">You're Invited! 🎉</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${userName},</p>
          <p><strong>${variables.inviterName || 'Someone'}</strong> has invited you to join <strong>${companyName}</strong> on WorldClass ERP.</p>
          <p>Click the button below to accept your invitation and set up your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${variables.inviteUrl || variables.acceptUrl || '#'}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">This invitation will expire in 7 days.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #888; font-size: 11px; text-align: center;">
            &copy; ${new Date().getFullYear()} WorldClass ERP. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `,
    'welcome': `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Welcome!</title></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to WorldClass ERP! 🚀</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${userName},</p>
          <p>Welcome aboard! Your account has been successfully created.</p>
          <p>You now have access to:</p>
          <ul>
            <li>📊 Dashboard & Reports</li>
            <li>📦 Inventory Management</li>
            <li>💰 Financial Accounting</li>
            <li>👥 HR & Payroll</li>
            <li>And much more...</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${variables.loginUrl || process.env.FRONTEND_URL || '#'}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
        </div>
      </body>
      </html>
    `,
    'reset-password': `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Reset Password</title></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #dc3545; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Password Reset Request 🔐</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${userName},</p>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${variables.resetUrl || '#'}" 
               style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email. This link expires in 1 hour.</p>
        </div>
      </body>
      </html>
    `,
    'verify-email': `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Verify Email</title></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Verify Your Email ✉️</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${userName},</p>
          <p>Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${variables.verifyUrl || '#'}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Verify Email
            </a>
          </div>
        </div>
      </body>
      </html>
    `,
  };
  
  // Return matching template or generic fallback
  if (templates[templateName]) {
    return templates[templateName];
  }
  
  // Generic fallback for unknown templates
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>${variables.subject || 'Notification'}</title></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">WorldClass ERP</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hi ${userName},</p>
        <p>${variables.message || 'You have a new notification from WorldClass ERP.'}</p>
        ${variables.actionUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${variables.actionUrl}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            ${variables.actionText || 'View Details'}
          </a>
        </div>` : ''}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #888; font-size: 11px; text-align: center;">
          &copy; ${new Date().getFullYear()} WorldClass ERP. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send email using template
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, string>;
  from?: string;
  userId?: number;
  tenantId?: number;
  category?: string;
}): Promise<void> {
  try {
    const { to, subject, template, variables, from, userId, tenantId, category } = options;

    // Check email preferences if user info provided
    if (userId && tenantId && category) {
      const canSend = await EmailPreferencesService.canSendEmail(userId, tenantId, category);
      if (!canSend) {
        console.log(`⏭️ Skipping email to ${to} - user preference: ${category}`);
        return;
      }
    }

    // Generate unsubscribe token if user info provided
    let unsubscribeUrl = '';
    if (userId && tenantId) {
      const token = await EmailPreferencesService.generateUnsubscribeToken(
        userId,
        tenantId,
        category
      );
      unsubscribeUrl = `${process.env.FRONTEND_URL}/api/email-preferences/unsubscribe/${token}`;
      variables.unsubscribeUrl = unsubscribeUrl;
    }

    // Load and process template
    const html = await loadTemplate(template, variables);

    // Use production email service if available (Resend, SES, SendGrid)
    if (USE_PRODUCTION_EMAIL) {
      const { emailService } = await import('./email-production.service');
      await emailService.send({
        to,
        subject,
        html,
        from: from || undefined,
      });
      return;
    }

    // Check if SMTP email is enabled
    if (!EMAIL_ENABLED || !transporter) {
      console.log(`⚠️ Email service disabled - would have sent to: ${to}, subject: ${subject}`);
      return; // Silently return if email is not configured
    }

    // Send email via SMTP
    const info = await transporter.sendMail({
      from: from || `"Worldclass ERP" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log('✅ Email sent:', {
      messageId: info.messageId,
      to,
      subject,
    });

    // Log email send for compliance
    if (userId && tenantId && category) {
      await EmailPreferencesService.logEmailSend({
        userId,
        tenantId,
        emailAddress: to,
        emailType: template,
        emailCategory: category,
        subject,
      });
    }
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
}

/**
 * Send plain text email (no template)
 */
export async function sendPlainEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
}): Promise<void> {
  try {
    const { to, subject, text, html, from } = options;

    const info = await transporter.sendMail({
      from: from || `"Worldclass ERP" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || text,
    });

    console.log('✅ Email sent:', {
      messageId: info.messageId,
      to,
      subject,
    });
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
}

/**
 * Send bulk emails (with rate limiting)
 */
export async function sendBulkEmails(
  emails: Array<{
    to: string;
    subject: string;
    template: string;
    variables: Record<string, string>;
  }>,
  delayMs: number = 100
): Promise<{ sent: number; failed: number; errors: any[] }> {
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as any[],
  };

  for (const email of emails) {
    try {
      await sendEmail(email);
      results.sent++;
      
      // Delay between emails to avoid rate limiting
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        email: email.to,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

export default {
  sendEmail,
  sendPlainEmail,
  sendBulkEmails,
};
