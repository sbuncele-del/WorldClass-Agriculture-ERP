/**
 * Email Verification Controller V2
 * 
 * Handles email verification flows:
 * - Send verification email
 * - Verify email token
 * - Resend verification
 * - Check verification status
 * 
 * Note: Email verification is typically tenant-aware but some operations
 * can happen before tenant context is established (during signup).
 */

import { Request, Response } from 'express';
import {
  sendVerificationEmail,
  verifyEmailToken,
  resendVerificationEmail,
  getVerificationStatus,
} from '../../services/email-verification.service';

// Tenant-aware request type
interface TenantRequest extends Request {
  tenant?: { id: string };
  user?: { id: string; email: string; role: string; permissions: string[]; first_name?: string; last_name?: string };
}

/**
 * Send verification email
 * POST /api/v2/email/verify/send
 */
export async function sendVerification(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { email, userId, tenantId } = req.body;

    if (!email || !userId) {
      res.status(400).json({
        success: false,
        error: 'Email and userId are required'
      });
      return;
    }

    // Use provided tenantId or try to get from request context
    const effectiveTenantId = tenantId || req.tenant?.id;

    await sendVerificationEmail(email, userId, effectiveTenantId);

    res.json({
      success: true,
      data: { message: 'Verification email sent' }
    });
  } catch (error: any) {
    console.error('[EmailVerification V2] Send verification error:', error);
    res.status(500).json({ success: false, error: 'Failed to send verification email' });
  }
}

/**
 * Verify email token
 * POST /api/v2/email/verify
 */
export async function verifyEmail(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Token is required'
      });
      return;
    }

    const result = await verifyEmailToken(token);

    if (result.success) {
      res.json({
        success: true,
        data: {
          message: result.message,
          userId: result.userId,
          tenantId: result.tenantId
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error: any) {
    console.error('[EmailVerification V2] Verify email error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify email' });
  }
}

/**
 * Resend verification email
 * POST /api/v2/email/verify/resend
 */
export async function resendVerification(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required'
      });
      return;
    }

    const result = await resendVerificationEmail(email);

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
    console.error('[EmailVerification V2] Resend verification error:', error);
    res.status(500).json({ success: false, error: 'Failed to resend verification email' });
  }
}

/**
 * Get verification status
 * GET /api/v2/email/verify/status/:userId
 */
export async function getStatus(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
      return;
    }

    const status = await getVerificationStatus(userId);

    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    console.error('[EmailVerification V2] Get verification status error:', error);
    res.status(500).json({ success: false, error: 'Failed to get verification status' });
  }
}

/**
 * Check if email is verified
 * GET /api/v2/email/verify/check/:userId
 */
export async function checkVerified(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
      return;
    }

    const status = await getVerificationStatus(userId);

    res.json({
      success: true,
      data: { verified: status.verified }
    });
  } catch (error: any) {
    console.error('[EmailVerification V2] Check verified error:', error);
    res.status(500).json({ success: false, error: 'Failed to check verification' });
  }
}
