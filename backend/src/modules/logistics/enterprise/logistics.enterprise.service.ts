import pool from '../../../config/database';
import { TenantFeatures } from '../../../types';
import {
  TransportationPlanPayload,
  YardOverviewFilters,
  DockAppointmentPayload,
  FreightAuditPayload,
  CarrierContractPayload,
  RevenueRecognitionPayload,
  RouteProfitabilityFilters,
  CarrierScorePayload,
  IotEventPayload,
  PredictiveMaintenancePayload,
  FeatureGateResponse,
} from './logistics.enterprise.types';
import {
  LOGISTICS_FEATURE_FLAGS,
  LOGISTICS_UPGRADE_PATHS,
  isFeatureEnabled,
  LogisticsFeatureName,
} from '../logistics.features';
import { BENCHMARK_BASELINE, LogisticsErpAdapter } from './logistics.erp-adapter';

export class LogisticsEnterpriseService {
  // ---------------------------------------------------------------------------
  // Advanced Transportation Planning
  // ---------------------------------------------------------------------------
  static async upsertTransportationPlan(
    tenantId: string,
    userId: string,
    payload: TransportationPlanPayload
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const planResult = await client.query(
        `INSERT INTO logistics.transportation_plans (
          plan_id, tenant_id, plan_number, plan_type, status, planning_horizon,
          strategy, constraints, capacity_summary, cost_projection,
          service_level_target, optimization_notes, created_by
        ) VALUES (
          COALESCE($1::uuid, uuid_generate_v4()), $2, $3, COALESCE($4, 'MULTI_STOP'),
          COALESCE($5, 'DRAFT'),
          CASE WHEN $6 IS NULL THEN NULL ELSE TSRANGE($6->>'start', $6->>'end', '[]') END,
          COALESCE($7::jsonb, '{}'::jsonb),
          COALESCE($8::jsonb, '{}'::jsonb),
          COALESCE($9::jsonb, '{}'::jsonb),
          COALESCE($10, 0),
          COALESCE($11, 95),
          $12,
          $13
        )
        ON CONFLICT (plan_id) DO UPDATE SET
          plan_type = EXCLUDED.plan_type,
          status = EXCLUDED.status,
          planning_horizon = EXCLUDED.planning_horizon,
          strategy = EXCLUDED.strategy,
          constraints = EXCLUDED.constraints,
          capacity_summary = EXCLUDED.capacity_summary,
          cost_projection = EXCLUDED.cost_projection,
          service_level_target = EXCLUDED.service_level_target,
          optimization_notes = EXCLUDED.optimization_notes,
          updated_at = NOW()
        RETURNING plan_id` ,
        [
          payload.planId || null,
          tenantId,
          payload.planNumber || null,
          payload.planType,
          payload.status,
          payload.planningHorizon || null,
          JSON.stringify(payload.strategy || {}),
          JSON.stringify(payload.constraints || {}),
          JSON.stringify(payload.capacitySummary || {}),
          payload.costProjection || 0,
          payload.serviceLevelTarget || 95,
          payload.optimizationNotes || null,
          userId,
        ]
      );

      const planId = planResult.rows[0].plan_id;

      if (payload.stops && payload.stops.length) {
        await client.query('DELETE FROM logistics.transportation_plan_stops WHERE plan_id = $1', [planId]);

        for (const stop of payload.stops) {
          await client.query(
            `INSERT INTO logistics.transportation_plan_stops (
              stop_id, plan_id, stop_sequence, stop_type, location, service_window, load_profile, sla_minutes
            ) VALUES (
              uuid_generate_v4(), $1, $2, $3, $4::jsonb,
              CASE WHEN $5 IS NULL THEN NULL ELSE TSRANGE($5->>'start', $5->>'end', '[]') END,
              COALESCE($6::jsonb, '{}'::jsonb),
              $7
            )`,
            [
              planId,
              stop.sequence,
              stop.stopType,
              JSON.stringify(stop.location),
              stop.serviceWindow || null,
              JSON.stringify(stop.loadProfile || {}),
              stop.slaMinutes || null,
            ]
          );
        }
      }

      await LogisticsErpAdapter.persistSnapshot({
        tenantId,
        sourceEntity: 'transportation_plan',
        sourceReference: planId,
        payload: { ...payload, planId },
      });

      await client.query('COMMIT');
      return { planId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getTransportationPlans(tenantId: string) {
    const { rows } = await pool.query(
      `SELECT plan_id, plan_number, plan_type, status, planning_horizon,
              capacity_summary, cost_projection, service_level_target, updated_at
         FROM logistics.transportation_plans
        WHERE tenant_id = $1
        ORDER BY updated_at DESC
        LIMIT 50`,
      [tenantId]
    );
    return rows;
  }

  // ---------------------------------------------------------------------------
  // Yard + Dock Management
  // ---------------------------------------------------------------------------
  static async getYardOverview(tenantId: string, filters: YardOverviewFilters = {}) {
    const zones = await pool.query(
      `SELECT z.zone_id, z.zone_name, z.zone_type, z.capacity,
              COALESCE(json_agg(s.*) FILTER (WHERE s.slot_id IS NOT NULL), '[]') AS slots
         FROM logistics.yard_zones z
    LEFT JOIN logistics.yard_slots s ON s.zone_id = z.zone_id
        WHERE z.tenant_id = $1
          AND ($2::text IS NULL OR z.zone_type = $2)
        GROUP BY z.zone_id
        ORDER BY z.zone_name`,
      [tenantId, filters.zoneType || null]
    );

    let recentMovements: any[] = [];
    if (filters.includeMovements) {
      const movements = await pool.query(
        `SELECT movement_id, vehicle_id, previous_slot_id, next_slot_id,
                movement_reason, scheduled_at, executed_at, status
           FROM logistics.yard_movements
          WHERE tenant_id = $1
          ORDER BY scheduled_at DESC
          LIMIT 25`,
        [tenantId]
      );
      recentMovements = movements.rows;
    }

    return { zones: zones.rows, recentMovements };
  }

  static async scheduleDockAppointment(tenantId: string, userId: string, payload: DockAppointmentPayload) {
    const { rows } = await pool.query(
      `INSERT INTO logistics.dock_appointments (
        appointment_id, tenant_id, dock_number, carrier_id, vehicle_id, load_id,
        appointment_window, status, special_handling, created_by, updated_by
      ) VALUES (
        COALESCE($1::uuid, uuid_generate_v4()), $2, $3, $4, $5, $6,
        TSRANGE($7->>'start', $7->>'end', '[]'),
        COALESCE($8, 'REQUESTED'),
        COALESCE($9::jsonb, '{}'::jsonb),
        $10, $10
      )
      ON CONFLICT (appointment_id) DO UPDATE SET
        dock_number = EXCLUDED.dock_number,
        carrier_id = EXCLUDED.carrier_id,
        vehicle_id = EXCLUDED.vehicle_id,
        load_id = EXCLUDED.load_id,
        appointment_window = EXCLUDED.appointment_window,
        status = EXCLUDED.status,
        special_handling = EXCLUDED.special_handling,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
      RETURNING appointment_id`,
      [
        null,
        tenantId,
        payload.dockNumber,
        payload.carrierId || null,
        payload.vehicleId || null,
        payload.loadId || null,
        payload.window,
        'CONFIRMED',
        JSON.stringify(payload.specialHandling || {}),
        userId,
      ]
    );
    return rows[0];
  }

  // ---------------------------------------------------------------------------
  // Freight Audit + Contracts
  // ---------------------------------------------------------------------------
  static async submitFreightAudit(tenantId: string, userId: string, payload: FreightAuditPayload) {
    const { rows } = await pool.query(
      `INSERT INTO logistics.freight_audits (
        audit_id, tenant_id, shipment_reference, carrier_id,
        billed_amount, expected_amount, variance_reason, documents, created_by
      ) VALUES (
        COALESCE($1::uuid, uuid_generate_v4()), $2, $3, $4,
        $5, $6, $7, COALESCE($8::jsonb, '{}'::jsonb), $9
      ) RETURNING audit_id, variance_amount, status` ,
      [
        payload.auditId || null,
        tenantId,
        payload.shipmentReference,
        payload.carrierId || null,
        payload.billedAmount,
        payload.expectedAmount,
        payload.varianceReason || null,
        JSON.stringify(payload.documents || {}),
        userId,
      ]
    );
    return rows[0];
  }

  static async upsertCarrierContract(tenantId: string, userId: string, payload: CarrierContractPayload) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const contractResult = await client.query(
        `INSERT INTO logistics.carrier_contracts (
          contract_id, tenant_id, carrier_id, contract_code, effective_range,
          payment_terms, sla_metrics, fuel_surcharge_formula, created_by
        ) VALUES (
          COALESCE($1::uuid, uuid_generate_v4()), $2, $3, $4,
          TSRANGE($5->>'start', $5->>'end', '[]'),
          $6, COALESCE($7::jsonb, '{}'::jsonb), $8, $9
        )
        ON CONFLICT (contract_id) DO UPDATE SET
          payment_terms = EXCLUDED.payment_terms,
          sla_metrics = EXCLUDED.sla_metrics,
          fuel_surcharge_formula = EXCLUDED.fuel_surcharge_formula,
          updated_at = NOW()
        RETURNING contract_id`,
        [
          payload.contractId || null,
          tenantId,
          payload.carrierId,
          payload.contractCode,
          payload.effectiveRange,
          payload.paymentTerms || null,
          JSON.stringify(payload.slaMetrics || {}),
          payload.fuelSurchargeFormula || null,
          userId,
        ]
      );

      const contractId = contractResult.rows[0].contract_id;

      if (payload.rates?.length) {
        await client.query('DELETE FROM logistics.carrier_rates WHERE contract_id = $1', [contractId]);
        for (const rate of payload.rates) {
          await client.query(
            `INSERT INTO logistics.carrier_rates (
              rate_id, contract_id, lane_key, base_rate, accessorials,
              fuel_index, effective_range
            ) VALUES (
              uuid_generate_v4(), $1, $2, $3, COALESCE($4::jsonb, '{}'::jsonb),
              $5, TSRANGE($6->>'start', $6->>'end', '[]')
            )`,
            [
              contractId,
              rate.laneKey,
              rate.baseRate,
              JSON.stringify(rate.accessorials || {}),
              rate.fuelIndex || null,
              rate.effectiveRange,
            ]
          );
        }
      }

      await client.query('COMMIT');
      return { contractId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async scoreCarrier(tenantId: string, payload: CarrierScorePayload) {
    const { rows } = await pool.query(
      `INSERT INTO logistics.carrier_scorecards (
        scorecard_id, tenant_id, carrier_id, period_month, kpi_scores, composite_score
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3::date, $4::jsonb, $5
      )
      ON CONFLICT (tenant_id, carrier_id, period_month) DO UPDATE SET
        kpi_scores = EXCLUDED.kpi_scores,
        composite_score = EXCLUDED.composite_score,
        created_at = NOW()
      RETURNING scorecard_id, composite_score` ,
      [tenantId, payload.carrierId, payload.periodMonth, JSON.stringify(payload.kpiScores), payload.compositeScore]
    );
    return rows[0];
  }

  // ---------------------------------------------------------------------------
  // Finance Hooks & Analytics
  // ---------------------------------------------------------------------------
  static async recordFinanceEvent(tenantId: string, userId: string, payload: RevenueRecognitionPayload) {
    const { rows } = await pool.query(
      `INSERT INTO logistics.logistics_finance_events (
        finance_event_id, tenant_id, event_type, trip_id, load_id, route_id,
        recognized_amount, cost_amount, currency_code, payload, created_by
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3, $4, $5,
        $6, $7, COALESCE($8, 'USD'), COALESCE($9::jsonb, '{}'::jsonb), $10
      ) RETURNING finance_event_id`,
      [
        tenantId,
        payload.eventType,
        payload.tripId || null,
        payload.loadId || null,
        payload.routeId || null,
        payload.recognizedAmount || 0,
        payload.costAmount || 0,
        payload.currencyCode || 'USD',
        JSON.stringify(payload.payload || {}),
        userId,
      ]
    );
    return rows[0];
  }

  static async getRouteProfitability(tenantId: string, filters: RouteProfitabilityFilters = {}) {
    const { rows } = await pool.query(
      `SELECT route_id, period_start, period_end, revenue, cost, margin, margin_percent,
              utilization_percent, payload
         FROM logistics.route_profitability_snapshots
        WHERE tenant_id = $1
          AND ($2::uuid IS NULL OR route_id = $2)
          AND ($3::date IS NULL OR period_start >= $3)
          AND ($4::date IS NULL OR period_end <= $4)
        ORDER BY period_start DESC
        LIMIT 50`,
      [tenantId, filters.routeId || null, filters.periodStart || null, filters.periodEnd || null]
    );
    return rows;
  }

  // ---------------------------------------------------------------------------
  // AI + IoT
  // ---------------------------------------------------------------------------
  static async ingestIotEvent(tenantId: string, payload: IotEventPayload) {
    const { rows } = await pool.query(
      `INSERT INTO logistics.iot_sensor_events (
        event_id, tenant_id, vehicle_id, sensor_type, reading, recorded_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3, $4::jsonb, $5::timestamptz
      ) RETURNING event_id` ,
      [tenantId, payload.vehicleId || null, payload.sensorType, JSON.stringify(payload.reading), payload.recordedAt]
    );
    return rows[0];
  }

  static async createPredictiveMaintenanceAlert(
    tenantId: string,
    userId: string,
    payload: PredictiveMaintenancePayload
  ) {
    const modelResult = await pool.query(
      `INSERT INTO logistics.predictive_maintenance_models (
        model_id, tenant_id, model_name, version, feature_space, accuracy, created_by
      ) VALUES (
        uuid_generate_v4(), $1, COALESCE($2, 'default'), COALESCE($3, 'v1'), '{}'::jsonb, 0, $4
      )
      ON CONFLICT (tenant_id, model_name, version) DO UPDATE SET updated_at = NOW()
      RETURNING model_id`,
      [tenantId, payload.modelName || null, payload.version || null, userId]
    );

    const modelId = modelResult.rows[0].model_id;

    const { rows } = await pool.query(
      `INSERT INTO logistics.predictive_maintenance_alerts (
        alert_id, tenant_id, vehicle_id, model_id, predicted_issue,
        probability, recommended_action, created_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3, $4, $5, $6, NOW()
      ) RETURNING alert_id, status` ,
      [tenantId, payload.vehicleId, modelId, payload.predictedIssue, payload.probability, payload.recommendedAction || null]
    );

    return rows[0];
  }

  // ---------------------------------------------------------------------------
  // Feature Gates + Benchmarks
  // ---------------------------------------------------------------------------
  static getFeatureGateResponse(features: TenantFeatures | undefined, tenantPlan: string): FeatureGateResponse {
    const flags: Record<string, boolean> = {};
    (Object.values(LOGISTICS_FEATURE_FLAGS) as LogisticsFeatureName[]).forEach((flag) => {
      flags[flag] = isFeatureEnabled(features, flag);
    });

    return {
      flags,
      upgradePaths: LOGISTICS_UPGRADE_PATHS,
      tenantPlan,
      featureCount: Object.values(flags).filter(Boolean).length,
    };
  }

  static async getBenchmarkSnapshot() {
    return BENCHMARK_BASELINE;
  }
}

export default LogisticsEnterpriseService;
