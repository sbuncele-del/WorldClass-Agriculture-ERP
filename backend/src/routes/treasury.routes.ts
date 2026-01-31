/**
 * Treasury Routes (V2, tenant-aware)
 * Delegates to tenant-hardened V2 controller.
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import * as TreasuryControllerV2 from '../controllers/v2/treasury.controller.v2';

const router = express.Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

// Treasury Accounts
router.get('/accounts', TreasuryControllerV2.getTreasuryAccounts);
router.get('/cash-position', TreasuryControllerV2.getCashPosition);
router.get('/dashboard', TreasuryControllerV2.getTreasuryDashboard);

// Cash Forecasting
router.get('/forecasts', TreasuryControllerV2.getCashForecasts);
router.post('/forecasts', TreasuryControllerV2.createCashForecast);

// Investments
router.get('/investments', TreasuryControllerV2.getInvestments);
router.post('/investments', TreasuryControllerV2.createInvestment);

// Transactions
router.get('/transactions', TreasuryControllerV2.getTreasuryTransactions);

// FX Rates
router.get('/fx-rates', TreasuryControllerV2.getFXRates);

// Payment Orders
router.get('/payment-orders', TreasuryControllerV2.getPaymentOrders);
router.post('/payment-orders', TreasuryControllerV2.createPaymentOrder);

// Liquidity Metrics
router.get('/liquidity-metrics', TreasuryControllerV2.getLiquidityMetrics);

export default router;
