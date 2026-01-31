-- Fix broken endpoints - Missing tables and columns
-- Generated: 2026-01-07

-- 1. Create chat_channels table (Communications module)
CREATE TABLE IF NOT EXISTS chat_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    channel_type VARCHAR(50) DEFAULT 'public',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_channels_tenant ON chat_channels(tenant_id);

-- 2. Create calendar_events table (Calendar module)
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    all_day BOOLEAN DEFAULT FALSE,
    location VARCHAR(255),
    event_type VARCHAR(50) DEFAULT 'meeting',
    recurrence_rule TEXT,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_tenant ON calendar_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates ON calendar_events(start_date, end_date);

-- 3. Add missing columns to audit_log
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS resource_type VARCHAR(100);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS resource_id UUID;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS changes JSONB;

-- 4. Add is_active to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 5. Create suppliers table if not exists (Purchase module)
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    tax_number VARCHAR(100),
    payment_terms INTEGER DEFAULT 30,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);

-- 6. Create vendor_invoices table (Purchase module)
CREATE TABLE IF NOT EXISTS vendor_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    invoice_number VARCHAR(100) NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    invoice_date DATE NOT NULL,
    due_date DATE,
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_invoices_tenant ON vendor_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendor_invoices_supplier ON vendor_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_vendor_invoices_status ON vendor_invoices(status);

-- 7. Create compliance_requirements table
CREATE TABLE IF NOT EXISTS compliance_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    regulation VARCHAR(255),
    due_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(50) DEFAULT 'medium',
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_requirements_tenant ON compliance_requirements(tenant_id);

-- 8. Create compliance_policies table
CREATE TABLE IF NOT EXISTS compliance_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    policy_type VARCHAR(100),
    version VARCHAR(50),
    effective_date DATE,
    review_date DATE,
    status VARCHAR(50) DEFAULT 'draft',
    content TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_policies_tenant ON compliance_policies(tenant_id);

-- 9. Create recurring_entries table (Financial module)
CREATE TABLE IF NOT EXISTS recurring_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    frequency VARCHAR(50) NOT NULL, -- daily, weekly, monthly, quarterly, yearly
    start_date DATE NOT NULL,
    end_date DATE,
    next_run_date DATE,
    amount DECIMAL(15,2),
    debit_account_id UUID,
    credit_account_id UUID,
    status VARCHAR(50) DEFAULT 'active',
    last_run_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_entries_tenant ON recurring_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recurring_entries_next_run ON recurring_entries(next_run_date);

-- 10. Add missing columns to property_properties
ALTER TABLE property_properties ADD COLUMN IF NOT EXISTS property_type VARCHAR(100);
ALTER TABLE property_properties ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'available';
ALTER TABLE property_properties ADD COLUMN IF NOT EXISTS address TEXT;

-- 11. Add missing columns to property_leases
ALTER TABLE property_leases ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE property_leases ADD COLUMN IF NOT EXISTS monthly_rent DECIMAL(15,2);

-- 12. Create property_tenants table if not exists
CREATE TABLE IF NOT EXISTS property_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    id_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_tenants_tenant ON property_tenants(tenant_id);

-- Verification queries
SELECT 'Tables created successfully' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('chat_channels', 'calendar_events', 'suppliers', 'vendor_invoices', 
                   'compliance_requirements', 'compliance_policies', 'recurring_entries', 'property_tenants');
