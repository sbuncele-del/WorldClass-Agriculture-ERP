import express from 'express';
import {
  getAllTenants,
  getTenantDetails,
  impersonateTenant,
  updateTenantStatus,
  getSystemHealth,
  getSystemMetricsTrends,
  getSupportTickets,
  getSupportTicket,
  createSupportTicket,
  updateSupportTicket,
  addTicketComment,
  getTicketStatistics,
  getTenantFeatureFlags,
  updateFeatureFlag,
  bulkUpdateFeatureFlags,
  getActiveAlerts,
  resolveAlert,
  getAdminAccessLogs
} from '../controllers/superadmin.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * Super Admin Routes
 * Base path: /api/super-admin
 * 
 * Security: All routes require platform_admin or support_agent role
 * These routes provide centralized management across ALL tenants
 */

// =====================================================
// MIDDLEWARE: Super Admin Role Check
// =====================================================
const requireSuperAdmin = (req: any, res: any, next: any) => {
  // Allow platform_admin, support_agent, monitoring_user, super_admin, and admin roles
  // Admin role is allowed for company owners who manage the platform
  const allowedRoles = ['platform_admin', 'support_agent', 'monitoring_user', 'super_admin', 'admin'];
  
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Access denied. Super admin privileges required.' 
    });
  }
  next();
};

// Apply authentication and super admin check to all routes
router.use(authenticateToken);
router.use(requireSuperAdmin);

// =====================================================
// 1. TENANT MANAGEMENT ROUTES
// =====================================================

/**
 * GET /api/super-admin/tenants
 * Get all tenants with health metrics
 * Query params: status, plan, search, health_status, page, limit
 */
router.get('/tenants', getAllTenants);

/**
 * GET /api/super-admin/tenants/:tenantId
 * Get detailed information for a single tenant
 * Returns: tenant info, metrics, users, activity, system health
 */
router.get('/tenants/:tenantId', getTenantDetails);

/**
 * POST /api/super-admin/tenants/:tenantId/impersonate
 * Generate impersonation token to view tenant's system
 * Body: { reason?: string }
 * Returns: Temporary JWT token (2 hour expiry)
 */
router.post('/tenants/:tenantId/impersonate', impersonateTenant);

/**
 * PUT /api/super-admin/tenants/:tenantId/status
 * Update tenant subscription or status
 * Body: { status?: string, subscription_plan?: string, reason?: string }
 */
router.put('/tenants/:tenantId/status', updateTenantStatus);

// =====================================================
// 2. SYSTEM HEALTH MONITORING ROUTES
// =====================================================

/**
 * GET /api/super-admin/system/health
 * Get system-wide health overview
 * Returns: Total tenants, active users, API calls, errors, critical issues
 */
router.get('/system/health', getSystemHealth);

/**
 * GET /api/super-admin/system/metrics/trends
 * Get system-wide metrics trends over time
 * Query params: days (default: 30)
 * Returns: Daily aggregated metrics across all tenants
 */
router.get('/system/metrics/trends', getSystemMetricsTrends);

// =====================================================
// 3. SUPPORT TICKET ROUTES
// =====================================================

/**
 * GET /api/super-admin/tickets
 * Get support tickets with filtering
 * Query params: status, priority, tenantId, assignedTo, category, page, limit
 */
router.get('/tickets', getSupportTickets);

/**
 * GET /api/super-admin/tickets/:ticketId
 * Get single ticket with full details and comments
 */
router.get('/tickets/:ticketId', getSupportTicket);

/**
 * POST /api/super-admin/tickets
 * Create new support ticket
 * Body: { tenant_id, subject, description, category, priority, severity, ... }
 */
router.post('/tickets', createSupportTicket);

/**
 * PUT /api/super-admin/tickets/:ticketId
 * Update ticket status, priority, or assignment
 * Body: { status?, priority?, assigned_to?, assigned_team?, resolution?, resolution_category? }
 */
router.put('/tickets/:ticketId', updateSupportTicket);

/**
 * POST /api/super-admin/tickets/:ticketId/comments
 * Add comment to ticket
 * Body: { comment_text: string, is_internal?: boolean }
 */
router.post('/tickets/:ticketId/comments', addTicketComment);

/**
 * GET /api/super-admin/tickets/statistics
 * Get ticket statistics and trends
 * Query params: tenantId?, days (default: 30)
 */
router.get('/tickets/statistics', getTicketStatistics);

// =====================================================
// 4. FEATURE FLAGS ROUTES
// =====================================================

/**
 * GET /api/super-admin/tenants/:tenantId/features
 * Get all feature flags for a tenant
 */
router.get('/tenants/:tenantId/features', getTenantFeatureFlags);

/**
 * PUT /api/super-admin/tenants/:tenantId/features
 * Update or create a feature flag for a tenant
 * Body: { feature_name: string, enabled: boolean, config?: object, reason?: string }
 */
router.put('/tenants/:tenantId/features', updateFeatureFlag);

/**
 * POST /api/super-admin/features/bulk-update
 * Bulk update feature flags across multiple tenants
 * Body: { tenant_ids: string[], feature_name: string, enabled: boolean, config?, reason? }
 */
router.post('/features/bulk-update', bulkUpdateFeatureFlags);

// =====================================================
// 5. ALERTS & MONITORING ROUTES
// =====================================================

/**
 * GET /api/super-admin/alerts
 * Get active alerts across all tenants
 * Query params: severity?, tenantId?, category?
 */
router.get('/alerts', getActiveAlerts);

/**
 * PUT /api/super-admin/alerts/:alertId/resolve
 * Resolve or dismiss an alert
 * Body: { status: 'RESOLVED' | 'DISMISSED', resolution_notes?: string }
 */
router.put('/alerts/:alertId/resolve', resolveAlert);

// =====================================================
// 6. ADMIN AUDIT LOG ROUTES
// =====================================================

/**
 * GET /api/super-admin/audit-logs
 * Get admin access logs with filtering
 * Query params: adminUserId?, tenantId?, action?, startDate?, endDate?, page, limit
 */
router.get('/audit-logs', getAdminAccessLogs);

// =====================================================
// EXPORT
// =====================================================

export default router;
