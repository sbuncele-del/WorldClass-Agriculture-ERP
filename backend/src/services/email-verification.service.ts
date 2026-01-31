/**
 * Email Verification Service
 * Handles email verification token generation and validation
 */

import crypto from 'crypto';
import { pool } from '../config/database';
import { sendEmail } from './email.service';

// Token expiration time (24 hours)
const TOKEN_EXPIRATION_MS = 24 * 60 * 60 * 1000;

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Send verification email to user
 */
export async function sendVerificationEmail(
  email: string,
  userId: string,
  tenantId?: string
): Promise<void> {
  try {
    // Generate verification token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MS);

    // Store token in database
    await pool.query(
      `INSERT INTO email_verification_tokens (user_id, tenant_id, token, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) 
       DO UPDATE SET token = $3, expires_at = $4, created_at = NOW()`,
      [userId, tenantId, token, expiresAt]
    );

    // Generate verification URL
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    // Send email
    await sendEmail({
      to: email,
      subject: 'Verify Your Email - Worldclass ERP',
      template: 'verify-email',
      variables: {
        verificationUrl,
        email,
        expiresIn: '24 hours',
      },
    });

    console.log('✅ Verification email sent to:', email);
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

/**
 * Verify email token
 */
export async function verifyEmailToken(token: string): Promise<{
  success: boolean;
  userId?: string;
  tenantId?: string;
  message: string;
}> {
  try {
    // Find token in database
    const result = await pool.query(
      `SELECT user_id, tenant_id, expires_at, used_at
       FROM email_verification_tokens
       WHERE token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        message: 'Invalid verification token',
      };
    }

    const tokenData = result.rows[0];

    // Check if token was already used
    if (tokenData.used_at) {
      return {
        success: false,
        message: 'This verification token has already been used',
      };
    }

    // Check if token expired
    if (new Date() > new Date(tokenData.expires_at)) {
      return {
        success: false,
        message: 'Verification token has expired. Please request a new one.',
      };
    }

    // Mark token as used
    await pool.query(
      `UPDATE email_verification_tokens
       SET used_at = NOW()
       WHERE token = $1`,
      [token]
    );

    // Mark user email as verified
    await pool.query(
      `UPDATE users
       SET email_verified = true, email_verified_at = NOW()
       WHERE id = $1`,
      [tokenData.user_id]
    );

    console.log('✅ Email verified for user:', tokenData.user_id);

    return {
      success: true,
      userId: tokenData.user_id,
      tenantId: tokenData.tenant_id,
      message: 'Email verified successfully',
    };
  } catch (error) {
    console.error('❌ Email verification failed:', error);
    throw new Error('Email verification failed');
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Find user by email
    const userResult = await pool.query(
      `SELECT id, tenant_id, email_verified
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    const user = userResult.rows[0];

    // Check if already verified
    if (user.email_verified) {
      return {
        success: false,
        message: 'Email is already verified',
      };
    }

    // Check rate limiting (max 3 emails per hour)
    const recentTokens = await pool.query(
      `SELECT COUNT(*) as count
       FROM email_verification_tokens
       WHERE user_id = $1 
       AND created_at > NOW() - INTERVAL '1 hour'`,
      [user.id]
    );

    if (parseInt(recentTokens.rows[0].count) >= 3) {
      return {
        success: false,
        message: 'Too many verification emails sent. Please try again later.',
      };
    }

    // Send new verification email
    await sendVerificationEmail(email, user.id, user.tenant_id);

    return {
      success: true,
      message: 'Verification email sent',
    };
  } catch (error) {
    console.error('❌ Failed to resend verification email:', error);
    throw new Error('Failed to resend verification email');
  }
}

/**
 * Check if email is verified
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT email_verified FROM users WHERE id = $1`,
      [userId]
    );

    return result.rows.length > 0 && result.rows[0].email_verified;
  } catch (error) {
    console.error('❌ Failed to check email verification status:', error);
    return false;
  }
}

/**
 * Get verification status
 */
export async function getVerificationStatus(userId: string): Promise<{
  verified: boolean;
  verifiedAt?: Date;
  pendingToken?: boolean;
  tokenExpiresAt?: Date;
}> {
  try {
    // Get user verification status
    const userResult = await pool.query(
      `SELECT email_verified, email_verified_at FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // Get pending token if exists
    const tokenResult = await pool.query(
      `SELECT expires_at, used_at
       FROM email_verification_tokens
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    const hasPendingToken = 
      tokenResult.rows.length > 0 &&
      !tokenResult.rows[0].used_at &&
      new Date() < new Date(tokenResult.rows[0].expires_at);

    return {
      verified: user.email_verified,
      verifiedAt: user.email_verified_at,
      pendingToken: hasPendingToken,
      tokenExpiresAt: hasPendingToken ? tokenResult.rows[0].expires_at : undefined,
    };
  } catch (error) {
    console.error('❌ Failed to get verification status:', error);
    throw error;
  }
}

/**
 * Clean up expired tokens (should be run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const result = await pool.query(
      `DELETE FROM email_verification_tokens
       WHERE expires_at < NOW() OR used_at IS NOT NULL`
    );

    const deletedCount = result.rowCount || 0;
    console.log(`🧹 Cleaned up ${deletedCount} expired/used verification tokens`);

    return deletedCount;
  } catch (error) {
    console.error('❌ Failed to cleanup expired tokens:', error);
    return 0;
  }
}

export default {
  sendVerificationEmail,
  verifyEmailToken,
  resendVerificationEmail,
  isEmailVerified,
  getVerificationStatus,
  cleanupExpiredTokens,
};
