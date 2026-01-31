/**
 * Role-Based Access Control (RBAC) Middleware
 * Enterprise-grade permission system for WorldClass ERP
 * 
 * Implements SOX-compliant segregation of duties
 */

import { Request, Response, NextFunction } from 'express';

// Define all permissions in the system
export enum Permission {
  // Logistics - Vehicles
  VEHICLES_VIEW = 'logistics:vehicles:view',
  VEHICLES_CREATE = 'logistics:vehicles:create',
  VEHICLES_UPDATE = 'logistics:vehicles:update',
  VEHICLES_DELETE = 'logistics:vehicles:delete',
  
  // Logistics - Drivers
  DRIVERS_VIEW = 'logistics:drivers:view',
  DRIVERS_CREATE = 'logistics:drivers:create',
  DRIVERS_UPDATE = 'logistics:drivers:update',
  DRIVERS_DELETE = 'logistics:drivers:delete',
  
  // Logistics - Trips
  TRIPS_VIEW = 'logistics:trips:view',
  TRIPS_CREATE = 'logistics:trips:create',
  TRIPS_UPDATE = 'logistics:trips:update',
  TRIPS_DELETE = 'logistics:trips:delete',
  TRIPS_START = 'logistics:trips:start',
  TRIPS_COMPLETE = 'logistics:trips:complete',
  
  // Logistics - Loads
  LOADS_VIEW = 'logistics:loads:view',
  LOADS_CREATE = 'logistics:loads:create',
  LOADS_UPDATE = 'logistics:loads:update',
  LOADS_DELETE = 'logistics:loads:delete',
  
  // Logistics - Fuel
  FUEL_VIEW = 'logistics:fuel:view',
  FUEL_CREATE = 'logistics:fuel:create',
  FUEL_RECONCILE = 'logistics:fuel:reconcile',
  
  // Logistics - Maintenance
  MAINTENANCE_VIEW = 'logistics:maintenance:view',
  MAINTENANCE_CREATE = 'logistics:maintenance:create',
  MAINTENANCE_UPDATE = 'logistics:maintenance:update',
  
  // Logistics - Reports
  REPORTS_VIEW = 'logistics:reports:view',
  REPORTS_EXPORT = 'logistics:reports:export',
  
  // Logistics - GPS
  GPS_VIEW = 'logistics:gps:view',
  GPS_CONFIGURE = 'logistics:gps:configure',
  
  // Logistics - Routes
  ROUTES_VIEW = 'logistics:routes:view',
  ROUTES_CREATE = 'logistics:routes:create',
  ROUTES_UPDATE = 'logistics:routes:update',
  ROUTES_DELETE = 'logistics:routes:delete',
  
  // Logistics - Incidents
  INCIDENTS_VIEW = 'logistics:incidents:view',
  INCIDENTS_CREATE = 'logistics:incidents:create',
  INCIDENTS_UPDATE = 'logistics:incidents:update',
  INCIDENTS_DELETE = 'logistics:incidents:delete',
  
  // Logistics - Geofences
  GEOFENCES_VIEW = 'logistics:geofences:view',
  GEOFENCES_CREATE = 'logistics:geofences:create',
  GEOFENCES_UPDATE = 'logistics:geofences:update',
  GEOFENCES_DELETE = 'logistics:geofences:delete',

  // Logistics Enterprise Extensions
  ENTERPRISE_ATMS_MANAGE = 'logistics:enterprise:atms:manage',
  ENTERPRISE_YARD_VIEW = 'logistics:enterprise:yard:view',
  ENTERPRISE_YARD_MOVE = 'logistics:enterprise:yard:move',
  ENTERPRISE_DOCK_SCHEDULE = 'logistics:enterprise:dock:schedule',
  ENTERPRISE_FREIGHT_AUDIT = 'logistics:enterprise:freight:audit',
  ENTERPRISE_CARRIER_CONTRACTS = 'logistics:enterprise:carrier:contracts',
  ENTERPRISE_FINANCE = 'logistics:enterprise:finance',
  ENTERPRISE_ANALYTICS = 'logistics:enterprise:analytics',
  ENTERPRISE_AI = 'logistics:enterprise:ai',
  ENTERPRISE_IOT = 'logistics:enterprise:iot',
  ENTERPRISE_PREDICTIVE = 'logistics:enterprise:predictive',
  
  // Admin
  ADMIN_FULL_ACCESS = 'admin:full_access',
}

// Define roles and their permissions
export const RolePermissions: Record<string, Permission[]> = {
  // System Administrator - Full access (SOX: should be limited to IT)
  SYSTEM_ADMIN: [Permission.ADMIN_FULL_ACCESS],
  
  // Logistics Administrator - Full logistics access
  LOGISTICS_ADMIN: [
    Permission.VEHICLES_VIEW, Permission.VEHICLES_CREATE, Permission.VEHICLES_UPDATE, Permission.VEHICLES_DELETE,
    Permission.DRIVERS_VIEW, Permission.DRIVERS_CREATE, Permission.DRIVERS_UPDATE, Permission.DRIVERS_DELETE,
    Permission.TRIPS_VIEW, Permission.TRIPS_CREATE, Permission.TRIPS_UPDATE, Permission.TRIPS_DELETE,
    Permission.LOADS_VIEW, Permission.LOADS_CREATE, Permission.LOADS_UPDATE, Permission.LOADS_DELETE,
    Permission.FUEL_VIEW, Permission.FUEL_CREATE, Permission.FUEL_RECONCILE,
    Permission.MAINTENANCE_VIEW, Permission.MAINTENANCE_CREATE, Permission.MAINTENANCE_UPDATE,
    Permission.REPORTS_VIEW, Permission.REPORTS_EXPORT,
    Permission.GPS_VIEW, Permission.GPS_CONFIGURE,
    Permission.ROUTES_VIEW, Permission.ROUTES_CREATE, Permission.ROUTES_UPDATE, Permission.ROUTES_DELETE,
    Permission.INCIDENTS_VIEW, Permission.INCIDENTS_CREATE, Permission.INCIDENTS_UPDATE, Permission.INCIDENTS_DELETE,
    Permission.GEOFENCES_VIEW, Permission.GEOFENCES_CREATE, Permission.GEOFENCES_UPDATE, Permission.GEOFENCES_DELETE,
    // Enterprise extensions
    Permission.ENTERPRISE_ATMS_MANAGE,
    Permission.ENTERPRISE_YARD_VIEW,
    Permission.ENTERPRISE_YARD_MOVE,
    Permission.ENTERPRISE_DOCK_SCHEDULE,
    Permission.ENTERPRISE_FREIGHT_AUDIT,
    Permission.ENTERPRISE_CARRIER_CONTRACTS,
    Permission.ENTERPRISE_FINANCE,
    Permission.ENTERPRISE_ANALYTICS,
    Permission.ENTERPRISE_AI,
    Permission.ENTERPRISE_IOT,
    Permission.ENTERPRISE_PREDICTIVE,
  ],
  
  // Dispatcher - Trip and load management
  DISPATCHER: [
    Permission.VEHICLES_VIEW,
    Permission.DRIVERS_VIEW,
    Permission.TRIPS_VIEW, Permission.TRIPS_CREATE, Permission.TRIPS_UPDATE,
    Permission.LOADS_VIEW, Permission.LOADS_CREATE, Permission.LOADS_UPDATE,
    Permission.GPS_VIEW,
    Permission.ROUTES_VIEW,
    Permission.REPORTS_VIEW,
    Permission.ENTERPRISE_ATMS_MANAGE,
    Permission.ENTERPRISE_DOCK_SCHEDULE,
    Permission.ENTERPRISE_ANALYTICS,
  ],
  
  // Driver - Limited to own trips
  DRIVER: [
    Permission.TRIPS_VIEW,
    Permission.TRIPS_START,
    Permission.TRIPS_COMPLETE,
    Permission.FUEL_CREATE, // Can log fuel
    Permission.INCIDENTS_CREATE, // Can report incidents
  ],
  
  // Fleet Manager - Vehicle and maintenance focus
  FLEET_MANAGER: [
    Permission.VEHICLES_VIEW, Permission.VEHICLES_CREATE, Permission.VEHICLES_UPDATE,
    Permission.DRIVERS_VIEW, Permission.DRIVERS_CREATE, Permission.DRIVERS_UPDATE,
    Permission.MAINTENANCE_VIEW, Permission.MAINTENANCE_CREATE, Permission.MAINTENANCE_UPDATE,
    Permission.GPS_VIEW, Permission.GPS_CONFIGURE,
    Permission.REPORTS_VIEW, Permission.REPORTS_EXPORT,
    Permission.INCIDENTS_VIEW, Permission.INCIDENTS_UPDATE,
    Permission.ENTERPRISE_YARD_VIEW,
    Permission.ENTERPRISE_YARD_MOVE,
    Permission.ENTERPRISE_PREDICTIVE,
  ],
  
  // Accountant - Financial focus (SOX: segregation from operations)
  ACCOUNTANT: [
    Permission.FUEL_VIEW, Permission.FUEL_RECONCILE,
    Permission.REPORTS_VIEW, Permission.REPORTS_EXPORT,
    Permission.TRIPS_VIEW, // View only for billing
    Permission.MAINTENANCE_VIEW, // View only for cost tracking
    Permission.ENTERPRISE_FINANCE,
  ],
  
  // Viewer - Read-only access
  VIEWER: [
    Permission.VEHICLES_VIEW,
    Permission.DRIVERS_VIEW,
    Permission.TRIPS_VIEW,
    Permission.LOADS_VIEW,
    Permission.FUEL_VIEW,
    Permission.MAINTENANCE_VIEW,
    Permission.REPORTS_VIEW,
    Permission.GPS_VIEW,
    Permission.ROUTES_VIEW,
    Permission.INCIDENTS_VIEW,
    Permission.GEOFENCES_VIEW,
    Permission.ENTERPRISE_ANALYTICS,
  ],
};

/**
 * Check if user has required permission
 */
export function hasPermission(userRoles: string[], requiredPermission: Permission): boolean {
  // Get all permissions for user's roles
  const userPermissions = new Set<Permission>();
  
  for (const role of userRoles) {
    const rolePerms = RolePermissions[role] || [];
    rolePerms.forEach(p => userPermissions.add(p));
  }
  
  // Admin has full access
  if (userPermissions.has(Permission.ADMIN_FULL_ACCESS)) {
    return true;
  }
  
  return userPermissions.has(requiredPermission);
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(userRoles: string[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.some(perm => hasPermission(userRoles, perm));
}

/**
 * Check if user has all of the required permissions
 */
export function hasAllPermissions(userRoles: string[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.every(perm => hasPermission(userRoles, perm));
}

/**
 * Middleware factory to require specific permission(s)
 */
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }
    
    const userRoles: string[] = user.roles || ['VIEWER'];
    
    // Check if user has any of the required permissions
    const hasAccess = permissions.some(perm => hasPermission(userRoles, perm));
    
    if (!hasAccess) {
      // Log unauthorized access attempt for SOX compliance
      console.warn(`[RBAC] Access denied for user ${user.id} (roles: ${userRoles.join(', ')}) attempting ${permissions.join(', ')}`);
      
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to perform this action',
        requiredPermissions: permissions
      });
    }
    
    next();
  };
}

/**
 * Middleware to require ALL specified permissions
 */
export function requireAllPermissions(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }
    
    const userRoles: string[] = user.roles || ['VIEWER'];
    
    if (!hasAllPermissions(userRoles, permissions)) {
      console.warn(`[RBAC] Access denied for user ${user.id} - missing permissions`);
      
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have all required permissions',
        requiredPermissions: permissions
      });
    }
    
    next();
  };
}

/**
 * Middleware to check resource ownership (e.g., driver can only see own trips)
 */
export function requireOwnershipOrPermission(
  ownerField: string,
  fallbackPermission: Permission
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }
    
    const userRoles: string[] = user.roles || ['VIEWER'];
    
    // If user has the fallback permission, allow access
    if (hasPermission(userRoles, fallbackPermission)) {
      return next();
    }
    
    // Check ownership - the resource ID should match user's associated entity
    const resourceOwnerId = req.params[ownerField] || req.body[ownerField];
    const userEntityId = user.driver_id || user.employee_id || user.id;
    
    if (resourceOwnerId && resourceOwnerId === userEntityId) {
      return next();
    }
    
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You can only access your own resources'
    });
  };
}

/**
 * Get user's effective permissions (for UI to show/hide features)
 */
export function getUserPermissions(userRoles: string[]): Permission[] {
  const permissions = new Set<Permission>();
  
  for (const role of userRoles) {
    const rolePerms = RolePermissions[role] || [];
    rolePerms.forEach(p => permissions.add(p));
  }
  
  return Array.from(permissions);
}

export default {
  Permission,
  RolePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  requirePermission,
  requireAllPermissions,
  requireOwnershipOrPermission,
  getUserPermissions,
};
