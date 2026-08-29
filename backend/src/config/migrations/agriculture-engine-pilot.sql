CREATE TABLE IF NOT EXISTS agriculture_provider_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  external_id VARCHAR(255) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, provider, entity_type, entity_id),
  UNIQUE (tenant_id, provider, external_id)
);

CREATE TABLE IF NOT EXISTS agriculture_telemetry_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  field_id UUID REFERENCES farm_fields(id) ON DELETE SET NULL,
  device_id VARCHAR(255) NOT NULL,
  signal_type VARCHAR(100) NOT NULL,
  value NUMERIC NOT NULL,
  unit VARCHAR(50) NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  quality VARCHAR(30) NOT NULL DEFAULT 'good',
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (tenant_id, device_id, signal_type, observed_at)
);

CREATE INDEX IF NOT EXISTS idx_agri_telemetry_context_time
  ON agriculture_telemetry_readings (tenant_id, farm_id, observed_at DESC);

CREATE TABLE IF NOT EXISTS agriculture_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  field_id UUID REFERENCES farm_fields(id) ON DELETE SET NULL,
  incident_type VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  severity VARCHAR(30) NOT NULL,
  title VARCHAR(255) NOT NULL,
  explanation TEXT NOT NULL,
  confidence_percent NUMERIC(5,2),
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_action TEXT,
  assigned_to UUID,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agri_incidents_work_queue
  ON agriculture_incidents (tenant_id, status, severity, created_at DESC);
