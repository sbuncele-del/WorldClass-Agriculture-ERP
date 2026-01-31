-- GPS Tracking Enhancement Migration
-- Add GPS position tracking and rate management tables
-- Migration Date: 2025-11-25

BEGIN;

-- GPS Positions Table (Historical tracking data)
CREATE TABLE IF NOT EXISTS logistics.gps_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(6, 2) DEFAULT 0, -- km/h
  heading INTEGER CHECK (heading >= 0 AND heading <= 360), -- degrees
  ignition BOOLEAN DEFAULT false,
  odometer DECIMAL(10, 2), -- kilometers
  fuel_level DECIMAL(5, 2), -- percentage 0-100
  provider VARCHAR(20) NOT NULL, -- 'cartrack', 'mix', 'ctrack'
  raw_data JSONB, -- Original provider response
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL,
  
  CONSTRAINT fk_gps_vehicle FOREIGN KEY (vehicle_id) 
    REFERENCES logistics.vehicles(id) ON DELETE CASCADE
);

-- Indexes for GPS positions (critical for performance)
CREATE INDEX idx_gps_vehicle_time ON logistics.gps_positions(vehicle_id, recorded_at DESC);
CREATE INDEX idx_gps_tenant ON logistics.gps_positions(tenant_id);
CREATE INDEX idx_gps_recorded_at ON logistics.gps_positions(recorded_at DESC);
CREATE INDEX idx_gps_provider ON logistics.gps_positions(provider);

-- Geospatial index for proximity queries (if PostGIS is available)
-- Uncomment if you have PostGIS extension:
-- CREATE INDEX idx_gps_location ON logistics.gps_positions 
--   USING GIST (ll_to_earth(latitude, longitude));

-- Current GPS Positions View (latest position per vehicle)
CREATE OR REPLACE VIEW logistics.gps_current_positions AS
SELECT DISTINCT ON (vehicle_id)
  id,
  vehicle_id,
  latitude,
  longitude,
  speed,
  heading,
  ignition,
  odometer,
  fuel_level,
  provider,
  recorded_at,
  tenant_id
FROM logistics.gps_positions
ORDER BY vehicle_id, recorded_at DESC;

-- Carrier Rate Management Table
CREATE TABLE IF NOT EXISTS logistics.carrier_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_zone VARCHAR(100) NOT NULL,
  destination_zone VARCHAR(100) NOT NULL,
  vehicle_type VARCHAR(50),
  rate_per_km DECIMAL(10, 2),
  rate_per_trip DECIMAL(10, 2),
  rate_per_ton DECIMAL(10, 2),
  minimum_charge DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'ZAR',
  effective_from DATE NOT NULL,
  effective_to DATE,
  carrier_name VARCHAR(200),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

CREATE INDEX idx_carrier_rates_zones ON logistics.carrier_rates(origin_zone, destination_zone);
CREATE INDEX idx_carrier_rates_dates ON logistics.carrier_rates(effective_from, effective_to);
CREATE INDEX idx_carrier_rates_tenant ON logistics.carrier_rates(tenant_id);

-- Route Optimization Cache Table
CREATE TABLE IF NOT EXISTS logistics.route_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_lat DECIMAL(10, 8) NOT NULL,
  origin_lon DECIMAL(11, 8) NOT NULL,
  dest_lat DECIMAL(10, 8) NOT NULL,
  dest_lon DECIMAL(11, 8) NOT NULL,
  distance_km DECIMAL(10, 2),
  duration_minutes INTEGER,
  route_geometry JSONB, -- GeoJSON LineString
  waypoints JSONB, -- Array of intermediate points
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  provider VARCHAR(20) DEFAULT 'osrm', -- 'osrm', 'graphhopper', 'google'
  
  -- Cache expiry (7 days)
  CONSTRAINT route_cache_valid CHECK (calculated_at > NOW() - INTERVAL '7 days')
);

CREATE INDEX idx_route_cache_origin ON logistics.route_cache(origin_lat, origin_lon);
CREATE INDEX idx_route_cache_dest ON logistics.route_cache(dest_lat, dest_lon);

-- GPS Provider Configuration Table
CREATE TABLE IF NOT EXISTS logistics.gps_provider_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(20) NOT NULL UNIQUE, -- 'cartrack', 'mix', 'ctrack'
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  base_url VARCHAR(500),
  webhook_secret_encrypted TEXT,
  customer_id VARCHAR(100),
  is_enabled BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  config_json JSONB, -- Additional provider-specific settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

CREATE INDEX idx_gps_config_tenant ON logistics.gps_provider_config(tenant_id);

-- Vehicle GPS Provider Mapping (allows different vehicles to use different providers)
CREATE TABLE IF NOT EXISTS logistics.vehicle_gps_mapping (
  vehicle_id UUID PRIMARY KEY,
  gps_provider VARCHAR(20) NOT NULL,
  external_vehicle_id VARCHAR(100), -- Provider's vehicle ID
  last_sync TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  tenant_id UUID NOT NULL,
  
  CONSTRAINT fk_vehicle_gps FOREIGN KEY (vehicle_id) 
    REFERENCES logistics.vehicles(id) ON DELETE CASCADE
);

CREATE INDEX idx_vehicle_gps_tenant ON logistics.vehicle_gps_mapping(tenant_id);

-- Document Archive Table (for OCR results)
CREATE TABLE IF NOT EXISTS logistics.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type VARCHAR(50) NOT NULL, -- 'load_confirmation', 'pod', 'invoice', 'waybill'
  filename VARCHAR(500) NOT NULL,
  file_url VARCHAR(1000), -- S3 URL
  file_size INTEGER, -- bytes
  mime_type VARCHAR(100),
  extracted_text TEXT,
  parsed_data JSONB,
  confidence_score DECIMAL(5, 2),
  related_trip_id UUID,
  related_load_id UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID,
  tenant_id UUID NOT NULL,
  
  CONSTRAINT fk_doc_trip FOREIGN KEY (related_trip_id) 
    REFERENCES logistics.trips(id) ON DELETE SET NULL
);

CREATE INDEX idx_documents_type ON logistics.documents(document_type);
CREATE INDEX idx_documents_trip ON logistics.documents(related_trip_id);
CREATE INDEX idx_documents_tenant ON logistics.documents(tenant_id);
CREATE INDEX idx_documents_created ON logistics.documents(created_at DESC);

-- Trip Events Table (for timeline/audit trail)
CREATE TABLE IF NOT EXISTS logistics.trip_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'created', 'started', 'arrived', 'departed', 'completed', 'incident'
  event_description TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  odometer DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  tenant_id UUID NOT NULL,
  
  CONSTRAINT fk_event_trip FOREIGN KEY (trip_id) 
    REFERENCES logistics.trips(id) ON DELETE CASCADE
);

CREATE INDEX idx_trip_events_trip ON logistics.trip_events(trip_id, created_at DESC);
CREATE INDEX idx_trip_events_type ON logistics.trip_events(event_type);
CREATE INDEX idx_trip_events_tenant ON logistics.trip_events(tenant_id);

-- Function to automatically create trip events from GPS data
CREATE OR REPLACE FUNCTION logistics.detect_trip_events()
RETURNS TRIGGER AS $$
BEGIN
  -- Detect arrival at destination (speed < 5 km/h and near destination)
  -- Detect departure from origin (speed > 10 km/h after being stationary)
  -- This is a placeholder for future implementation
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for trip event detection (disabled by default)
-- CREATE TRIGGER trigger_detect_trip_events
--   AFTER INSERT ON logistics.gps_positions
--   FOR EACH ROW
--   EXECUTE FUNCTION logistics.detect_trip_events();

-- Add GPS tracking columns to trips table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'logistics' 
    AND table_name = 'trips' 
    AND column_name = 'distance_km'
  ) THEN
    ALTER TABLE logistics.trips 
      ADD COLUMN distance_km DECIMAL(10, 2),
      ADD COLUMN estimated_duration_minutes INTEGER,
      ADD COLUMN actual_duration_minutes INTEGER,
      ADD COLUMN route_geometry JSONB;
  END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON logistics.gps_positions TO worldclass_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON logistics.carrier_rates TO worldclass_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON logistics.route_cache TO worldclass_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON logistics.gps_provider_config TO worldclass_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON logistics.vehicle_gps_mapping TO worldclass_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON logistics.documents TO worldclass_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON logistics.trip_events TO worldclass_user;
GRANT SELECT ON logistics.gps_current_positions TO worldclass_user;

COMMIT;

-- Verification
SELECT 
  'GPS positions table' as component,
  COUNT(*) as record_count
FROM logistics.gps_positions
UNION ALL
SELECT 
  'Carrier rates table',
  COUNT(*)
FROM logistics.carrier_rates
UNION ALL
SELECT 
  'GPS provider config',
  COUNT(*)
FROM logistics.gps_provider_config;
