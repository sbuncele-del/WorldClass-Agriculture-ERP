-- 033_agriculture_engine_pilot.sql
-- Masaphokati Agriculture OS — irrigation-monitoring pilot.
-- Additive only (CREATE TABLE IF NOT EXISTS); safe to re-run, does not touch
-- existing data. Also applied via POST /api/migrate/agriculture-engine.

CREATE TABLE IF NOT EXISTS agriculture_telemetry_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  farm_id VARCHAR(100) NOT NULL,
  field_id VARCHAR(100),
  device_id VARCHAR(100) NOT NULL,
  signal_type VARCHAR(40) NOT NULL,       -- pressure | flow | soil_moisture | ...
  value DOUBLE PRECISION NOT NULL,
  unit VARCHAR(20) NOT NULL,              -- bar | L/min | % | ...
  observed_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  quality VARCHAR(20) NOT NULL DEFAULT 'good',   -- good | degraded
  raw_payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_agri_reading UNIQUE (tenant_id, device_id, signal_type, observed_at)
);

CREATE INDEX IF NOT EXISTS idx_agri_reading_tenant_farm
  ON agriculture_telemetry_readings (tenant_id, farm_id, observed_at DESC);

CREATE TABLE IF NOT EXISTS agriculture_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  farm_id VARCHAR(100) NOT NULL,
  field_id VARCHAR(100),
  incident_type VARCHAR(60) NOT NULL,     -- irrigation_delivery | ...
  status VARCHAR(20) NOT NULL DEFAULT 'open',   -- open | acknowledged | in_progress | resolved | cancelled
  severity VARCHAR(20) NOT NULL DEFAULT 'medium',  -- low | medium | high
  title VARCHAR(255) NOT NULL,
  explanation TEXT,
  confidence_percent NUMERIC(5,2),
  evidence JSONB DEFAULT '[]',
  recommended_action TEXT,
  assigned_to VARCHAR(255),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agri_incident_tenant_status
  ON agriculture_incidents (tenant_id, status, created_at DESC);
