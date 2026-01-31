import { Request, Response } from 'express';
import { pool } from '../config/database';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../middleware/auth';

/**
 * Profile Controller
 * 
 * Handles user profile management operations
 */

/**
 * Get user profile
 * 
 * GET /api/auth/profile
 */
export async function getProfile(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const result = await pool.query(
      `SELECT 
        id, email, name, phone, avatar, role, 
        email_verified, two_factor_enabled, 
        timezone, language, created_at
      FROM users 
      WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        emailVerified: user.email_verified,
        twoFactorEnabled: user.two_factor_enabled,
        timezone: user.timezone || 'Africa/Johannesburg',
        language: user.language || 'en',
        createdAt: user.created_at,
      },
    });
    return;
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
    });
    return;
  }
}

/**
 * Update user profile
 * 
 * PATCH /api/auth/profile
 */
export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { name, phone, timezone, language, avatar } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Name is required',
      });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name.trim());
      paramCount++;
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramCount}`);
      values.push(phone || null);
      paramCount++;
    }

    if (timezone !== undefined) {
      updates.push(`timezone = $${paramCount}`);
      values.push(timezone);
      paramCount++;
    }

    if (language !== undefined) {
      updates.push(`language = $${paramCount}`);
      values.push(language);
      paramCount++;
    }

    if (avatar !== undefined) {
      updates.push(`avatar = $${paramCount}`);
      values.push(avatar || null);
      paramCount++;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, name, phone, avatar, role, timezone, language
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        timezone: user.timezone,
        language: user.language,
      },
    });
    return;
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
    return;
  }
}

/**
 * Change password
 * 
 * POST /api/auth/change-password
 */
export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters',
      });
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      return res.status(400).json({
        success: false,
        error: 'Password must contain uppercase, lowercase, number, and special character',
      });
    }

    // Get current password hash
    const userResult = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const currentPasswordHash = userResult.rows[0].password;

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, currentPasswordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    // Log to audit trail
    await pool.query(
      `INSERT INTO audit_log (user_id, tenant_id, action, entity_type, entity_id, details)
       SELECT $1, tenant_id, 'password_change', 'user', $1, '{"source": "profile_settings"}'
       FROM users WHERE id = $1`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
    return;
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
    });
    return;
  }
}

/**
 * Upload avatar
 * 
 * POST /api/auth/avatar
 */
export async function uploadAvatar(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // TODO: Implement file upload to S3 or file storage service
    // For now, we'll accept base64 encoded images

    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({
        success: false,
        error: 'Avatar data is required',
      });
    }

    // Validate base64 image (basic check)
    if (!avatar.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image format',
      });
    }

    // Update avatar in database
    const result = await pool.query(
      'UPDATE users SET avatar = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING avatar',
      [avatar, userId]
    );

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar: result.rows[0].avatar,
    });
    return;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload avatar',
    });
    return;
  }
}

/**
 * Delete avatar
 * 
 * DELETE /api/auth/avatar
 */
export async function deleteAvatar(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    await pool.query(
      'UPDATE users SET avatar = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: 'Avatar deleted successfully',
    });
    return;
  } catch (error) {
    console.error('Error deleting avatar:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete avatar',
    });
    return;
  }
}
