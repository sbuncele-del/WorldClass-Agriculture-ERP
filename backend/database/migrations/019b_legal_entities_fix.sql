-- ================================================
-- Legal Entities Module - Controller Compatible
-- ================================================
-- Creates tables with column names expected by the V2 controller
-- ================================================

-- Drop existing tables if they exist (careful in production!)
-- DROP TABLE IF EXISTS entity_settings CASCADE;
-- DROP TABLE IF EXISTS consolidation_rules CASCADE;
-- DROP TABLE IF EXISTS inter_entity_transactions CASCADE;
-- DROP TABLE IF EXISTS entity_permissions CASCADE;
-- DROP TABLE IF EXISTS entity_relationships CASCADE;
-- DROP TABLE IF EXISTS entities CASCADE;

-- Legal Entities (main table)
CREATE TABLE IF NOT EXISTS legal_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'subsidiary', -- holding, subsidiary, branch, division
    
    -- Legal/Tax info
    registration_number VARCHAR(100),
    vat_number VARCHAR(100),
    tax_number VARCHAR(100),
    
    -- Address
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'ZA',
    
    -- Contact
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    
    -- Financial
    currency VARCHAR(10) DEFAULT 'ZAR',
    fiscal_year_end VARCHAR(10) DEFAULT '12-31',
    chart_of_accounts_id UUID,
    
    -- Hierarchy
    parent_id UUID REFERENCES legal_entities(id),
    level INTEGER DEFAULT 0,
    path TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, archived
    is_default BOOLEAN DEFAULT false,
    
    -- Ownership
    ownership_percentage DECIMAL(5,2) DEFAULT 100.00,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    UNIQUE(tenant_id, code)
);

CREATE INDEX idx_legal_entities_tenant ON legal_entities(tenant_id);
CREATE INDEX idx_legal_entities_parent ON legal_entities(parent_id);
CREATE INDEX idx_legal_entities_status ON legal_entities(status);
CREATE INDEX idx_legal_entities_type ON legal_entities(type);

-- Entity Permissions (user access per entity)
CREATE TABLE IF NOT EXISTS entity_user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    entity_id UUID NOT NULL REFERENCES legal_entities(id) ON DELETE CASCADE,
    
    -- Access levels
    can_view BOOLEAN DEFAULT true,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_approve BOOLEAN DEFAULT false,
    
    -- Module-specific permissions
    modules JSONB DEFAULT '[]',
    
    -- Delegation
    granted_by UUID,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, user_id, entity_id)
);

CREATE INDEX idx_entity_user_permissions_user ON entity_user_permissions(user_id);
CREATE INDEX idx_entity_user_permissions_entity ON entity_user_permissions(entity_id);

-- Inter-Entity Transactions
CREATE TABLE IF NOT EXISTS intercompany_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Source entity
    source_entity_id UUID NOT NULL REFERENCES legal_entities(id),
    source_reference VARCHAR(100),
    
    -- Destination entity
    dest_entity_id UUID NOT NULL REFERENCES legal_entities(id),
    dest_reference VARCHAR(100),
    
    -- Transaction details
    transaction_type VARCHAR(50) NOT NULL, -- SALE, PURCHASE, TRANSFER, LOAN, ALLOCATION, DIVIDEND
    transaction_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ZAR',
    description TEXT,
    
    -- GL accounts affected
    source_gl_account VARCHAR(50),
    dest_gl_account VARCHAR(50),
    
    -- Elimination tracking
    requires_elimination BOOLEAN DEFAULT true,
    elimination_status VARCHAR(50) DEFAULT 'pending', -- pending, eliminated, excluded
    elimination_journal_id UUID,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, posted
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    approved_at TIMESTAMP,
    approved_by UUID,
    
    CHECK (source_entity_id != dest_entity_id),
    CHECK (amount > 0)
);

CREATE INDEX idx_intercompany_source ON intercompany_transactions(source_entity_id);
CREATE INDEX idx_intercompany_dest ON intercompany_transactions(dest_entity_id);
CREATE INDEX idx_intercompany_date ON intercompany_transactions(transaction_date);
CREATE INDEX idx_intercompany_status ON intercompany_transactions(status);

-- Consolidation Rules
CREATE TABLE IF NOT EXISTS consolidation_elimination_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- elimination, adjustment, reclassification
    
    -- Applicability
    entity_ids UUID[], -- NULL means all entities
    transaction_types VARCHAR(50)[],
    
    -- Rule definition
    source_account_pattern VARCHAR(100),
    target_account VARCHAR(50),
    percentage DECIMAL(5,2) DEFAULT 100.00,
    
    -- Conditions
    conditions JSONB,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, code)
);

-- Consolidation Periods/Runs
CREATE TABLE IF NOT EXISTS consolidation_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_name VARCHAR(100),
    fiscal_year INTEGER,
    period_number INTEGER,
    
    -- Status
    status VARCHAR(50) DEFAULT 'open', -- open, in_progress, closed, locked
    
    -- Consolidation results
    consolidated_at TIMESTAMP,
    consolidated_by UUID,
    total_eliminations DECIMAL(15,2) DEFAULT 0,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, period_start, period_end)
);

-- Entity Settings
CREATE TABLE IF NOT EXISTS entity_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_id UUID NOT NULL REFERENCES legal_entities(id) ON DELETE CASCADE,
    
    -- Financial settings
    chart_template VARCHAR(100),
    numbering_prefix VARCHAR(20),
    default_payment_terms INTEGER DEFAULT 30,
    default_tax_rate DECIMAL(5,2),
    
    -- Operational settings
    default_warehouse_id UUID,
    default_price_list VARCHAR(100),
    logo_url VARCHAR(500),
    
    -- Reporting
    reporting_currency VARCHAR(10) DEFAULT 'ZAR',
    translation_method VARCHAR(50) DEFAULT 'current_rate',
    
    -- Modules enabled
    enabled_modules JSONB DEFAULT '["sales", "purchase", "financial", "inventory"]',
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, entity_id)
);

-- ================================================
-- CREATE DEFAULT ENTITY FOR TENANT
-- ================================================

INSERT INTO legal_entities (
    tenant_id, code, name, type, status, is_default, level, country, currency
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'HQ',
    'Head Office',
    'holding',
    'active',
    true,
    0,
    'ZA',
    'ZAR'
)
ON CONFLICT (tenant_id, code) DO NOTHING;

-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Function to get entity hierarchy (ancestors)
CREATE OR REPLACE FUNCTION get_legal_entity_ancestors(p_entity_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE entity_tree AS (
        SELECT 
            e.id,
            e.name,
            e.level,
            e.parent_id
        FROM legal_entities e
        WHERE e.id = p_entity_id
        
        UNION ALL
        
        SELECT 
            e.id,
            e.name,
            e.level,
            e.parent_id
        FROM legal_entities e
        INNER JOIN entity_tree et ON e.id = et.parent_id
    )
    SELECT 
        entity_tree.id,
        entity_tree.name,
        entity_tree.level
    FROM entity_tree
    ORDER BY entity_tree.level;
END;
$$ LANGUAGE plpgsql;

-- Function to get entity descendants
CREATE OR REPLACE FUNCTION get_legal_entity_descendants(p_entity_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE entity_tree AS (
        SELECT 
            e.id,
            e.name,
            e.level,
            e.parent_id
        FROM legal_entities e
        WHERE e.id = p_entity_id
        
        UNION ALL
        
        SELECT 
            e.id,
            e.name,
            e.level,
            e.parent_id
        FROM legal_entities e
        INNER JOIN entity_tree et ON e.parent_id = et.id
    )
    SELECT 
        entity_tree.id,
        entity_tree.name,
        entity_tree.level
    FROM entity_tree
    ORDER BY entity_tree.level;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- COMPLETION
-- ================================================

DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Legal Entities Module Created!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Tables: 6';
    RAISE NOTICE '  - legal_entities (companies/entities)';
    RAISE NOTICE '  - entity_user_permissions (user access)';
    RAISE NOTICE '  - intercompany_transactions (inter-entity txns)';
    RAISE NOTICE '  - consolidation_elimination_rules';
    RAISE NOTICE '  - consolidation_periods';
    RAISE NOTICE '  - entity_config (entity settings)';
    RAISE NOTICE '';
    RAISE NOTICE 'Default entity created: HQ (Head Office)';
    RAISE NOTICE '==================================================';
END $$;
