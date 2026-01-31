-- Fix properties table structure to match controller expectations

-- Add missing columns to properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE properties ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS province VARCHAR(100);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS year_built INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_sqm DECIMAL(15,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS manager_name VARCHAR(255);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Copy existing data to new columns where possible
UPDATE properties SET 
    name = COALESCE(name, property_name),
    province = COALESCE(province, state_province),
    total_sqm = COALESCE(total_sqm, total_area),
    code = COALESCE(code, property_code)
WHERE name IS NULL OR province IS NULL;

-- Add missing columns to leases
ALTER TABLE leases ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE leases ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE leases ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS base_rent DECIMAL(15,2);
ALTER TABLE leases ADD COLUMN IF NOT EXISTS rent_escalation_rate DECIMAL(5,2);

UPDATE leases SET 
    code = COALESCE(code, lease_number),
    base_rent = COALESCE(base_rent, monthly_rent),
    rent_escalation_rate = COALESCE(rent_escalation_rate, escalation_rate);

-- Fix farms table
ALTER TABLE farms ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE farms ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE farms ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE farms ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
UPDATE farms SET name = COALESCE(name, farm_name), code = COALESCE(code, farm_code);

-- Fix crops table
ALTER TABLE crops ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE crops ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE crops ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE crops ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
UPDATE crops SET name = COALESCE(name, crop_name), code = COALESCE(code, crop_code);

-- Fix livestock table
ALTER TABLE livestock ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE livestock ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE livestock ADD COLUMN IF NOT EXISTS type VARCHAR(100);
ALTER TABLE livestock ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
UPDATE livestock SET type = COALESCE(type, animal_type), code = COALESCE(code, livestock_code);

-- Fix construction_projects table
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Fix projects table ambiguous tenant_id by creating proper column
ALTER TABLE projects ADD COLUMN IF NOT EXISTS p_tenant_id UUID;
UPDATE projects SET p_tenant_id = tenant_id WHERE p_tenant_id IS NULL;

SELECT 'Table columns added and updated' as status;
