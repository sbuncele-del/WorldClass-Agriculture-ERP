-- Multi-Entity Schema Migration
-- Created: December 19, 2025
-- Purpose: Create tables for multi-entity (legal entity) management
-- Applied: December 19, 2025 (via SSM to RDS)

-- ============================================================================
-- LEGACY ENTITIES TABLE (for legacy controller)
-- ============================================================================
CREATE TABLE IF NOT EXISTS entities (
    entity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_code VARCHAR(50) NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'subsidiary',
    legal_name VARCHAR(255),
    registration_number VARCHAR(100),
    tax_number VARCHAR(100),
    vat_number VARCHAR(100),
    address JSONB DEFAULT '{}',
    contact JSONB DEFAULT '{}',
    parent_entity_id UUID REFERENCES entities(entity_id),
    level_in_hierarchy INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    base_currency VARCHAR(3) DEFAULT 'ZAR',
    fiscal_year_start INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    UNIQUE(tenant_id, entity_code)
);

-- ============================================================================
-- V2 LEGAL ENTITIES TABLE (for V2 controller)
-- ============================================================================
CREATE TABLE IF NOT EXISTS legal_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'subsidiary',
    registration_number VARCHAR(100),
    vat_number VARCHAR(100),
    tax_number VARCHAR(100),
    parent_id UUID REFERENCES legal_entities(id),
    level INTEGER DEFAULT 0,
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2) DEFAULT 'ZA',
    currency VARCHAR(3) DEFAULT 'ZAR',
    chart_of_accounts_id UUID,
    status VARCHAR(50) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    UNIQUE(tenant_id, code)
);

-- Intercompany accounts table
CREATE TABLE IF NOT EXISTS intercompany_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source_entity_id UUID NOT NULL REFERENCES legal_entities(id),
    target_entity_id UUID NOT NULL REFERENCES legal_entities(id),
    receivable_account_id UUID,
    payable_account_id UUID,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_entity_id, target_entity_id)
);

-- Create entity_settings table
CREATE TABLE IF NOT EXISTS entity_settings (
    setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES entities(entity_id) ON DELETE CASCADE,
    numbering_format JSONB DEFAULT '{}',
    default_payment_terms INTEGER DEFAULT 30,
    enabled_modules JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create entity_permissions table
CREATE TABLE IF NOT EXISTS entity_permissions (
    permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES entities(entity_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    permission_level VARCHAR(50) DEFAULT 'read',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_id, user_id)
);

-- Create intercompany_transactions table
CREATE TABLE IF NOT EXISTS intercompany_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source_entity_id UUID NOT NULL REFERENCES entities(entity_id),
    target_entity_id UUID NOT NULL REFERENCES entities(entity_id),
    transaction_type VARCHAR(50) NOT NULL,
    transaction_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ZAR',
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    source_journal_id UUID,
    target_journal_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_entities_tenant ON entities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_entities_parent ON entities(parent_entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_settings_entity ON entity_settings(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_permissions_entity ON entity_permissions(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_permissions_user ON entity_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_intercompany_tenant ON intercompany_transactions(tenant_id);

-- Entity types: 'holding', 'subsidiary', 'branch', 'division', 'department'
-- Permission levels: 'read', 'write', 'admin', 'owner'
