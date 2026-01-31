/**
 * Logistics Routes Index
 * 
 * Aggregates all logistics-related route modules
 */

import express from 'express';
import { tenantMiddleware } from '../../middleware/tenant';

import enterpriseRoutes from './enterprise';
import tripsRoutes from './trips';
import fuelRoutes from './fuel';
import documentsRoutes from './documents';
import trackingRoutes from './tracking';

const router = express.Router();

// Apply tenant middleware to all logistics routes
router.use(tenantMiddleware);

// Mount route modules
router.use('/enterprise', enterpriseRoutes);
router.use('/trips', tripsRoutes);
router.use('/fuel', fuelRoutes);
router.use('/documents', documentsRoutes);
router.use('/tracking', trackingRoutes);

export default router;
