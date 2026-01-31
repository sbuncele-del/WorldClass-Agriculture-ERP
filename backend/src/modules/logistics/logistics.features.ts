import { TenantFeatures } from '../../types';

/**
 * Logistics feature flags mapped to cohesive identifiers used in middleware + UI.
 * Each entry aligns with SAP/Oracle/Microsoft parity requirements.
 */
export const LOGISTICS_FEATURE_FLAGS = {
  ATMS: 'logistics_atms',
  YARD: 'logistics_yard_management',
  DOCK: 'logistics_dock_scheduling',
  FREIGHT_AUDIT: 'logistics_freight_audit',
  CARRIER_CONTRACTS: 'logistics_carrier_contracts',
  REVENUE_RECOGNITION: 'logistics_delivery_revenue',
  FREIGHT_BILLING: 'logistics_freight_billing',
  ROUTE_PROFITABILITY: 'logistics_route_profitability',
  CARRIER_SCORING: 'logistics_carrier_scoring',
  POWER_BI_EXPORT: 'logistics_power_bi',
  AI_ROUTE_OPTIMIZATION: 'logistics_ai_route_optimization',
  PREDICTIVE_MAINTENANCE: 'logistics_predictive_maintenance',
  IOT_INGESTION: 'logistics_iot_ingestion',
  PROCESS_GENOME: 'logistics_process_genome',
} as const;

export type LogisticsFeatureName = typeof LOGISTICS_FEATURE_FLAGS[keyof typeof LOGISTICS_FEATURE_FLAGS];

/**
 * Helper to safely read a feature flag on the tenant payload.
 * Keeps backward compatibility with tenants that do not yet have the new keys.
 */
export const isFeatureEnabled = (
  features: TenantFeatures | undefined,
  feature: LogisticsFeatureName
): boolean => Boolean(features && features[feature]);

/**
 * Upgrade path content used by backend + frontend to show customers what toggles unlock.
 */
export const LOGISTICS_UPGRADE_PATHS: Record<LogisticsFeatureName, string> = {
  [LOGISTICS_FEATURE_FLAGS.ATMS]: 'Unlock AI-assisted transportation plans with constraint-based optimization.',
  [LOGISTICS_FEATURE_FLAGS.YARD]: 'Digitize yard zones/slots for live capacity orchestration.',
  [LOGISTICS_FEATURE_FLAGS.DOCK]: 'Automate dock door scheduling with conflict detection.',
  [LOGISTICS_FEATURE_FLAGS.FREIGHT_AUDIT]: 'Auto-match carrier invoices vs contracted rates before payment.',
  [LOGISTICS_FEATURE_FLAGS.CARRIER_CONTRACTS]: 'Version carrier contracts + enforce SLA targets across the network.',
  [LOGISTICS_FEATURE_FLAGS.REVENUE_RECOGNITION]: 'Trigger IFRS-compliant revenue recognition at delivery confirmation.',
  [LOGISTICS_FEATURE_FLAGS.FREIGHT_BILLING]: 'Generate freight bills + GL postings automatically per trip.',
  [LOGISTICS_FEATURE_FLAGS.ROUTE_PROFITABILITY]: 'See per-route revenue, cost, and utilization margins instantly.',
  [LOGISTICS_FEATURE_FLAGS.CARRIER_SCORING]: 'Score each carrier monthly on on-time %, damage, billing accuracy.',
  [LOGISTICS_FEATURE_FLAGS.POWER_BI_EXPORT]: 'Stream logistics cubes into embedded Power BI workspaces.',
  [LOGISTICS_FEATURE_FLAGS.AI_ROUTE_OPTIMIZATION]: 'Use reinforcement learning to re-plan routes when exceptions occur.',
  [LOGISTICS_FEATURE_FLAGS.PREDICTIVE_MAINTENANCE]: 'Predict vehicle component failures 30+ days before downtime.',
  [LOGISTICS_FEATURE_FLAGS.IOT_INGESTION]: 'Ingest CAN bus, ELD, and cold-chain IoT telemetry in real time.',
  [LOGISTICS_FEATURE_FLAGS.PROCESS_GENOME]: 'Layer AI-native orchestration that legacy ERPs cannot replicate.',
};
