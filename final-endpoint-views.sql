-- Create views and tables for remaining broken endpoints

-- 1. Create policies view from compliance_policies
CREATE OR REPLACE VIEW policies AS 
SELECT 
    id as policy_id,
    tenant_id,
    name as policy_name,
    description,
    policy_type,
    version,
    effective_date,
    review_date,
    status,
    content as policy_content,
    created_by,
    created_at,
    updated_at,
    1 as category_id,  -- Default category
    true as is_active
FROM compliance_policies;

-- 2. Create policy_categories table if not exists
CREATE TABLE IF NOT EXISTS policy_categories (
    category_id SERIAL PRIMARY KEY,
    tenant_id UUID,
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id INTEGER,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default category
INSERT INTO policy_categories (category_id, category_name, description) 
VALUES (1, 'General', 'General policies')
ON CONFLICT DO NOTHING;

-- 3. Create policy_acknowledgments table if not exists
CREATE TABLE IF NOT EXISTS policy_acknowledgments (
    acknowledgment_id SERIAL PRIMARY KEY,
    policy_id UUID,
    user_id UUID,
    acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent TEXT,
    signature TEXT
);

-- 4. Create property views if not using the direct tables
-- (Using the tables we created earlier)

-- 5. Fix construction_projects status
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'ACTIVE';

-- 6. Fix entities/intercompany - create proper view
-- First check entity_relationships
CREATE TABLE IF NOT EXISTS entity_relationships (
    id SERIAL PRIMARY KEY,
    tenant_id UUID,
    parent_entity_id UUID,
    child_entity_id UUID,
    relationship_type VARCHAR(50) DEFAULT 'SUBSIDIARY',
    ownership_percentage DECIMAL(5,2),
    effective_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Fix intercompany transactions query - add missing columns
ALTER TABLE intercompany_transactions ADD COLUMN IF NOT EXISTS from_entity_name VARCHAR(255);
ALTER TABLE intercompany_transactions ADD COLUMN IF NOT EXISTS to_entity_name VARCHAR(255);
ALTER TABLE intercompany_transactions ADD COLUMN IF NOT EXISTS currency_code VARCHAR(10) DEFAULT 'ZAR';

-- 8. Create indexes
CREATE INDEX IF NOT EXISTS idx_policies_tenant ON policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policy_ack_policy ON policy_acknowledgments(policy_id);
CREATE INDEX IF NOT EXISTS idx_entity_rel_tenant ON entity_relationships(tenant_id);

SELECT 'Views and tables created successfully' as status;
