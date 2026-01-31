-- ================================================
-- Multi-Entity Module
-- ================================================
-- Enterprise multi-entity support within tenants
-- Allows managing multiple legal entities, subsidiaries, branches
-- Tables: 6
-- ================================================

-- Legal Entities (within a tenant)
CREATE TABLE IF NOT EXISTS entities (
    entity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_code VARCHAR(50) NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- HEAD_OFFICE, SUBSIDIARY, BRANCH, DIVISION, FRANCHISE
    legal_name VARCHAR(255),
    registration_number VARCHAR(100),
    tax_number VARCHAR(100),
    vat_number VARCHAR(100),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'South Africa',
    
    -- Contact
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    
    -- Financial
    base_currency VARCHAR(10) DEFAULT 'ZAR',
    fiscal_year_end VARCHAR(10), -- MM-DD format, e.g., '12-31'
    
    -- Hierarchy
    parent_entity_id UUID REFERENCES entities(entity_id),
    level_in_hierarchy INTEGER DEFAULT 0,
    path TEXT, -- Materialized path: /root/parent/child
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false, -- Default entity for tenant
    activation_date DATE,
    deactivation_date DATE,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    UNIQUE(tenant_id, entity_code)
);

CREATE INDEX idx_entities_tenant ON entities(tenant_id);
CREATE INDEX idx_entities_parent ON entities(parent_entity_id);
CREATE INDEX idx_entities_path ON entities(path);

-- Entity Relationships (ownership, control)
CREATE TABLE IF NOT EXISTS entity_relationships (
    relationship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    parent_entity_id UUID NOT NULL REFERENCES entities(entity_id),
    child_entity_id UUID NOT NULL REFERENCES entities(entity_id),
    relationship_type VARCHAR(50) NOT NULL, -- OWNS, CONTROLS, MANAGES, OPERATES
    ownership_percentage DECIMAL(5,2), -- For OWNS type
    effective_from DATE NOT NULL,
    effective_to DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (parent_entity_id != child_entity_id),
    CHECK (ownership_percentage IS NULL OR (ownership_percentage >= 0 AND ownership_percentage <= 100))
);

CREATE INDEX idx_entity_relationships_parent ON entity_relationships(parent_entity_id);
CREATE INDEX idx_entity_relationships_child ON entity_relationships(child_entity_id);

-- Entity Permissions (user access per entity)
CREATE TABLE IF NOT EXISTS entity_permissions (
    permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    entity_id UUID NOT NULL REFERENCES entities(entity_id),
    
    -- Access levels
    can_view BOOLEAN DEFAULT true,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_approve BOOLEAN DEFAULT false,
    
    -- Module-specific permissions
    modules_access JSONB DEFAULT '[]', -- Array of module names
    
    -- Delegation
    granted_by UUID,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, user_id, entity_id)
);

CREATE INDEX idx_entity_permissions_user ON entity_permissions(user_id);
CREATE INDEX idx_entity_permissions_entity ON entity_permissions(entity_id);

-- Inter-Entity Transactions
CREATE TABLE IF NOT EXISTS inter_entity_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Source entity
    source_entity_id UUID NOT NULL REFERENCES entities(entity_id),
    source_reference VARCHAR(100),
    
    -- Destination entity
    destination_entity_id UUID NOT NULL REFERENCES entities(entity_id),
    destination_reference VARCHAR(100),
    
    -- Transaction details
    transaction_type VARCHAR(50) NOT NULL, -- SALE, PURCHASE, TRANSFER, LOAN, ALLOCATION
    transaction_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ZAR',
    
    -- Accounting impact
    source_gl_account VARCHAR(50),
    destination_gl_account VARCHAR(50),
    
    -- Elimination tracking (for consolidation)
    requires_elimination BOOLEAN DEFAULT true,
    elimination_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, ELIMINATED, EXCLUDED
    elimination_entry_id UUID,
    
    -- Description
    description TEXT,
    notes TEXT,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    approved_at TIMESTAMP,
    approved_by UUID,
    
    CHECK (source_entity_id != destination_entity_id),
    CHECK (amount > 0)
);

CREATE INDEX idx_inter_entity_source ON inter_entity_transactions(source_entity_id);
CREATE INDEX idx_inter_entity_destination ON inter_entity_transactions(destination_entity_id);
CREATE INDEX idx_inter_entity_date ON inter_entity_transactions(transaction_date);
CREATE INDEX idx_inter_entity_elimination ON inter_entity_transactions(elimination_status);

-- Consolidation Rules
CREATE TABLE IF NOT EXISTS consolidation_rules (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    rule_code VARCHAR(50) NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- ELIMINATION, ADJUSTMENT, RECLASSIFICATION
    
    -- Applicability
    applies_to_entity_ids UUID[], -- NULL means all entities
    applies_to_transaction_types VARCHAR(50)[],
    
    -- Rule definition
    source_account_pattern VARCHAR(100), -- Regex or exact match
    destination_account VARCHAR(50),
    percentage DECIMAL(5,2) DEFAULT 100.00,
    
    -- Conditions
    conditions JSONB, -- Complex conditions as JSON
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, rule_code)
);

CREATE INDEX idx_consolidation_rules_tenant ON consolidation_rules(tenant_id);

-- Entity Settings (entity-specific configurations)
CREATE TABLE IF NOT EXISTS entity_settings (
    setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_id UUID NOT NULL REFERENCES entities(entity_id),
    
    -- Financial settings
    chart_of_accounts_template VARCHAR(100), -- Can differ per entity
    numbering_format JSONB, -- Invoice, PO numbering per entity
    default_payment_terms INTEGER DEFAULT 30,
    default_tax_rate DECIMAL(5,2),
    
    -- Operational settings
    default_warehouse_id UUID,
    default_price_list VARCHAR(100),
    logo_url VARCHAR(500),
    
    -- Reporting settings
    reporting_currency VARCHAR(10),
    translation_method VARCHAR(50), -- CURRENT_RATE, TEMPORAL, MONETARY_NONMONETARY
    
    -- Module enablement
    enabled_modules JSONB DEFAULT '["Sales", "Purchase", "Financial", "Inventory"]',
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, entity_id)
);

CREATE INDEX idx_entity_settings_entity ON entity_settings(entity_id);

-- ================================================
-- PRE-POPULATE SAMPLE ENTITIES FOR EXISTING TENANTS
-- ================================================

-- Create default entity for each existing tenant
INSERT INTO entities (tenant_id, entity_code, entity_name, entity_type, is_default, level_in_hierarchy, path)
SELECT 
    DISTINCT tenant_id,
    'HQ',
    'Head Office',
    'HEAD_OFFICE',
    true,
    0,
    '/' || tenant_id::text || '/HQ'
FROM tenants
WHERE NOT EXISTS (
    SELECT 1 FROM entities WHERE entities.tenant_id = tenants.tenant_id
)
ON CONFLICT (tenant_id, entity_code) DO NOTHING;

-- Create default entity settings
INSERT INTO entity_settings (tenant_id, entity_id)
SELECT 
    e.tenant_id,
    e.entity_id
FROM entities e
WHERE NOT EXISTS (
    SELECT 1 FROM entity_settings es WHERE es.entity_id = e.entity_id
);

-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Function to get entity hierarchy (ancestors)
CREATE OR REPLACE FUNCTION get_entity_ancestors(p_entity_id UUID)
RETURNS TABLE (
    entity_id UUID,
    entity_name VARCHAR,
    level_in_hierarchy INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE entity_tree AS (
        -- Base case: start with given entity
        SELECT 
            e.entity_id,
            e.entity_name,
            e.level_in_hierarchy,
            e.parent_entity_id
        FROM entities e
        WHERE e.entity_id = p_entity_id
        
        UNION ALL
        
        -- Recursive case: get parent
        SELECT 
            e.entity_id,
            e.entity_name,
            e.level_in_hierarchy,
            e.parent_entity_id
        FROM entities e
        INNER JOIN entity_tree et ON e.entity_id = et.parent_entity_id
    )
    SELECT 
        entity_tree.entity_id,
        entity_tree.entity_name,
        entity_tree.level_in_hierarchy
    FROM entity_tree
    ORDER BY level_in_hierarchy;
END;
$$ LANGUAGE plpgsql;

-- Function to get entity descendants (children, grandchildren, etc.)
CREATE OR REPLACE FUNCTION get_entity_descendants(p_entity_id UUID)
RETURNS TABLE (
    entity_id UUID,
    entity_name VARCHAR,
    level_in_hierarchy INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE entity_tree AS (
        -- Base case: start with given entity
        SELECT 
            e.entity_id,
            e.entity_name,
            e.level_in_hierarchy,
            e.parent_entity_id
        FROM entities e
        WHERE e.entity_id = p_entity_id
        
        UNION ALL
        
        -- Recursive case: get children
        SELECT 
            e.entity_id,
            e.entity_name,
            e.level_in_hierarchy,
            e.parent_entity_id
        FROM entities e
        INNER JOIN entity_tree et ON e.parent_entity_id = et.entity_id
    )
    SELECT 
        entity_tree.entity_id,
        entity_tree.entity_name,
        entity_tree.level_in_hierarchy
    FROM entity_tree
    ORDER BY level_in_hierarchy;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- UPDATE EXISTING TABLES TO SUPPORT ENTITIES
-- ================================================
-- NOTE: Run these ALTER statements carefully in production
-- They add entity_id to core tables for multi-entity filtering

-- Sales tables
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES entities(entity_id);
ALTER TABLE sales_quotations ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES entities(entity_id);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES entities(entity_id);

-- Purchase tables
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES entities(entity_id);
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES entities(entity_id);

-- Inventory tables
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES entities(entity_id);
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES entities(entity_id);

-- Financial tables
ALTER TABLE gl_accounts ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES entities(entity_id);
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES entities(entity_id);

-- Create indexes for entity filtering
CREATE INDEX IF NOT EXISTS idx_sales_invoices_entity ON sales_invoices(entity_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotations_entity ON sales_quotations(entity_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_entity ON sales_orders(entity_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_entity ON purchase_orders(entity_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_entity ON purchase_invoices(entity_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_entity ON inventory_items(entity_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_entity ON stock_transactions(entity_id);
CREATE INDEX IF NOT EXISTS idx_gl_accounts_entity ON gl_accounts(entity_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_entity ON journal_entries(entity_id);

-- Set default entity for existing records
UPDATE sales_invoices SET entity_id = (
    SELECT entity_id FROM entities WHERE tenant_id = sales_invoices.tenant_id AND is_default = true LIMIT 1
) WHERE entity_id IS NULL;

UPDATE sales_quotations SET entity_id = (
    SELECT entity_id FROM entities WHERE tenant_id = sales_quotations.tenant_id AND is_default = true LIMIT 1
) WHERE entity_id IS NULL;

UPDATE sales_orders SET entity_id = (
    SELECT entity_id FROM entities WHERE tenant_id = sales_orders.tenant_id AND is_default = true LIMIT 1
) WHERE entity_id IS NULL;

UPDATE purchase_orders SET entity_id = (
    SELECT entity_id FROM entities WHERE tenant_id = purchase_orders.tenant_id AND is_default = true LIMIT 1
) WHERE entity_id IS NULL;

UPDATE purchase_invoices SET entity_id = (
    SELECT entity_id FROM entities WHERE tenant_id = purchase_invoices.tenant_id AND is_default = true LIMIT 1
) WHERE entity_id IS NULL;

UPDATE inventory_items SET entity_id = (
    SELECT entity_id FROM entities WHERE tenant_id = inventory_items.tenant_id AND is_default = true LIMIT 1
) WHERE entity_id IS NULL;

UPDATE stock_transactions SET entity_id = (
    SELECT entity_id FROM entities WHERE tenant_id = stock_transactions.tenant_id AND is_default = true LIMIT 1
) WHERE entity_id IS NULL;

UPDATE gl_accounts SET entity_id = (
    SELECT entity_id FROM entities WHERE tenant_id = gl_accounts.tenant_id AND is_default = true LIMIT 1
) WHERE entity_id IS NULL;

UPDATE journal_entries SET entity_id = (
    SELECT entity_id FROM entities WHERE tenant_id = journal_entries.tenant_id AND is_default = true LIMIT 1
) WHERE entity_id IS NULL;

-- ================================================
-- COMPLETION
-- ================================================

DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Multi-Entity Module Schema Created!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Tables: 6';
    RAISE NOTICE '  - entities (legal entities within tenant)';
    RAISE NOTICE '  - entity_relationships (ownership, control)';
    RAISE NOTICE '  - entity_permissions (user access per entity)';
    RAISE NOTICE '  - inter_entity_transactions (transactions between entities)';
    RAISE NOTICE '  - consolidation_rules (elimination rules)';
    RAISE NOTICE '  - entity_settings (entity configurations)';
    RAISE NOTICE '';
    RAISE NOTICE 'Helper Functions: 2';
    RAISE NOTICE '  - get_entity_ancestors() - Get parent hierarchy';
    RAISE NOTICE '  - get_entity_descendants() - Get children hierarchy';
    RAISE NOTICE '';
    RAISE NOTICE 'Existing Tables Updated:';
    RAISE NOTICE '  - sales_invoices, sales_quotations, sales_orders';
    RAISE NOTICE '  - purchase_orders, purchase_invoices';
    RAISE NOTICE '  - inventory_items, stock_transactions';
    RAISE NOTICE '  - gl_accounts, journal_entries';
    RAISE NOTICE '';
    RAISE NOTICE 'Default entities created for all existing tenants';
    RAISE NOTICE '==================================================';
END $$;
