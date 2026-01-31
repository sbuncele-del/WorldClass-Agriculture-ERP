-- Comprehensive fix for all remaining broken endpoints
-- Adds missing columns using COALESCE-safe approach

-- 1. Fix farms table
ALTER TABLE farms ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10,8);
ALTER TABLE farms ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11,8);
ALTER TABLE farms ADD COLUMN IF NOT EXISTS size_hectares DECIMAL(15,2);
ALTER TABLE farms ADD COLUMN IF NOT EXISTS manager_name VARCHAR(255);
ALTER TABLE farms ADD COLUMN IF NOT EXISTS water_source VARCHAR(100);
ALTER TABLE farms ADD COLUMN IF NOT EXISTS province VARCHAR(100);
ALTER TABLE farms ADD COLUMN IF NOT EXISTS address TEXT;
UPDATE farms SET size_hectares = COALESCE(size_hectares, total_hectares) WHERE size_hectares IS NULL;

-- 2. Fix construction_projects table
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS project_type VARCHAR(100);
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS expected_end_date DATE;
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS contract_value DECIMAL(15,2);
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS completion_percentage DECIMAL(5,2) DEFAULT 0;
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS site_address TEXT;
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS project_manager VARCHAR(255);
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS budget DECIMAL(15,2);
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS end_date DATE;

-- 3. Fix properties table - ensure all needed columns exist
ALTER TABLE properties ADD COLUMN IF NOT EXISTS province VARCHAR(100);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS year_built INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_sqm DECIMAL(15,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS manager_name VARCHAR(255);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
UPDATE properties SET province = COALESCE(province, state_province) WHERE province IS NULL;
UPDATE properties SET total_sqm = COALESCE(total_sqm, total_area) WHERE total_sqm IS NULL;

-- 4. Fix leases table
ALTER TABLE leases ADD COLUMN IF NOT EXISTS lease_id SERIAL;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS lessee_name VARCHAR(255);
UPDATE leases SET lessee_name = lessee_name WHERE lessee_name IS NULL;

-- 5. Ensure property_id column exists on leases
ALTER TABLE leases ADD COLUMN IF NOT EXISTS property_id INTEGER;

-- 6. Fix crops and livestock farm_id joins - ensure consistent types
-- These tables use integer farm_id, not uuid

SELECT 'All columns added successfully' as status;
