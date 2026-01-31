/**
 * Asset Management Controller
 */

import { Request, Response } from 'express';
import assetsService from './service';

export class AssetsController {
  
  /**
   * Create a new fixed asset
   * POST /api/assets
   */
  async createAsset(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || '00000000-0000-0000-0000-000000000001';
      const userId = (req as any).user?.id || '00000000-0000-0000-0000-000000000000';
      
      const asset = await assetsService.createAsset({
        ...req.body,
        tenant_id: tenantId
      }, userId);
      
      res.status(201).json({
        success: true,
        data: asset
      });
      
    } catch (error: any) {
      console.error('Error creating asset:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create asset'
      });
    }
  }
  
  /**
   * Get asset by ID
   * GET /api/assets/:id
   */
  async getAsset(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || '00000000-0000-0000-0000-000000000001';
      const assetId = parseInt(req.params.id);
      
      const asset = await assetsService.getAssetById(assetId, tenantId);
      
      if (!asset) {
        res.status(404).json({
          success: false,
          error: 'Asset not found'
        });
        return;
      }
      
      res.json({
        success: true,
        data: asset
      });
      
    } catch (error: any) {
      console.error('Error getting asset:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get asset'
      });
    }
  }
  
  /**
   * List assets with filters
   * GET /api/assets
   */
  async listAssets(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || '00000000-0000-0000-0000-000000000001';
      
      const filters = {
        status: req.query.status as string,
        category_id: req.query.category_id ? parseInt(req.query.category_id as string) : undefined,
        location_id: req.query.location_id ? parseInt(req.query.location_id as string) : undefined,
        search: req.query.search as string
      };
      
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const result = await assetsService.listAssets(filters, tenantId, page, limit);
      
      res.json({
        success: true,
        ...result
      });
      
    } catch (error: any) {
      console.error('Error listing assets:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to list assets'
      });
    }
  }
  
  /**
   * Calculate monthly depreciation
   * POST /api/assets/depreciation/calculate
   */
  async calculateDepreciation(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || '00000000-0000-0000-0000-000000000001';
      const { month } = req.body;
      
      if (!month) {
        res.status(400).json({
          success: false,
          error: 'Month is required (YYYY-MM-DD format)'
        });
        return;
      }
      
      const result = await assetsService.calculateDepreciation(tenantId, month);
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error: any) {
      console.error('Error calculating depreciation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to calculate depreciation'
      });
    }
  }
  
  /**
   * Create asset revaluation
   * POST /api/assets/:id/revaluations
   */
  async createRevaluation(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || '00000000-0000-0000-0000-000000000001';
      const userId = (req as any).user?.id || '00000000-0000-0000-0000-000000000000';
      const assetId = parseInt(req.params.id);
      
      const revaluation = await assetsService.createRevaluation({
        ...req.body,
        asset_id: assetId,
        tenant_id: tenantId
      }, userId);
      
      res.status(201).json({
        success: true,
        data: revaluation
      });
      
    } catch (error: any) {
      console.error('Error creating revaluation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create revaluation'
      });
    }
  }
  
  /**
   * Approve revaluation
   * POST /api/assets/revaluations/:id/approve
   */
  async approveRevaluation(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || '00000000-0000-0000-0000-000000000000';
      const revaluationId = parseInt(req.params.id);
      
      const revaluation = await assetsService.approveRevaluation(revaluationId, userId);
      
      res.json({
        success: true,
        data: revaluation,
        message: 'Revaluation approved and posted to GL'
      });
      
    } catch (error: any) {
      console.error('Error approving revaluation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to approve revaluation'
      });
    }
  }
  
  /**
   * Get asset depreciation schedule
   * GET /api/assets/:id/depreciation
   */
  async getDepreciationSchedule(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || '00000000-0000-0000-0000-000000000001';
      const assetId = parseInt(req.params.id);
      
      const schedule = await assetsService.getDepreciationSchedule(assetId, tenantId);
      
      res.json({
        success: true,
        data: schedule
      });
      
    } catch (error: any) {
      console.error('Error getting depreciation schedule:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get depreciation schedule'
      });
    }
  }
  
  /**
   * Get workspace summary - Demo data for dashboard
   * GET /api/asset-management/workspace
   */
  async getWorkspaceSummary(_req: Request, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        data: {
          summary: {
            totalAssets: 847,
            activeAssets: 792,
            disposedAssets: 42,
            underMaintenanceAssets: 13,
            totalValue: 125000000,
            totalDepreciation: 42500000,
            netBookValue: 82500000,
            assetsRequiringAttention: 8
          },
          assetsByCategory: [
            { category: 'Property & Buildings', count: 45, value: 65000000 },
            { category: 'Vehicles & Fleet', count: 156, value: 18500000 },
            { category: 'IT Equipment', count: 342, value: 8750000 },
            { category: 'Machinery & Equipment', count: 89, value: 22000000 },
            { category: 'Office Furniture', count: 215, value: 10750000 }
          ],
          recentActivities: [
            { date: '2025-12-11', action: 'Depreciation Run', description: 'Monthly depreciation calculated for Dec 2025' },
            { date: '2025-12-10', action: 'Asset Acquisition', description: 'New delivery vehicle added - REG ABC 123 GP' },
            { date: '2025-12-09', action: 'Revaluation', description: 'Property revaluation completed - Main Office Building' },
            { date: '2025-12-08', action: 'Disposal', description: 'Old IT equipment disposed - batch #2025-12-001' }
          ],
          upcomingDepreciation: {
            month: 'December 2025',
            estimatedAmount: 3250000,
            assetsAffected: 687
          }
        }
      });
    } catch (error: any) {
      console.error('Error getting workspace summary:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get workspace summary'
      });
    }
  }

  /**
   * List all depreciation schedules
   * GET /api/asset-management/depreciation
   */
  async listDepreciationSchedules(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || '00000000-0000-0000-0000-000000000001';
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const result = await assetsService.listDepreciationSchedules(tenantId, page, limit);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error('Error listing depreciation schedules:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to list depreciation schedules'
      });
    }
  }

  /**
   * List all asset disposals
   * GET /api/asset-management/disposals
   */
  async listDisposals(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || '00000000-0000-0000-0000-000000000001';
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const result = await assetsService.listDisposals(tenantId, page, limit);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error('Error listing disposals:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to list disposals'
      });
    }
  }
}

export default new AssetsController();
