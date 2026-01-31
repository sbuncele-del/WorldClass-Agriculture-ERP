/**
 * Dashboard Routes (V2, tenant-aware)
 * Delegates to tenant-hardened V2 controller.
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import DashboardControllerV2 from '../controllers/dashboard.controller.v2';

const router = express.Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

// Main Dashboard Endpoints
router.get('/stats', DashboardControllerV2.getDashboardStats);
router.get('/revenue-trend', DashboardControllerV2.getRevenueTrend);
router.get('/expense-breakdown', DashboardControllerV2.getExpenseBreakdown);
router.get('/recent-entries', DashboardControllerV2.getRecentEntries);
router.get('/cash-position', DashboardControllerV2.getCashPosition);
router.get('/aging', DashboardControllerV2.getAgingSummary);
router.get('/kpis', DashboardControllerV2.getKPIs);

export default router;
