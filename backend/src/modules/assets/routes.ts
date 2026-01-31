/**
 * Asset Management Routes
 */

import { Router } from 'express';
import assetsController from './controller';

const router = Router();

// Workspace summary endpoint (no auth required for demo data)
router.get('/workspace', assetsController.getWorkspaceSummary.bind(assetsController));

// Asset CRUD - explicit routes before :id param
router.get('/assets', assetsController.listAssets.bind(assetsController));
router.get('/depreciation', assetsController.listDepreciationSchedules.bind(assetsController));
router.get('/disposals', assetsController.listDisposals.bind(assetsController));

router.post('/', assetsController.createAsset.bind(assetsController));
router.get('/', assetsController.listAssets.bind(assetsController));
router.get('/:id', assetsController.getAsset.bind(assetsController));

// Depreciation
router.post('/depreciation/calculate', assetsController.calculateDepreciation.bind(assetsController));
router.get('/:id/depreciation', assetsController.getDepreciationSchedule.bind(assetsController));

// Revaluation
router.post('/:id/revaluations', assetsController.createRevaluation.bind(assetsController));
router.post('/revaluations/:id/approve', assetsController.approveRevaluation.bind(assetsController));

export default router;
