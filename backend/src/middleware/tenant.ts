import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool as sharedPool } from '../config/database';
import { TenantRequest, JWTPayload, UnauthorizedError, ForbiddenError } from '../types';

// Use shared pool from config/database.ts - single pool for entire application
function getPool() {
  return sharedPool;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

/**
 * Tenant Middleware
 * 
 * Extracts and validates tenant context from JWT token.
 * Attaches tenant and user information to the request object.
 * 
 * Usage:
 *   router.get('/api/customers', tenantMiddleware, getCustomers);
 */
export const tenantMiddleware = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(`[TenantMiddleware] 401 - No token provided for ${req.method} ${req.originalUrl}`);
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify and decode JWT
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        console.log(`[TenantMiddleware] 401 - Token expired for ${req.method} ${req.originalUrl}`);
        throw new UnauthorizedError('Token expired');
      }
      console.log(`[TenantMiddleware] 401 - Invalid token for ${req.method} ${req.originalUrl}: ${error.message}`);
      throw new UnauthorizedError('Invalid token');
    }

    // Validate token type
    if (decoded.type !== 'access') {
      console.log(`[TenantMiddleware] 401 - Invalid token type '${decoded.type}' for ${req.method} ${req.originalUrl}`);
      throw new UnauthorizedError('Invalid token type');
    }

    // Load tenant from database
    const tenantResult = await getPool().query(
      `SELECT 
        id, slug, name, status, subscription_plan, 
        subscription_status, features, settings
      FROM tenants 
      WHERE id = $1 AND deleted_at IS NULL`,
      [decoded.tenantId]
    );

    if (tenantResult.rows.length === 0) {
      throw new ForbiddenError('Tenant not found');
    }

    const tenant = tenantResult.rows[0];

    // Check tenant status
    if (tenant.status === 'suspended') {
      throw new ForbiddenError('Tenant account is suspended. Please contact support.');
    }

    if (tenant.status === 'cancelled') {
      throw new ForbiddenError('Tenant account has been cancelled');
    }

    // DISABLED: Trial check - we're in testing mode
    // TODO: Re-enable for production
    /*
    if (tenant.status === 'trial' && tenant.subscription_status === 'trialing') {
      const trialCheck = await getPool().query(
        'SELECT trial_ends_at FROM tenants WHERE id = $1',
        [decoded.tenantId]
      );
      
      if (trialCheck.rows[0]?.trial_ends_at) {
        const trialEnd = new Date(trialCheck.rows[0].trial_ends_at);
        if (trialEnd < new Date()) {
          throw new ForbiddenError('Trial period has expired. Please subscribe to continue.');
        }
      }
    }
    */

    // Load user from database
    const userResult = await getPool().query(
      `SELECT 
        id, email, role, permissions, status
      FROM users 
      WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [decoded.userId, decoded.tenantId]
    );

    if (userResult.rows.length === 0) {
      throw new ForbiddenError('User not found');
    }

    const user = userResult.rows[0];

    // Check user status
    if (user.status === 'suspended') {
      throw new ForbiddenError('User account is suspended');
    }

    if (user.status === 'inactive') {
      throw new ForbiddenError('User account is inactive');
    }

    // Attach tenant and user to request
    // Set both req.tenant and req.tenantId for backwards compatibility
    req.tenant = {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      status: tenant.status,
      subscription_plan: tenant.subscription_plan,
      features: tenant.features,
      settings: tenant.settings
    };
    
    // Also set tenantId directly for controllers that use req.tenantId
    (req as any).tenantId = tenant.id;

    // Map legacy role names to RBAC roles
    const roleMapping: Record<string, string> = {
      'admin': 'SYSTEM_ADMIN',
      'super_admin': 'SYSTEM_ADMIN',
      'logistics_admin': 'LOGISTICS_ADMIN',
      'dispatcher': 'DISPATCHER',
      'driver': 'DRIVER',
      'fleet_manager': 'FLEET_MANAGER',
      'accountant': 'ACCOUNTANT',
      'viewer': 'VIEWER',
      'user': 'VIEWER',
    };
    
    // Determine roles array for RBAC
    const mappedRole = roleMapping[user.role?.toLowerCase()] || 'VIEWER';

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      roles: [mappedRole],  // Add roles array for RBAC middleware
      permissions: user.permissions || []
    };
    
    // Also set userId directly for controllers that use req.userId
    (req as any).userId = user.id;

    // Log audit trail for sensitive actions
    if (req.method !== 'GET') {
      await logAuditTrail(req, 'api_access');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional Tenant Middleware
 * 
 * Same as tenantMiddleware but doesn't throw error if no token.
 * Useful for public endpoints that can work with or without authentication.
 * 
 * Usage:
 *   router.get('/api/public-data', optionalTenantMiddleware, getData);
 */
export const optionalTenantMiddleware = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without tenant context
      return next();
    }

    // If token exists, validate it
    await tenantMiddleware(req, res, next);
  } catch (error) {
    // If validation fails, continue without tenant context
    next();
  }
};

/**
 * Role-Based Access Control Middleware
 * 
 * Requires specific roles to access the endpoint.
 * Must be used AFTER tenantMiddleware.
 * 
 * Usage:
 *   router.post('/api/settings', tenantMiddleware, requireRole('admin'), updateSettings);
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: TenantRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError(
          `Access denied. Required roles: ${allowedRoles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Permission-Based Access Control Middleware
 * 
 * Requires specific permissions to access the endpoint.
 * Must be used AFTER tenantMiddleware.
 * 
 * Usage:
 *   router.delete('/api/customers/:id', tenantMiddleware, requirePermission('customers.delete'), deleteCustomer);
 */
export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: TenantRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      // Super admin has all permissions
      if (req.user.role === 'super_admin') {
        return next();
      }

      // Check if user has at least one of the required permissions
      const hasPermission = requiredPermissions.some(permission =>
        req.user!.permissions.includes(permission)
      );

      if (!hasPermission) {
        throw new ForbiddenError(
          `Access denied. Required permissions: ${requiredPermissions.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Feature gate middleware - check if tenant has access to specific feature
 * 
 * Usage:
 *   router.post('/api/ai/reconcile', tenantMiddleware, requireFeature('ai_automation'), autoReconcile);
 */
export const requireFeature = (featureName: string) => {
  return (req: TenantRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.tenant) {
        throw new UnauthorizedError('Tenant context required');
      }

      if (!req.tenant.features[featureName]) {
        throw new ForbiddenError(
          `This feature is not available in your current plan. Please upgrade to access "${String(featureName)}".`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Demo Mode Middleware
 * 
 * Blocks write operations in demo mode.
 * 
 * Usage:
 *   router.post('/api/customers', tenantMiddleware, blockDemoWrites, createCustomer);
 */
export const blockDemoWrites = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenant) {
      return next();
    }

    // Check if this is a demo tenant
    const demoCheck = await getPool().query(
      'SELECT id FROM demo_tenants WHERE tenant_id = $1',
      [req.tenant.id]
    );

    if (demoCheck.rows.length > 0 && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      throw new ForbiddenError(
        'Write operations are not allowed in demo mode. Sign up for a real account to make changes.'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Audit Trail Logger
 * 
 * Logs important actions to audit_log table
 */
async function logAuditTrail(req: TenantRequest, action: string): Promise<void> {
  try {
    await getPool().query(
      `INSERT INTO audit_log 
        (tenant_id, user_id, action, resource_type, resource_id, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.tenant?.id || null,
        req.user?.id || null,
        action,
        req.baseUrl || null,
        req.params.id || null,
        req.ip || req.socket.remoteAddress,
        req.get('user-agent') || null
      ]
    );
  } catch (error) {
    // Don't fail request if audit logging fails
    console.error('Audit log error:', error);
  }
}

/**
 * Super Admin Only Middleware
 * 
 * Only allows super admins (platform administrators).
 * 
 * Usage:
 *   router.get('/api/admin/tenants', tenantMiddleware, superAdminOnly, getAllTenants);
 */
export const superAdminOnly = (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (req.user.role !== 'super_admin') {
      throw new ForbiddenError('Super admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default {
  tenantMiddleware,
  optionalTenantMiddleware,
  requireRole,
  requirePermission,
  requireFeature,
  blockDemoWrites,
  superAdminOnly
};
