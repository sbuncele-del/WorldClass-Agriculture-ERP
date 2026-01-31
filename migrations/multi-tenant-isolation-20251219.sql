-- ============================================================================
-- MULTI-TENANT ISOLATION MIGRATION
-- Created: December 19, 2025
-- Purpose: Add tenant_id to all module tables for proper data isolation
-- ============================================================================

-- Get default tenant ID (first tenant) for existing data
-- This assigns orphan data to the default tenant
DO $$
DECLARE
    v_default_tenant_id UUID;
BEGIN
    SELECT id INTO v_default_tenant_id FROM tenants ORDER BY created_at ASC LIMIT 1;
    
    IF v_default_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No tenants exist. Please create a tenant first.';
    END IF;
    
    RAISE NOTICE 'Default tenant ID: %', v_default_tenant_id;
    
    -- Store for use in subsequent statements
    PERFORM set_config('app.default_tenant_id', v_default_tenant_id::text, false);
END $$;

-- ============================================================================
-- PURCHASE MODULE - Add tenant_id
-- ============================================================================

-- Suppliers
ALTER TABLE purchase.suppliers 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

UPDATE purchase.suppliers 
SET tenant_id = current_setting('app.default_tenant_id')::UUID 
WHERE tenant_id IS NULL;

ALTER TABLE purchase.suppliers 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE purchase.suppliers 
ADD CONSTRAINT fk_suppliers_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id 
ON purchase.suppliers(tenant_id);

-- Purchase Requisitions
ALTER TABLE purchase.purchase_requisitions 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

UPDATE purchase.purchase_requisitions 
SET tenant_id = current_setting('app.default_tenant_id')::UUID 
WHERE tenant_id IS NULL;

ALTER TABLE purchase.purchase_requisitions 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE purchase.purchase_requisitions 
ADD CONSTRAINT fk_requisitions_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_requisitions_tenant_id 
ON purchase.purchase_requisitions(tenant_id);

-- Purchase Orders
ALTER TABLE purchase.purchase_orders 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

UPDATE purchase.purchase_orders 
SET tenant_id = current_setting('app.default_tenant_id')::UUID 
WHERE tenant_id IS NULL;

ALTER TABLE purchase.purchase_orders 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE purchase.purchase_orders 
ADD CONSTRAINT fk_purchase_orders_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_id 
ON purchase.purchase_orders(tenant_id);

-- Vendor Invoices (if exists)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'purchase' AND table_name = 'vendor_invoices') THEN
        ALTER TABLE purchase.vendor_invoices ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE purchase.vendor_invoices SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE purchase.vendor_invoices ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE purchase.vendor_invoices ADD CONSTRAINT fk_vendor_invoices_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_vendor_invoices_tenant_id ON purchase.vendor_invoices(tenant_id);
    END IF;
END $$;

-- Goods Receipts (if exists)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'purchase' AND table_name = 'goods_receipts') THEN
        ALTER TABLE purchase.goods_receipts ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE purchase.goods_receipts SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE purchase.goods_receipts ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE purchase.goods_receipts ADD CONSTRAINT fk_goods_receipts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_goods_receipts_tenant_id ON purchase.goods_receipts(tenant_id);
    END IF;
END $$;

-- ============================================================================
-- ASSETS MODULE - Add tenant_id
-- ============================================================================

-- Asset Categories
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'assets' AND table_name = 'asset_categories') THEN
        ALTER TABLE assets.asset_categories ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE assets.asset_categories SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE assets.asset_categories ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE assets.asset_categories ADD CONSTRAINT fk_asset_categories_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_asset_categories_tenant_id ON assets.asset_categories(tenant_id);
    END IF;
END $$;

-- Fixed Assets
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'assets' AND table_name = 'fixed_assets') THEN
        ALTER TABLE assets.fixed_assets ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE assets.fixed_assets SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE assets.fixed_assets ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE assets.fixed_assets ADD CONSTRAINT fk_fixed_assets_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_fixed_assets_tenant_id ON assets.fixed_assets(tenant_id);
    END IF;
END $$;

-- Asset Depreciation Schedule
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'assets' AND table_name = 'asset_depreciation_schedule') THEN
        ALTER TABLE assets.asset_depreciation_schedule ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE assets.asset_depreciation_schedule SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE assets.asset_depreciation_schedule ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE assets.asset_depreciation_schedule ADD CONSTRAINT fk_asset_depreciation_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_asset_depreciation_tenant_id ON assets.asset_depreciation_schedule(tenant_id);
    END IF;
END $$;

-- Asset Maintenance
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'assets' AND table_name = 'asset_maintenance') THEN
        ALTER TABLE assets.asset_maintenance ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE assets.asset_maintenance SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE assets.asset_maintenance ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE assets.asset_maintenance ADD CONSTRAINT fk_asset_maintenance_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_asset_maintenance_tenant_id ON assets.asset_maintenance(tenant_id);
    END IF;
END $$;

-- Asset Transfers
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'assets' AND table_name = 'asset_transfers') THEN
        ALTER TABLE assets.asset_transfers ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE assets.asset_transfers SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE assets.asset_transfers ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE assets.asset_transfers ADD CONSTRAINT fk_asset_transfers_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_asset_transfers_tenant_id ON assets.asset_transfers(tenant_id);
    END IF;
END $$;

-- ============================================================================
-- HR MODULE - Add tenant_id
-- ============================================================================

-- Departments
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'hr' AND table_name = 'departments') THEN
        ALTER TABLE hr.departments ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE hr.departments SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE hr.departments ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE hr.departments ADD CONSTRAINT fk_departments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_departments_tenant_id ON hr.departments(tenant_id);
    END IF;
END $$;

-- Positions
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'hr' AND table_name = 'positions') THEN
        ALTER TABLE hr.positions ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE hr.positions SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE hr.positions ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE hr.positions ADD CONSTRAINT fk_positions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_positions_tenant_id ON hr.positions(tenant_id);
    END IF;
END $$;

-- Employees
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'hr' AND table_name = 'employees') THEN
        ALTER TABLE hr.employees ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE hr.employees SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE hr.employees ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE hr.employees ADD CONSTRAINT fk_employees_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON hr.employees(tenant_id);
    END IF;
END $$;

-- Payroll Periods
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'hr' AND table_name = 'payroll_periods') THEN
        ALTER TABLE hr.payroll_periods ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE hr.payroll_periods SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE hr.payroll_periods ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE hr.payroll_periods ADD CONSTRAINT fk_payroll_periods_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_payroll_periods_tenant_id ON hr.payroll_periods(tenant_id);
    END IF;
END $$;

-- Payroll Runs
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'hr' AND table_name = 'payroll_runs') THEN
        ALTER TABLE hr.payroll_runs ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE hr.payroll_runs SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE hr.payroll_runs ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE hr.payroll_runs ADD CONSTRAINT fk_payroll_runs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_payroll_runs_tenant_id ON hr.payroll_runs(tenant_id);
    END IF;
END $$;

-- Leave Requests (if exists)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'hr' AND table_name = 'leave_requests') THEN
        ALTER TABLE hr.leave_requests ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE hr.leave_requests SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE hr.leave_requests ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE hr.leave_requests ADD CONSTRAINT fk_leave_requests_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant_id ON hr.leave_requests(tenant_id);
    END IF;
END $$;

-- ============================================================================
-- INVENTORY MODULE - Add tenant_id
-- ============================================================================

-- Item Categories
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'inventory' AND table_name = 'item_categories') THEN
        ALTER TABLE inventory.item_categories ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE inventory.item_categories SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE inventory.item_categories ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE inventory.item_categories ADD CONSTRAINT fk_item_categories_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_item_categories_tenant_id ON inventory.item_categories(tenant_id);
    END IF;
END $$;

-- Warehouses
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'inventory' AND table_name = 'warehouses') THEN
        ALTER TABLE inventory.warehouses ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE inventory.warehouses SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE inventory.warehouses ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE inventory.warehouses ADD CONSTRAINT fk_warehouses_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_warehouses_tenant_id ON inventory.warehouses(tenant_id);
    END IF;
END $$;

-- Items
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'inventory' AND table_name = 'items') THEN
        ALTER TABLE inventory.items ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE inventory.items SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE inventory.items ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE inventory.items ADD CONSTRAINT fk_items_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_items_tenant_id ON inventory.items(tenant_id);
    END IF;
END $$;

-- Stock Levels
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'inventory' AND table_name = 'stock_levels') THEN
        ALTER TABLE inventory.stock_levels ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE inventory.stock_levels SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE inventory.stock_levels ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE inventory.stock_levels ADD CONSTRAINT fk_stock_levels_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_stock_levels_tenant_id ON inventory.stock_levels(tenant_id);
    END IF;
END $$;

-- Stock Movements
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'inventory' AND table_name = 'stock_movements') THEN
        ALTER TABLE inventory.stock_movements ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE inventory.stock_movements SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE inventory.stock_movements ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE inventory.stock_movements ADD CONSTRAINT fk_stock_movements_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_id ON inventory.stock_movements(tenant_id);
    END IF;
END $$;

-- ============================================================================
-- LOGISTICS MODULE - Add tenant_id
-- ============================================================================

-- Vehicles
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'logistics' AND table_name = 'vehicles') THEN
        ALTER TABLE logistics.vehicles ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE logistics.vehicles SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE logistics.vehicles ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE logistics.vehicles ADD CONSTRAINT fk_vehicles_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_id ON logistics.vehicles(tenant_id);
    END IF;
END $$;

-- Drivers
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'logistics' AND table_name = 'drivers') THEN
        ALTER TABLE logistics.drivers ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE logistics.drivers SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE logistics.drivers ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE logistics.drivers ADD CONSTRAINT fk_drivers_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_drivers_tenant_id ON logistics.drivers(tenant_id);
    END IF;
END $$;

-- Trips
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'logistics' AND table_name = 'trips') THEN
        ALTER TABLE logistics.trips ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE logistics.trips SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE logistics.trips ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE logistics.trips ADD CONSTRAINT fk_trips_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_trips_tenant_id ON logistics.trips(tenant_id);
    END IF;
END $$;

-- Loads
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'logistics' AND table_name = 'loads') THEN
        ALTER TABLE logistics.loads ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE logistics.loads SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE logistics.loads ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE logistics.loads ADD CONSTRAINT fk_loads_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_loads_tenant_id ON logistics.loads(tenant_id);
    END IF;
END $$;

-- Fuel Transactions
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'logistics' AND table_name = 'fuel_transactions') THEN
        ALTER TABLE logistics.fuel_transactions ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE logistics.fuel_transactions SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE logistics.fuel_transactions ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE logistics.fuel_transactions ADD CONSTRAINT fk_fuel_transactions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_fuel_transactions_tenant_id ON logistics.fuel_transactions(tenant_id);
    END IF;
END $$;

-- Routes
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'logistics' AND table_name = 'routes') THEN
        ALTER TABLE logistics.routes ADD COLUMN IF NOT EXISTS tenant_id UUID;
        UPDATE logistics.routes SET tenant_id = current_setting('app.default_tenant_id')::UUID WHERE tenant_id IS NULL;
        ALTER TABLE logistics.routes ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE logistics.routes ADD CONSTRAINT fk_routes_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_routes_tenant_id ON logistics.routes(tenant_id);
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERY
-- Run this after migration to verify all tables have tenant_id
-- ============================================================================

-- SELECT 
--     table_schema, 
--     table_name,
--     CASE WHEN column_name IS NOT NULL THEN '✓ tenant_id exists' ELSE '✗ MISSING tenant_id' END as status
-- FROM information_schema.tables t
-- LEFT JOIN information_schema.columns c 
--     ON t.table_schema = c.table_schema 
--     AND t.table_name = c.table_name 
--     AND c.column_name = 'tenant_id'
-- WHERE t.table_schema IN ('purchase', 'assets', 'hr', 'inventory', 'logistics')
--     AND t.table_type = 'BASE TABLE'
-- ORDER BY t.table_schema, t.table_name;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
SELECT 'Multi-tenant isolation migration completed successfully!' as status;
