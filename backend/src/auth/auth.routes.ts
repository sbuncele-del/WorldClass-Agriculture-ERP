import { Router, Request, Response } from 'express';
import AuthController from './auth.controller';
import { tenantMiddleware } from '../middleware/tenant';
import { authenticateToken } from '../middleware/auth';
import * as ProfileController from '../controllers/profile.controller';
import { getUserPermissions, RolePermissions } from '../middleware/rbac.middleware';

const router = Router();

/**
 * Public Authentication Routes
 */

// Company signup (creates tenant + admin user)
router.post('/signup', AuthController.signup);

// User login
router.post('/login', AuthController.login);

// Refresh access token
router.post('/refresh', AuthController.refresh);

// Logout (revoke refresh token)
router.post('/logout', AuthController.logout);

// Forgot password (request reset token)
router.post('/forgot-password', AuthController.forgotPassword);

// Reset password with token
router.post('/reset-password', AuthController.resetPassword);

// Verify email address
router.get('/verify-email/:token', AuthController.verifyEmail);

// Resend email verification
router.post('/resend-verification', AuthController.resendVerification);

// Accept team invitation (public - no auth required)
router.post('/accept-invite', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    const bcrypt = await import('bcrypt');
    const { pool } = await import('../config/database');

    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and password are required' });
    }

    // Find user by invitation token
    const userResult = await pool.query(`
      SELECT u.*, t.name as tenant_name, t.slug as tenant_slug
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      WHERE u.invitation_token = $1 AND u.status = 'invited'
    `, [token]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired invitation' });
    }

    const user = userResult.rows[0];

    // Check if token expired
    if (new Date(user.invitation_expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'Invitation has expired. Please request a new one.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Activate user
    await pool.query(`
      UPDATE users 
      SET password_hash = $1, 
          status = 'active', 
          is_active = true,
          invitation_token = NULL,
          invitation_expires_at = NULL,
          email_verified = true,
          updated_at = NOW()
      WHERE id = $2
    `, [passwordHash, user.id]);

    console.log(`✅ User ${user.email} accepted invitation and activated account`);

    res.json({
      success: true,
      message: 'Account activated successfully. You can now log in.',
      tenant: {
        name: user.tenant_name,
        slug: user.tenant_slug
      }
    });

  } catch (error: any) {
    console.error('[Auth] Accept invitation error:', error);
    res.status(500).json({ success: false, message: 'Failed to accept invitation' });
  }
});

/**
 * Protected Routes (require authentication)
 */

// Get current user info
router.get('/me', tenantMiddleware, AuthController.me);

// Profile management
router.get('/profile', authenticateToken, ProfileController.getProfile);
router.patch('/profile', authenticateToken, ProfileController.updateProfile);
router.post('/change-password', authenticateToken, ProfileController.changePassword);
router.post('/avatar', authenticateToken, ProfileController.uploadAvatar);
router.delete('/avatar', authenticateToken, ProfileController.deleteAvatar);

// Get user's effective permissions (for UI feature toggling)
router.get('/permissions', authenticateToken, (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const roles = user.roles || ['VIEWER'];
  const permissions = getUserPermissions(roles);
  
  res.json({
    userId: user.userId,
    email: user.email,
    roles,
    permissions,
    availableRoles: Object.keys(RolePermissions),
  });
});

export default router;
