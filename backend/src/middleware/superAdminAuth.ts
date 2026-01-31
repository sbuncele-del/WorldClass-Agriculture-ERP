import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || '').split(',').filter(Boolean);

/**
 * Super Admin Authentication Middleware
 * 
 * Verifies that the authenticated user is a super admin
 * Super admins are defined by email in SUPER_ADMIN_EMAILS env variable
 * 
 * Usage:
 * app.use('/api/admin', superAdminAuth, adminRoutes);
 */

interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

export const superAdminAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided'
      });
      return;
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Check if user email is in super admin list
    if (!SUPER_ADMIN_EMAILS.includes(decoded.email)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
      return;
    }

    // Attach user info to request
    (req as any).user = decoded;
    (req as any).isSuperAdmin = true;

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    } else if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Authentication error'
      });
    }
  }
};
