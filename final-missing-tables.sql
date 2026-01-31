-- Final Missing Tables Migration
-- Creates all remaining missing tables

-- 1. Properties table for Property Management
CREATE TABLE IF NOT EXISTS properties (
    property_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    property_code VARCHAR(50),
    property_name VARCHAR(255) NOT NULL,
    property_type VARCHAR(50) DEFAULT 'COMMERCIAL',
    address TEXT,
    city VARCHAR(100),
    state_province VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    total_units INTEGER DEFAULT 1,
    total_area DECIMAL(15,2),
    area_unit VARCHAR(20) DEFAULT 'sqm',
    acquisition_date DATE,
    acquisition_cost DECIMAL(15,2),
    current_value DECIMAL(15,2),
    status VARCHAR(30) DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- 2. Leases table for Property Management
CREATE TABLE IF NOT EXISTS leases (
    lease_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    lease_number VARCHAR(50),
    property_id INTEGER REFERENCES properties(property_id),
    lessee_id INTEGER,
    lessee_name VARCHAR(255),
    lease_type VARCHAR(50) DEFAULT 'OPERATING',
    start_date DATE NOT NULL,
    end_date DATE,
    monthly_rent DECIMAL(15,2),
    annual_rent DECIMAL(15,2),
    deposit_amount DECIMAL(15,2),
    payment_terms VARCHAR(100),
    escalation_rate DECIMAL(5,2),
    status VARCHAR(30) DEFAULT 'ACTIVE',
    signed_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- 3. Farms table for Agriculture module
CREATE TABLE IF NOT EXISTS farms (
    farm_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    farm_code VARCHAR(50),
    farm_name VARCHAR(255) NOT NULL,
    location TEXT,
    total_hectares DECIMAL(15,2),
    farm_type VARCHAR(50),
    soil_type VARCHAR(100),
    water_source VARCHAR(100),
    climate_zone VARCHAR(100),
    status VARCHAR(30) DEFAULT 'ACTIVE',
    acquisition_date DATE,
    gps_coordinates VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- 4. Crops table for Agriculture module
CREATE TABLE IF NOT EXISTS crops (
    crop_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    farm_id INTEGER REFERENCES farms(farm_id),
    crop_code VARCHAR(50),
    crop_name VARCHAR(255) NOT NULL,
    crop_type VARCHAR(50),
    variety VARCHAR(100),
    planting_date DATE,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    area_planted DECIMAL(15,2),
    expected_yield DECIMAL(15,2),
    actual_yield DECIMAL(15,2),
    yield_unit VARCHAR(20) DEFAULT 'tons',
    status VARCHAR(30) DEFAULT 'GROWING',
    production_cost DECIMAL(15,2),
    sale_price DECIMAL(15,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- 5. Livestock table for Agriculture module
CREATE TABLE IF NOT EXISTS livestock (
    livestock_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    farm_id INTEGER REFERENCES farms(farm_id),
    livestock_code VARCHAR(50),
    animal_type VARCHAR(100) NOT NULL,
    breed VARCHAR(100),
    tag_number VARCHAR(50),
    birth_date DATE,
    acquisition_date DATE,
    acquisition_cost DECIMAL(15,2),
    weight DECIMAL(10,2),
    weight_unit VARCHAR(20) DEFAULT 'kg',
    gender VARCHAR(20),
    status VARCHAR(30) DEFAULT 'ACTIVE',
    health_status VARCHAR(50),
    location_paddock VARCHAR(100),
    parent_male_id INTEGER,
    parent_female_id INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- 6. Add missing columns to compliance_requirements
ALTER TABLE compliance_requirements ADD COLUMN IF NOT EXISTS framework_id INTEGER;
ALTER TABLE compliance_requirements ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'PENDING';

-- 7. Add missing columns to compliance_policies
ALTER TABLE compliance_policies ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'ACTIVE';
ALTER TABLE compliance_policies ADD COLUMN IF NOT EXISTS effective_date DATE;

-- 8. Add missing columns to construction_projects
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'ACTIVE';

-- 9. Add missing columns to intercompany_transactions
ALTER TABLE intercompany_transactions ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'PENDING';

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_tenant ON properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_tenant ON leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_property ON leases(property_id);
CREATE INDEX IF NOT EXISTS idx_farms_tenant ON farms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crops_tenant ON crops(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crops_farm ON crops(farm_id);
CREATE INDEX IF NOT EXISTS idx_livestock_tenant ON livestock(tenant_id);
CREATE INDEX IF NOT EXISTS idx_livestock_farm ON livestock(farm_id);

-- 11. Ensure journal_entry_lines has tenant_id
ALTER TABLE journal_entry_lines ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- 12. Update tenant_id in journal_entry_lines from parent entries
UPDATE journal_entry_lines jel
SET tenant_id = je.tenant_id
FROM journal_entries je
WHERE jel.journal_entry_id = je.journal_entry_id
AND jel.tenant_id IS NULL;

-- Done
SELECT 'Final tables migration complete' as status;
