import { queueEmail, EmailJobData } from '../queues/email.queue';

/**
 * Email Queue Service
 * 
 * High-level service for queuing emails with priority handling.
 * Use this service instead of calling sendEmail directly for non-critical emails.
 * 
 * Priority Guidelines:
 * - HIGH: Transactional emails (password reset, email verification, payment confirmations)
 * - NORMAL: Notifications (team invites, security alerts, low stock)
 * - LOW: Marketing emails, newsletters, product updates
 */

export class EmailQueueService {
  /**
   * Queue a high-priority email (processed immediately)
   * 
   * Use for: Password resets, email verification, payment confirmations
   */
  static async queueHighPriority(emailData: Omit<EmailJobData, 'priority'>): Promise<void> {
    await queueEmail(
      { ...emailData, priority: 'high' },
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000, // Faster retry for critical emails
        },
      }
    );
  }

  /**
   * Queue a normal-priority email
   * 
   * Use for: Notifications, alerts, team invitations
   */
  static async queueNormalPriority(emailData: Omit<EmailJobData, 'priority'>): Promise<void> {
    await queueEmail({ ...emailData, priority: 'normal' });
  }

  /**
   * Queue a low-priority email
   * 
   * Use for: Marketing emails, newsletters, product updates
   */
  static async queueLowPriority(emailData: Omit<EmailJobData, 'priority'>): Promise<void> {
    await queueEmail(
      { ...emailData, priority: 'low' },
      {
        attempts: 3, // Fewer retries for low-priority emails
      }
    );
  }

  /**
   * Queue a scheduled email (drip campaigns, delayed sends)
   * 
   * @param emailData - Email data
   * @param scheduledFor - Date or Unix timestamp when email should be sent
   * @param priority - Priority level (default: normal)
   */
  static async queueScheduled(
    emailData: Omit<EmailJobData, 'priority' | 'scheduledFor'>,
    scheduledFor: Date | number,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<void> {
    await queueEmail({
      ...emailData,
      priority,
      scheduledFor,
    });
  }

  /**
   * Queue a batch of emails (e.g., newsletter to multiple recipients)
   * 
   * @param recipients - Array of recipient emails
   * @param emailData - Common email data (subject, template, variables)
   * @param priority - Priority level (default: low)
   */
  static async queueBatch(
    recipients: string[],
    emailData: Omit<EmailJobData, 'to' | 'priority'>,
    priority: 'high' | 'normal' | 'low' = 'low'
  ): Promise<void> {
    const jobs = recipients.map((to) =>
      queueEmail(
        {
          ...emailData,
          to,
          priority,
        },
        {
          attempts: 2, // Fewer retries for batch emails
        }
      )
    );

    await Promise.all(jobs);
    console.log(`📬 Queued ${recipients.length} batch emails`);
  }

  /**
   * Queue a drip campaign email
   * 
   * Drip campaigns send a series of emails over time.
   * 
   * @param emailData - Email data
   * @param delayInMinutes - Delay in minutes before sending
   */
  static async queueDripCampaign(
    emailData: Omit<EmailJobData, 'priority' | 'scheduledFor'>,
    delayInMinutes: number
  ): Promise<void> {
    const scheduledFor = Date.now() + delayInMinutes * 60 * 1000;
    await this.queueScheduled(emailData, scheduledFor, 'low');
  }

  // === Specific Email Type Helpers ===

  /**
   * Queue email verification email (high priority)
   */
  static async queueEmailVerification(
    to: string,
    userId: number,
    tenantId: number,
    variables: Record<string, string>
  ): Promise<void> {
    await this.queueHighPriority({
      to,
      subject: 'Verify Your Email Address',
      template: 'email-verification',
      variables,
      userId,
      tenantId,
      category: 'security_alerts',
    });
  }

  /**
   * Queue password reset email (high priority)
   */
  static async queuePasswordReset(
    to: string,
    userId: number,
    tenantId: number,
    variables: Record<string, string>
  ): Promise<void> {
    await this.queueHighPriority({
      to,
      subject: 'Reset Your Password',
      template: 'password-reset',
      variables,
      userId,
      tenantId,
      category: 'security_alerts',
    });
  }

  /**
   * Queue welcome email (normal priority)
   */
  static async queueWelcomeEmail(
    to: string,
    userId: number,
    tenantId: number,
    variables: Record<string, string>
  ): Promise<void> {
    await this.queueNormalPriority({
      to,
      subject: 'Welcome to Worldclass ERP! 🎉',
      template: 'welcome',
      variables,
      userId,
      tenantId,
      category: 'system_notifications',
    });
  }

  /**
   * Queue payment success email (high priority)
   */
  static async queuePaymentSuccess(
    to: string,
    userId: number,
    tenantId: number,
    variables: Record<string, string>
  ): Promise<void> {
    await this.queueHighPriority({
      to,
      subject: 'Payment Successful - Receipt Attached',
      template: 'payment-success',
      variables,
      userId,
      tenantId,
      category: 'payment_notifications',
    });
  }

  /**
   * Queue payment failed email (high priority)
   */
  static async queuePaymentFailed(
    to: string,
    userId: number,
    tenantId: number,
    variables: Record<string, string>
  ): Promise<void> {
    await this.queueHighPriority({
      to,
      subject: 'Payment Failed - Action Required',
      template: 'payment-failed',
      variables,
      userId,
      tenantId,
      category: 'payment_notifications',
    });
  }

  /**
   * Queue team invitation email (normal priority)
   */
  static async queueTeamInvitation(
    to: string,
    variables: Record<string, string>
  ): Promise<void> {
    await this.queueNormalPriority({
      to,
      subject: `You've Been Invited to Join ${variables.companyName}`,
      template: 'team-invitation',
      variables,
      category: 'team_notifications',
    });
  }

  /**
   * Queue security alert email (high priority)
   */
  static async queueSecurityAlert(
    to: string,
    userId: number,
    tenantId: number,
    variables: Record<string, string>
  ): Promise<void> {
    await this.queueHighPriority({
      to,
      subject: `Security Alert: ${variables.alertType}`,
      template: 'security-alert',
      variables,
      userId,
      tenantId,
      category: 'security_alerts',
    });
  }

  /**
   * Queue low stock alert email (normal priority)
   */
  static async queueLowStockAlert(
    to: string,
    userId: number,
    tenantId: number,
    variables: Record<string, string>
  ): Promise<void> {
    await this.queueNormalPriority({
      to,
      subject: `Low Stock Alert: ${variables.productName}`,
      template: 'low-stock-alert',
      variables,
      userId,
      tenantId,
      category: 'inventory_alerts',
    });
  }

  /**
   * Queue subscription expiring email (normal priority)
   */
  static async queueSubscriptionExpiring(
    to: string,
    userId: number,
    tenantId: number,
    variables: Record<string, string>
  ): Promise<void> {
    await this.queueNormalPriority({
      to,
      subject: `Your ${variables.planName} Plan Expires Soon`,
      template: 'subscription-expiring',
      variables,
      userId,
      tenantId,
      category: 'subscription_notifications',
    });
  }

  /**
   * Queue marketing email (low priority)
   */
  static async queueMarketingEmail(
    to: string,
    userId: number,
    tenantId: number,
    subject: string,
    template: string,
    variables: Record<string, string>
  ): Promise<void> {
    await this.queueLowPriority({
      to,
      subject,
      template,
      variables,
      userId,
      tenantId,
      category: 'marketing_emails',
    });
  }
}

export default EmailQueueService;
