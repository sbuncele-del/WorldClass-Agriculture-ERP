-- Fix remaining broken endpoints - Part 2
-- Create missing tables in proper schemas

-- 1. Create vendor_invoices in purchase schema
CREATE TABLE IF NOT EXISTS purchase.vendor_invoices (
    invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    supplier_id UUID,
    invoice_date DATE NOT NULL,
    due_date DATE,
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    gr_id UUID,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_vendor_invoices_tenant ON purchase.vendor_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_vendor_invoices_supplier ON purchase.vendor_invoices(supplier_id);

-- 2. Check/create purchase.suppliers 
CREATE TABLE IF NOT EXISTS purchase.suppliers (
    supplier_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    supplier_code VARCHAR(50),
    supplier_name VARCHAR(255) NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_purchase_suppliers_tenant ON purchase.suppliers(tenant_id);

-- 3. Check assets schema for supplier_id issue
-- The asset query references s.supplier_id - let's check the assets.fixed_assets table
ALTER TABLE IF EXISTS assets.fixed_assets ADD COLUMN IF NOT EXISTS supplier_id UUID;

-- Alternatively, if using public schema for fixed_assets
ALTER TABLE fixed_assets ADD COLUMN IF NOT EXISTS supplier_id UUID;

-- 4. Create dashboard tables for KPI support
CREATE TABLE IF NOT EXISTS dashboard_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    kpi_name VARCHAR(100) NOT NULL,
    kpi_value DECIMAL(15,2),
    kpi_type VARCHAR(50),
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_kpis_tenant ON dashboard_kpis(tenant_id);

-- 5. Compliance - make sure we have proper structure
ALTER TABLE compliance_requirements ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE compliance_policies ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- 6. Property module - ensure proper columns
ALTER TABLE property_properties ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE property_leases ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE property_leases ADD COLUMN IF NOT EXISTS property_id UUID;

-- 7. Agriculture module
ALTER TABLE agriculture_farms ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE farm_crops ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE farm_livestock ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- 8. Construction module
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 9. Projects table - add missing columns
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 10. Users table - ensure name column exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
-- Update name from first_name + last_name if empty
UPDATE users SET name = COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') WHERE name IS NULL;

-- 11. Financial recurring entries
ALTER TABLE recurring_entries ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Verification
SELECT 'Schema fixes applied' as status;
SELECT schemaname, tablename FROM pg_tables WHERE tablename = 'vendor_invoices';
