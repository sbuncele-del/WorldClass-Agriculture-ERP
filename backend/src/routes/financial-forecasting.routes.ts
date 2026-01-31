/**
 * Financial Forecasting Routes (V2, tenant-aware)
 * Delegates to tenant-hardened V2 controller.
 */
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import * as ForecastingControllerV2 from '../controllers/v2/financial-forecasting.controller.v2';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

// Budget Scenarios
router.get('/scenarios', ForecastingControllerV2.getBudgetScenarios);
router.get('/scenarios/:id', ForecastingControllerV2.getBudgetScenario);
router.post('/scenarios', ForecastingControllerV2.createBudgetScenario);
router.put('/scenarios/:id', ForecastingControllerV2.updateBudgetScenario);
router.delete('/scenarios/:id', ForecastingControllerV2.deleteBudgetScenario);

// Budgets
router.get('/budgets', ForecastingControllerV2.getBudgets);
router.get('/budgets/:id', ForecastingControllerV2.getBudgetById);
router.post('/budgets', ForecastingControllerV2.createBudget);
router.put('/budgets/:id', ForecastingControllerV2.updateBudget);
router.delete('/budgets/:id', ForecastingControllerV2.deleteBudget);

// Budget vs Actual
router.get('/budgets/:budget_id/vs-actual', ForecastingControllerV2.getBudgetVsActual);
router.get('/variance-analysis', ForecastingControllerV2.getVarianceAnalysis);

// Forecasting
router.post('/forecast/generate', ForecastingControllerV2.generateForecast);

// Dashboard
router.get('/dashboard', ForecastingControllerV2.getBudgetDashboard);

export default router;
