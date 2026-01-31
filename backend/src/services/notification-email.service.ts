import { pool } from '../config/database';
import { sendEmail } from './email.service';

/**
 * Notification Email Service
 * Handles system notifications, alerts, and important updates
 */

interface NotificationData {
  userId: number;
  email: string;
  userName?: string;
  companyName?: string;
  tenantId?: number;
}

/**
 * Send payment success notification
 */
export async function sendPaymentSuccessEmail(
  email: string,
  userId: number,
  paymentDetails: {
    amount: number;
    currency: string;
    planName: string;
    invoiceNumber: string;
    paymentDate: string;
  }
): Promise<void> {
  try {
    // Fetch user details
    const userResult = await pool.query(
      `SELECT first_name, last_name FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      console.error('User not found for payment success email:', userId);
      return;
    }

    const user = userResult.rows[0];
    const userName = user.first_name;

    // Send payment success email
    await sendEmail({
      to: email,
      subject: `Payment Received - ${paymentDetails.planName}`,
      template: 'payment-success',
      variables: {
        userName,
        amount: paymentDetails.amount.toFixed(2),
        currency: paymentDetails.currency.toUpperCase(),
        planName: paymentDetails.planName,
        invoiceNumber: paymentDetails.invoiceNumber,
        paymentDate: paymentDetails.paymentDate,
        dashboardUrl: `${process.env.FRONTEND_URL}/billing`,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      },
    });

    console.log('✅ Payment success email sent to:', email);
  } catch (error) {
    console.error('❌ Failed to send payment success email:', error);
    // Don't throw - email failure shouldn't block payment processing
  }
}

/**
 * Send payment failed notification
 */
export async function sendPaymentFailedEmail(
  email: string,
  userId: number,
  failureDetails: {
    amount: number;
    currency: string;
    planName: string;
    reason: string;
    attemptDate: string;
  }
): Promise<void> {
  try {
    const userResult = await pool.query(
      `SELECT first_name FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) return;

    const userName = userResult.rows[0].first_name;

    await sendEmail({
      to: email,
      subject: 'Payment Failed - Action Required',
      template: 'payment-failed',
      variables: {
        userName,
        amount: failureDetails.amount.toFixed(2),
        currency: failureDetails.currency.toUpperCase(),
        planName: failureDetails.planName,
        reason: failureDetails.reason,
        attemptDate: failureDetails.attemptDate,
        updatePaymentUrl: `${process.env.FRONTEND_URL}/billing/payment-methods`,
        supportUrl: `${process.env.FRONTEND_URL}/help`,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      },
    });

    console.log('✅ Payment failed email sent to:', email);
  } catch (error) {
    console.error('❌ Failed to send payment failed email:', error);
  }
}

/**
 * Send subscription expiring soon notification
 */
export async function sendSubscriptionExpiringEmail(
  email: string,
  userId: number,
  expiryDetails: {
    planName: string;
    expiryDate: string;
    daysRemaining: number;
  }
): Promise<void> {
  try {
    const userResult = await pool.query(
      `SELECT first_name FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) return;

    const userName = userResult.rows[0].first_name;

    await sendEmail({
      to: email,
      subject: `Your ${expiryDetails.planName} Plan Expires in ${expiryDetails.daysRemaining} Days`,
      template: 'subscription-expiring',
      variables: {
        userName,
        planName: expiryDetails.planName,
        expiryDate: expiryDetails.expiryDate,
        daysRemaining: expiryDetails.daysRemaining.toString(),
        renewUrl: `${process.env.FRONTEND_URL}/billing`,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      },
    });

    console.log('✅ Subscription expiring email sent to:', email);
  } catch (error) {
    console.error('❌ Failed to send subscription expiring email:', error);
  }
}

/**
 * Send subscription cancelled notification
 */
export async function sendSubscriptionCancelledEmail(
  email: string,
  userId: number,
  cancellationDetails: {
    planName: string;
    cancellationDate: string;
    accessUntil: string;
    reason?: string;
  }
): Promise<void> {
  try {
    const userResult = await pool.query(
      `SELECT first_name FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) return;

    const userName = userResult.rows[0].first_name;

    await sendEmail({
      to: email,
      subject: 'Subscription Cancelled',
      template: 'subscription-cancelled',
      variables: {
        userName,
        planName: cancellationDetails.planName,
        cancellationDate: cancellationDetails.cancellationDate,
        accessUntil: cancellationDetails.accessUntil,
        reason: cancellationDetails.reason || 'User requested',
        reactivateUrl: `${process.env.FRONTEND_URL}/billing`,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      },
    });

    console.log('✅ Subscription cancelled email sent to:', email);
  } catch (error) {
    console.error('❌ Failed to send subscription cancelled email:', error);
  }
}

/**
 * Send team member invitation
 */
export async function sendTeamInvitationEmail(
  email: string,
  inviterName: string,
  companyName: string,
  role: string,
  invitationToken: string
): Promise<void> {
  try {
    const inviteUrl = `${process.env.FRONTEND_URL}/accept-invitation?token=${invitationToken}`;

    await sendEmail({
      to: email,
      subject: `You've been invited to join ${companyName} on Worldclass ERP`,
      template: 'team-invitation',
      variables: {
        inviterName,
        companyName,
        role,
        inviteUrl,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      },
    });

    console.log('✅ Team invitation email sent to:', email);
  } catch (error) {
    console.error('❌ Failed to send team invitation email:', error);
  }
}

/**
 * Send security alert notification
 */
export async function sendSecurityAlertEmail(
  email: string,
  userId: number,
  alertDetails: {
    alertType: string;
    description: string;
    timestamp: string;
    ipAddress: string;
    location?: string;
  }
): Promise<void> {
  try {
    const userResult = await pool.query(
      `SELECT first_name FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) return;

    const userName = userResult.rows[0].first_name;

    await sendEmail({
      to: email,
      subject: `Security Alert: ${alertDetails.alertType}`,
      template: 'security-alert',
      variables: {
        userName,
        alertType: alertDetails.alertType,
        description: alertDetails.description,
        timestamp: alertDetails.timestamp,
        ipAddress: alertDetails.ipAddress,
        location: alertDetails.location || 'Unknown',
        securityUrl: `${process.env.FRONTEND_URL}/settings/security`,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      },
    });

    console.log('✅ Security alert email sent to:', email);
  } catch (error) {
    console.error('❌ Failed to send security alert email:', error);
  }
}

/**
 * Send system maintenance notification
 */
export async function sendMaintenanceNotificationEmail(
  email: string,
  userId: number,
  maintenanceDetails: {
    startTime: string;
    endTime: string;
    duration: string;
    affectedServices: string[];
    reason: string;
  }
): Promise<void> {
  try {
    const userResult = await pool.query(
      `SELECT first_name FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) return;

    const userName = userResult.rows[0].first_name;

    await sendEmail({
      to: email,
      subject: 'Scheduled Maintenance Notification',
      template: 'maintenance-notification',
      variables: {
        userName,
        startTime: maintenanceDetails.startTime,
        endTime: maintenanceDetails.endTime,
        duration: maintenanceDetails.duration,
        affectedServices: maintenanceDetails.affectedServices.join(', '),
        reason: maintenanceDetails.reason,
        statusUrl: `${process.env.FRONTEND_URL}/status`,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      },
    });

    console.log('✅ Maintenance notification email sent to:', email);
  } catch (error) {
    console.error('❌ Failed to send maintenance notification email:', error);
  }
}

/**
 * Send data export ready notification
 */
export async function sendDataExportReadyEmail(
  email: string,
  userId: number,
  exportDetails: {
    exportType: string;
    fileName: string;
    fileSize: string;
    downloadUrl: string;
    expiresIn: string;
  }
): Promise<void> {
  try {
    const userResult = await pool.query(
      `SELECT first_name FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) return;

    const userName = userResult.rows[0].first_name;

    await sendEmail({
      to: email,
      subject: 'Your Data Export is Ready',
      template: 'data-export-ready',
      variables: {
        userName,
        exportType: exportDetails.exportType,
        fileName: exportDetails.fileName,
        fileSize: exportDetails.fileSize,
        downloadUrl: exportDetails.downloadUrl,
        expiresIn: exportDetails.expiresIn,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      },
    });

    console.log('✅ Data export ready email sent to:', email);
  } catch (error) {
    console.error('❌ Failed to send data export ready email:', error);
  }
}

/**
 * Send low stock alert
 */
export async function sendLowStockAlertEmail(
  email: string,
  userId: number,
  stockDetails: {
    productName: string;
    currentStock: number;
    reorderPoint: number;
    sku: string;
  }
): Promise<void> {
  try {
    const userResult = await pool.query(
      `SELECT first_name FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) return;

    const userName = userResult.rows[0].first_name;

    await sendEmail({
      to: email,
      subject: `Low Stock Alert: ${stockDetails.productName}`,
      template: 'low-stock-alert',
      variables: {
        userName,
        productName: stockDetails.productName,
        currentStock: stockDetails.currentStock.toString(),
        reorderPoint: stockDetails.reorderPoint.toString(),
        sku: stockDetails.sku,
        inventoryUrl: `${process.env.FRONTEND_URL}/inventory`,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      },
    });

    console.log('✅ Low stock alert email sent to:', email);
  } catch (error) {
    console.error('❌ Failed to send low stock alert email:', error);
  }
}

export const NotificationEmailService = {
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendSubscriptionExpiringEmail,
  sendSubscriptionCancelledEmail,
  sendTeamInvitationEmail,
  sendSecurityAlertEmail,
  sendMaintenanceNotificationEmail,
  sendDataExportReadyEmail,
  sendLowStockAlertEmail,
};

export default NotificationEmailService;
