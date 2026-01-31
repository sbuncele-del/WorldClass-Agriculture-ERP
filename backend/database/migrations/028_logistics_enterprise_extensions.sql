-- ============================================================================
-- Logistics Enterprise Extensions
-- Adds SAP/Oracle/Microsoft parity capabilities + AI-native data structures
-- ============================================================================

-- Ensure schema + uuid helper exist (covers "UUID issues" raised)
CREATE SCHEMA IF NOT EXISTS logistics;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Advanced Transportation Management (ATMS)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logistics.transportation_plans (
    plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    plan_number TEXT UNIQUE,
    plan_type TEXT NOT NULL DEFAULT 'MULTI_STOP', -- dynamic, milk_run, pool_point
    status TEXT NOT NULL DEFAULT 'DRAFT', -- draft, running, locked, completed
    planning_horizon TSRANGE,
    strategy JSONB DEFAULT '{}'::jsonb,
    constraints JSONB DEFAULT '{}'::jsonb,
    capacity_summary JSONB DEFAULT '{}'::jsonb,
    cost_projection NUMERIC(18,2) DEFAULT 0,
    service_level_target NUMERIC(5,2) DEFAULT 95.00,
    optimization_notes TEXT,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transportation_plans_tenant ON logistics.transportation_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transportation_plans_status ON logistics.transportation_plans(status);

CREATE TABLE IF NOT EXISTS logistics.transportation_plan_stops (
    stop_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES logistics.transportation_plans(plan_id) ON DELETE CASCADE,
    stop_sequence INT NOT NULL,
    stop_type TEXT NOT NULL, -- pickup, delivery, cross_dock, dwell
    location JSONB NOT NULL, -- {name, lat, lng, address}
    service_window TSRANGE,
    load_profile JSONB DEFAULT '{}'::jsonb,
    sla_minutes INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transportation_plan_stops_plan ON logistics.transportation_plan_stops(plan_id, stop_sequence);

-- ---------------------------------------------------------------------------
-- Yard + Dock Management
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logistics.yard_zones (
    zone_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    zone_code TEXT NOT NULL,
    zone_name TEXT NOT NULL,
    zone_type TEXT NOT NULL DEFAULT 'STAGING', -- staging, maintenance, quarantine, outbound
    capacity INT NOT NULL DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, zone_code)
);

CREATE TABLE IF NOT EXISTS logistics.yard_slots (
    slot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID NOT NULL REFERENCES logistics.yard_zones(zone_id) ON DELETE CASCADE,
    slot_code TEXT NOT NULL,
    slot_status TEXT NOT NULL DEFAULT 'AVAILABLE', -- available, occupied, restricted
    current_vehicle_id UUID,
    restrictions JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (zone_id, slot_code)
);

CREATE TABLE IF NOT EXISTS logistics.yard_movements (
    movement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    vehicle_id UUID,
    previous_slot_id UUID REFERENCES logistics.yard_slots(slot_id),
    next_slot_id UUID REFERENCES logistics.yard_slots(slot_id),
    movement_reason TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    executed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'PLANNED',
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logistics.dock_appointments (
    appointment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    dock_number TEXT NOT NULL,
    carrier_id UUID,
    vehicle_id UUID,
    load_id UUID,
    appointment_window TSRANGE NOT NULL,
    status TEXT NOT NULL DEFAULT 'REQUESTED',
    special_handling JSONB DEFAULT '{}'::jsonb,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dock_appointments_tenant ON logistics.dock_appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dock_appointments_window ON logistics.dock_appointments USING GIST (appointment_window);

-- ---------------------------------------------------------------------------
-- Freight Audit & Carrier Contracting
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logistics.freight_audits (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    shipment_reference TEXT NOT NULL,
    carrier_id UUID,
    billed_amount NUMERIC(18,2) NOT NULL,
    expected_amount NUMERIC(18,2) NOT NULL,
    variance_amount NUMERIC(18,2) GENERATED ALWAYS AS (billed_amount - expected_amount) STORED,
    variance_reason TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    documents JSONB DEFAULT '{}'::jsonb,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS logistics.freight_audit_disputes (
    dispute_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES logistics.freight_audits(audit_id) ON DELETE CASCADE,
    carrier_response TEXT,
    resolution_notes TEXT,
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'OPEN'
);

CREATE TABLE IF NOT EXISTS logistics.carrier_contracts (
    contract_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    carrier_id UUID NOT NULL,
    contract_code TEXT NOT NULL,
    effective_range TSRANGE NOT NULL,
    payment_terms TEXT,
    sla_metrics JSONB DEFAULT '{}'::jsonb,
    fuel_surcharge_formula TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, contract_code)
);

CREATE TABLE IF NOT EXISTS logistics.carrier_rates (
    rate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES logistics.carrier_contracts(contract_id) ON DELETE CASCADE,
    lane_key TEXT NOT NULL,
    base_rate NUMERIC(18,2) NOT NULL,
    accessorials JSONB DEFAULT '{}'::jsonb,
    fuel_index NUMERIC(6,3),
    effective_range TSRANGE NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS logistics.carrier_scorecards (
    scorecard_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    carrier_id UUID NOT NULL,
    period_month DATE NOT NULL,
    kpi_scores JSONB NOT NULL, -- on_time, damage_ratio, billing_accuracy, co₂ per km, etc
    composite_score NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, carrier_id, period_month)
);

-- ---------------------------------------------------------------------------
-- Financial & Profitability Hooks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logistics.logistics_finance_events (
    finance_event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    event_type TEXT NOT NULL, -- revenue_recognition, freight_bill, accrual
    trip_id UUID,
    load_id UUID,
    route_id UUID,
    recognized_amount NUMERIC(18,2),
    cost_amount NUMERIC(18,2),
    currency_code CHAR(3) DEFAULT 'USD',
    recognized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payload JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_events_tenant_type ON logistics.logistics_finance_events(tenant_id, event_type);

CREATE TABLE IF NOT EXISTS logistics.route_profitability_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    route_id UUID,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    revenue NUMERIC(18,2) DEFAULT 0,
    cost NUMERIC(18,2) DEFAULT 0,
    margin NUMERIC(18,2) GENERATED ALWAYS AS (revenue - cost) STORED,
    margin_percent NUMERIC(6,3),
    utilization_percent NUMERIC(5,2),
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, route_id, period_start, period_end)
);

-- ---------------------------------------------------------------------------
-- AI / IoT telemetry + predictive maintenance
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logistics.iot_sensor_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    vehicle_id UUID,
    sensor_type TEXT NOT NULL,
    reading JSONB NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ,
    processing_status TEXT NOT NULL DEFAULT 'RECEIVED'
);

CREATE INDEX IF NOT EXISTS idx_iot_sensor_events_vehicle ON logistics.iot_sensor_events(vehicle_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS logistics.predictive_maintenance_models (
    model_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    model_name TEXT NOT NULL,
    version TEXT NOT NULL,
    feature_space JSONB NOT NULL,
    accuracy NUMERIC(5,2),
    trained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE (tenant_id, model_name, version)
);

CREATE TABLE IF NOT EXISTS logistics.predictive_maintenance_alerts (
    alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    vehicle_id UUID NOT NULL,
    model_id UUID REFERENCES logistics.predictive_maintenance_models(model_id),
    predicted_issue TEXT NOT NULL,
    probability NUMERIC(5,2) NOT NULL,
    recommended_action TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN',
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID
);

-- ---------------------------------------------------------------------------
-- ERP Bridge payloads (multi-ERP migration abstraction)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logistics.erp_bridge_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    source_entity TEXT NOT NULL,
    source_reference UUID,
    payload_unified JSONB NOT NULL,
    payload_sap JSONB,
    payload_oracle JSONB,
    payload_dynamics JSONB,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checksum TEXT,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_erp_bridge_tenant_entity ON logistics.erp_bridge_snapshots(tenant_id, source_entity);

-- ---------------------------------------------------------------------------
-- Feature flag seeds (gracefully skip if table missing)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'feature_flags'
    ) THEN
        INSERT INTO feature_flags (name, description, enabled, rollout_percentage)
        VALUES
            ('logistics_atms', 'Advanced transportation planning engine with AI optimization', false, 5),
            ('logistics_yard_management', 'Digital twin of yard slots + dock scheduling', false, 5),
            ('logistics_freight_audit', 'Automated freight audit and payment approvals', false, 5),
            ('logistics_carrier_contracts', 'Carrier contract lifecycle + rate versioning', false, 5),
            ('logistics_delivery_revenue', 'Revenue recognition on delivery confirmation', false, 5),
            ('logistics_freight_billing', 'Automated freight invoicing + GL hooks', false, 5),
            ('logistics_route_profitability', 'Route-level profitability analytics', false, 5),
            ('logistics_carrier_scoring', 'Carrier performance KPIs and ranking', false, 5),
            ('logistics_power_bi', 'Embedded analytics export for Power BI', false, 5),
            ('logistics_ai_route_optimization', 'AI route optimization + scenario planning', false, 5),
            ('logistics_predictive_maintenance', 'Predictive maintenance modeling from IoT', false, 5),
            ('logistics_iot_ingestion', 'High-volume IoT sensor ingestion bus', false, 5),
            ('logistics_process_genome', 'Unified innovation layer beyond SAP/Oracle/Dynamics', false, 5)
        ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;
    END IF;
END $$;

-- ============================================================================
-- END OF MIGRATION 028
-- ============================================================================
