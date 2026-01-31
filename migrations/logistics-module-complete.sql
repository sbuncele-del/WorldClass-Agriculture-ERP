-- ============================================================================
-- LOGISTICS MODULE - COMPLETE DATABASE SCHEMA
-- Created: November 20, 2025
-- ============================================================================

-- Create logistics schema
CREATE SCHEMA IF NOT EXISTS logistics;

-- ============================================================================
-- VEHICLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS logistics.vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    vehicle_registration VARCHAR(50) UNIQUE NOT NULL,
    vehicle_type VARCHAR(100) NOT NULL,
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    capacity_kg NUMERIC(10,2),
    capacity_m3 NUMERIC(10,2),
    fuel_type VARCHAR(50),
    fuel_tank_capacity NUMERIC(10,2),
    license_expiry_date DATE,
    insurance_expiry_date DATE,
    last_service_date DATE,
    next_service_date DATE,
    current_mileage INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- DRIVERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS logistics.drivers (
    driver_id SERIAL PRIMARY KEY,
    driver_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    id_number VARCHAR(50),
    license_number VARCHAR(50),
    license_expiry_date DATE,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    employment_status VARCHAR(50) DEFAULT 'ACTIVE',
    hire_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TRIPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS logistics.trips (
    trip_id SERIAL PRIMARY KEY,
    trip_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_id INTEGER REFERENCES logistics.vehicles(vehicle_id),
    driver_id INTEGER REFERENCES logistics.drivers(driver_id),
    trip_date DATE NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    distance_km NUMERIC(10,2),
    start_mileage INTEGER,
    end_mileage INTEGER,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PLANNED',
    load_value NUMERIC(15,2),
    commodity VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- LOADS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS logistics.loads (
    load_id SERIAL PRIMARY KEY,
    load_number VARCHAR(50) UNIQUE NOT NULL,
    trip_id INTEGER REFERENCES logistics.trips(trip_id),
    order_number VARCHAR(50),
    load_date DATE NOT NULL,
    from_location VARCHAR(255) NOT NULL,
    to_location VARCHAR(255) NOT NULL,
    quantity NUMERIC(15,2),
    rate NUMERIC(15,2),
    value_excl NUMERIC(15,2),
    value_incl NUMERIC(15,2),
    commodity VARCHAR(255),
    status VARCHAR(50) DEFAULT 'REQUESTED',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FUEL TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS logistics.fuel_transactions (
    fuel_transaction_id SERIAL PRIMARY KEY,
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_id INTEGER REFERENCES logistics.vehicles(vehicle_id),
    driver_id INTEGER REFERENCES logistics.drivers(driver_id),
    trip_id INTEGER REFERENCES logistics.trips(trip_id),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fuel_station VARCHAR(255),
    fuel_type VARCHAR(50),
    quantity_liters NUMERIC(10,2) NOT NULL,
    cost_per_liter NUMERIC(10,2),
    total_cost NUMERIC(15,2) NOT NULL,
    mileage_at_fill INTEGER,
    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciled_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MAINTENANCE RECORDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS logistics.maintenance_records (
    maintenance_id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES logistics.vehicles(vehicle_id),
    maintenance_date DATE NOT NULL,
    maintenance_type VARCHAR(100) NOT NULL,
    description TEXT,
    cost NUMERIC(15,2),
    mileage INTEGER,
    service_provider VARCHAR(255),
    next_service_date DATE,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert Vehicles
INSERT INTO logistics.vehicles (vehicle_registration, vehicle_type, make, model, year, capacity_kg, fuel_type, fuel_tank_capacity, current_mileage, status) VALUES
('ABC123GP', 'Truck - 8 Ton', 'Isuzu', 'NPR 400', 2020, 8000, 'Diesel', 100, 85000, 'ACTIVE'),
('DEF456GP', 'Truck - 4 Ton', 'Hino', '300 Series', 2021, 4000, 'Diesel', 80, 45000, 'ACTIVE'),
('GHI789GP', 'Bakkie', 'Toyota', 'Hilux 2.8 GD-6', 2022, 1000, 'Diesel', 80, 32000, 'ACTIVE'),
('JKL012GP', 'Truck - 12 Ton', 'UD', 'Quon', 2019, 12000, 'Diesel', 150, 125000, 'ACTIVE'),
('MNO345GP', 'Van', 'Mercedes-Benz', 'Sprinter', 2023, 2000, 'Diesel', 70, 15000, 'ACTIVE');

-- Insert Drivers
INSERT INTO logistics.drivers (driver_code, first_name, last_name, license_number, phone, employment_status, hire_date) VALUES
('DRV-001', 'Thabo', 'Molefe', 'L1234567', '0821234567', 'ACTIVE', '2019-03-15'),
('DRV-002', 'Sipho', 'Dlamini', 'L2345678', '0832345678', 'ACTIVE', '2020-06-01'),
('DRV-003', 'John', 'van der Merwe', 'L3456789', '0843456789', 'ACTIVE', '2021-01-10'),
('DRV-004', 'Patrick', 'Nkosi', 'L4567890', '0854567890', 'ACTIVE', '2021-08-20'),
('DRV-005', 'Michael', 'Smith', 'L5678901', '0865678901', 'ACTIVE', '2022-11-05');

-- Insert Trips
INSERT INTO logistics.trips (trip_number, vehicle_id, driver_id, trip_date, origin, destination, distance_km, status, load_value, commodity) VALUES
('TRP-2024-001', 1, 1, '2024-11-01', 'Johannesburg', 'Durban', 575, 'COMPLETED', 125000, 'Electronics'),
('TRP-2024-002', 2, 2, '2024-11-05', 'Pretoria', 'Cape Town', 1450, 'COMPLETED', 89000, 'Clothing'),
('TRP-2024-003', 3, 3, '2024-11-10', 'Johannesburg', 'Bloemfontein', 400, 'IN_TRANSIT', 45000, 'Office Supplies'),
('TRP-2024-004', 4, 4, '2024-11-15', 'Durban', 'Port Elizabeth', 725, 'PLANNED', 175000, 'Industrial Equipment'),
('TRP-2024-005', 5, 5, '2024-11-18', 'Johannesburg', 'Polokwane', 270, 'PLANNED', 32000, 'Groceries');

-- Insert Loads
INSERT INTO logistics.loads (load_number, trip_id, order_number, load_date, from_location, to_location, quantity, rate, value_excl, value_incl, commodity, status) VALUES
('LD-2024-001', 1, 'SO-2024-101', '2024-11-01', 'Johannesburg Warehouse', 'Durban Client A', 5000, 25.00, 125000, 143750, 'Electronics', 'DELIVERED'),
('LD-2024-002', 2, 'SO-2024-102', '2024-11-05', 'Pretoria Depot', 'Cape Town Store', 3200, 27.81, 89000, 102350, 'Clothing', 'DELIVERED'),
('LD-2024-003', 3, 'SO-2024-103', '2024-11-10', 'Johannesburg Office', 'Bloemfontein Branch', 1500, 30.00, 45000, 51750, 'Office Supplies', 'IN_TRANSIT'),
('LD-2024-004', 4, 'SO-2024-104', '2024-11-15', 'Durban Factory', 'PE Warehouse', 8000, 21.88, 175000, 201250, 'Industrial Equipment', 'SCHEDULED'),
('LD-2024-005', 5, 'SO-2024-105', '2024-11-18', 'Johannesburg Distribution', 'Polokwane Retailer', 2000, 16.00, 32000, 36800, 'Groceries', 'REQUESTED');

-- Insert Fuel Transactions
INSERT INTO logistics.fuel_transactions (transaction_number, vehicle_id, driver_id, transaction_date, fuel_station, fuel_type, quantity_liters, cost_per_liter, total_cost, mileage_at_fill, is_reconciled) VALUES
('FT-2024-001', 1, 1, '2024-11-01 08:00:00', 'Engen Midrand', 'Diesel', 95.5, 21.50, 2053.25, 84500, TRUE),
('FT-2024-002', 2, 2, '2024-11-05 07:30:00', 'Shell Pretoria', 'Diesel', 75.2, 21.75, 1635.60, 44200, TRUE),
('FT-2024-003', 3, 3, '2024-11-10 09:15:00', 'BP Sandton', 'Diesel', 65.0, 22.00, 1430.00, 31800, FALSE),
('FT-2024-004', 1, 1, '2024-11-12 14:30:00', 'Sasol Durban', 'Diesel', 88.3, 21.90, 1933.77, 85200, FALSE),
('FT-2024-005', 4, 4, '2024-11-15 06:45:00', 'Engen PE', 'Diesel', 120.0, 21.60, 2592.00, 125000, FALSE);

-- Insert Maintenance Records
INSERT INTO logistics.maintenance_records (vehicle_id, maintenance_date, maintenance_type, description, cost, mileage, service_provider, status) VALUES
(1, '2024-10-15', 'Service', '80,000 km service - oil change, filters, inspection', 4500.00, 80000, 'Isuzu Midrand', 'COMPLETED'),
(2, '2024-09-20', 'Service', '40,000 km service - routine maintenance', 3200.00, 40000, 'Hino Pretoria', 'COMPLETED'),
(3, '2024-11-05', 'Repair', 'Brake pads replacement', 2800.00, 31500, 'Toyota Sandton', 'COMPLETED'),
(4, '2024-08-10', 'Service', '120,000 km major service', 8500.00, 120000, 'UD Boksburg', 'COMPLETED'),
(5, '2024-10-30', 'Service', '15,000 km first service', 2100.00, 15000, 'Mercedes-Benz Johannesburg', 'COMPLETED');

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON logistics.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON logistics.drivers(employment_status);
CREATE INDEX IF NOT EXISTS idx_trips_date ON logistics.trips(trip_date);
CREATE INDEX IF NOT EXISTS idx_trips_status ON logistics.trips(status);
CREATE INDEX IF NOT EXISTS idx_loads_status ON logistics.loads(status);
CREATE INDEX IF NOT EXISTS idx_fuel_vehicle ON logistics.fuel_transactions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_reconciled ON logistics.fuel_transactions(is_reconciled);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON logistics.maintenance_records(vehicle_id);

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA logistics TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA logistics TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA logistics TO postgres;
