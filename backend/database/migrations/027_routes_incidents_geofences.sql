-- =====================================================
-- Routes, Incidents, and Geofences Tables
-- Complete CRUD support for logistics module
-- =====================================================

-- ===========================================
-- ROUTES TABLE
-- Predefined routes with waypoints
-- ===========================================
CREATE TABLE IF NOT EXISTS routes (
    route_id SERIAL PRIMARY KEY,
    tenant_id INTEGER,
    route_name VARCHAR(255) NOT NULL,
    route_code VARCHAR(50),
    description TEXT,
    origin_address TEXT NOT NULL,
    origin_lat DECIMAL(10, 8),
    origin_lng DECIMAL(11, 8),
    destination_address TEXT NOT NULL,
    destination_lat DECIMAL(10, 8),
    destination_lng DECIMAL(11, 8),
    distance_km DECIMAL(10, 2),
    estimated_duration_minutes INTEGER,
    toll_cost DECIMAL(10, 2) DEFAULT 0,
    fuel_estimate_liters DECIMAL(10, 2),
    route_type VARCHAR(50) DEFAULT 'standard', -- standard, express, economy, hazmat
    is_active BOOLEAN DEFAULT TRUE,
    waypoints JSONB, -- Array of {lat, lng, address, stop_duration_minutes}
    restrictions JSONB, -- {max_weight_kg, max_height_m, hazmat_allowed, night_allowed}
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routes_tenant ON routes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_routes_active ON routes(is_active);
CREATE INDEX IF NOT EXISTS idx_routes_code ON routes(route_code);

-- ===========================================
-- INCIDENTS TABLE
-- Accidents, breakdowns, delays, violations
-- ===========================================
CREATE TABLE IF NOT EXISTS incidents (
    incident_id SERIAL PRIMARY KEY,
    tenant_id INTEGER,
    incident_number VARCHAR(50) UNIQUE,
    incident_type VARCHAR(50) NOT NULL, -- accident, breakdown, delay, theft, damage, violation, weather, other
    severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- low, medium, high, critical
    status VARCHAR(30) DEFAULT 'reported', -- reported, investigating, resolved, closed
    
    -- Related entities
    trip_id INTEGER,
    vehicle_id INTEGER,
    driver_id INTEGER,
    
    -- Location
    location_address TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    
    -- Timing
    incident_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reported_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_date TIMESTAMP WITH TIME ZONE,
    
    -- Details
    description TEXT NOT NULL,
    cause TEXT,
    injuries_count INTEGER DEFAULT 0,
    fatalities_count INTEGER DEFAULT 0,
    property_damage BOOLEAN DEFAULT FALSE,
    damage_estimate DECIMAL(12, 2),
    
    -- Insurance
    insurance_claim_number VARCHAR(100),
    insurance_status VARCHAR(30), -- not_filed, filed, approved, denied, settled
    
    -- Police/Authority
    police_report_number VARCHAR(100),
    police_report_filed BOOLEAN DEFAULT FALSE,
    
    -- Documentation
    photos JSONB, -- Array of photo URLs
    documents JSONB, -- Array of document URLs
    witness_info JSONB, -- Array of {name, contact, statement}
    
    -- Resolution
    resolution_notes TEXT,
    corrective_actions TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    
    -- Audit
    reported_by INTEGER,
    assigned_to INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_tenant ON incidents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_date ON incidents(incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_vehicle ON incidents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_incidents_driver ON incidents(driver_id);

-- ===========================================
-- GEOFENCES TABLE
-- Geographic zones for alerts and tracking
-- ===========================================
CREATE TABLE IF NOT EXISTS geofences (
    geofence_id SERIAL PRIMARY KEY,
    tenant_id INTEGER,
    geofence_name VARCHAR(255) NOT NULL,
    geofence_code VARCHAR(50),
    geofence_type VARCHAR(50) NOT NULL, -- customer_site, warehouse, restricted_zone, speed_zone, delivery_zone, no_go_zone
    
    -- Geometry (supports circle or polygon)
    geometry_type VARCHAR(20) NOT NULL DEFAULT 'circle', -- circle, polygon
    center_lat DECIMAL(10, 8), -- For circle
    center_lng DECIMAL(11, 8), -- For circle
    radius_meters INTEGER, -- For circle
    polygon_coordinates JSONB, -- For polygon: Array of {lat, lng}
    
    -- Settings
    is_active BOOLEAN DEFAULT TRUE,
    alert_on_enter BOOLEAN DEFAULT TRUE,
    alert_on_exit BOOLEAN DEFAULT TRUE,
    alert_on_dwell BOOLEAN DEFAULT FALSE,
    dwell_time_minutes INTEGER, -- Alert if vehicle stays longer than this
    speed_limit_kmh INTEGER, -- For speed zones
    
    -- Schedule (when geofence is active)
    schedule JSONB, -- {days: [1,2,3,4,5], start_time: "08:00", end_time: "18:00"}
    
    -- Alert recipients
    alert_emails TEXT[], -- Array of email addresses
    alert_phone_numbers TEXT[], -- Array of phone numbers for SMS
    
    -- Associated entities
    customer_id INTEGER,
    address TEXT,
    
    -- Metadata
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for map display
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geofences_tenant ON geofences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_geofences_type ON geofences(geofence_type);
CREATE INDEX IF NOT EXISTS idx_geofences_active ON geofences(is_active);
CREATE INDEX IF NOT EXISTS idx_geofences_customer ON geofences(customer_id);

-- ===========================================
-- GEOFENCE EVENTS TABLE
-- Log of geofence entries/exits
-- ===========================================
CREATE TABLE IF NOT EXISTS geofence_events (
    event_id SERIAL PRIMARY KEY,
    tenant_id INTEGER,
    geofence_id INTEGER REFERENCES geofences(geofence_id),
    vehicle_id INTEGER,
    driver_id INTEGER,
    trip_id INTEGER,
    event_type VARCHAR(20) NOT NULL, -- enter, exit, dwell, speeding
    event_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    speed_kmh INTEGER,
    alert_sent BOOLEAN DEFAULT FALSE,
    alert_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by INTEGER,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_geofence_events_geofence ON geofence_events(geofence_id);
CREATE INDEX IF NOT EXISTS idx_geofence_events_vehicle ON geofence_events(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_geofence_events_time ON geofence_events(event_time DESC);

-- Add sequence for incident numbers
CREATE SEQUENCE IF NOT EXISTS incident_number_seq START 1000;

-- Function to auto-generate incident numbers
CREATE OR REPLACE FUNCTION generate_incident_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.incident_number IS NULL THEN
        NEW.incident_number := 'INC-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(nextval('incident_number_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for incident number
DROP TRIGGER IF EXISTS trg_incident_number ON incidents;
CREATE TRIGGER trg_incident_number
    BEFORE INSERT ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION generate_incident_number();

SELECT 'Routes, Incidents, and Geofences tables created successfully!' as result;
