import { Request, Response } from 'express';
import SuperAdminService from '../services/super-admin.service';

/**
 * Super Admin Controller
 * 
 * Handles HTTP requests for super admin functionality
 * All endpoints should be protected by superAdminAuth middleware
 */

class SuperAdminController {
  /**
   * Get list of all tenants
   * GET /api/admin/tenants
   */
  async getTenants(req: Request, res: Response): Promise<void> {
    try {
      const { status, plan, search, limit, offset } = req.query;

      const result = await SuperAdminService.getTenants({
        status: status as any,
        plan: plan as string,
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });

      res.status(200).json({
        success: true,
        ...result
      });

    } catch (error: any) {
      console.error('[SuperAdmin] Get tenants error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tenants',
        error: error.message
      });
    }
  }

  /**
   * Get tenant details
   * GET /api/admin/tenants/:id
   */
  async getTenantDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const details = await SuperAdminService.getTenantDetails(id);

      res.status(200).json({
        success: true,
        ...details
      });

    } catch (error: any) {
      console.error('[SuperAdmin] Get tenant details error:', error);
      res.status(error.message === 'Tenant not found' ? 404 : 500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Suspend tenant
   * POST /api/admin/tenants/:id/suspend
   */
  async suspendTenant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminEmail = (req as any).user.email;

      if (!reason) {
        res.status(400).json({
          success: false,
          message: 'Suspension reason is required'
        });
        return;
      }

      const result = await SuperAdminService.suspendTenant(id, reason, adminEmail);
      res.status(200).json(result);

    } catch (error: any) {
      console.error('[SuperAdmin] Suspend tenant error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to suspend tenant',
        error: error.message
      });
    }
  }

  /**
   * Activate tenant
   * POST /api/admin/tenants/:id/activate
   */
  async activateTenant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminEmail = (req as any).user.email;

      const result = await SuperAdminService.activateTenant(id, adminEmail);
      res.status(200).json(result);

    } catch (error: any) {
      console.error('[SuperAdmin] Activate tenant error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to activate tenant',
        error: error.message
      });
    }
  }

  /**
   * Delete tenant
   * DELETE /api/admin/tenants/:id
   */
  async deleteTenant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminEmail = (req as any).user.email;

      const result = await SuperAdminService.deleteTenant(id, adminEmail);
      res.status(200).json(result);

    } catch (error: any) {
      console.error('[SuperAdmin] Delete tenant error:', error);
      res.status(error.message === 'Cannot delete demo tenant' ? 403 : 500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Generate impersonation token
   * POST /api/admin/impersonate
   */
  async impersonateUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;
      const adminEmail = (req as any).user.email;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      const result = await SuperAdminService.generateImpersonationToken(userId, adminEmail);
      res.status(200).json({
        success: true,
        ...result
      });

    } catch (error: any) {
      console.error('[SuperAdmin] Impersonate error:', error);
      res.status(error.message === 'User not found' ? 404 : 500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get system statistics
   * GET /api/admin/stats
   */
  async getSystemStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await SuperAdminService.getSystemStats();
      res.status(200).json({
        success: true,
        stats
      });

    } catch (error: any) {
      console.error('[SuperAdmin] Get stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch system statistics',
        error: error.message
      });
    }
  }

  /**
   * Get system health
   * GET /api/admin/health
   */
  async getSystemHealth(_req: Request, res: Response): Promise<void> {
    try {
      const health = await SuperAdminService.getSystemHealth();
      res.status(200).json({
        success: true,
        health
      });

    } catch (error: any) {
      console.error('[SuperAdmin] Get health error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch system health',
        error: error.message
      });
    }
  }

  /**
   * Get feature flags
   * GET /api/admin/feature-flags
   */
  async getFeatureFlags(_req: Request, res: Response): Promise<void> {
    try {
      const flags = await SuperAdminService.getFeatureFlags();
      res.status(200).json({
        success: true,
        flags
      });

    } catch (error: any) {
      console.error('[SuperAdmin] Get feature flags error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feature flags',
        error: error.message
      });
    }
  }

  /**
   * Update feature flag
   * PUT /api/admin/feature-flags/:name
   */
  async updateFeatureFlag(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const { enabled, rolloutPercentage } = req.body;

      if (typeof enabled !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'enabled must be a boolean'
        });
        return;
      }

      const result = await SuperAdminService.updateFeatureFlag(
        name,
        enabled,
        rolloutPercentage
      );

      res.status(200).json(result);

    } catch (error: any) {
      console.error('[SuperAdmin] Update feature flag error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update feature flag',
        error: error.message
      });
    }
  }

  /**
   * Get audit logs
   * GET /api/admin/audit-logs
   */
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const { limit, offset } = req.query;

      const result = await SuperAdminService.getAuditLogs(
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      );

      res.status(200).json({
        success: true,
        ...result
      });

    } catch (error: any) {
      console.error('[SuperAdmin] Get audit logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs',
        error: error.message
      });
    }
  }
}

export default new SuperAdminController();
