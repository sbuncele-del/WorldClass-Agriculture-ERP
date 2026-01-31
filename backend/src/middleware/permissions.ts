import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';

/**
 * Permission Middleware
 * 
 * Checks if authenticated user has specific permission
 */

/**
 * Check if user has specific permission
 */
export const requirePermission = (permissionCode: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Check if user is super admin (bypass permission checks)
      const superAdminCheck = await pool.query(
        'SELECT is_super_admin FROM users WHERE user_id = $1',
        [userId]
      );

      if (superAdminCheck.rows.length > 0 && superAdminCheck.rows[0].is_super_admin) {
        next();
        return;
      }

      // Check permission through roles or direct user permissions
      const query = `
        SELECT EXISTS (
          -- Check through role permissions
          SELECT 1 FROM user_roles ur
          JOIN role_permissions rp ON ur.role_id = rp.role_id
          JOIN permissions p ON rp.permission_id = p.permission_id
          WHERE ur.user_id = $1 
            AND ur.is_active = true
            AND p.permission_code = $2
            AND p.is_active = true
          
          UNION
          
          -- Check direct user permissions (GRANT only)
          SELECT 1 FROM user_permissions up
          JOIN permissions p ON up.permission_id = p.permission_id
          WHERE up.user_id = $1
            AND up.permission_type = 'GRANT'
            AND p.permission_code = $2
            AND p.is_active = true
        ) as has_permission
      `;

      const result = await pool.query(query, [userId, permissionCode]);

      if (!result.rows[0].has_permission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          requiredPermission: permissionCode
        });
        return;
      }

      next();

    } catch (error: any) {
      console.error('[Permission Middleware] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed',
        error: error.message
      });
    }
  };
};

/**
 * Check if user has ANY of the specified permissions
 */
export const requireAnyPermission = (permissionCodes: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Check if user is super admin
      const superAdminCheck = await pool.query(
        'SELECT is_super_admin FROM users WHERE user_id = $1',
        [userId]
      );

      if (superAdminCheck.rows.length > 0 && superAdminCheck.rows[0].is_super_admin) {
        next();
        return;
      }

      // Check if user has any of the permissions
      const query = `
        SELECT EXISTS (
          -- Check through role permissions
          SELECT 1 FROM user_roles ur
          JOIN role_permissions rp ON ur.role_id = rp.role_id
          JOIN permissions p ON rp.permission_id = p.permission_id
          WHERE ur.user_id = $1 
            AND ur.is_active = true
            AND p.permission_code = ANY($2)
            AND p.is_active = true
          
          UNION
          
          -- Check direct user permissions (GRANT only)
          SELECT 1 FROM user_permissions up
          JOIN permissions p ON up.permission_id = p.permission_id
          WHERE up.user_id = $1
            AND up.permission_type = 'GRANT'
            AND p.permission_code = ANY($2)
            AND p.is_active = true
        ) as has_permission
      `;

      const result = await pool.query(query, [userId, permissionCodes]);

      if (!result.rows[0].has_permission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          requiredPermissions: permissionCodes
        });
        return;
      }

      next();

    } catch (error: any) {
      console.error('[Permission Middleware] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed',
        error: error.message
      });
    }
  };
};

/**
 * Check if user has ALL of the specified permissions
 */
export const requireAllPermissions = (permissionCodes: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Check if user is super admin
      const superAdminCheck = await pool.query(
        'SELECT is_super_admin FROM users WHERE user_id = $1',
        [userId]
      );

      if (superAdminCheck.rows.length > 0 && superAdminCheck.rows[0].is_super_admin) {
        next();
        return;
      }

      // Check each permission
      for (const permissionCode of permissionCodes) {
        const query = `
          SELECT EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN role_permissions rp ON ur.role_id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.permission_id
            WHERE ur.user_id = $1 
              AND ur.is_active = true
              AND p.permission_code = $2
              AND p.is_active = true
            
            UNION
            
            SELECT 1 FROM user_permissions up
            JOIN permissions p ON up.permission_id = p.permission_id
            WHERE up.user_id = $1
              AND up.permission_type = 'GRANT'
              AND p.permission_code = $2
              AND p.is_active = true
          ) as has_permission
        `;

        const result = await pool.query(query, [userId, permissionCode]);

        if (!result.rows[0].has_permission) {
          res.status(403).json({
            success: false,
            message: 'Insufficient permissions',
            missingPermission: permissionCode,
            requiredPermissions: permissionCodes
          });
          return;
        }
      }

      next();

    } catch (error: any) {
      console.error('[Permission Middleware] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed',
        error: error.message
      });
    }
  };
};

/**
 * Get all permissions for a user (utility function)
 */
export const getUserPermissions = async (userId: string): Promise<string[]> => {
  try {
    const query = `
      SELECT DISTINCT p.permission_code
      FROM (
        -- Permissions from roles
        SELECT p.permission_code
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.permission_id
        WHERE ur.user_id = $1 
          AND ur.is_active = true
          AND p.is_active = true
        
        UNION
        
        -- Direct user permissions (GRANT only)
        SELECT p.permission_code
        FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.permission_id
        WHERE up.user_id = $1
          AND up.permission_type = 'GRANT'
          AND p.is_active = true
      ) p
    `;

    const result = await pool.query(query, [userId]);
    return result.rows.map(row => row.permission_code);

  } catch (error) {
    console.error('[Get User Permissions] Error:', error);
    return [];
  }
};
