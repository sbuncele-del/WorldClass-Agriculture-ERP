-- ============================================================================
-- LOGISTICS MODULE - DATABASE SCHEMA
-- Worldclass ERP Software
-- Created: November 10, 2025
-- ============================================================================

-- ============================================================================
-- 1. FLEET & VEHICLES
-- ============================================================================

-- Vehicle Master Table
CREATE TABLE logistics_vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Basic Information
    vehicle_number VARCHAR(50) NOT NULL UNIQUE, -- Fleet number (e.g., "TRK-001")
    registration_number VARCHAR(20) NOT NULL UNIQUE, -- License plate
    vin_number VARCHAR(50), -- Vehicle Identification Number
    make VARCHAR(100) NOT NULL, -- e.g., "Mercedes-Benz"
    model VARCHAR(100) NOT NULL, -- e.g., "Actros 2646"
    vehicle_type VARCHAR(50) NOT NULL, -- TRUCK, BAKKIE, VAN, TRAILER, TANKER
    year_of_manufacture INTEGER,
    
    -- Capacity & Specifications
    payload_capacity_kg DECIMAL(10,2), -- Maximum load capacity
    volume_capacity_m3 DECIMAL(10,2), -- Cubic meters
    fuel_type VARCHAR(20), -- DIESEL, PETROL, ELECTRIC
    fuel_tank_capacity_litres DECIMAL(10,2),
    
    -- Ownership & Financial
    ownership_type VARCHAR(20) NOT NULL DEFAULT 'OWNED', -- OWNED, LEASED, RENTED
    purchase_date DATE,
    purchase_cost DECIMAL(15,2),
    current_book_value DECIMAL(15,2),
    asset_id INTEGER, -- Link to Asset Management
    
    -- Operational Status
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, MAINTENANCE, OUT_OF_SERVICE, SOLD
    current_location VARCHAR(200), -- Last known location
    current_driver_id INTEGER, -- Current assigned driver
    
    -- Maintenance
    last_service_date DATE,
    last_service_odometer INTEGER,
    next_service_date DATE,
    next_service_odometer INTEGER,
    service_interval_km INTEGER DEFAULT 10000,
    service_interval_days INTEGER DEFAULT 90,
    
    -- Documents & Compliance
    license_expiry_date DATE,
    roadworthy_expiry_date DATE,
    insurance_expiry_date DATE,
    insurance_policy_number VARCHAR(100),
    
    -- GPS & Tracking
    gps_device_id VARCHAR(100), -- External GPS provider device ID
    gps_provider VARCHAR(50), -- CARTRACK, MIX_TELEMATICS, CTRACK
    
    -- Audit Fields
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Constraints
    CONSTRAINT chk_vehicle_status CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'SOLD')),
    CONSTRAINT chk_ownership_type CHECK (ownership_type IN ('OWNED', 'LEASED', 'RENTED')),
    CONSTRAINT chk_fuel_type CHECK (fuel_type IN ('DIESEL', 'PETROL', 'ELECTRIC', 'HYBRID'))
);

-- Indexes for performance
CREATE INDEX idx_logistics_vehicles_tenant ON logistics_vehicles(tenant_id);
CREATE INDEX idx_logistics_vehicles_status ON logistics_vehicles(status) WHERE is_active = true;
CREATE INDEX idx_logistics_vehicles_registration ON logistics_vehicles(registration_number);


-- Vehicle Maintenance Records
CREATE TABLE logistics_vehicle_maintenance (
    maintenance_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    vehicle_id INTEGER NOT NULL REFERENCES logistics_vehicles(vehicle_id),
    
    -- Maintenance Details
    maintenance_type VARCHAR(50) NOT NULL, -- SERVICE, REPAIR, INSPECTION, BREAKDOWN
    maintenance_date DATE NOT NULL,
    odometer_reading INTEGER NOT NULL,
    
    -- Service Provider
    service_provider VARCHAR(200),
    invoice_number VARCHAR(100),
    cost DECIMAL(15,2) NOT NULL DEFAULT 0,
    
    -- Work Performed
    description TEXT NOT NULL,
    parts_replaced TEXT,
    labor_hours DECIMAL(5,2),
    
    -- Next Service Scheduling
    next_service_due_date DATE,
    next_service_due_km INTEGER,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED', -- SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    
    -- Audit
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_maintenance_type CHECK (maintenance_type IN ('SERVICE', 'REPAIR', 'INSPECTION', 'BREAKDOWN')),
    CONSTRAINT chk_maintenance_status CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);

CREATE INDEX idx_vehicle_maintenance_vehicle ON logistics_vehicle_maintenance(vehicle_id);
CREATE INDEX idx_vehicle_maintenance_date ON logistics_vehicle_maintenance(maintenance_date DESC);


-- Vehicle Documents
CREATE TABLE logistics_vehicle_documents (
    document_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    vehicle_id INTEGER NOT NULL REFERENCES logistics_vehicles(vehicle_id),
    
    document_type VARCHAR(50) NOT NULL, -- LICENSE, INSURANCE, ROADWORTHY, LEASE_AGREEMENT
    document_number VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    
    -- File Storage
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_size INTEGER, -- bytes
    mime_type VARCHAR(100),
    
    -- Reminders
    reminder_days_before INTEGER DEFAULT 30, -- Alert 30 days before expiry
    
    -- Audit
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_vehicle_documents_vehicle ON logistics_vehicle_documents(vehicle_id);
CREATE INDEX idx_vehicle_documents_expiry ON logistics_vehicle_documents(expiry_date) WHERE is_active = true;


-- ============================================================================
-- 2. DRIVERS
-- ============================================================================

-- Driver Master Table
CREATE TABLE logistics_drivers (
    driver_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Link to HR System
    employee_id INTEGER, -- If driver is employee
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    id_number VARCHAR(20) NOT NULL UNIQUE, -- SA ID Number
    date_of_birth DATE,
    contact_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    physical_address TEXT,
    
    -- Employment Details
    employment_type VARCHAR(20) NOT NULL DEFAULT 'PERMANENT', -- PERMANENT, CONTRACTOR, TEMP
    date_hired DATE,
    date_terminated DATE,
    
    -- Driver License
    license_number VARCHAR(50) NOT NULL,
    license_type VARCHAR(10) NOT NULL, -- CODE_08, CODE_10, CODE_14, etc.
    license_issue_date DATE,
    license_expiry_date DATE,
    
    -- Professional Driver Permit (PrDP)
    prdp_number VARCHAR(50),
    prdp_expiry_date DATE,
    
    -- Medical Fitness
    medical_certificate_date DATE,
    medical_certificate_expiry DATE,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, ON_LEAVE, SUSPENDED, TERMINATED
    current_vehicle_id INTEGER REFERENCES logistics_vehicles(vehicle_id),
    
    -- Performance Metrics
    total_trips INTEGER DEFAULT 0,
    on_time_delivery_rate DECIMAL(5,2) DEFAULT 0, -- Percentage
    incident_count INTEGER DEFAULT 0,
    
    -- Mobile App Access
    mobile_app_enabled BOOLEAN DEFAULT true,
    mobile_phone_number VARCHAR(20),
    last_app_login TIMESTAMP,
    
    -- Audit
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    CONSTRAINT chk_driver_status CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED')),
    CONSTRAINT chk_employment_type CHECK (employment_type IN ('PERMANENT', 'CONTRACTOR', 'TEMP'))
);

CREATE INDEX idx_logistics_drivers_tenant ON logistics_drivers(tenant_id);
CREATE INDEX idx_logistics_drivers_status ON logistics_drivers(status) WHERE is_active = true;
CREATE INDEX idx_logistics_drivers_id_number ON logistics_drivers(id_number);


-- Driver Documents
CREATE TABLE logistics_driver_documents (
    document_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    driver_id INTEGER NOT NULL REFERENCES logistics_drivers(driver_id),
    
    document_type VARCHAR(50) NOT NULL, -- LICENSE, PRDP, MEDICAL, ID_COPY, CONTRACT
    document_number VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    
    -- File Storage
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- Reminders
    reminder_days_before INTEGER DEFAULT 30,
    
    -- Audit
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_driver_documents_driver ON logistics_driver_documents(driver_id);
CREATE INDEX idx_driver_documents_expiry ON logistics_driver_documents(expiry_date) WHERE is_active = true;


-- ============================================================================
-- 3. ROUTES & TRIPS
-- ============================================================================

-- Route Master (Predefined regular routes)
CREATE TABLE logistics_routes (
    route_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    route_code VARCHAR(50) NOT NULL UNIQUE,
    route_name VARCHAR(200) NOT NULL,
    
    -- Origin & Destination
    origin_location VARCHAR(200) NOT NULL,
    origin_latitude DECIMAL(10,8),
    origin_longitude DECIMAL(11,8),
    
    destination_location VARCHAR(200) NOT NULL,
    destination_latitude DECIMAL(10,8),
    destination_longitude DECIMAL(11,8),
    
    -- Route Details
    distance_km DECIMAL(10,2),
    estimated_duration_minutes INTEGER,
    route_type VARCHAR(20), -- INTERCITY, LOCAL, CROSS_BORDER
    
    -- Costs
    fuel_cost_estimate DECIMAL(15,2),
    toll_cost_estimate DECIMAL(15,2),
    standard_rate DECIMAL(15,2), -- Standard charge for this route
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logistics_routes_tenant ON logistics_routes(tenant_id);


-- Trip/Job Master
CREATE TABLE logistics_trips (
    trip_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Trip Identification
    trip_number VARCHAR(50) NOT NULL UNIQUE, -- e.g., "TRIP-2025-001234"
    
    -- Links to Sales/Purchase
    sales_order_id INTEGER, -- If linked to sales order
    customer_id INTEGER,
    
    -- Assignment
    vehicle_id INTEGER NOT NULL REFERENCES logistics_vehicles(vehicle_id),
    driver_id INTEGER NOT NULL REFERENCES logistics_drivers(driver_id),
    route_id INTEGER REFERENCES logistics_routes(route_id),
    
    -- Trip Details
    trip_date DATE NOT NULL,
    planned_start_time TIMESTAMP NOT NULL,
    planned_end_time TIMESTAMP,
    
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    
    -- Origin & Destination
    pickup_location VARCHAR(200) NOT NULL,
    pickup_contact_name VARCHAR(100),
    pickup_contact_phone VARCHAR(20),
    
    delivery_location VARCHAR(200) NOT NULL,
    delivery_contact_name VARCHAR(100),
    delivery_contact_phone VARCHAR(20),
    
    -- Cargo Details
    cargo_description TEXT,
    cargo_weight_kg DECIMAL(10,2),
    cargo_volume_m3 DECIMAL(10,2),
    number_of_items INTEGER,
    
    -- Distance & Time
    planned_distance_km DECIMAL(10,2),
    actual_distance_km DECIMAL(10,2),
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED', 
    -- PLANNED, ASSIGNED, LOADED, IN_TRANSIT, DELIVERED, CANCELLED, FAILED
    
    -- POD (Proof of Delivery)
    pod_received BOOLEAN DEFAULT false,
    pod_signature_path VARCHAR(500), -- File path to signature image
    pod_photo_path VARCHAR(500), -- Photo of delivered goods
    pod_notes TEXT,
    pod_timestamp TIMESTAMP,
    
    -- Financial
    trip_cost DECIMAL(15,2) DEFAULT 0, -- Fuel + tolls + other
    trip_revenue DECIMAL(15,2) DEFAULT 0, -- Amount charged to customer
    
    -- Audit
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_trip_status CHECK (status IN ('PLANNED', 'ASSIGNED', 'LOADED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED'))
);

CREATE INDEX idx_logistics_trips_tenant ON logistics_trips(tenant_id);
CREATE INDEX idx_logistics_trips_vehicle ON logistics_trips(vehicle_id);
CREATE INDEX idx_logistics_trips_driver ON logistics_trips(driver_id);
CREATE INDEX idx_logistics_trips_date ON logistics_trips(trip_date DESC);
CREATE INDEX idx_logistics_trips_status ON logistics_trips(status);


-- Trip Stop Points (for multi-drop deliveries)
CREATE TABLE logistics_trip_stops (
    stop_id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES logistics_trips(trip_id) ON DELETE CASCADE,
    
    stop_sequence INTEGER NOT NULL, -- Order of stops (1, 2, 3...)
    stop_type VARCHAR(20) NOT NULL, -- PICKUP, DELIVERY
    
    -- Location
    location_name VARCHAR(200) NOT NULL,
    location_address TEXT,
    location_latitude DECIMAL(10,8),
    location_longitude DECIMAL(11,8),
    
    -- Contact
    contact_name VARCHAR(100),
    contact_phone VARCHAR(20),
    
    -- Timing
    planned_arrival_time TIMESTAMP,
    actual_arrival_time TIMESTAMP,
    planned_departure_time TIMESTAMP,
    actual_departure_time TIMESTAMP,
    
    -- Items
    items_description TEXT,
    items_weight_kg DECIMAL(10,2),
    items_count INTEGER,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, ARRIVED, COMPLETED, FAILED
    notes TEXT,
    
    CONSTRAINT chk_stop_type CHECK (stop_type IN ('PICKUP', 'DELIVERY')),
    CONSTRAINT chk_stop_status CHECK (status IN ('PENDING', 'ARRIVED', 'COMPLETED', 'FAILED'))
);

CREATE INDEX idx_trip_stops_trip ON logistics_trip_stops(trip_id, stop_sequence);


-- ============================================================================
-- 4. FUEL MANAGEMENT
-- ============================================================================

-- Fuel Transactions
CREATE TABLE logistics_fuel_transactions (
    transaction_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    vehicle_id INTEGER NOT NULL REFERENCES logistics_vehicles(vehicle_id),
    driver_id INTEGER NOT NULL REFERENCES logistics_drivers(driver_id),
    trip_id INTEGER REFERENCES logistics_trips(trip_id), -- If linked to specific trip
    
    -- Transaction Details
    transaction_date TIMESTAMP NOT NULL,
    transaction_number VARCHAR(100), -- Fuel card transaction number
    
    -- Location
    fuel_station VARCHAR(200),
    location VARCHAR(200),
    
    -- Fuel Details
    fuel_type VARCHAR(20) NOT NULL, -- DIESEL, PETROL
    litres DECIMAL(10,2) NOT NULL,
    price_per_litre DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    
    -- Vehicle State
    odometer_reading INTEGER,
    
    -- Payment
    payment_method VARCHAR(50), -- FUEL_CARD, CASH, COMPANY_ACCOUNT
    fuel_card_number VARCHAR(50),
    
    -- Reconciliation
    reconciled BOOLEAN DEFAULT false,
    variance_litres DECIMAL(10,2), -- Expected vs actual
    variance_amount DECIMAL(15,2),
    
    -- Audit
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_fuel_type CHECK (fuel_type IN ('DIESEL', 'PETROL', 'ELECTRIC'))
);

CREATE INDEX idx_fuel_transactions_vehicle ON logistics_fuel_transactions(vehicle_id);
CREATE INDEX idx_fuel_transactions_date ON logistics_fuel_transactions(transaction_date DESC);
CREATE INDEX idx_fuel_transactions_reconciled ON logistics_fuel_transactions(reconciled) WHERE reconciled = false;


-- ============================================================================
-- 5. GPS TRACKING & TELEMETRY
-- ============================================================================

-- GPS Location History
CREATE TABLE logistics_gps_tracking (
    tracking_id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    vehicle_id INTEGER NOT NULL REFERENCES logistics_vehicles(vehicle_id),
    trip_id INTEGER REFERENCES logistics_trips(trip_id),
    
    -- Location
    timestamp TIMESTAMP NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    altitude DECIMAL(10,2),
    
    -- Vehicle State
    speed_kmh DECIMAL(5,2),
    heading INTEGER, -- Compass direction (0-360)
    odometer INTEGER,
    engine_status VARCHAR(20), -- ON, OFF, IDLING
    
    -- GPS Quality
    gps_accuracy INTEGER, -- meters
    satellite_count INTEGER,
    
    -- External Provider Data
    provider VARCHAR(50), -- CARTRACK, MIX_TELEMATICS
    provider_event_id VARCHAR(100)
);

-- Partition by month for performance
CREATE INDEX idx_gps_tracking_vehicle_time ON logistics_gps_tracking(vehicle_id, timestamp DESC);
CREATE INDEX idx_gps_tracking_trip ON logistics_gps_tracking(trip_id) WHERE trip_id IS NOT NULL;


-- Geofence Definitions
CREATE TABLE logistics_geofences (
    geofence_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    geofence_name VARCHAR(200) NOT NULL,
    geofence_type VARCHAR(50) NOT NULL, -- CUSTOMER_SITE, DEPOT, FUEL_STATION, RESTRICTED_AREA
    
    -- Center Point
    center_latitude DECIMAL(10,8) NOT NULL,
    center_longitude DECIMAL(11,8) NOT NULL,
    radius_meters INTEGER NOT NULL, -- Circular geofence radius
    
    -- Alerts
    alert_on_entry BOOLEAN DEFAULT false,
    alert_on_exit BOOLEAN DEFAULT false,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Audit
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_geofences_tenant ON logistics_geofences(tenant_id) WHERE is_active = true;


-- Geofence Events
CREATE TABLE logistics_geofence_events (
    event_id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    vehicle_id INTEGER NOT NULL REFERENCES logistics_vehicles(vehicle_id),
    geofence_id INTEGER NOT NULL REFERENCES logistics_geofences(geofence_id),
    
    event_type VARCHAR(20) NOT NULL, -- ENTRY, EXIT
    event_timestamp TIMESTAMP NOT NULL,
    
    -- Location at event
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Notification
    notification_sent BOOLEAN DEFAULT false,
    
    CONSTRAINT chk_event_type CHECK (event_type IN ('ENTRY', 'EXIT'))
);

CREATE INDEX idx_geofence_events_vehicle ON logistics_geofence_events(vehicle_id, event_timestamp DESC);


-- ============================================================================
-- 6. LOAD PLANNING
-- ============================================================================

-- Load Planning Header
CREATE TABLE logistics_loads (
    load_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    load_number VARCHAR(50) NOT NULL UNIQUE,
    load_date DATE NOT NULL,
    
    -- Planning Status
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, PLANNED, ASSIGNED, IN_PROGRESS, COMPLETED
    
    -- Assignments
    vehicle_id INTEGER REFERENCES logistics_vehicles(vehicle_id),
    driver_id INTEGER REFERENCES logistics_drivers(driver_id),
    
    -- Load Details
    total_weight_kg DECIMAL(10,2),
    total_volume_m3 DECIMAL(10,2),
    number_of_orders INTEGER,
    
    -- Route Optimization
    optimized BOOLEAN DEFAULT false,
    optimization_algorithm VARCHAR(50), -- SHORTEST_TIME, SHORTEST_DISTANCE, LOWEST_COST
    
    -- Audit
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_load_status CHECK (status IN ('DRAFT', 'PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'))
);

CREATE INDEX idx_logistics_loads_tenant ON logistics_loads(tenant_id);
CREATE INDEX idx_logistics_loads_date ON logistics_loads(load_date DESC);


-- Load Items (Multiple orders/deliveries on one load)
CREATE TABLE logistics_load_items (
    load_item_id SERIAL PRIMARY KEY,
    load_id INTEGER NOT NULL REFERENCES logistics_loads(load_id) ON DELETE CASCADE,
    
    sales_order_id INTEGER,
    customer_id INTEGER,
    
    -- Delivery Details
    delivery_address TEXT NOT NULL,
    delivery_contact VARCHAR(100),
    delivery_phone VARCHAR(20),
    
    -- Items
    item_description TEXT,
    weight_kg DECIMAL(10,2),
    volume_m3 DECIMAL(10,2),
    quantity INTEGER,
    
    -- Timing
    delivery_time_window_start TIMESTAMP,
    delivery_time_window_end TIMESTAMP,
    
    -- Sequence
    delivery_sequence INTEGER, -- Order in which to deliver
    
    -- Status
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, LOADED, DELIVERED, FAILED
    
    CONSTRAINT chk_load_item_status CHECK (status IN ('PENDING', 'LOADED', 'DELIVERED', 'FAILED'))
);

CREATE INDEX idx_load_items_load ON logistics_load_items(load_id);


-- ============================================================================
-- 7. INCIDENTS & ACCIDENTS
-- ============================================================================

CREATE TABLE logistics_incidents (
    incident_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    incident_number VARCHAR(50) NOT NULL UNIQUE,
    incident_date TIMESTAMP NOT NULL,
    
    -- Involved Parties
    vehicle_id INTEGER REFERENCES logistics_vehicles(vehicle_id),
    driver_id INTEGER REFERENCES logistics_drivers(driver_id),
    trip_id INTEGER REFERENCES logistics_trips(trip_id),
    
    -- Incident Details
    incident_type VARCHAR(50) NOT NULL, -- ACCIDENT, BREAKDOWN, THEFT, HIJACKING, TRAFFIC_VIOLATION
    severity VARCHAR(20) NOT NULL, -- MINOR, MODERATE, SEVERE, CRITICAL
    
    -- Location
    location_description TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Description
    description TEXT NOT NULL,
    police_case_number VARCHAR(100),
    insurance_claim_number VARCHAR(100),
    
    -- Financial Impact
    estimated_cost DECIMAL(15,2),
    actual_cost DECIMAL(15,2),
    insurance_payout DECIMAL(15,2),
    
    -- Resolution
    status VARCHAR(20) NOT NULL DEFAULT 'REPORTED', -- REPORTED, INVESTIGATING, RESOLVED, CLOSED
    resolution_notes TEXT,
    resolved_date DATE,
    
    -- Audit
    reported_by UUID NOT NULL REFERENCES users(id),
    reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_incident_type CHECK (incident_type IN ('ACCIDENT', 'BREAKDOWN', 'THEFT', 'HIJACKING', 'TRAFFIC_VIOLATION', 'OTHER')),
    CONSTRAINT chk_incident_severity CHECK (severity IN ('MINOR', 'MODERATE', 'SEVERE', 'CRITICAL')),
    CONSTRAINT chk_incident_status CHECK (status IN ('REPORTED', 'INVESTIGATING', 'RESOLVED', 'CLOSED'))
);

CREATE INDEX idx_logistics_incidents_tenant ON logistics_incidents(tenant_id);
CREATE INDEX idx_logistics_incidents_date ON logistics_incidents(incident_date DESC);
CREATE INDEX idx_logistics_incidents_vehicle ON logistics_incidents(vehicle_id);


-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE logistics_vehicles IS 'Master table for fleet vehicles including trucks, bakkies, vans, and trailers';
COMMENT ON TABLE logistics_drivers IS 'Driver master data with license, PrDP, and performance tracking';
COMMENT ON TABLE logistics_trips IS 'Individual trips/jobs with POD and tracking';
COMMENT ON TABLE logistics_fuel_transactions IS 'Fuel purchases with reconciliation support';
COMMENT ON TABLE logistics_gps_tracking IS 'Real-time GPS location history from tracking providers';
COMMENT ON TABLE logistics_loads IS 'Load planning with multi-drop route optimization';

-- ============================================================================
-- END OF LOGISTICS MODULE SCHEMA
-- ============================================================================
