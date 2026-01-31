/**
 * Period Management Routes
 * API endpoints for fiscal years and accounting periods
 */

import express from 'express';
import * as periodController from '../modules/financial/controllers/period.controller';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();

// Apply tenant middleware to all period routes
router.use(tenantMiddleware);

// ===== FISCAL YEARS =====
router.get('/fiscal-years', periodController.getAllFiscalYears);
router.get('/fiscal-years/current', periodController.getCurrentFiscalYear);
router.get('/fiscal-years/:id', periodController.getFiscalYear);
router.get('/fiscal-years/:id/with-periods', periodController.getFiscalYearWithPeriods);
router.post('/fiscal-years', periodController.createFiscalYear);
router.put('/fiscal-years/:id/set-current', periodController.setCurrentFiscalYear);
router.post('/fiscal-years/:id/close', periodController.closeFiscalYear);

// ===== ACCOUNTING PERIODS =====
router.get('/summary', periodController.getPeriodSummary);
router.get('/current', periodController.getCurrentPeriod);
router.get('/open', periodController.getOpenPeriods);
router.get('/:id/validate-close', periodController.validatePeriodClose);
router.get('/:id', periodController.getPeriod);
router.get('/', periodController.getAllPeriods);
router.post('/:id/open', periodController.openPeriod);
router.post('/:id/close', periodController.closePeriod);
router.post('/:id/lock', periodController.lockPeriod);
router.post('/', periodController.createPeriod);
router.put('/:id/set-current', periodController.setCurrentPeriod);

export default router;
