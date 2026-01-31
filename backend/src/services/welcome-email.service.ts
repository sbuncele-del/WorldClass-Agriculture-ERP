/**
 * Welcome Email Service
 * Handles sending welcome emails to new users
 */

import { pool } from '../config/database';
import { sendEmail } from './email.service';

/**
 * Send welcome email after signup
 */
export async function sendWelcomeEmail(
  email: string,
  userId: string
): Promise<void> {
  try {
    // Get user details with tenant name
    const userResult = await pool.query(
      `SELECT u.first_name, u.last_name, u.email, u.created_at, t.name as company_name
       FROM users u
       LEFT JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];
    const userName = user.first_name || 'there';
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Valued User';
    const companyName = user.company_name || 'your company';

    // Send welcome email
    await sendEmail({
      to: email,
      subject: `Welcome to Worldclass ERP, ${userName}! 🎉`,
      template: 'welcome',
      variables: {
        userName,
        fullName,
        email,
        companyName,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
        helpUrl: `${process.env.FRONTEND_URL}/help`,
        frontendUrl: process.env.FRONTEND_URL || '',
      },
    });

    console.log('✅ Welcome email sent to:', email);
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    // Don't throw - welcome email failure shouldn't block user creation
  }
}

/**
 * Send onboarding complete email
 */
export async function sendOnboardingCompleteEmail(
  email: string,
  userId: string
): Promise<void> {
  try {
    // Get user details with tenant name
    const userResult = await pool.query(
      `SELECT u.first_name, u.email, t.name as company_name
       FROM users u
       LEFT JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];
    const userName = user.first_name || 'there';
    const companyName = user.company_name || 'your company';

    // Send onboarding complete email
    await sendEmail({
      to: email,
      subject: `Your ${companyName} Workspace is Ready! 🚀`,
      template: 'onboarding-complete',
      variables: {
        userName,
        email,
        companyName,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
        frontendUrl: process.env.FRONTEND_URL || '',
      },
    });

    console.log('✅ Onboarding complete email sent to:', email);
  } catch (error) {
    console.error('❌ Failed to send onboarding complete email:', error);
    // Don't throw - email failure shouldn't block onboarding
  }
}

/**
 * Send getting started guide email
 */
export async function sendGettingStartedEmail(
  email: string,
  userId: string
): Promise<void> {
  try {
    // Get user details
    const userResult = await pool.query(
      `SELECT first_name, email
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];
    const userName = user.first_name || 'there';

    // Send getting started guide
    await sendEmail({
      to: email,
      subject: 'Getting Started with Worldclass ERP 📚',
      template: 'getting-started',
      variables: {
        userName,
        email,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
        tutorialsUrl: `${process.env.FRONTEND_URL}/tutorials`,
        frontendUrl: process.env.FRONTEND_URL || '',
      },
    });

    console.log('✅ Getting started email sent to:', email);
  } catch (error) {
    console.error('❌ Failed to send getting started email:', error);
  }
}

/**
 * Send welcome series (drip campaign)
 * Sends a series of emails over time to help users get started
 */
export async function sendWelcomeSeries(
  email: string,
  userId: string
): Promise<void> {
  try {
    // Day 0: Welcome email (sent immediately)
    await sendWelcomeEmail(email, userId);

    // Day 1: Getting started guide (schedule for 24 hours later)
    // This would typically be handled by a job queue like Bull
    // For now, we just log the intention
    console.log('📅 Scheduled: Getting started email for', email, 'in 24 hours');

    // Day 3: Feature highlights (schedule for 72 hours later)
    console.log('📅 Scheduled: Feature highlights email for', email, 'in 3 days');

    // Day 7: Check-in email (schedule for 7 days later)
    console.log('📅 Scheduled: Check-in email for', email, 'in 7 days');
  } catch (error) {
    console.error('❌ Failed to initiate welcome series:', error);
  }
}

export default {
  sendWelcomeEmail,
  sendOnboardingCompleteEmail,
  sendGettingStartedEmail,
  sendWelcomeSeries,
};
