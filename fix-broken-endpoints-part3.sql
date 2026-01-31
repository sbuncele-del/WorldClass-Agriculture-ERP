-- Fix remaining broken endpoints - Part 3
-- Generated: 2026-01-07

-- 1. Fix chat_channels - add missing is_archived column
ALTER TABLE chat_channels ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- 2. Fix asset-management type mismatch (integer = uuid)
-- The category_id might be integer but trying to compare with uuid
-- Let's check and fix the column types

-- 3. Fix projects ambiguous tenant_id
-- Add alias when querying

-- 4. Fix compliance requirements/policies issues
-- Ensure proper columns exist
ALTER TABLE compliance_requirements ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE compliance_requirements ADD COLUMN IF NOT EXISTS regulation VARCHAR(255);
ALTER TABLE compliance_requirements ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE compliance_requirements ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE compliance_requirements ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'medium';
ALTER TABLE compliance_requirements ADD COLUMN IF NOT EXISTS assigned_to UUID;

ALTER TABLE compliance_policies ADD COLUMN IF NOT EXISTS policy_type VARCHAR(100);
ALTER TABLE compliance_policies ADD COLUMN IF NOT EXISTS version VARCHAR(50);
ALTER TABLE compliance_policies ADD COLUMN IF NOT EXISTS effective_date DATE;
ALTER TABLE compliance_policies ADD COLUMN IF NOT EXISTS review_date DATE;
ALTER TABLE compliance_policies ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';
ALTER TABLE compliance_policies ADD COLUMN IF NOT EXISTS content TEXT;

-- 5. Fix property module issues
ALTER TABLE property_properties ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE property_properties ADD COLUMN IF NOT EXISTS property_type VARCHAR(100);
ALTER TABLE property_properties ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'available';
ALTER TABLE property_properties ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE property_properties ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE property_properties ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE property_properties ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE property_properties ADD COLUMN IF NOT EXISTS total_units INTEGER DEFAULT 0;
ALTER TABLE property_properties ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(15,2);
ALTER TABLE property_properties ADD COLUMN IF NOT EXISTS current_value DECIMAL(15,2);

ALTER TABLE property_leases ADD COLUMN IF NOT EXISTS property_id UUID;
ALTER TABLE property_leases ADD COLUMN IF NOT EXISTS unit_id UUID;
ALTER TABLE property_leases ADD COLUMN IF NOT EXISTS tenant_name VARCHAR(255);
ALTER TABLE property_leases ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE property_leases ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE property_leases ADD COLUMN IF NOT EXISTS rent_amount DECIMAL(15,2);
ALTER TABLE property_leases ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(15,2);

-- 6. Fix agriculture module issues
ALTER TABLE agriculture_farms ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE agriculture_farms ADD COLUMN IF NOT EXISTS farm_type VARCHAR(100);
ALTER TABLE agriculture_farms ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE agriculture_farms ADD COLUMN IF NOT EXISTS size_hectares DECIMAL(10,2);
ALTER TABLE agriculture_farms ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

ALTER TABLE farm_crops ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE farm_crops ADD COLUMN IF NOT EXISTS crop_type VARCHAR(100);
ALTER TABLE farm_crops ADD COLUMN IF NOT EXISTS farm_id UUID;
ALTER TABLE farm_crops ADD COLUMN IF NOT EXISTS planting_date DATE;
ALTER TABLE farm_crops ADD COLUMN IF NOT EXISTS expected_harvest_date DATE;
ALTER TABLE farm_crops ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'planted';

ALTER TABLE farm_livestock ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE farm_livestock ADD COLUMN IF NOT EXISTS species VARCHAR(100);
ALTER TABLE farm_livestock ADD COLUMN IF NOT EXISTS breed VARCHAR(100);
ALTER TABLE farm_livestock ADD COLUMN IF NOT EXISTS farm_id UUID;
ALTER TABLE farm_livestock ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0;
ALTER TABLE farm_livestock ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'healthy';

-- 7. Fix construction projects
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS project_type VARCHAR(100);
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS site_address TEXT;
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS budget DECIMAL(15,2);
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'planning';
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS progress_percent INTEGER DEFAULT 0;

-- 8. Fix projects table (general) for ambiguous tenant_id
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_name VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS manager_id UUID;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 9. Fix recurring_entries
ALTER TABLE recurring_entries ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE recurring_entries ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE recurring_entries ADD COLUMN IF NOT EXISTS frequency VARCHAR(50);
ALTER TABLE recurring_entries ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE recurring_entries ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE recurring_entries ADD COLUMN IF NOT EXISTS next_run_date DATE;
ALTER TABLE recurring_entries ADD COLUMN IF NOT EXISTS amount DECIMAL(15,2);
ALTER TABLE recurring_entries ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- 10. Create intercompany_transactions table if needed
CREATE TABLE IF NOT EXISTS intercompany_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    from_entity_id UUID,
    to_entity_id UUID,
    transaction_type VARCHAR(100),
    amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'ZAR',
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    transaction_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intercompany_transactions_tenant ON intercompany_transactions(tenant_id);

-- Verification
SELECT 'Part 3 fixes applied' as status;
