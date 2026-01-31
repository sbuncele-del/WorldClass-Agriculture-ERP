import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id?: number | string;
        userId?: number;
        user_id?: number;
        tenantId?: number;
        tenant_id?: string;
        email: string;
        role: string;
        roles?: string[];  // RBAC roles array
        permissions?: string[];
        first_name?: string;
        last_name?: string;
        driver_id?: string;  // For driver-specific access
        employee_id?: string;  // For employee-specific access
      };
    }
  }
}

export {};
