/**
 * Password Reset Service
 * Handles password reset token generation and validation
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { pool } from '../config/database';
import { sendEmail } from './email.service';

// Token expiration time (1 hour)
const TOKEN_EXPIRATION_MS = 60 * 60 * 1000;

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Find user by email
    const userResult = await pool.query(
      `SELECT id, email, first_name, tenant_id FROM users WHERE email = $1`,
      [email]
    );

    // Always return success to prevent email enumeration
    if (userResult.rows.length === 0) {
      console.log('Password reset requested for non-existent email:', email);
      return {
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.',
      };
    }

    const user = userResult.rows[0];

    // Check rate limiting (max 3 reset requests per hour)
    const recentTokens = await pool.query(
      `SELECT COUNT(*) as count
       FROM password_reset_tokens
       WHERE user_id = $1 
       AND created_at > NOW() - INTERVAL '1 hour'`,
      [user.id]
    );

    if (parseInt(recentTokens.rows[0].count) >= 3) {
      console.log('Rate limit exceeded for user:', user.id);
      return {
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MS);

    // Store token in database
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, tenant_id, token, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) 
       DO UPDATE SET token = $3, expires_at = $4, created_at = NOW(), used_at = NULL`,
      [user.id, user.tenant_id, token, expiresAt]
    );

    // Generate reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // Send email
    await sendEmail({
      to: email,
      subject: 'Reset Your Password - Worldclass ERP',
      template: 'reset-password',
      variables: {
        resetUrl,
        userName: user.first_name || 'there',
        email,
        expiresIn: '1 hour',
      },
    });

    console.log('✅ Password reset email sent to:', email);

    return {
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    };
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    throw new Error('Failed to process password reset request');
  }
}

/**
 * Verify password reset token
 */
export async function verifyResetToken(token: string): Promise<{
  success: boolean;
  userId?: string;
  message: string;
}> {
  try {
    // Find token in database
    const result = await pool.query(
      `SELECT user_id, expires_at, used_at
       FROM password_reset_tokens
       WHERE token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        message: 'Invalid password reset token',
      };
    }

    const tokenData = result.rows[0];

    // Check if token was already used
    if (tokenData.used_at) {
      return {
        success: false,
        message: 'This password reset token has already been used',
      };
    }

    // Check if token expired
    if (new Date() > new Date(tokenData.expires_at)) {
      return {
        success: false,
        message: 'Password reset token has expired. Please request a new one.',
      };
    }

    return {
      success: true,
      userId: tokenData.user_id,
      message: 'Token is valid',
    };
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    throw new Error('Token verification failed');
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Verify token
    const verification = await verifyResetToken(token);

    if (!verification.success) {
      return {
        success: false,
        message: verification.message,
      };
    }

    const userId = verification.userId!;

    // Validate password strength
    if (newPassword.length < 8) {
      return {
        success: false,
        message: 'Password must be at least 8 characters long',
      };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await pool.query(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, userId]
    );

    // Mark token as used
    await pool.query(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE token = $1`,
      [token]
    );

    // Get user email for notification
    const userResult = await pool.query(
      `SELECT email, first_name FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];

      // Send password changed notification email
      await sendEmail({
        to: user.email,
        subject: 'Password Changed Successfully - Worldclass ERP',
        template: 'password-changed',
        variables: {
          userName: user.first_name || 'there',
          email: user.email,
          changeTime: new Date().toLocaleString(),
        },
      }).catch(err => {
        console.error('Failed to send password changed email:', err);
        // Don't fail the password reset if email fails
      });
    }

    console.log('✅ Password reset successfully for user:', userId);

    return {
      success: true,
      message: 'Password has been reset successfully',
    };
  } catch (error) {
    console.error('❌ Password reset failed:', error);
    throw new Error('Password reset failed');
  }
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
} {
  const errors: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  // Common patterns check
  const commonPatterns = ['password', '12345', 'qwerty', 'abc123', 'admin'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    errors.push('Password contains common patterns');
    score = Math.max(0, score - 2);
  }

  // Determine strength
  let strength: 'weak' | 'fair' | 'good' | 'strong';
  if (score <= 2) strength = 'weak';
  else if (score <= 4) strength = 'fair';
  else if (score <= 6) strength = 'good';
  else strength = 'strong';

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Clean up expired tokens (should be run periodically)
 */
export async function cleanupExpiredResetTokens(): Promise<number> {
  try {
    const result = await pool.query(
      `DELETE FROM password_reset_tokens
       WHERE expires_at < NOW() OR used_at IS NOT NULL`
    );

    const deletedCount = result.rowCount || 0;
    console.log(`🧹 Cleaned up ${deletedCount} expired/used password reset tokens`);

    return deletedCount;
  } catch (error) {
    console.error('❌ Failed to cleanup expired tokens:', error);
    return 0;
  }
}

export default {
  sendPasswordResetEmail,
  verifyResetToken,
  resetPassword,
  validatePasswordStrength,
  cleanupExpiredResetTokens,
};
