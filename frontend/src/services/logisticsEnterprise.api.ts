import { apiGet, apiPost } from '../services/api.service';

const BASE = '/api/v2/logistics/enterprise';

export interface TransportationPlanPayload {
  planId?: string;
  planNumber?: string;
  planType?: string;
  status?: string;
  planningHorizon?: { start: string; end: string };
  strategy?: Record<string, unknown>;
  constraints?: Record<string, unknown>;
  capacitySummary?: Record<string, unknown>;
  costProjection?: number;
  serviceLevelTarget?: number;
  stops?: Array<{
    stopId?: string;
    sequence: number;
    stopType: string;
    location: { name: string; lat: number; lng: number; address?: string };
    serviceWindow?: { start: string; end: string };
    loadProfile?: Record<string, unknown>;
    slaMinutes?: number;
  }>;
}

export const logisticsEnterpriseAPI = {
  getFeatureGates: () => apiGet(`${BASE}/feature-gates`),
  getBenchmarks: () => apiGet(`${BASE}/benchmarks`),
  getInnovationRoadmap: () => apiGet(`${BASE}/innovation-roadmap`),

  listTransportationPlans: () => apiGet(`${BASE}/atms/plans`),
  upsertTransportationPlan: (payload: TransportationPlanPayload) =>
    apiPost(`${BASE}/atms/plans`, payload),

  getYardOverview: (params?: { zoneType?: string; includeMovements?: boolean }) =>
    apiGet(`${BASE}/yard/overview`, params),

  scheduleDockAppointment: (payload: Record<string, unknown>) =>
    apiPost(`${BASE}/yard/dock-appointments`, payload),

  submitFreightAudit: (payload: Record<string, unknown>) =>
    apiPost(`${BASE}/freight/audits`, payload),

  upsertCarrierContract: (payload: Record<string, unknown>) =>
    apiPost(`${BASE}/carriers/contracts`, payload),

  scoreCarrierPerformance: (payload: Record<string, unknown>) =>
    apiPost(`${BASE}/carriers/scorecards`, payload),

  recordRevenueRecognition: (payload: Record<string, unknown>) =>
    apiPost(`${BASE}/finance/revenue-recognition`, payload),

  getRouteProfitability: (params?: { routeId?: string; periodStart?: string; periodEnd?: string }) =>
    apiGet(`${BASE}/analytics/route-profitability`, params),

  ingestIotEvent: (payload: Record<string, unknown>) =>
    apiPost(`${BASE}/iot/events`, payload),

  createPredictiveMaintenanceAlert: (payload: Record<string, unknown>) =>
    apiPost(`${BASE}/ai/predictive-maintenance`, payload),
};

export default logisticsEnterpriseAPI;
