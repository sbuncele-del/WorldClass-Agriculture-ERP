/**
 * Password Reset Controller V2
 * 
 * Handles password reset flows:
 * - Request password reset
 * - Verify reset token
 * - Reset password with token
 * - Validate password strength
 * 
 * Note: Password reset flows are typically pre-auth and don't require tenant context.
 */

import { Request, Response } from 'express';
import {
  sendPasswordResetEmail,
  verifyResetToken,
  resetPassword,
  validatePasswordStrength,
} from '../../services/password-reset.service';

// Tenant-aware request type
interface TenantRequest extends Request {
  tenant?: { id: string };
  user?: { id: string; email: string; role: string; permissions: string[]; first_name?: string; last_name?: string };
}

/**
 * Request password reset
 * POST /api/v2/auth/password/reset-request
 */
export async function requestPasswordReset(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required'
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
      return;
    }

    try {
      await sendPasswordResetEmail(email);
    } catch (err) {
      // Log but don't expose errors to prevent email enumeration
      console.error('[PasswordReset V2] Error sending reset email:', err);
    }

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      data: {
        message: 'If an account exists with that email, a password reset link has been sent.'
      }
    });
  } catch (error: any) {
    console.error('[PasswordReset V2] Request password reset error:', error);
    // Still return success to prevent email enumeration
    res.json({
      success: true,
      data: {
        message: 'If an account exists with that email, a password reset link has been sent.'
      }
    });
  }
}

/**
 * Verify reset token
 * POST /api/v2/auth/password/verify-token
 */
export async function verifyToken(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Token is required'
      });
      return;
    }

    const result = await verifyResetToken(token);

    if (result.success) {
      res.json({
        success: true,
        data: { message: result.message }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error: any) {
    console.error('[PasswordReset V2] Verify token error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify token' });
  }
}

/**
 * Reset password
 * POST /api/v2/auth/password/reset
 */
export async function resetPasswordHandler(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      res.status(400).json({
        success: false,
        error: 'Token, password, and confirm password are required'
      });
      return;
    }

    // Check passwords match
    if (password !== confirmPassword) {
      res.status(400).json({
        success: false,
        error: 'Passwords do not match'
      });
      return;
    }

    // Validate password strength
    const validation = validatePasswordStrength(password);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: 'Password does not meet requirements',
        data: {
          errors: validation.errors,
          strength: validation.strength
        }
      });
      return;
    }

    // Reset password
    const result = await resetPassword(token, password);

    if (result.success) {
      res.json({
        success: true,
        data: { message: result.message }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error: any) {
    console.error('[PasswordReset V2] Reset password error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
}

/**
 * Validate password strength
 * POST /api/v2/auth/password/validate
 */
export async function validatePassword(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { password } = req.body;

    if (!password) {
      res.status(400).json({
        success: false,
        error: 'Password is required'
      });
      return;
    }

    const validation = validatePasswordStrength(password);

    res.json({
      success: true,
      data: {
        valid: validation.valid,
        strength: validation.strength,
        errors: validation.errors
      }
    });
  } catch (error: any) {
    console.error('[PasswordReset V2] Validate password error:', error);
    res.status(500).json({ success: false, error: 'Failed to validate password' });
  }
}
