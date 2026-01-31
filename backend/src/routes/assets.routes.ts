/**
 * Asset Management Routes (V2, tenant-aware)
 * API endpoints for fixed assets, depreciation, disposals, transfers, and maintenance
 * IAS 16 compliant asset lifecycle management
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import assetsController from '../controllers/assets.controller.v2';
import * as assetsWorkspaceController from '../modules/assets/controllers/assets.workspace.controller';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

// Workspace
router.get('/workspace', assetsWorkspaceController.getAssetsWorkspace);

// Fixed Assets CRUD
router.get('/assets', assetsController.getAllAssets);
router.get('/assets/:id', assetsController.getAssetById);
router.post('/assets', assetsController.createAsset);
router.put('/assets/:id', assetsController.updateAsset);
router.delete('/assets/:id', assetsController.deleteAsset);

// Asset Categories
router.get('/categories', assetsController.getAssetCategories);
router.post('/categories', assetsController.createAssetCategory);

// Depreciation
router.post('/depreciation/run', assetsController.runDepreciation);

// Disposals
router.get('/disposals', assetsController.getAssetDisposals);
router.post('/assets/:asset_id/dispose', assetsController.createAssetDisposal);

// Transfers
router.get('/transfers', assetsController.getAssetTransfers);
router.post('/assets/:asset_id/transfer', assetsController.createAssetTransfer);

// Maintenance
router.get('/maintenance', assetsController.getAssetMaintenance);
router.post('/assets/:asset_id/maintenance', assetsController.createAssetMaintenance);

// Dashboard
router.get('/dashboard', assetsController.getAssetDashboard);

export default router;
