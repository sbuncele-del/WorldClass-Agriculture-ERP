/**
 * Email Verification Routes
 * Routes for email verification functionality
 */

import { Router } from 'express';
import {
  sendVerification,
  verifyEmail,
  resendVerification,
  getStatus,
  checkVerified,
} from '../controllers/email-verification.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * Public routes (no authentication required)
 */

// Verify email with token
router.post('/verify', verifyEmail);

// Resend verification email
router.post('/verify/resend', resendVerification);

/**
 * Protected routes (authentication required)
 */

// Send verification email (admin/system use)
router.post('/verify/send', authenticateToken, sendVerification);

// Get verification status
router.get('/verify/status/:userId', authenticateToken, getStatus);

// Check if verified
router.get('/verify/check/:userId', authenticateToken, checkVerified);

export default router;
