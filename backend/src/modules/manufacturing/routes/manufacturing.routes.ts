/**
 * Manufacturing Routes
 */

import { Router } from 'express';
import * as manufacturingController from '../controllers/manufacturing.controller.v2';
import { tenantMiddleware } from '../../../middleware/tenant';
import { MrpEngineService } from '../services/mrp-engine.service';
import { ProductionSchedulerService } from '../services/production-scheduler.service';

const router = Router();

// Enforce tenant context for all manufacturing routes
router.use(tenantMiddleware);

// ==================================================
// WORK CENTERS
// ==================================================
router.get('/work-centers', manufacturingController.getWorkCenters);
router.post('/work-centers', manufacturingController.createWorkCenter);

// ==================================================
// BILL OF MATERIALS (BOM)
// ==================================================
router.get('/boms', manufacturingController.getBOMs);
router.get('/boms/:id', manufacturingController.getBOMById);
router.post('/boms', manufacturingController.createBOM);

// ==================================================
// PRODUCTION ORDERS
// ==================================================
router.get('/orders', manufacturingController.getProductionOrders);
router.post('/orders', manufacturingController.createProductionOrder);
router.put('/orders/:id/status', manufacturingController.updateProductionOrderStatus);

// ==================================================
// MRP (Material Requirements Planning)
// ==================================================
router.post('/mrp/run', async (req, res) => {
  try {
    const userId = typeof req.user?.id === 'string' ? parseInt(req.user.id) : (req.user?.id || 1);
    const result = await MrpEngineService.runMrp(req.body, userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/mrp/results', async (req, res) => {
  try {
    const results = await MrpEngineService.getResults(req.query.run_id ? Number(req.query.run_id) : undefined);
    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================================================
// SCHEDULING
// ==================================================
router.post('/schedule/:orderId', async (req, res) => {
  try {
    const result = await ProductionSchedulerService.scheduleOrder(Number(req.params.orderId));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/schedule/load', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const load = await ProductionSchedulerService.getWorkCenterLoad(
      start_date as string, 
      end_date as string
    );
    res.json({ success: true, data: load });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================================================
// DASHBOARD
// ==================================================
router.get('/dashboard', manufacturingController.getDashboardStats);

export default router;
