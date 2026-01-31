/**
 * Email Verification Controller
 * Handles HTTP requests for email verification
 */

import { Request, Response } from 'express';
import {
  sendVerificationEmail,
  verifyEmailToken,
  resendVerificationEmail,
  getVerificationStatus,
} from '../services/email-verification.service';
import { AppError } from '../middleware/errorHandler';

/**
 * Send verification email
 * POST /api/email/verify/send
 */
export async function sendVerification(req: Request, res: Response): Promise<void> {
  try {
    const { email, userId, tenantId } = req.body;

    if (!email || !userId) {
      throw new AppError('Email and userId are required', 400);
    }

    await sendVerificationEmail(email, userId, tenantId);

    res.status(200).json({
      success: true,
      message: 'Verification email sent',
    });
  } catch (error) {
    console.error('Send verification error:', error);
    throw new AppError('Failed to send verification email', 500);
  }
}

/**
 * Verify email token
 * POST /api/email/verify
 */
export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.body;

    if (!token) {
      throw new AppError('Token is required', 400);
    }

    const result = await verifyEmailToken(token);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        userId: result.userId,
        tenantId: result.tenantId,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error('Verify email error:', error);
    throw new AppError('Failed to verify email', 500);
  }
}

/**
 * Resend verification email
 * POST /api/email/verify/resend
 */
export async function resendVerification(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const result = await resendVerificationEmail(email);

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
    console.error('Resend verification error:', error);
    throw new AppError('Failed to resend verification email', 500);
  }
}

/**
 * Get verification status
 * GET /api/email/verify/status/:userId
 */
export async function getStatus(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;

    if (!userId) {
      throw new AppError('User ID is required', 400);
    }

    const status = await getVerificationStatus(userId);

    res.status(200).json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    throw new AppError('Failed to get verification status', 500);
  }
}

/**
 * Check if email is verified (middleware-compatible)
 * GET /api/email/verify/check/:userId
 */
export async function checkVerified(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;

    if (!userId) {
      throw new AppError('User ID is required', 400);
    }

    const status = await getVerificationStatus(userId);

    res.status(200).json({
      success: true,
      verified: status.verified,
    });
  } catch (error) {
    console.error('Check verified error:', error);
    throw new AppError('Failed to check verification', 500);
  }
}

export default {
  sendVerification,
  verifyEmail,
  resendVerification,
  getStatus,
  checkVerified,
};
