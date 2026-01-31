-- ============================================================================
-- MINING MODULE COMPLETE SCHEMA FIX
-- Run this on production to fix the mining_sites table
-- ============================================================================

-- Add missing columns to mining_sites
ALTER TABLE mining_sites ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE mining_sites ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE mining_sites ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8);
ALTER TABLE mining_sites ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8);
ALTER TABLE mining_sites ADD COLUMN IF NOT EXISTS province VARCHAR(100);
ALTER TABLE mining_sites ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE mining_sites ADD COLUMN IF NOT EXISTS area_hectares DECIMAL(15, 2);
ALTER TABLE mining_sites ADD COLUMN IF NOT EXISTS mineral_type VARCHAR(100);
ALTER TABLE mining_sites ADD COLUMN IF NOT EXISTS mining_method VARCHAR(100);
ALTER TABLE mining_sites ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE mining_sites ADD COLUMN IF NOT EXISTS license_number VARCHAR(100);
ALTER TABLE mining_sites ADD COLUMN IF NOT EXISTS license_expiry DATE;

-- Copy site_name to name if name is null
UPDATE mining_sites SET name = site_name WHERE name IS NULL AND site_name IS NOT NULL;

-- Add missing columns to mining_production
ALTER TABLE mining_production ADD COLUMN IF NOT EXISTS mineral_type VARCHAR(100);
ALTER TABLE mining_production ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'tonnes';
ALTER TABLE mining_production ADD COLUMN IF NOT EXISTS shift VARCHAR(50);
ALTER TABLE mining_production ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add missing columns to mining_safety_incidents
ALTER TABLE mining_safety_incidents ADD COLUMN IF NOT EXISTS site_id UUID;
ALTER TABLE mining_safety_incidents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE mining_safety_incidents ADD COLUMN IF NOT EXISTS injury_count INTEGER DEFAULT 0;
ALTER TABLE mining_safety_incidents ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'open';
ALTER TABLE mining_safety_incidents ADD COLUMN IF NOT EXISTS resolution TEXT;

-- Create mining_equipment table if not exists
CREATE TABLE IF NOT EXISTS mining_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    site_id UUID REFERENCES mining_sites(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    serial_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'operational',
    last_maintenance DATE,
    next_maintenance DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create mining_minerals table if not exists
CREATE TABLE IF NOT EXISTS mining_minerals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    unit VARCHAR(50) DEFAULT 'tonnes',
    current_price DECIMAL(15, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mining_sites_tenant ON mining_sites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mining_sites_status ON mining_sites(status);
CREATE INDEX IF NOT EXISTS idx_mining_production_site ON mining_production(site_id);
CREATE INDEX IF NOT EXISTS idx_mining_production_date ON mining_production(production_date);
CREATE INDEX IF NOT EXISTS idx_mining_equipment_site ON mining_equipment(site_id);
CREATE INDEX IF NOT EXISTS idx_mining_safety_site ON mining_safety_incidents(site_id);

-- Success message
SELECT 'Mining module schema updated successfully' as status;
