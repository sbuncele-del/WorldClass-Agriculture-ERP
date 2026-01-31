/**
 * MINING INDUSTRY ROUTES (V2, tenant-aware)
 * Thin routing layer that delegates to the hardened V2 controller.
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import * as miningController from '../controllers/mining.controller.v2';

const router = express.Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

// Workspace summary
router.get('/workspace', miningController.getWorkspace);

// Mining sites
router.get('/sites', miningController.getSites);
router.get('/sites/:id', miningController.getSiteById);
router.post('/sites', miningController.createSite);
router.put('/sites/:id', miningController.updateSite);

// Production tracking
router.get('/production', miningController.getProduction);
router.post('/production', miningController.recordProduction);
router.put('/production/:id', miningController.updateProduction);

// Safety incidents
router.get('/safety/incidents', miningController.getSafetyIncidents);
router.post('/safety/incidents', miningController.reportSafetyIncident);
router.put('/safety/incidents/:id', miningController.updateSafetyIncident);

// Equipment
router.get('/equipment', miningController.getEquipment);
router.post('/equipment', miningController.registerEquipment);
router.put('/equipment/:id', miningController.updateEquipment);

export default router;
