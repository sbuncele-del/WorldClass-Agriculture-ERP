/**
 * Email Verification Middleware
 * Ensures user has verified their email before accessing protected routes
 */

import { Request, Response, NextFunction } from 'express';
import { isEmailVerified } from '../services/email-verification.service';
import { AppError } from './errorHandler';

/**
 * Middleware to require email verification
 * Add this middleware after authenticateToken on routes that require verified email
 */
export async function requireEmailVerification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get user ID from authenticated request
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Check if email is verified
    const verified = await isEmailVerified(userId);

    if (!verified) {
      res.status(403).json({
        success: false,
        error: 'Email verification required',
        message: 'Please verify your email address to access this resource',
        code: 'EMAIL_NOT_VERIFIED',
      });
      return;
    }

    // Email is verified, continue to next middleware
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional email verification middleware
 * Adds verification status to request but doesn't block access
 */
export async function checkEmailVerification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    if (userId) {
      const verified = await isEmailVerified(userId);
      (req as any).emailVerified = verified;
    }

    next();
  } catch (error) {
    // Don't block request on error, just set as unverified
    (req as any).emailVerified = false;
    next();
  }
}

export default {
  requireEmailVerification,
  checkEmailVerification,
};
