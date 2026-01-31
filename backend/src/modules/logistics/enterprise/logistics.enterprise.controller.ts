import { Response } from 'express';
import LogisticsEnterpriseService from './logistics.enterprise.service';
import { TenantRequest } from '../../../types';
import {
  TransportationPlanPayload,
  DockAppointmentPayload,
  FreightAuditPayload,
  CarrierContractPayload,
  RevenueRecognitionPayload,
  RouteProfitabilityFilters,
  CarrierScorePayload,
  IotEventPayload,
  PredictiveMaintenancePayload,
} from './logistics.enterprise.types';
import { LOGISTICS_FEATURE_FLAGS } from '../logistics.features';

const assertTenantContext = (req: TenantRequest) => {
  if (!req.tenant || !req.user) {
    throw new Error('Tenant context required. Ensure tenantMiddleware runs before enterprise routes.');
  }
};

export const upsertTransportationPlan = async (req: TenantRequest, res: Response) => {
  try {
    assertTenantContext(req);
    const payload = req.body as TransportationPlanPayload;
    const plan = await LogisticsEnterpriseService.upsertTransportationPlan(
      req.tenant!.id,
      req.user!.id,
      payload
    );
    res.status(201).json(plan);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to save transportation plan', details: error.message });
  }
};

export const listTransportationPlans = async (req: TenantRequest, res: Response) => {
  try {
    assertTenantContext(req);
    const plans = await LogisticsEnterpriseService.getTransportationPlans(req.tenant!.id);
    res.json({ plans });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch transportation plans', details: error.message });
  }
};

export const getYardOverview = async (req: TenantRequest, res: Response) => {
  try {
    assertTenantContext(req);
    const overview = await LogisticsEnterpriseService.getYardOverview(req.tenant!.id, {
      zoneType: req.query.zoneType as string,
      includeMovements: req.query.includeMovements === 'true',
    });
    res.json(overview);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load yard overview', details: error.message });
  }
};

export const scheduleDockAppointment = async (req: TenantRequest, res: Response) => {
  try {
    assertTenantContext(req);
    const payload = req.body as DockAppointmentPayload;
    const appointment = await LogisticsEnterpriseService.scheduleDockAppointment(
      req.tenant!.id,
      req.user!.id,
      payload
    );
    res.status(201).json(appointment);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to schedule dock appointment', details: error.message });
  }
};

export const submitFreightAudit = async (req: TenantRequest, res: Response) => {
  try {
    assertTenantContext(req);
    const payload = req.body as FreightAuditPayload;
    const result = await LogisticsEnterpriseService.submitFreightAudit(
      req.tenant!.id,
      req.user!.id,
      payload
    );
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to submit freight audit', details: error.message });
  }
};

export const upsertCarrierContract = async (req: TenantRequest, res: Response) => {
  try {
    assertTenantContext(req);
    const payload = req.body as CarrierContractPayload;
    const contract = await LogisticsEnterpriseService.upsertCarrierContract(
      req.tenant!.id,
      req.user!.id,
      payload
    );
    res.status(201).json(contract);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to upsert carrier contract', details: error.message });
  }
};

export const scoreCarrierPerformance = async (req: TenantRequest, res: Response) => {
  try {
    assertTenantContext(req);
    const payload = req.body as CarrierScorePayload;
    const score = await LogisticsEnterpriseService.scoreCarrier(
      req.tenant!.id,
      payload
    );
    res.status(201).json(score);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to score carrier', details: error.message });
  }
};

export const recordRevenueRecognition = async (req: TenantRequest, res: Response) => {
  try {
    assertTenantContext(req);
    const payload = req.body as RevenueRecognitionPayload;
    const record = await LogisticsEnterpriseService.recordFinanceEvent(
      req.tenant!.id,
      req.user!.id,
      payload
    );
    res.status(201).json(record);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to record finance event', details: error.message });
  }
};

export const getRouteProfitability = async (req: TenantRequest, res: Response) => {
  try {
    assertTenantContext(req);
    const filters: RouteProfitabilityFilters = {
      routeId: req.query.routeId as string,
      periodStart: req.query.periodStart as string,
      periodEnd: req.query.periodEnd as string,
    };
    const snapshots = await LogisticsEnterpriseService.getRouteProfitability(req.tenant!.id, filters);
    res.json({ snapshots });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch route profitability', details: error.message });
  }
};

export const ingestIotEvent = async (req: TenantRequest, res: Response) => {
  try {
    assertTenantContext(req);
    const payload = req.body as IotEventPayload;
    const event = await LogisticsEnterpriseService.ingestIotEvent(req.tenant!.id, payload);
    res.status(201).json(event);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to ingest IoT event', details: error.message });
  }
};

export const createPredictiveMaintenanceAlert = async (req: TenantRequest, res: Response) => {
  try {
    assertTenantContext(req);
    const payload = req.body as PredictiveMaintenancePayload;
    const alert = await LogisticsEnterpriseService.createPredictiveMaintenanceAlert(
      req.tenant!.id,
      req.user!.id,
      payload
    );
    res.status(201).json(alert);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create predictive maintenance alert', details: error.message });
  }
};

export const getFeatureGates = async (req: TenantRequest, res: Response) => {
  try {
    assertTenantContext(req);
    const response = LogisticsEnterpriseService.getFeatureGateResponse(
      req.tenant!.features,
      req.tenant!.subscription_plan
    );
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load feature flags', details: error.message });
  }
};

export const getBenchmarks = async (_req: TenantRequest, res: Response) => {
  try {
    const data = await LogisticsEnterpriseService.getBenchmarkSnapshot();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load benchmarks', details: error.message });
  }
};

/**
 * Simple helper endpoint for frontend to know which innovations remain locked.
 */
export const getInnovationRoadmap = async (req: TenantRequest, res: Response) => {
  try {
    assertTenantContext(req);
    const featureResponse = LogisticsEnterpriseService.getFeatureGateResponse(
      req.tenant!.features,
      req.tenant!.subscription_plan
    );

    const innovation = {
      processGenomeUnlocked: featureResponse.flags[LOGISTICS_FEATURE_FLAGS.PROCESS_GENOME],
      pendingFeatures: Object.entries(featureResponse.flags)
        .filter(([, enabled]) => !enabled)
        .map(([key]) => ({
          feature: key,
          message: featureResponse.upgradePaths[key as keyof typeof featureResponse.upgradePaths],
        })),
    };

    res.json({ ...featureResponse, innovation });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load innovation roadmap', details: error.message });
  }
};
