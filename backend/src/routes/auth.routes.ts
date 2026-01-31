/**
 * Authentication Routes
 * Routes for authentication and password management
 */

import { Router } from 'express';
import {
  requestPasswordReset,
  verifyToken,
  resetPasswordHandler,
  validatePassword,
} from '../controllers/password-reset.controller';

const router = Router();

/**
 * Password Reset Routes (all public)
 */

// Request password reset
router.post('/password/reset-request', requestPasswordReset);

// Verify reset token
router.post('/password/verify-token', verifyToken);

// Reset password with token
router.post('/password/reset', resetPasswordHandler);

// Validate password strength
router.post('/password/validate', validatePassword);

export default router;
