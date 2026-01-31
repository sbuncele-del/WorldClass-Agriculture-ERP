-- ============================================================================
-- LOGISTICS MODULE DATABASE SCHEMA
-- Run this migration to create all logistics tables
-- ============================================================================

-- Create logistics schema
CREATE SCHEMA IF NOT EXISTS logistics;

-- ============================================================================
-- VEHICLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS logistics.vehicles (
    vehicle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    vehicle_number VARCHAR(50),
    vehicle_registration VARCHAR(20) NOT NULL,
    vin_number VARCHAR(50),
    make VARCHAR(50),
    model VARCHAR(50),
    vehicle_type VARCHAR(50) DEFAULT 'TRUCK',
    year_of_manufacture INTEGER,
    payload_capacity_kg DECIMAL(10,2),
    volume_capacity_m3 DECIMAL(10,2),
    fuel_type VARCHAR(20) DEFAULT 'DIESEL',
    fuel_tank_capacity_litres DECIMAL(10,2),
    ownership_type VARCHAR(20) DEFAULT 'OWNED',
    purchase_date DATE,
    purchase_cost DECIMAL(15,2),
    asset_id UUID,
    current_odometer DECIMAL(12,2) DEFAULT 0,
    current_location VARCHAR(255),
    driver_id UUID,
    service_interval_km INTEGER DEFAULT 10000,
    service_interval_days INTEGER DEFAULT 90,
    last_service_date DATE,
    last_service_odometer DECIMAL(12,2),
    next_service_date DATE,
    next_service_odometer DECIMAL(12,2),
    gps_device_id VARCHAR(100),
    gps_provider VARCHAR(50),
    insurance_policy_number VARCHAR(100),
    insurance_expiry_date DATE,
    license_disk_expiry_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- DRIVERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS logistics.drivers (
    driver_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id VARCHAR(50),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    id_number VARCHAR(20),
    date_of_birth DATE,
    phone VARCHAR(20),
    email VARCHAR(255),
    physical_address TEXT,
    employment_type VARCHAR(20) DEFAULT 'PERMANENT',
    employment_status VARCHAR(20) DEFAULT 'ACTIVE',
    date_hired DATE,
    license_number VARCHAR(50),
    license_type VARCHAR(20),
    license_issue_date DATE,
    license_expiry_date DATE,
    prdp_number VARCHAR(50),
    prdp_expiry_date DATE,
    current_vehicle_id UUID,
    mobile_app_enabled BOOLEAN DEFAULT true,
    mobile_phone_number VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TRIPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS logistics.trips (
    trip_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    trip_number VARCHAR(50) NOT NULL UNIQUE,
    sales_order_id UUID,
    customer_id UUID,
    vehicle_id UUID REFERENCES logistics.vehicles(vehicle_id),
    driver_id UUID REFERENCES logistics.drivers(driver_id),
    route_id UUID,
    trip_date DATE NOT NULL,
    planned_start_time TIMESTAMP,
    planned_end_time TIMESTAMP,
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    pickup_location VARCHAR(255),
    pickup_contact_name VARCHAR(100),
    pickup_contact_phone VARCHAR(20),
    delivery_location VARCHAR(255),
    delivery_contact_name VARCHAR(100),
    delivery_contact_phone VARCHAR(20),
    cargo_description TEXT,
    cargo_weight_kg DECIMAL(10,2),
    cargo_volume_m3 DECIMAL(10,2),
    number_of_items INTEGER,
    planned_distance_km DECIMAL(10,2),
    actual_distance_km DECIMAL(10,2),
    trip_revenue DECIMAL(15,2) DEFAULT 0,
    trip_cost DECIMAL(15,2) DEFAULT 0,
    pod_received BOOLEAN DEFAULT false,
    pod_signature_path VARCHAR(500),
    pod_photo_path VARCHAR(500),
    pod_notes TEXT,
    pod_timestamp TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PLANNED',
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FUEL TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS logistics.fuel_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    vehicle_id UUID REFERENCES logistics.vehicles(vehicle_id),
    driver_id UUID REFERENCES logistics.drivers(driver_id),
    trip_id UUID REFERENCES logistics.trips(trip_id),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transaction_number VARCHAR(50),
    fuel_station VARCHAR(100),
    location VARCHAR(255),
    fuel_type VARCHAR(20),
    litres DECIMAL(10,2) NOT NULL,
    price_per_litre DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    odometer_reading DECIMAL(12,2),
    payment_method VARCHAR(20),
    fuel_card_number VARCHAR(50),
    receipt_image_path VARCHAR(500),
    reconciled BOOLEAN DEFAULT false,
    variance_litres DECIMAL(10,2) DEFAULT 0,
    variance_amount DECIMAL(15,2) DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- LOADS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS logistics.loads (
    load_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    load_number VARCHAR(50) NOT NULL UNIQUE,
    load_date DATE NOT NULL,
    vehicle_id UUID REFERENCES logistics.vehicles(vehicle_id),
    driver_id UUID REFERENCES logistics.drivers(driver_id),
    total_weight_kg DECIMAL(10,2) DEFAULT 0,
    total_volume_m3 DECIMAL(10,2) DEFAULT 0,
    number_of_orders INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'DRAFT',
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TRIP STOPS TABLE (GAP-003 FIX)
-- ============================================================================
CREATE TABLE IF NOT EXISTS logistics_trip_stops (
    stop_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES logistics.trips(trip_id) ON DELETE CASCADE,
    stop_sequence INTEGER NOT NULL,
    stop_type VARCHAR(20) DEFAULT 'PICKUP',
    location_name VARCHAR(255),
    location_address TEXT,
    contact_name VARCHAR(100),
    contact_phone VARCHAR(20),
    planned_arrival_time TIMESTAMP,
    actual_arrival_time TIMESTAMP,
    items_description TEXT,
    items_weight_kg DECIMAL(10,2),
    items_count INTEGER,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- LOAD ITEMS TABLE (GAP-003 FIX)
-- ============================================================================
CREATE TABLE IF NOT EXISTS logistics_load_items (
    load_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id UUID NOT NULL REFERENCES logistics.loads(load_id) ON DELETE CASCADE,
    sales_order_id UUID,
    customer_id UUID,
    delivery_address TEXT,
    delivery_contact VARCHAR(100),
    delivery_phone VARCHAR(20),
    item_description TEXT,
    weight_kg DECIMAL(10,2),
    volume_m3 DECIMAL(10,2),
    quantity INTEGER,
    delivery_sequence INTEGER,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_logistics_vehicles_tenant ON logistics.vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_logistics_vehicles_status ON logistics.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_logistics_drivers_tenant ON logistics.drivers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_logistics_drivers_status ON logistics.drivers(status);
CREATE INDEX IF NOT EXISTS idx_logistics_trips_tenant ON logistics.trips(tenant_id);
CREATE INDEX IF NOT EXISTS idx_logistics_trips_date ON logistics.trips(trip_date);
CREATE INDEX IF NOT EXISTS idx_logistics_trips_status ON logistics.trips(status);
CREATE INDEX IF NOT EXISTS idx_logistics_fuel_vehicle ON logistics.fuel_transactions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_logistics_fuel_date ON logistics.fuel_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_logistics_trip_stops_trip ON logistics_trip_stops(trip_id, stop_sequence);
CREATE INDEX IF NOT EXISTS idx_logistics_load_items_load ON logistics_load_items(load_id, delivery_sequence);

-- ============================================================================
-- SAMPLE DATA (for demo tenant)
-- ============================================================================
INSERT INTO logistics.vehicles (tenant_id, vehicle_registration, make, model, vehicle_type, year_of_manufacture, status)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'ABC 123 GP', 'Toyota', 'Hilux', 'LDV', 2022, 'ACTIVE'),
    ('00000000-0000-0000-0000-000000000001', 'DEF 456 GP', 'Isuzu', 'NPR 400', 'TRUCK', 2021, 'ACTIVE'),
    ('00000000-0000-0000-0000-000000000001', 'GHI 789 GP', 'Mercedes', 'Actros', 'HORSE', 2020, 'ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO logistics.drivers (tenant_id, first_name, last_name, id_number, phone, license_type, status)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'John', 'Mthembu', '8501015123456', '0821234567', 'CODE 14', 'ACTIVE'),
    ('00000000-0000-0000-0000-000000000001', 'Peter', 'Nkosi', '9002025234567', '0832345678', 'CODE 10', 'ACTIVE'),
    ('00000000-0000-0000-0000-000000000001', 'David', 'Molefe', '8803035345678', '0843456789', 'CODE 14', 'ACTIVE')
ON CONFLICT DO NOTHING;

SELECT 'Logistics schema created successfully' as result;
