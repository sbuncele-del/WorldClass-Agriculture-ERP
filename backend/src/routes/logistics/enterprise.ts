import { Router } from 'express';
import { requirePermission, Permission } from '../../middleware/rbac.middleware';
import { tenantMiddleware, requireFeature } from '../../middleware/tenant';
import * as enterpriseController from '../../modules/logistics/enterprise/logistics.enterprise.controller';
import { LOGISTICS_FEATURE_FLAGS } from '../../modules/logistics/logistics.features';

const router = Router();

// Enforce tenant context before RBAC/feature checks
router.use(tenantMiddleware);

// Feature discovery + planning
router.get(
  '/feature-gates',
  requirePermission(Permission.REPORTS_VIEW, Permission.ADMIN_FULL_ACCESS),
  enterpriseController.getFeatureGates
);
router.get(
  '/benchmarks',
  requirePermission(Permission.REPORTS_VIEW, Permission.ADMIN_FULL_ACCESS),
  enterpriseController.getBenchmarks
);
router.get(
  '/innovation-roadmap',
  requirePermission(Permission.REPORTS_VIEW, Permission.ADMIN_FULL_ACCESS),
  enterpriseController.getInnovationRoadmap
);

// Advanced Transportation Management (ATMS)
router.post(
  '/atms/plans',
  requirePermission(Permission.ENTERPRISE_ATMS_MANAGE, Permission.ADMIN_FULL_ACCESS),
  requireFeature(LOGISTICS_FEATURE_FLAGS.ATMS),
  enterpriseController.upsertTransportationPlan
);
router.get(
  '/atms/plans',
  requirePermission(Permission.ENTERPRISE_ATMS_MANAGE, Permission.ADMIN_FULL_ACCESS),
  requireFeature(LOGISTICS_FEATURE_FLAGS.ATMS),
  enterpriseController.listTransportationPlans
);

// Yard + Dock
router.get(
  '/yard/overview',
  requirePermission(Permission.ENTERPRISE_YARD_VIEW, Permission.ADMIN_FULL_ACCESS),
  requireFeature(LOGISTICS_FEATURE_FLAGS.YARD),
  enterpriseController.getYardOverview
);
router.post(
  '/yard/dock-appointments',
  requirePermission(Permission.ENTERPRISE_DOCK_SCHEDULE, Permission.ADMIN_FULL_ACCESS),
  requireFeature(LOGISTICS_FEATURE_FLAGS.DOCK),
  enterpriseController.scheduleDockAppointment
);

// Freight audit + contracts
router.post(
  '/freight/audits',
  requirePermission(Permission.ENTERPRISE_FREIGHT_AUDIT, Permission.ADMIN_FULL_ACCESS),
  requireFeature(LOGISTICS_FEATURE_FLAGS.FREIGHT_AUDIT),
  enterpriseController.submitFreightAudit
);
router.post(
  '/carriers/contracts',
  requirePermission(Permission.ENTERPRISE_CARRIER_CONTRACTS, Permission.ADMIN_FULL_ACCESS),
  requireFeature(LOGISTICS_FEATURE_FLAGS.CARRIER_CONTRACTS),
  enterpriseController.upsertCarrierContract
);
router.post(
  '/carriers/scorecards',
  requirePermission(Permission.ENTERPRISE_ANALYTICS, Permission.ADMIN_FULL_ACCESS),
  requireFeature(LOGISTICS_FEATURE_FLAGS.CARRIER_SCORING),
  enterpriseController.scoreCarrierPerformance
);

// Finance & analytics
router.post(
  '/finance/revenue-recognition',
  requirePermission(Permission.ENTERPRISE_FINANCE, Permission.ADMIN_FULL_ACCESS),
  requireFeature(LOGISTICS_FEATURE_FLAGS.REVENUE_RECOGNITION),
  enterpriseController.recordRevenueRecognition
);
router.get(
  '/analytics/route-profitability',
  requirePermission(Permission.ENTERPRISE_ANALYTICS, Permission.ADMIN_FULL_ACCESS),
  requireFeature(LOGISTICS_FEATURE_FLAGS.ROUTE_PROFITABILITY),
  enterpriseController.getRouteProfitability
);

// AI + IoT
router.post(
  '/iot/events',
  requirePermission(Permission.ENTERPRISE_IOT, Permission.ADMIN_FULL_ACCESS),
  requireFeature(LOGISTICS_FEATURE_FLAGS.IOT_INGESTION),
  enterpriseController.ingestIotEvent
);
router.post(
  '/ai/predictive-maintenance',
  requirePermission(Permission.ENTERPRISE_PREDICTIVE, Permission.ADMIN_FULL_ACCESS),
  requireFeature(LOGISTICS_FEATURE_FLAGS.PREDICTIVE_MAINTENANCE),
  enterpriseController.createPredictiveMaintenanceAlert
);

// UPGRADE_PATH: add AI-native route optimization endpoint here once reinforcement models move to production.

export default router;
