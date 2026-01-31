import { Request, Response } from 'express';
import { pool } from '../config/database';
import bcrypt from 'bcrypt';

/**
 * Admin Controller
 * 
 * Handles user management, roles, permissions, settings, and notifications
 * All endpoints should be protected by appropriate auth middleware
 */

class AdminController {
  
  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  /**
   * Get all users
   * GET /api/admin/users
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const { status, role, search, limit = 50, offset = 0 } = req.query;
      
      let whereConditions: string[] = ['u.tenant_id = $1'];
      let queryParams: any[] = [(req as any).tenantId || '00000000-0000-0000-0000-000000000000'];
      let paramIndex = 2;

      if (status) {
        whereConditions.push(`u.is_active = $${paramIndex}`);
        queryParams.push(status === 'active');
        paramIndex++;
      }

      if (search) {
        whereConditions.push(`(u.email ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`);
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      const query = `
        SELECT 
          u.user_id, u.email, u.username, u.first_name, u.last_name, u.display_name,
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
        LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
        LEFT JOIN roles r ON ur.role_id = r.role_id
        ${whereClause}
        GROUP BY u.user_id
        ORDER BY u.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);

      const result = await pool.query(query, queryParams);

      // Count total
      const countQuery = `SELECT COUNT(*) FROM users u ${whereClause}`;
      const countResult = await pool.query(countQuery, queryParams.slice(0, -2));

      res.status(200).json({
        success: true,
        users: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

    } catch (error: any) {
      console.error('[Admin] Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message
      });
    }
  }

  /**
   * Get user by ID
   * GET /api/admin/users/:id
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          u.*,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'role_id', r.role_id, 
                'role_name', r.role_name, 
                'role_code', r.role_code,
                'assigned_at', ur.assigned_at,
                'expires_at', ur.expires_at
              )
            ) FILTER (WHERE r.role_id IS NOT NULL),
            '[]'
          ) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
        LEFT JOIN roles r ON ur.role_id = r.role_id
        WHERE u.user_id = $1
        GROUP BY u.user_id
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Remove sensitive fields
      const user = result.rows[0];
      delete user.password_hash;
      delete user.password_reset_token;
      delete user.email_verification_token;
      delete user.mfa_secret;
      delete user.mfa_backup_codes;

      res.status(200).json({
        success: true,
        user
      });

    } catch (error: any) {
      console.error('[Admin] Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user',
        error: error.message
      });
    }
  }

  /**
   * Create user
   * POST /api/admin/users
   */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const {
        email, password, firstName, lastName, username, phone,
        roles, isActive = true, emailVerified = false
      } = req.body;

      // Validation
      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          message: 'Email, password, first name, and last name are required'
        });
        return;
      }

      // Check if email exists
      const emailCheck = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
      if (emailCheck.rows.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      const displayName = `${firstName} ${lastName}`;
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const createdBy = (req as any).user?.userId;

      // Create user
      const query = `
        INSERT INTO users (
          tenant_id, email, password_hash, username, first_name, last_name, 
          display_name, phone, is_active, email_verified, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING user_id, email, first_name, last_name, display_name, is_active, created_at
      `;

      const result = await pool.query(query, [
        tenantId, email, passwordHash, username, firstName, lastName,
        displayName, phone, isActive, emailVerified, createdBy
      ]);

      const user = result.rows[0];

      // Assign roles
      if (roles && Array.isArray(roles) && roles.length > 0) {
        const roleAssignments = roles.map((roleId: number) => 
          pool.query(
            'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1, $2, $3)',
            [user.user_id, roleId, createdBy]
          )
        );
        await Promise.all(roleAssignments);
      }

      // Audit log
      await pool.query(`
        INSERT INTO audit_logs (tenant_id, user_id, user_email, action, resource_type, resource_id, description)
        VALUES ($1, $2, $3, 'CREATE', 'users', $4, 'Created new user')
      `, [tenantId, createdBy, (req as any).user?.email, user.user_id]);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user
      });

    } catch (error: any) {
      console.error('[Admin] Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: error.message
      });
    }
  }

  /**
   * Update user
   * PUT /api/admin/users/:id
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        firstName, lastName, username, phone, isActive, roles
      } = req.body;

      // Check if user exists
      const userCheck = await pool.query('SELECT user_id FROM users WHERE user_id = $1', [id]);
      if (userCheck.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const updatedBy = (req as any).user?.userId;
      const displayName = firstName && lastName ? `${firstName} ${lastName}` : undefined;

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (firstName !== undefined) {
        updates.push(`first_name = $${paramIndex++}`);
        values.push(firstName);
      }
      if (lastName !== undefined) {
        updates.push(`last_name = $${paramIndex++}`);
        values.push(lastName);
      }
      if (displayName !== undefined) {
        updates.push(`display_name = $${paramIndex++}`);
        values.push(displayName);
      }
      if (username !== undefined) {
        updates.push(`username = $${paramIndex++}`);
        values.push(username);
      }
      if (phone !== undefined) {
        updates.push(`phone = $${paramIndex++}`);
        values.push(phone);
      }
      if (isActive !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(isActive);
      }

      updates.push(`updated_by = $${paramIndex++}`);
      values.push(updatedBy);
      updates.push(`updated_at = CURRENT_TIMESTAMP`);

      values.push(id);

      if (updates.length > 0) {
        const query = `
          UPDATE users 
          SET ${updates.join(', ')}
          WHERE user_id = $${paramIndex}
          RETURNING user_id, email, first_name, last_name, display_name, is_active, updated_at
        `;

        await pool.query(query, values);
      }

      // Update roles if provided
      if (roles && Array.isArray(roles)) {
        // Deactivate existing roles
        await pool.query('UPDATE user_roles SET is_active = false WHERE user_id = $1', [id]);
        
        // Add new roles
        if (roles.length > 0) {
          const roleAssignments = roles.map((roleId: number) =>
            pool.query(`
              INSERT INTO user_roles (user_id, role_id, assigned_by)
              VALUES ($1, $2, $3)
              ON CONFLICT (user_id, role_id) 
              DO UPDATE SET is_active = true, assigned_at = CURRENT_TIMESTAMP
            `, [id, roleId, updatedBy])
          );
          await Promise.all(roleAssignments);
        }
      }

      // Audit log
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      await pool.query(`
        INSERT INTO audit_logs (tenant_id, user_id, user_email, action, resource_type, resource_id, description, new_values)
        VALUES ($1, $2, $3, 'UPDATE', 'users', $4, 'Updated user', $5)
      `, [tenantId, updatedBy, (req as any).user?.email, id, JSON.stringify(req.body)]);

      res.status(200).json({
        success: true,
        message: 'User updated successfully'
      });

    } catch (error: any) {
      console.error('[Admin] Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: error.message
      });
    }
  }

  /**
   * Delete user
   * DELETE /api/admin/users/:id
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if user exists
      const userCheck = await pool.query('SELECT user_id, email FROM users WHERE user_id = $1', [id]);
      if (userCheck.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Soft delete - deactivate instead of deleting
      await pool.query('UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1', [id]);

      // Audit log
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const deletedBy = (req as any).user?.userId;
      await pool.query(`
        INSERT INTO audit_logs (tenant_id, user_id, user_email, action, resource_type, resource_id, description)
        VALUES ($1, $2, $3, 'DELETE', 'users', $4, 'Deleted user')
      `, [tenantId, deletedBy, (req as any).user?.email, id]);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error: any) {
      console.error('[Admin] Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message
      });
    }
  }

  /**
   * Reset user password
   * POST /api/admin/users/:id/reset-password
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 8) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters'
        });
        return;
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await pool.query(`
        UPDATE users 
        SET password_hash = $1, last_password_change = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
      `, [passwordHash, id]);

      // Audit log
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const updatedBy = (req as any).user?.userId;
      await pool.query(`
        INSERT INTO audit_logs (tenant_id, user_id, user_email, action, resource_type, resource_id, description)
        VALUES ($1, $2, $3, 'RESET_PASSWORD', 'users', $4, 'Reset user password')
      `, [tenantId, updatedBy, (req as any).user?.email, id]);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error: any) {
      console.error('[Admin] Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset password',
        error: error.message
      });
    }
  }

  // ============================================================================
  // ROLE MANAGEMENT
  // ============================================================================

  /**
   * Get all roles
   * GET /api/admin/roles
   */
  async getAllRoles(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';

      const query = `
        SELECT 
          r.*,
          COUNT(DISTINCT ur.user_id) as user_count,
          COUNT(DISTINCT rp.permission_id) as permission_count
        FROM roles r
        LEFT JOIN user_roles ur ON r.role_id = ur.role_id AND ur.is_active = true
        LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
        WHERE r.tenant_id = $1 AND r.is_active = true
        GROUP BY r.role_id
        ORDER BY r.role_level DESC, r.role_name
      `;

      const result = await pool.query(query, [tenantId]);

      res.status(200).json({
        success: true,
        roles: result.rows
      });

    } catch (error: any) {
      console.error('[Admin] Get roles error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch roles',
        error: error.message
      });
    }
  }

  /**
   * Get role by ID with permissions
   * GET /api/admin/roles/:id
   */
  async getRoleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          r.*,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'permission_id', p.permission_id,
                'permission_code', p.permission_code,
                'permission_name', p.permission_name,
                'module', p.module,
                'resource', p.resource,
                'action', p.action
              )
            ) FILTER (WHERE p.permission_id IS NOT NULL),
            '[]'
          ) as permissions
        FROM roles r
        LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.permission_id
        WHERE r.role_id = $1
        GROUP BY r.role_id
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Role not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        role: result.rows[0]
      });

    } catch (error: any) {
      console.error('[Admin] Get role error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch role',
        error: error.message
      });
    }
  }

  /**
   * Create role
   * POST /api/admin/roles
   */
  async createRole(req: Request, res: Response): Promise<void> {
    try {
      const { roleName, roleCode, description, roleLevel = 1, permissions = [] } = req.body;

      if (!roleName || !roleCode) {
        res.status(400).json({
          success: false,
          message: 'Role name and code are required'
        });
        return;
      }

      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const createdBy = (req as any).user?.userId;

      // Create role
      const query = `
        INSERT INTO roles (tenant_id, role_name, role_code, description, role_level, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const result = await pool.query(query, [tenantId, roleName, roleCode, description, roleLevel, createdBy]);
      const role = result.rows[0];

      // Assign permissions
      if (permissions.length > 0) {
        const permissionAssignments = permissions.map((permissionId: number) =>
          pool.query(
            'INSERT INTO role_permissions (role_id, permission_id, granted_by) VALUES ($1, $2, $3)',
            [role.role_id, permissionId, createdBy]
          )
        );
        await Promise.all(permissionAssignments);
      }

      // Audit log
      await pool.query(`
        INSERT INTO audit_logs (tenant_id, user_id, user_email, action, resource_type, resource_id, description)
        VALUES ($1, $2, $3, 'CREATE', 'roles', $4, 'Created new role')
      `, [tenantId, createdBy, (req as any).user?.email, role.role_id]);

      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        role
      });

    } catch (error: any) {
      console.error('[Admin] Create role error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create role',
        error: error.message
      });
    }
  }

  /**
   * Update role permissions
   * POST /api/admin/roles/:id/permissions
   */
  async updateRolePermissions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        res.status(400).json({
          success: false,
          message: 'Permissions must be an array'
        });
        return;
      }

      const grantedBy = (req as any).user?.userId;

      // Remove existing permissions
      await pool.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);

      // Add new permissions
      if (permissions.length > 0) {
        const permissionAssignments = permissions.map((permissionId: number) =>
          pool.query(
            'INSERT INTO role_permissions (role_id, permission_id, granted_by) VALUES ($1, $2, $3)',
            [id, permissionId, grantedBy]
          )
        );
        await Promise.all(permissionAssignments);
      }

      // Audit log
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      await pool.query(`
        INSERT INTO audit_logs (tenant_id, user_id, user_email, action, resource_type, resource_id, description, new_values)
        VALUES ($1, $2, $3, 'UPDATE', 'roles', $4, 'Updated role permissions', $5)
      `, [tenantId, grantedBy, (req as any).user?.email, id, JSON.stringify(permissions)]);

      res.status(200).json({
        success: true,
        message: 'Role permissions updated successfully'
      });

    } catch (error: any) {
      console.error('[Admin] Update role permissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update role permissions',
        error: error.message
      });
    }
  }

  // ============================================================================
  // PERMISSIONS
  // ============================================================================

  /**
   * Get all permissions
   * GET /api/admin/permissions
   */
  async getAllPermissions(req: Request, res: Response): Promise<void> {
    try {
      const { module } = req.query;

      let query = 'SELECT * FROM permissions WHERE is_active = true';
      const params: any[] = [];

      if (module) {
        query += ' AND module = $1';
        params.push(module);
      }

      query += ' ORDER BY module, resource, action';

      const result = await pool.query(query, params);

      // Group by module
      const grouped = result.rows.reduce((acc: any, permission: any) => {
        if (!acc[permission.module]) {
          acc[permission.module] = [];
        }
        acc[permission.module].push(permission);
        return acc;
      }, {});

      res.status(200).json({
        success: true,
        permissions: result.rows,
        grouped
      });

    } catch (error: any) {
      console.error('[Admin] Get permissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch permissions',
        error: error.message
      });
    }
  }

  // ============================================================================
  // SYSTEM SETTINGS
  // ============================================================================

  /**
   * Get all settings
   * GET /api/admin/settings
   */
  async getAllSettings(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const { category } = req.query;

      let query = 'SELECT * FROM system_settings WHERE tenant_id = $1';
      const params: any[] = [tenantId];

      if (category) {
        query += ' AND category = $2';
        params.push(category);
      }

      query += ' ORDER BY category, setting_key';

      const result = await pool.query(query, params);

      // Group by category
      const grouped = result.rows.reduce((acc: any, setting: any) => {
        if (!acc[setting.category]) {
          acc[setting.category] = [];
        }
        acc[setting.category].push(setting);
        return acc;
      }, {});

      res.status(200).json({
        success: true,
        settings: result.rows,
        grouped
      });

    } catch (error: any) {
      console.error('[Admin] Get settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch settings',
        error: error.message
      });
    }
  }

  /**
   * Update setting
   * PUT /api/admin/settings/:key
   */
  async updateSetting(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const { value } = req.body;

      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const updatedBy = (req as any).user?.userId;

      await pool.query(`
        UPDATE system_settings 
        SET setting_value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = $3 AND setting_key = $4
      `, [value, updatedBy, tenantId, key]);

      // Audit log
      await pool.query(`
        INSERT INTO audit_logs (tenant_id, user_id, user_email, action, resource_type, resource_id, description, new_values)
        VALUES ($1, $2, $3, 'UPDATE', 'settings', $4, 'Updated system setting', $5)
      `, [tenantId, updatedBy, (req as any).user?.email, key, JSON.stringify({ key, value })]);

      res.status(200).json({
        success: true,
        message: 'Setting updated successfully'
      });

    } catch (error: any) {
      console.error('[Admin] Update setting error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update setting',
        error: error.message
      });
    }
  }

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================

  /**
   * Get user notifications
   * GET /api/admin/notifications
   */
  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { unreadOnly = false, limit = 50, offset = 0 } = req.query;

      let query = `
        SELECT * FROM user_notifications 
        WHERE user_id = $1
      `;
      const params: any[] = [userId];

      if (unreadOnly === 'true') {
        query += ' AND is_read = false';
      }

      query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Count unread
      const unreadCount = await pool.query(
        'SELECT COUNT(*) FROM user_notifications WHERE user_id = $1 AND is_read = false',
        [userId]
      );

      res.status(200).json({
        success: true,
        notifications: result.rows,
        unreadCount: parseInt(unreadCount.rows[0].count)
      });

    } catch (error: any) {
      console.error('[Admin] Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message
      });
    }
  }

  /**
   * Mark notification as read
   * PUT /api/admin/notifications/:id/read
   */
  async markNotificationRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;

      await pool.query(`
        UPDATE user_notifications 
        SET is_read = true, read_at = CURRENT_TIMESTAMP
        WHERE notification_id = $1 AND user_id = $2
      `, [id, userId]);

      res.status(200).json({
        success: true,
        message: 'Notification marked as read'
      });

    } catch (error: any) {
      console.error('[Admin] Mark notification read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  }

  // ============================================================================
  // AUDIT LOGS
  // ============================================================================

  /**
   * Get audit logs
   * GET /api/admin/audit-logs
   */
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const { userId, action, resourceType, startDate, endDate, limit = 100, offset = 0 } = req.query;

      let whereConditions: string[] = ['tenant_id = $1'];
      let queryParams: any[] = [tenantId];
      let paramIndex = 2;

      if (userId) {
        whereConditions.push(`user_id = $${paramIndex}`);
        queryParams.push(userId);
        paramIndex++;
      }

      if (action) {
        whereConditions.push(`action = $${paramIndex}`);
        queryParams.push(action);
        paramIndex++;
      }

      if (resourceType) {
        whereConditions.push(`resource_type = $${paramIndex}`);
        queryParams.push(resourceType);
        paramIndex++;
      }

      if (startDate) {
        whereConditions.push(`timestamp >= $${paramIndex}`);
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereConditions.push(`timestamp <= $${paramIndex}`);
        queryParams.push(endDate);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT * FROM audit_logs
        WHERE ${whereClause}
        ORDER BY timestamp DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);

      const result = await pool.query(query, queryParams);

      // Count total
      const countQuery = `SELECT COUNT(*) FROM audit_logs WHERE ${whereClause}`;
      const countResult = await pool.query(countQuery, queryParams.slice(0, -2));

      res.status(200).json({
        success: true,
        logs: result.rows,
        total: parseInt(countResult.rows[0].count)
      });

    } catch (error: any) {
      console.error('[Admin] Get audit logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs',
        error: error.message
      });
    }
  }
}

export default new AdminController();
