/**
 * Password Reset Controller
 * Handles HTTP requests for password reset
 */

import { Request, Response } from 'express';
import {
  sendPasswordResetEmail,
  verifyResetToken,
  resetPassword,
  validatePasswordStrength,
} from '../services/password-reset.service';
import { AppError } from '../middleware/errorHandler';

/**
 * Request password reset
 * POST /api/auth/password/reset-request
 */
export async function requestPasswordReset(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError('Invalid email format', 400);
    }

    const result = await sendPasswordResetEmail(email);

    // Always return success to prevent email enumeration
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    
    // Still return success to prevent email enumeration
    res.status(200).json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
  }
}

/**
 * Verify reset token
 * POST /api/auth/password/verify-token
 */
export async function verifyToken(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.body;

    if (!token) {
      throw new AppError('Token is required', 400);
    }

    const result = await verifyResetToken(token);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error('Verify token error:', error);
    throw new AppError('Failed to verify token', 500);
  }
}

/**
 * Reset password
 * POST /api/auth/password/reset
 */
export async function resetPasswordHandler(req: Request, res: Response): Promise<void> {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      throw new AppError('Token, password, and confirm password are required', 400);
    }

    // Check passwords match
    if (password !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
      return;
    }

    // Validate password strength
    const validation = validatePasswordStrength(password);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: validation.errors,
        strength: validation.strength,
      });
      return;
    }

    // Reset password
    const result = await resetPassword(token, password);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error('Reset password error:', error);
    throw new AppError('Failed to reset password', 500);
  }
}

/**
 * Validate password strength
 * POST /api/auth/password/validate
 */
export async function validatePassword(req: Request, res: Response): Promise<void> {
  try {
    const { password } = req.body;

    if (!password) {
      throw new AppError('Password is required', 400);
    }

    const validation = validatePasswordStrength(password);

    res.status(200).json({
      success: true,
      ...validation,
    });
  } catch (error) {
    console.error('Validate password error:', error);
    throw new AppError('Failed to validate password', 500);
  }
}

export default {
  requestPasswordReset,
  verifyToken,
  resetPasswordHandler,
  validatePassword,
};
