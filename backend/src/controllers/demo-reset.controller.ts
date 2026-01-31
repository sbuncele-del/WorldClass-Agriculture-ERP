import { Request, Response } from 'express';
import DemoResetService from '../services/demo-reset.service';

/**
 * Demo Reset Controller
 * 
 * Provides API endpoints for:
 * - Manual demo tenant reset (for testing/emergency)
 * - Reset status/statistics
 * - Health check
 */

class DemoResetController {
  /**
   * Manually trigger demo tenant reset
   * POST /api/demo/reset
   * 
   * Security: Should be protected by super admin auth in production
   */
  async triggerReset(_req: Request, res: Response): Promise<void> {
    try {
      console.log('[DemoResetController] Manual reset triggered');

      const result = await DemoResetService.resetDemoTenant();

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          timestamp: result.timestamp,
          stats: DemoResetService.getResetStats()
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          timestamp: result.timestamp
        });
      }

    } catch (error: any) {
      console.error('[DemoResetController] Reset error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset demo tenant',
        error: error.message
      });
    }
  }

  /**
   * Get reset statistics and status
   * GET /api/demo/reset/status
   */
  async getResetStatus(_req: Request, res: Response): Promise<void> {
    try {
      const stats = DemoResetService.getResetStats();
      const needsReset = DemoResetService.needsReset();

      res.status(200).json({
        success: true,
        stats: {
          lastResetTime: stats.lastResetTime,
          resetCount: stats.resetCount,
          resetInProgress: stats.resetInProgress,
          needsReset,
          nextScheduledReset: '2:00 AM daily'
        }
      });

    } catch (error: any) {
      console.error('[DemoResetController] Status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get reset status',
        error: error.message
      });
    }
  }

  /**
   * Health check for demo reset service
   * GET /api/demo/reset/health
   */
  async healthCheck(_req: Request, res: Response): Promise<void> {
    try {
      const stats = DemoResetService.getResetStats();

      res.status(200).json({
        success: true,
        status: 'operational',
        service: 'demo-reset',
        cronSchedule: '0 2 * * * (2:00 AM daily)',
        stats
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        status: 'error',
        error: error.message
      });
    }
  }
}

export default new DemoResetController();
