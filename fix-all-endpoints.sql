-- COMPREHENSIVE FIX FOR ALL BROKEN ENDPOINTS

-- 1. Property Units table (needed for properties endpoint)
CREATE TABLE IF NOT EXISTS property_units (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    property_id INTEGER,
    unit_number VARCHAR(50),
    unit_type VARCHAR(50),
    bedrooms INTEGER,
    bathrooms INTEGER,
    size_sqm DECIMAL(15,2),
    monthly_rent DECIMAL(15,2),
    status VARCHAR(30) DEFAULT 'vacant',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Fix properties table - add id column as alias for property_id
ALTER TABLE properties ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
UPDATE properties SET id = gen_random_uuid() WHERE id IS NULL;

-- Add property_id column to property_units
ALTER TABLE property_units ADD COLUMN IF NOT EXISTS property_id INTEGER;

-- 3. Fix leases table - add property_id INTEGER column
ALTER TABLE leases ADD COLUMN IF NOT EXISTS property_id INTEGER;

-- 4. Add tenant_id to crops and livestock if missing
ALTER TABLE crops ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE livestock ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- 5. Create property_maintenance table for workspace
CREATE TABLE IF NOT EXISTS property_maintenance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID,
    property_id INTEGER,
    unit_id UUID,
    issue_type VARCHAR(100),
    description TEXT,
    status VARCHAR(30) DEFAULT 'open',
    priority VARCHAR(30) DEFAULT 'normal',
    reported_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Fix for intercompany_transactions
ALTER TABLE intercompany_transactions ADD COLUMN IF NOT EXISTS from_entity_id UUID;
ALTER TABLE intercompany_transactions ADD COLUMN IF NOT EXISTS to_entity_id UUID;
ALTER TABLE intercompany_transactions ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(50);
ALTER TABLE intercompany_transactions ADD COLUMN IF NOT EXISTS amount DECIMAL(15,2);
ALTER TABLE intercompany_transactions ADD COLUMN IF NOT EXISTS transaction_date DATE;

-- 7. Add indexes
CREATE INDEX IF NOT EXISTS idx_property_units_tenant ON property_units(tenant_id);
CREATE INDEX IF NOT EXISTS idx_property_units_property ON property_units(property_id);
CREATE INDEX IF NOT EXISTS idx_property_maintenance_tenant ON property_maintenance(tenant_id);

SELECT 'All endpoint tables fixed' as status;
