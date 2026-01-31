/**
 * Dimensions Routes
 * REST API routes for financial dimensions
 */

import { Router } from 'express';
import * as dimensionsController from '../modules/financial/controllers/dimensions.controller';
import { tenantMiddleware } from '../middleware/tenant';

const router = Router();

// Apply tenant middleware to all dimension routes
router.use(tenantMiddleware);

// ===== COST CENTERS =====
router.get('/cost-centers', dimensionsController.getAllCostCenters);
router.get('/cost-centers/:code', dimensionsController.getCostCenter);
router.post('/cost-centers', dimensionsController.createCostCenter);
router.put('/cost-centers/:code', dimensionsController.updateCostCenter);
router.delete('/cost-centers/:code', dimensionsController.deleteCostCenter);

// ===== DEPARTMENTS =====
router.get('/departments', dimensionsController.getAllDepartments);
router.get('/departments/:code', dimensionsController.getDepartment);
router.post('/departments', dimensionsController.createDepartment);
router.put('/departments/:code', dimensionsController.updateDepartment);
router.delete('/departments/:code', dimensionsController.deleteDepartment);

// ===== PROJECTS =====
router.get('/projects', dimensionsController.getAllProjects);
router.get('/projects/:code', dimensionsController.getProject);
router.post('/projects', dimensionsController.createProject);
router.put('/projects/:code', dimensionsController.updateProject);
router.delete('/projects/:code', dimensionsController.deleteProject);

// ===== PRODUCTS =====
router.get('/products', dimensionsController.getAllProducts);
router.get('/products/:code', dimensionsController.getProduct);
router.post('/products', dimensionsController.createProduct);
router.put('/products/:code', dimensionsController.updateProduct);
router.delete('/products/:code', dimensionsController.deleteProduct);

// ===== LOCATIONS =====
router.get('/locations', dimensionsController.getAllLocations);
router.get('/locations/:code', dimensionsController.getLocation);
router.post('/locations', dimensionsController.createLocation);
router.put('/locations/:code', dimensionsController.updateLocation);
router.delete('/locations/:code', dimensionsController.deleteLocation);

// ===== SUMMARY =====
router.get('/summary', dimensionsController.getDimensionSummary);

export default router;
