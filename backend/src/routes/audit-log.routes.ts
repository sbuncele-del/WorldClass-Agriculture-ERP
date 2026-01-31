/**
 * Audit Log API Routes
 * Provides endpoints for querying and exporting audit trails
 * 
 * SOX Compliance: Auditors can review all data changes
 * GDPR Compliance: Users can see who accessed their data
 */

import { Router, Request, Response } from 'express';
import { queryAuditLogs, AuditAction } from '../middleware/audit.middleware';
import { authenticateToken } from '../middleware/auth';
import { requirePermission, Permission } from '../middleware/rbac.middleware';
import { tenantMiddleware } from '../middleware/tenant';

const router = Router();

// All audit routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

/**
 * GET /api/audit/logs
 * Query audit logs with filters
 * 
 * Query params:
 * - userId: Filter by user
 * - entityType: Filter by entity (e.g., 'vehicles', 'drivers')
 * - entityId: Filter by specific entity ID
 * - action: Filter by action (CREATE, UPDATE, DELETE, etc.)
 * - startDate: Filter from date (ISO string)
 * - endDate: Filter to date (ISO string)
 * - page: Page number (default 1)
 * - limit: Results per page (default 50, max 100)
 */
router.get('/logs', 
  requirePermission(Permission.REPORTS_VIEW, Permission.ADMIN_FULL_ACCESS),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const {
        userId,
        entityType,
        entityId,
        action,
        startDate,
        endDate,
        page = '1',
        limit = '50',
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
      const offset = (pageNum - 1) * limitNum;

      const result = await queryAuditLogs({
        userId: userId ? parseInt(userId as string, 10) : undefined,
        tenantId: user.tenantId, // Always filter by tenant for security
        entityType: entityType as string,
        entityId: entityId as string,
        action: action as AuditAction,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: limitNum,
        offset,
      });

      res.json({
        success: true,
        data: result.logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          totalPages: Math.ceil(result.total / limitNum),
        },
      });
    } catch (error) {
      console.error('[AUDIT API] Error querying audit logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to query audit logs',
      });
    }
  }
);

/**
 * GET /api/audit/entity/:entityType/:entityId
 * Get full audit history for a specific entity
 */
router.get('/entity/:entityType/:entityId',
  requirePermission(Permission.REPORTS_VIEW, Permission.ADMIN_FULL_ACCESS),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { entityType, entityId } = req.params;

      const result = await queryAuditLogs({
        tenantId: user.tenantId,
        entityType,
        entityId,
        limit: 100,
      });

      res.json({
        success: true,
        entityType,
        entityId,
        history: result.logs,
        totalChanges: result.total,
      });
    } catch (error) {
      console.error('[AUDIT API] Error getting entity history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get entity audit history',
      });
    }
  }
);

/**
 * GET /api/audit/user/:userId
 * Get all actions performed by a specific user
 */
router.get('/user/:userId',
  requirePermission(Permission.ADMIN_FULL_ACCESS), // Admin only
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { userId } = req.params;
      const { startDate, endDate, page = '1', limit = '50' } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(100, parseInt(limit as string, 10));
      const offset = (pageNum - 1) * limitNum;

      const result = await queryAuditLogs({
        userId: parseInt(userId, 10),
        tenantId: user.tenantId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: limitNum,
        offset,
      });

      res.json({
        success: true,
        userId: parseInt(userId, 10),
        data: result.logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          totalPages: Math.ceil(result.total / limitNum),
        },
      });
    } catch (error) {
      console.error('[AUDIT API] Error getting user audit history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user audit history',
      });
    }
  }
);

/**
 * GET /api/audit/summary
 * Get audit summary statistics
 */
router.get('/summary',
  requirePermission(Permission.REPORTS_VIEW, Permission.ADMIN_FULL_ACCESS),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { days = '7' } = req.query;
      const daysNum = parseInt(days as string, 10);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);

      // Get counts by action type
      const [creates, updates, deletes, logins] = await Promise.all([
        queryAuditLogs({ tenantId: user.tenantId, action: AuditAction.CREATE, startDate, limit: 0 }),
        queryAuditLogs({ tenantId: user.tenantId, action: AuditAction.UPDATE, startDate, limit: 0 }),
        queryAuditLogs({ tenantId: user.tenantId, action: AuditAction.DELETE, startDate, limit: 0 }),
        queryAuditLogs({ tenantId: user.tenantId, action: AuditAction.LOGIN, startDate, limit: 0 }),
      ]);

      res.json({
        success: true,
        period: {
          days: daysNum,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
        summary: {
          creates: creates.total,
          updates: updates.total,
          deletes: deletes.total,
          logins: logins.total,
          total: creates.total + updates.total + deletes.total + logins.total,
        },
      });
    } catch (error) {
      console.error('[AUDIT API] Error getting audit summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get audit summary',
      });
    }
  }
);

/**
 * GET /api/audit/export
 * Export audit logs for compliance reporting
 */
router.get('/export',
  requirePermission(Permission.REPORTS_EXPORT, Permission.ADMIN_FULL_ACCESS),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { startDate, endDate, format = 'json' } = req.query;

      const result = await queryAuditLogs({
        tenantId: user.tenantId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: 10000, // Max export limit
      });

      if (format === 'csv') {
        // Generate CSV
        const headers = [
          'ID', 'Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID',
          'Changed Fields', 'IP Address', 'Request Path'
        ].join(',');
        
        const rows = result.logs.map(log => [
          log.id,
          log.created_at,
          log.user_email || 'System',
          log.action,
          log.entity_type,
          log.entity_id || '',
          (log.changed_fields || []).join(';'),
          log.ip_address || '',
          log.request_path || '',
        ].map(v => `"${v}"`).join(','));

        const csv = [headers, ...rows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=audit-log-${new Date().toISOString().split('T')[0]}.csv`);
        return res.send(csv);
      }

      // Default: JSON format
      res.json({
        success: true,
        exportDate: new Date().toISOString(),
        totalRecords: result.total,
        data: result.logs,
      });
    } catch (error) {
      console.error('[AUDIT API] Error exporting audit logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export audit logs',
      });
    }
  }
);

export default router;
