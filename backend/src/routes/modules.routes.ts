/**
 * Modules Routes
 * Backend-driven module discovery system
 */

import { Router } from 'express';
import * as modulesController from '../controllers/modules.controller';
import { tenantMiddleware } from '../middleware/tenant';

const router = Router();

// All module discovery routes require authentication
// tenantMiddleware provides tenant context for industry filtering

/**
 * GET /api/modules/available
 * Get all modules available to the current tenant
 * Filters by tenant's industry type
 */
router.get('/available', tenantMiddleware, modulesController.getAvailableModules);

/**
 * GET /api/modules/categories
 * Get list of module categories
 */
router.get('/categories', tenantMiddleware, modulesController.getModuleCategories);

/**
 * GET /api/modules/industries
 * Get list of supported industries and their module counts
 */
router.get('/industries', tenantMiddleware, modulesController.getSupportedIndustries);

/**
 * GET /api/modules/:moduleId
 * Get detailed information about a specific module
 */
router.get('/:moduleId', tenantMiddleware, modulesController.getModuleDetails);

export default router;
