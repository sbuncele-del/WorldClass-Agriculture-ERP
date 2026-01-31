import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Authentication Middleware
 * 
 * Verifies JWT tokens and adds user info to request
 */

export interface AuthRequest extends Request {
  user?: {
    id?: number;
    userId: number;
    tenantId: number;
    email: string;
    role: string;
    roles?: string[];  // Support for multiple roles (RBAC)
    driver_id?: string;  // For driver-specific access
    employee_id?: string;  // For employee-specific access
  };
}

/**
 * Authenticate JWT token middleware
 * 
 * Verifies the Authorization header and decodes the JWT token.
 * Adds user information to req.user if valid.
 */
export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access token required',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      tenantId: number;
      email: string;
      role: string;
      roles?: string[];
      driver_id?: string;
      employee_id?: string;
    };

    // Support both single role and multiple roles
    // Map legacy role names to new RBAC roles
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
    
    // Determine roles array
    let roles: string[];
    if (decoded.roles && Array.isArray(decoded.roles)) {
      roles = decoded.roles;
    } else if (decoded.role) {
      // Map legacy role to new role system
      const mappedRole = roleMapping[decoded.role.toLowerCase()] || 'VIEWER';
      roles = [mappedRole];
    } else {
      roles = ['VIEWER'];
    }

    req.user = {
      ...decoded,
      id: decoded.userId,
      roles,
    };
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: 'Invalid or expired token',
    });
    return;
  }
}
