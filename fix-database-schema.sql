-- ============================================================================
-- DATABASE SCHEMA FIX SCRIPT
-- Run this on RDS to fix missing columns and schema issues
-- ============================================================================

-- Fix tenants table - add missing columns
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_email VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_phone VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS province VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'South Africa';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tax_number VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Africa/Johannesburg';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'ZAR';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS fiscal_year_end VARCHAR(10) DEFAULT '12-31';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);

-- Set company_name from name if not set
UPDATE tenants SET company_name = name WHERE company_name IS NULL;

-- ============================================================================
-- Create logistics schema if not exists
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS logistics;

-- ============================================================================
-- TRIPS TABLE - Create with correct columns for the routes
-- ============================================================================
DROP TABLE IF EXISTS logistics.trips CASCADE;
CREATE TABLE logistics.trips (
    trip_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    trip_number VARCHAR(50),
    customer VARCHAR(255),
    origin VARCHAR(255),
    destination VARCHAR(255),
    driver VARCHAR(255),
    vehicle_reg VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Pending',
    pod_status VARCHAR(50) DEFAULT 'Pending',
    eta TIMESTAMP,
    cargo_description TEXT,
    cargo_weight_kg DECIMAL(10,2),
    distance_km DECIMAL(10,2),
    revenue DECIMAL(15,2) DEFAULT 0,
    cost DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FUEL TRANSACTIONS TABLE
-- ============================================================================
DROP TABLE IF EXISTS logistics.fuel_transactions CASCADE;
CREATE TABLE logistics.fuel_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    vehicle_id UUID,
    driver_id UUID,
    trip_id UUID,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transaction_number VARCHAR(50),
    fuel_station VARCHAR(100),
    location VARCHAR(255),
    fuel_type VARCHAR(20) DEFAULT 'Diesel',
    litres DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_per_litre DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    odometer_reading DECIMAL(12,2),
    payment_method VARCHAR(20),
    fuel_card_number VARCHAR(50),
    receipt_image_path VARCHAR(500),
    reconciled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- VEHICLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS logistics.vehicles (
    vehicle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    vehicle_registration VARCHAR(50) NOT NULL,
    make VARCHAR(50),
    model VARCHAR(50),
    vehicle_type VARCHAR(50) DEFAULT 'Truck',
    year INTEGER,
    status VARCHAR(20) DEFAULT 'Active',
    current_driver VARCHAR(255),
    fuel_type VARCHAR(20) DEFAULT 'Diesel',
    odometer DECIMAL(12,2) DEFAULT 0,
    last_service_date DATE,
    next_service_date DATE,
    insurance_expiry DATE,
    license_expiry DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- DRIVERS TABLE  
-- ============================================================================
CREATE TABLE IF NOT EXISTS logistics.drivers (
    driver_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    id_number VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    license_number VARCHAR(50),
    license_type VARCHAR(20),
    license_expiry DATE,
    status VARCHAR(20) DEFAULT 'Active',
    current_vehicle_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- LOADS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS logistics.loads (
    load_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    load_number VARCHAR(50),
    load_date DATE,
    vehicle_id UUID,
    driver_id UUID,
    total_weight_kg DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_trips_tenant ON logistics.trips(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON logistics.trips(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant ON logistics.vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_drivers_tenant ON logistics.drivers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fuel_tenant ON logistics.fuel_transactions(tenant_id);

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Sample vehicles
INSERT INTO logistics.vehicles (tenant_id, vehicle_registration, make, model, vehicle_type, year, status)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'ABC 123 GP', 'Toyota', 'Hilux', 'LDV', 2022, 'Active'),
    ('00000000-0000-0000-0000-000000000001', 'DEF 456 GP', 'Isuzu', 'NPR 400', 'Truck', 2021, 'Active'),
    ('00000000-0000-0000-0000-000000000001', 'GHI 789 GP', 'Mercedes', 'Actros', 'Horse', 2020, 'Active'),
    ('00000000-0000-0000-0000-000000000001', 'JKL 012 GP', 'Hino', '500', 'Truck', 2023, 'Active'),
    ('00000000-0000-0000-0000-000000000001', 'MNO 345 GP', 'Volvo', 'FH16', 'Horse', 2022, 'Available')
ON CONFLICT DO NOTHING;

-- Sample drivers
INSERT INTO logistics.drivers (tenant_id, first_name, last_name, id_number, phone, license_type, status)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'John', 'Mthembu', '8501015123456', '0821234567', 'CODE 14', 'Active'),
    ('00000000-0000-0000-0000-000000000001', 'Peter', 'Nkosi', '9002025234567', '0832345678', 'CODE 10', 'Active'),
    ('00000000-0000-0000-0000-000000000001', 'David', 'Molefe', '8803035345678', '0843456789', 'CODE 14', 'Active'),
    ('00000000-0000-0000-0000-000000000001', 'Samuel', 'Dlamini', '8504045456789', '0854567890', 'CODE 14', 'Active'),
    ('00000000-0000-0000-0000-000000000001', 'Thabo', 'Sithole', '9005055567890', '0865678901', 'CODE 10', 'Available')
ON CONFLICT DO NOTHING;

-- Sample trips
INSERT INTO logistics.trips (tenant_id, trip_number, customer, origin, destination, driver, vehicle_reg, status, pod_status, eta)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'TRP-001', 'Shoprite Checkers', 'Johannesburg', 'Pretoria', 'John Mthembu', 'ABC 123 GP', 'In Transit', 'Pending', NOW() + INTERVAL '2 hours'),
    ('00000000-0000-0000-0000-000000000001', 'TRP-002', 'Pick n Pay', 'Cape Town', 'Stellenbosch', 'Peter Nkosi', 'DEF 456 GP', 'In Transit', 'Pending', NOW() + INTERVAL '4 hours'),
    ('00000000-0000-0000-0000-000000000001', 'TRP-003', 'Woolworths', 'Durban', 'Pietermaritzburg', 'David Molefe', 'GHI 789 GP', 'Completed', 'Received', NOW() - INTERVAL '1 day'),
    ('00000000-0000-0000-0000-000000000001', 'TRP-004', 'Massmart', 'Bloemfontein', 'Kimberley', 'Samuel Dlamini', 'JKL 012 GP', 'Planned', 'Pending', NOW() + INTERVAL '1 day'),
    ('00000000-0000-0000-0000-000000000001', 'TRP-005', 'Makro', 'Port Elizabeth', 'East London', 'Thabo Sithole', 'MNO 345 GP', 'Completed', 'Received', NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- Sample fuel transactions
INSERT INTO logistics.fuel_transactions (tenant_id, transaction_number, fuel_station, location, fuel_type, litres, price_per_litre, total_amount, transaction_date)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'FUEL-001', 'Engen N1', 'Johannesburg', 'Diesel', 150.00, 24.50, 3675.00, NOW() - INTERVAL '1 day'),
    ('00000000-0000-0000-0000-000000000001', 'FUEL-002', 'Shell N2', 'Cape Town', 'Diesel', 200.00, 24.30, 4860.00, NOW() - INTERVAL '2 days'),
    ('00000000-0000-0000-0000-000000000001', 'FUEL-003', 'BP N3', 'Durban', 'Diesel', 180.00, 24.45, 4401.00, NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

SELECT 'Database schema fixed successfully!' as result;
