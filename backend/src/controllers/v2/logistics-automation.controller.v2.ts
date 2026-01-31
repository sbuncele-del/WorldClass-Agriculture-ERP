/**
 * Logistics Automation V2 Controller
 * 
 * REST API endpoints for all logistics automation services
 * 
 * Endpoints:
 * - /api/v2/logistics/automation/* - Smart dispatch, routing, driver scoring
 * - /api/v2/logistics/compliance/* - RTMS, licenses, pre-trip inspection
 * - /api/v2/logistics/maintenance/* - Service scheduling, defects, predictive
 * - /api/v2/logistics/costing/* - Trip costs, invoicing, profitability
 */

import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

// Tenant request interface
interface TenantRequest extends Request {
  tenant?: { id: string };
  user?: { id: string; email: string; role: string };
}

// Get tenant ID helper
function getTenantId(req: TenantRequest): string {
  const tenantId = req.tenant?.id || req.headers['x-tenant-id'] as string;
  if (!tenantId) throw new Error('Tenant context required');
  return tenantId;
}
import { 
  LogisticsAutomationService, 
  createLogisticsAutomationService 
} from '../../services/logistics-automation.service';
import { 
  LogisticsComplianceService, 
  createLogisticsComplianceService,
  PRE_TRIP_CHECKLIST 
} from '../../services/logistics-compliance.service';
import { 
  LogisticsMaintenanceService, 
  createLogisticsMaintenanceService 
} from '../../services/logistics-maintenance.service';
import { 
  LogisticsCostingService, 
  createLogisticsCostingService 
} from '../../services/logistics-costing.service';

export class LogisticsAutomationControllerV2 {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  private getAutomationService(tenantId: string): LogisticsAutomationService {
    return createLogisticsAutomationService(this.pool, tenantId);
  }

  private getComplianceService(tenantId: string): LogisticsComplianceService {
    return createLogisticsComplianceService(this.pool, tenantId);
  }

  private getMaintenanceService(tenantId: string): LogisticsMaintenanceService {
    return createLogisticsMaintenanceService(this.pool, tenantId);
  }

  private getCostingService(tenantId: string): LogisticsCostingService {
    return createLogisticsCostingService(this.pool, tenantId);
  }

  // ============================================
  // AUTOMATION ENDPOINTS
  // ============================================

  /**
   * POST /api/v2/logistics/automation/dispatch
   * Smart dispatch - auto-assign best driver/vehicle for trip
   */
  smartDispatch = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const { origin, destination, pickupTime, cargoType, weightKg, volumeM3, pallets, isUrgent, requiresRefrigeration } = req.body;

      const service = this.getAutomationService(tenantId);
      const result = await service.smartDispatch({
        origin: origin || 'JHB',
        destination: destination || 'CPT',
        pickupTime: pickupTime ? new Date(pickupTime) : new Date(),
        cargoType: cargoType || 'GENERAL',
        weightKg: weightKg || 20000,
        volumeM3,
        pallets,
        isUrgent,
        requiresRefrigeration
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v2/logistics/automation/optimize-route
   * Optimize route with fuel/toll estimates
   */
  optimizeRoute = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const { origin, destination, waypoints, vehicleType, departureTime } = req.body;

      const service = this.getAutomationService(tenantId);
      const result = await service.optimizeRoute(
        origin || 'JHB',
        destination || 'CPT',
        waypoints || [],
        vehicleType || 'SUPER',
        departureTime ? new Date(departureTime) : new Date()
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v2/logistics/automation/driver-scores
   * Get driver performance scores
   */
  getDriverScores = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const service = this.getAutomationService(tenantId);
      const result = await service.calculateDriverScores();

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v2/logistics/automation/load-balance
   * Analyze fleet workload distribution
   */
  analyzeLoadBalance = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const service = this.getAutomationService(tenantId);
      const result = await service.analyzeLoadBalance();

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v2/logistics/automation/find-backhaul
   * Find return loads to reduce empty running
   */
  findBackhaulLoads = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const { currentLocation, homeBase, vehicleType, availableCapacityKg } = req.body;

      const service = this.getAutomationService(tenantId);
      const result = await service.findBackhaulLoads(
        currentLocation || 'JHB',
        homeBase || 'JHB',
        vehicleType || 'SUPER',
        availableCapacityKg || 20000
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  // ============================================
  // COMPLIANCE ENDPOINTS
  // ============================================

  /**
   * GET /api/v2/logistics/compliance/driver-hours/:driverId
   * Check RTMS hours of service compliance
   */
  checkDriverHours = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const { driverId } = req.params;

      const service = this.getComplianceService(tenantId);
      const result = await service.checkDriverHoursCompliance(driverId);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v2/logistics/compliance/license-expiry
   * Get expiring licenses and permits
   */
  checkLicenseExpiry = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const daysAhead = parseInt(req.query.daysAhead as string) || 30;

      const service = this.getComplianceService(tenantId);
      const result = await service.checkLicenseExpiries(daysAhead);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v2/logistics/compliance/pre-trip/checklist
   * Get pre-trip inspection checklist template
   */
  getPreTripChecklist = async (_req: TenantRequest, res: Response, _next: NextFunction) => {
    res.json({ success: true, data: { checklist: PRE_TRIP_CHECKLIST } });
  };

  /**
   * POST /api/v2/logistics/compliance/pre-trip/create
   * Create new pre-trip inspection
   */
  createPreTripInspection = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const { vehicleId, driverId, tripId } = req.body;

      const service = this.getComplianceService(tenantId);
      const result = await service.createPreTripInspection(vehicleId, driverId, tripId);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v2/logistics/compliance/pre-trip/:inspectionId/submit
   * Submit completed pre-trip inspection
   */
  submitPreTripInspection = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const { inspectionId } = req.params;
      const { responses, odometer, driverSignature } = req.body;

      const service = this.getComplianceService(tenantId);
      const result = await service.submitPreTripInspection(
        inspectionId,
        responses,
        odometer,
        driverSignature
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v2/logistics/compliance/cross-border
   * Check cross-border permit requirements
   */
  checkCrossBorder = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const { vehicleId, driverId, destinationCountry } = req.query;

      const service = this.getComplianceService(tenantId);
      const result = await service.checkCrossBorderRequirements(
        vehicleId as string,
        driverId as string,
        destinationCountry as string
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v2/logistics/compliance/dashboard
   * Get compliance dashboard
   */
  getComplianceDashboard = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const service = this.getComplianceService(tenantId);
      const result = await service.getComplianceDashboard();

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  // ============================================
  // MAINTENANCE ENDPOINTS
  // ============================================

  /**
   * GET /api/v2/logistics/maintenance/schedule
   * Get vehicle service schedule
   */
  getServiceSchedule = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const vehicleId = req.query.vehicleId as string | undefined;

      const service = this.getMaintenanceService(tenantId);
      const result = await service.getServiceSchedule(vehicleId);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v2/logistics/maintenance/defects/report
   * Report a vehicle defect
   */
  reportDefect = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const { vehicleId, driverId, defectType, description, photoUrls } = req.body;

      const service = this.getMaintenanceService(tenantId);
      const result = await service.reportDefect(
        vehicleId,
        driverId,
        defectType,
        description,
        photoUrls || []
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v2/logistics/maintenance/defects
   * Get open defects
   */
  getOpenDefects = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const vehicleId = req.query.vehicleId as string | undefined;

      const service = this.getMaintenanceService(tenantId);
      const result = await service.getOpenDefects(vehicleId);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v2/logistics/maintenance/defects/:defectId/resolve
   * Resolve a defect
   */
  resolveDefect = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const { defectId } = req.params;
      const { resolution, repairCost, partsUsed } = req.body;

      const service = this.getMaintenanceService(tenantId);
      const result = await service.resolveDefect(defectId, resolution, repairCost, partsUsed || []);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v2/logistics/maintenance/predictive
   * Get predictive maintenance alerts
   */
  getPredictiveAlerts = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const vehicleId = req.query.vehicleId as string | undefined;

      const service = this.getMaintenanceService(tenantId);
      const result = await service.getPredictiveAlerts(vehicleId);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v2/logistics/maintenance/schedule-service
   * Schedule a vehicle service
   */
  scheduleService = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const { vehicleId, serviceType, preferredDate, notes } = req.body;

      const service = this.getMaintenanceService(tenantId);
      const result = await service.scheduleService(vehicleId, serviceType, preferredDate, notes);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v2/logistics/maintenance/cost-analysis
   * Get maintenance cost analysis
   */
  getMaintenanceCostAnalysis = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const { startDate, endDate, vehicleId } = req.query;

      const service = this.getMaintenanceService(tenantId);
      const result = await service.getMaintenanceCostAnalysis(
        startDate as string,
        endDate as string,
        vehicleId as string | undefined
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v2/logistics/maintenance/dashboard
   * Get maintenance dashboard
   */
  getMaintenanceDashboard = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const service = this.getMaintenanceService(tenantId);
      const result = await service.getMaintenanceDashboard();

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  // ============================================
  // COSTING ENDPOINTS
  // ============================================

  /**
   * GET /api/v2/logistics/costing/trip/:tripId
   * Calculate trip cost breakdown
   */
  calculateTripCost = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const { tripId } = req.params;

      const service = this.getCostingService(tenantId);
      const result = await service.calculateTripCost(tripId);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v2/logistics/costing/invoice/generate
   * Generate invoice for trip
   */
  generateInvoice = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const { tripId } = req.body;

      const service = this.getCostingService(tenantId);
      const result = await service.generateTripInvoice(tripId);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v2/logistics/costing/pod-complete
   * Handle POD completion with auto-invoicing
   */
  onPODComplete = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const { tripId, signedBy, signature, deliveryNotes, photoUrls } = req.body;

      const service = this.getCostingService(tenantId);
      const result = await service.onPODCompleted(tripId, {
        signedBy,
        signature,
        deliveryNotes,
        photoUrls,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v2/logistics/costing/route-profitability
   * Analyze route profitability
   */
  analyzeRouteProfitability = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const { startDate, endDate } = req.query;

      const service = this.getCostingService(tenantId);
      const result = await service.analyzeRouteProfitability(
        startDate as string,
        endDate as string
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v2/logistics/costing/driver-pay/:driverId
   * Calculate driver pay
   */
  calculateDriverPay = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const { driverId } = req.params;
      const { payPeriodStart, payPeriodEnd } = req.query;

      const service = this.getCostingService(tenantId);
      const result = await service.calculateDriverPay(
        driverId,
        payPeriodStart as string,
        payPeriodEnd as string
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v2/logistics/costing/fuel-reconciliation/:vehicleId
   * Reconcile fuel usage
   */
  reconcileFuel = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const { vehicleId } = req.params;
      const { startDate, endDate } = req.query;

      const service = this.getCostingService(tenantId);
      const result = await service.reconcileFuel(
        vehicleId,
        startDate as string,
        endDate as string
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v2/logistics/costing/dashboard
   * Get costing dashboard
   */
  getCostingDashboard = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      const period = (req.query.period as 'week' | 'month' | 'quarter') || 'month';

      const service = this.getCostingService(tenantId);
      const result = await service.getCostingDashboard(period);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}

// Factory function
export const createLogisticsAutomationControllerV2 = (pool: Pool) => {
  return new LogisticsAutomationControllerV2(pool);
};
