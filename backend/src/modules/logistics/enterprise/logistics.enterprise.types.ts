import { TenantFeatures } from '../../../types';

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
  optimizationNotes?: string;
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

export interface YardOverviewFilters {
  zoneType?: string;
  includeMovements?: boolean;
}

export interface DockAppointmentPayload {
  appointmentId?: string;
  dockNumber: string;
  carrierId?: string;
  vehicleId?: string;
  loadId?: string;
  window: { start: string; end: string };
  specialHandling?: Record<string, unknown>;
}

export interface FreightAuditPayload {
  auditId?: string;
  shipmentReference: string;
  carrierId?: string;
  billedAmount: number;
  expectedAmount: number;
  varianceReason?: string;
  documents?: Record<string, unknown>;
}

export interface CarrierContractPayload {
  contractId?: string;
  carrierId: string;
  contractCode: string;
  effectiveRange: { start: string; end: string };
  paymentTerms?: string;
  slaMetrics?: Record<string, unknown>;
  fuelSurchargeFormula?: string;
  rates?: Array<{
    laneKey: string;
    baseRate: number;
    accessorials?: Record<string, unknown>;
    fuelIndex?: number;
    effectiveRange: { start: string; end: string };
  }>;
}

export interface RevenueRecognitionPayload {
  eventType: 'revenue_recognition' | 'freight_bill' | 'accrual';
  tripId?: string;
  loadId?: string;
  routeId?: string;
  recognizedAmount?: number;
  costAmount?: number;
  currencyCode?: string;
  payload?: Record<string, unknown>;
}

export interface RouteProfitabilityFilters {
  routeId?: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface CarrierScorePayload {
  carrierId: string;
  periodMonth: string; // YYYY-MM-01
  kpiScores: Record<string, number>;
  compositeScore: number;
}

export interface IotEventPayload {
  vehicleId?: string;
  sensorType: string;
  reading: Record<string, unknown>;
  recordedAt: string;
}

export interface PredictiveMaintenancePayload {
  vehicleId: string;
  modelName?: string;
  version?: string;
  predictedIssue: string;
  probability: number;
  recommendedAction?: string;
}

export interface FeatureGateResponse {
  flags: Record<string, boolean>;
  upgradePaths: Record<string, string>;
  tenantPlan: string;
  featureCount: number;
}

export interface BenchmarkSnapshot {
  throughputPerDispatcher: { ours: number; sap: number; oracle: number; dynamics: number };
  planningLatencyMinutes: { ours: number; sap: number; oracle: number; dynamics: number };
  revenueRecognitionLagMinutes: { ours: number; sap: number; oracle: number; dynamics: number };
  aiRouteAccuracy: { ours: number; sap: number; oracle: number; dynamics: number };
  carbonOptimizationPercent: { ours: number; sap: number; oracle: number; dynamics: number };
  lastValidatedAt: string;
}

export interface TenantFeatureProjection {
  plan: string;
  features: TenantFeatures;
}
