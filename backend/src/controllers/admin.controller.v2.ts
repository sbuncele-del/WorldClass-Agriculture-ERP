/**
 * Admin Controller V2 - Tenant-Hardened
 * 
 * Multi-tenant secure administration for users, roles,
 * permissions, and tenant settings.
 */

import { Response } from 'express';
import { pool } from '../config/database';
import bcrypt from 'bcrypt';
import { TenantRequest } from '../types';

// Helper to extract tenant context
function getTenantContext(req: TenantRequest): { tenantId: string; userId?: string } {
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }
  return { tenantId, userId: req.user?.id };
}

export class AdminControllerV2 {
  /**
   * Get all users
   * GET /api/v2/admin/users
   */
  static async getAllUsers(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { status, role, search, limit = 50, offset = 0 } = req.query;

      let conditions: string[] = ['u.tenant_id = $1'];
      let params: any[] = [tenantId];
      let paramIndex = 2;

      if (status) {
        conditions.push(`u.is_active = $${paramIndex}`);
        params.push(status === 'active');
        paramIndex++;
      }

      if (search) {
        conditions.push(`(u.email ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      const query = `
        SELECT 
          u.id as user_id, u.email, u.username, u.first_name, u.last_name, u.display_name,
          u.phone, u.avatar_url, u.email_verified, u.mfa_enabled,
          u.last_login_at, u.last_active_at, u.is_active, u.is_super_admin,
          u.account_suspended, u.created_at,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object('role_id', r.role_id, 'role_name', r.role_name, 'role_code', r.role_code)
            ) FILTER (WHERE r.role_id IS NOT NULL),
            '[]'
          ) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
        LEFT JOIN roles r ON ur.role_id = r.role_id
        WHERE ${conditions.join(' AND ')}
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);
      const result = await pool.query(query, params);

      // Count total
      const countQuery = `SELECT COUNT(*) FROM users u WHERE ${conditions.slice(0, -2).join(' AND ') || 'u.tenant_id = $1'}`;
      const countResult = await pool.query(countQuery, params.slice(0, -2));

      res.json({
        success: true,
        users: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Admin] Get users error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
  }

  /**
   * Get user by ID
   * GET /api/v2/admin/users/:id
   */
  static async getUserById(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { id } = req.params;

      const query = `
        SELECT 
          u.*,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object('role_id', r.role_id, 'role_name', r.role_name, 'role_code', r.role_code)
            ) FILTER (WHERE r.role_id IS NOT NULL),
            '[]'
          ) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
        LEFT JOIN roles r ON ur.role_id = r.role_id
        WHERE u.id = $1 AND u.tenant_id = $2
        GROUP BY u.id
      `;

      const result = await pool.query(query, [id, tenantId]);

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Remove sensitive fields
      const user = result.rows[0];
      delete user.password_hash;

      res.json({
        success: true,
        user
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Admin] Get user error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
  }

  /**
   * Create a new user
   * POST /api/v2/admin/users
   */
  static async createUser(req: TenantRequest, res: Response): Promise<void> {
    const client = await pool.connect();
    try {
      const { tenantId, userId } = getTenantContext(req);
      const {
        email,
        username,
        password,
        first_name,
        last_name,
        phone,
        roles
      } = req.body;

      await client.query('BEGIN');

      // Check if email exists
      const existsResult = await client.query(
        'SELECT user_id FROM users WHERE email = $1',
        [email]
      );

      if (existsResult.rows.length > 0) {
        await client.query('ROLLBACK');
        res.status(400).json({ success: false, message: 'Email already exists' });
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const userQuery = `
        INSERT INTO users (
          tenant_id, email, username, password_hash,
          first_name, last_name, phone, display_name,
          is_active, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
        RETURNING user_id, email, username, first_name, last_name, display_name, created_at
      `;

      const displayName = `${first_name} ${last_name}`.trim() || username;
      const userResult = await client.query(userQuery, [
        tenantId,
        email,
        username,
        passwordHash,
        first_name,
        last_name,
        phone,
        displayName,
        userId
      ]);

      const newUserId = userResult.rows[0].user_id;

      // Assign roles
      if (roles && roles.length > 0) {
        for (const roleId of roles) {
          await client.query(`
            INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
            VALUES ($1, $2, $3, true)
          `, [newUserId, roleId, userId]);
        }
      }

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        user: userResult.rows[0]
      });

    } catch (error: any) {
      await client.query('ROLLBACK');
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Admin] Create user error:', error);
      res.status(500).json({ success: false, message: 'Failed to create user' });
    } finally {
      client.release();
    }
  }

  /**
   * Update user
   * PUT /api/v2/admin/users/:id
   */
  static async updateUser(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = getTenantContext(req);
      const { id } = req.params;
      const {
        first_name,
        last_name,
        phone,
        is_active,
        roles
      } = req.body;

      // Verify user belongs to tenant
      const checkResult = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
        [id, tenantId]
      );

      if (checkResult.rows.length === 0) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const updateQuery = `
        UPDATE users
        SET first_name = COALESCE($1, first_name),
            last_name = COALESCE($2, last_name),
            phone = COALESCE($3, phone),
            is_active = COALESCE($4, is_active),
            display_name = COALESCE(CONCAT($1, ' ', $2), display_name),
            updated_at = NOW()
        WHERE id = $5 AND tenant_id = $6
        RETURNING id as user_id, email, username, first_name, last_name, is_active
      `;

      const result = await pool.query(updateQuery, [
        first_name, last_name, phone, is_active, id, tenantId
      ]);

      // Update roles if provided
      if (roles) {
        await pool.query('UPDATE user_roles SET is_active = false WHERE user_id = $1', [id]);
        for (const roleId of roles) {
          await pool.query(`
            INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
            VALUES ($1, $2, $3, true)
            ON CONFLICT (user_id, role_id) DO UPDATE SET is_active = true
          `, [id, roleId, userId]);
        }
      }

      res.json({
        success: true,
        user: result.rows[0]
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Admin] Update user error:', error);
      res.status(500).json({ success: false, message: 'Failed to update user' });
    }
  }

  /**
   * Delete/deactivate user
   * DELETE /api/v2/admin/users/:id
   */
  static async deleteUser(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { id } = req.params;

      // Soft delete - deactivate user
      const result = await pool.query(`
        UPDATE users
        SET is_active = false, account_suspended = true, updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2
        RETURNING id as user_id
      `, [id, tenantId]);

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.json({
        success: true,
        message: 'User deactivated'
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Admin] Delete user error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
  }

  /**
   * Get all roles
   * GET /api/v2/admin/roles
   */
  static async getRoles(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);

      const query = `
        SELECT 
          r.*,
          COUNT(DISTINCT ur.user_id) as user_count
        FROM roles r
        LEFT JOIN user_roles ur ON r.role_id = ur.role_id AND ur.is_active = true
        WHERE r.tenant_id = $1 OR r.is_system_role = true
        GROUP BY r.role_id
        ORDER BY r.role_name
      `;

      const result = await pool.query(query, [tenantId]);

      res.json({
        success: true,
        roles: result.rows
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Admin] Get roles error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch roles' });
    }
  }

  /**
   * Create a role
   * POST /api/v2/admin/roles
   */
  static async createRole(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = getTenantContext(req);
      const { role_name, role_code, description, permissions } = req.body;

      const query = `
        INSERT INTO roles (
          tenant_id, role_name, role_code, description,
          permissions, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const result = await pool.query(query, [
        tenantId,
        role_name,
        role_code,
        description,
        JSON.stringify(permissions || []),
        userId
      ]);

      res.status(201).json({
        success: true,
        role: result.rows[0]
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Admin] Create role error:', error);
      res.status(500).json({ success: false, message: 'Failed to create role' });
    }
  }

  /**
   * Get audit log
   * GET /api/v2/admin/audit-log
   */
  static async getAuditLog(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { limit = 100, offset = 0 } = req.query;

      // Simplified query - just get from audit_log table
      const result = await pool.query(`
        SELECT id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, created_at
        FROM audit_log
        WHERE tenant_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `, [tenantId, limit, offset]);

      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Admin] Get audit log error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch audit log' });
    }
  }

  /**
   * Get tenant settings
   * GET /api/v2/admin/settings
   */
  static async getSettings(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);

      const query = `
        SELECT setting_key, setting_value, setting_type, description
        FROM tenant_settings
        WHERE tenant_id = $1
        ORDER BY setting_key
      `;

      const result = await pool.query(query, [tenantId]);

      res.json({
        success: true,
        settings: result.rows
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Admin] Get settings error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
  }

  /**
   * Update tenant settings
   * PUT /api/v2/admin/settings
   */
  static async updateSettings(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = getTenantContext(req);
      const { settings } = req.body;

      if (!settings || typeof settings !== 'object') {
        res.status(400).json({ success: false, message: 'Settings object required' });
        return;
      }

      for (const [key, value] of Object.entries(settings)) {
        await pool.query(`
          INSERT INTO tenant_settings (tenant_id, setting_key, setting_value, updated_by)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (tenant_id, setting_key)
          DO UPDATE SET setting_value = $3, updated_by = $4, updated_at = NOW()
        `, [tenantId, key, String(value), userId]);
      }

      res.json({
        success: true,
        message: 'Settings updated'
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Admin] Update settings error:', error);
      res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
  }

  /**
   * Invite a new user via email
   * POST /api/v2/admin/users/invite
   */
  static async inviteUser(req: TenantRequest, res: Response): Promise<void> {
    const client = await pool.connect();
    try {
      const { tenantId, userId } = getTenantContext(req);
      const { email, first_name, last_name, role_id, message } = req.body;

      if (!email) {
        res.status(400).json({ success: false, message: 'Email is required' });
        return;
      }

      await client.query('BEGIN');

      // Check if email exists in this tenant
      const existsResult = await client.query(
        'SELECT id FROM users WHERE email = $1 AND tenant_id = $2',
        [email, tenantId]
      );

      if (existsResult.rows.length > 0) {
        await client.query('ROLLBACK');
        res.status(400).json({ success: false, message: 'User already exists in your organization' });
        return;
      }

      // Get tenant name for email
      const tenantResult = await client.query(
        'SELECT name FROM tenants WHERE id = $1',
        [tenantId]
      );
      const tenantName = tenantResult.rows[0]?.name || 'Your Organization';

      // Get inviter's name
      const inviterResult = await client.query(
        'SELECT first_name, last_name, email FROM users WHERE id = $1',
        [userId]
      );
      const inviter = inviterResult.rows[0];
      const inviterName = inviter ? `${inviter.first_name || ''} ${inviter.last_name || ''}`.trim() || inviter.email : 'Administrator';

      // Generate invitation token (valid for 7 days)
      const crypto = require('crypto');
      const invitationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Create user in pending/invited status
      const displayName = `${first_name || ''} ${last_name || ''}`.trim() || email.split('@')[0];
      const userQuery = `
        INSERT INTO users (
          tenant_id, email, first_name, last_name, display_name, password_hash,
          status, invitation_token, invitation_expires_at, created_by, is_active
        )
        VALUES ($1, $2, $3, $4, $5, 'pending_invite', 'invited', $6, $7, $8, false)
        RETURNING id, email, first_name, last_name, display_name, status, created_at
      `;

      const userResult = await client.query(userQuery, [
        tenantId,
        email,
        first_name || null,
        last_name || null,
        displayName,
        invitationToken,
        expiresAt,
        userId
      ]);

      const newUserId = userResult.rows[0].id;

      // Assign role if provided
      if (role_id) {
        await client.query(`
          INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
          VALUES ($1, $2, $3, true)
        `, [newUserId, role_id, userId]);
      }

      // Get role name for email
      let roleName = 'Team Member';
      if (role_id) {
        const roleResult = await client.query(
          'SELECT role_name FROM roles WHERE role_id = $1',
          [role_id]
        );
        roleName = roleResult.rows[0]?.role_name || 'Team Member';
      }

      await client.query('COMMIT');

      // Send invitation email
      const frontendUrl = process.env.FRONTEND_URL || 'http://primesources.site';
      const acceptUrl = `${frontendUrl}/accept-invite?token=${invitationToken}`;
      
      try {
        const { sendEmail } = require('../services/email.service');
        await sendEmail({
          to: email,
          subject: `You've been invited to join ${tenantName}`,
          template: 'team-invitation',
          variables: {
            recipientName: displayName,
            companyName: tenantName,
            inviterName: inviterName,
            roleName: roleName,
            personalMessage: message || '',
            acceptUrl: acceptUrl,
            expiryDate: expiresAt.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
          }
        });
        console.log(`✅ Invitation email sent to ${email}`);
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't fail the request if email fails - user was created
      }

      res.status(201).json({
        success: true,
        message: `Invitation sent to ${email}`,
        user: userResult.rows[0],
        inviteUrl: acceptUrl // Also return URL in case email fails
      });

    } catch (error: any) {
      await client.query('ROLLBACK');
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Admin] Invite user error:', error);
      res.status(500).json({ success: false, message: 'Failed to invite user' });
    } finally {
      client.release();
    }
  }

  /**
   * Accept invitation and set password
   * POST /api/v2/admin/users/accept-invite
   */
  static async acceptInvitation(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        res.status(400).json({ success: false, message: 'Token and password are required' });
        return;
      }

      // Find user by invitation token
      const userResult = await pool.query(`
        SELECT u.*, t.name as tenant_name, t.slug as tenant_slug
        FROM users u
        JOIN tenants t ON u.tenant_id = t.id
        WHERE u.invitation_token = $1 AND u.status = 'invited'
      `, [token]);

      if (userResult.rows.length === 0) {
        res.status(400).json({ success: false, message: 'Invalid or expired invitation' });
        return;
      }

      const user = userResult.rows[0];

      // Check if token expired
      if (new Date(user.invitation_expires_at) < new Date()) {
        res.status(400).json({ success: false, message: 'Invitation has expired. Please request a new one.' });
        return;
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

      res.json({
        success: true,
        message: 'Account activated successfully',
        tenant: {
          name: user.tenant_name,
          slug: user.tenant_slug
        }
      });

    } catch (error: any) {
      console.error('[Admin] Accept invitation error:', error);
      res.status(500).json({ success: false, message: 'Failed to accept invitation' });
    }
  }

  /**
   * Resend invitation email
   * POST /api/v2/admin/users/:id/resend-invite
   */
  static async resendInvitation(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = getTenantContext(req);
      const { id } = req.params;

      // Get user
      const userResult = await pool.query(`
        SELECT u.*, t.name as tenant_name
        FROM users u
        JOIN tenants t ON u.tenant_id = t.id
        WHERE u.id = $1 AND u.tenant_id = $2 AND u.status = 'invited'
      `, [id, tenantId]);

      if (userResult.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Invited user not found' });
        return;
      }

      const user = userResult.rows[0];

      // Generate new token
      const crypto = require('crypto');
      const invitationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Update token
      await pool.query(`
        UPDATE users SET invitation_token = $1, invitation_expires_at = $2
        WHERE id = $3
      `, [invitationToken, expiresAt, id]);

      // Get inviter name
      const inviterResult = await pool.query(
        'SELECT first_name, last_name, email FROM users WHERE id = $1',
        [userId]
      );
      const inviter = inviterResult.rows[0];
      const inviterName = inviter ? `${inviter.first_name || ''} ${inviter.last_name || ''}`.trim() || inviter.email : 'Administrator';

      // Send email
      const frontendUrl = process.env.FRONTEND_URL || 'http://primesources.site';
      const acceptUrl = `${frontendUrl}/accept-invite?token=${invitationToken}`;

      try {
        const { sendEmail } = require('../services/email.service');
        await sendEmail({
          to: user.email,
          subject: `Reminder: You've been invited to join ${user.tenant_name}`,
          template: 'team-invitation',
          variables: {
            recipientName: user.display_name || user.email,
            companyName: user.tenant_name,
            inviterName: inviterName,
            roleName: 'Team Member',
            personalMessage: '',
            acceptUrl: acceptUrl,
            expiryDate: expiresAt.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
          }
        });
      } catch (emailError) {
        console.error('Failed to resend invitation email:', emailError);
      }

      res.json({
        success: true,
        message: `Invitation resent to ${user.email}`,
        inviteUrl: acceptUrl
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Admin] Resend invitation error:', error);
      res.status(500).json({ success: false, message: 'Failed to resend invitation' });
    }
  }
}

export default AdminControllerV2;
