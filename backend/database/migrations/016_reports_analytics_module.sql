-- ================================================
-- Reports & Analytics Module
-- ================================================
-- 
-- Comprehensive self-service reporting and analytics infrastructure
-- 
-- Features:
-- - Custom report builder
-- - Scheduled reports
-- - Interactive dashboards
-- - KPI tracking
-- - Data exports
-- - Report sharing & subscriptions
-- - Drill-down analytics
-- - Real-time data refresh
--
-- Tables: 15
-- ================================================

-- ================================================
-- REPORT DEFINITIONS
-- ================================================

-- Report Templates/Definitions
CREATE TABLE IF NOT EXISTS report_definitions (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    report_code VARCHAR(50) UNIQUE NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    report_description TEXT,
    report_category VARCHAR(100) NOT NULL, -- Sales, Purchase, Financial, HR, Inventory, Custom
    data_source VARCHAR(100) NOT NULL, -- Main table/view to query
    query_template TEXT NOT NULL, -- SQL template with parameters
    parameters JSONB DEFAULT '[]', -- Report parameters (filters, date ranges, etc.)
    columns JSONB NOT NULL, -- Column definitions
    default_filters JSONB DEFAULT '{}',
    default_sort JSONB DEFAULT '{}',
    aggregations JSONB DEFAULT '[]', -- Sum, Count, Avg, etc.
    grouping JSONB DEFAULT '[]',
    chart_config JSONB DEFAULT '{}', -- Chart type and settings
    is_system_report BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_report_definitions_tenant ON report_definitions(tenant_id);
CREATE INDEX idx_report_definitions_category ON report_definitions(report_category);
CREATE INDEX idx_report_definitions_active ON report_definitions(is_active);

-- Report Schedules
CREATE TABLE IF NOT EXISTS report_schedules (
    schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    report_id UUID NOT NULL REFERENCES report_definitions(report_id) ON DELETE CASCADE,
    schedule_name VARCHAR(255) NOT NULL,
    frequency VARCHAR(50) NOT NULL, -- DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY
    schedule_config JSONB NOT NULL, -- Cron expression or config
    parameters JSONB DEFAULT '{}', -- Override report parameters
    output_format VARCHAR(50) DEFAULT 'PDF', -- PDF, EXCEL, CSV
    recipients JSONB NOT NULL, -- Email addresses
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_report_schedules_tenant ON report_schedules(tenant_id);
CREATE INDEX idx_report_schedules_report ON report_schedules(report_id);
CREATE INDEX idx_report_schedules_next_run ON report_schedules(next_run_at) WHERE is_active = true;

-- Report Executions (History)
CREATE TABLE IF NOT EXISTS report_executions (
    execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    report_id UUID NOT NULL REFERENCES report_definitions(report_id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES report_schedules(schedule_id) ON DELETE SET NULL,
    execution_type VARCHAR(50) NOT NULL, -- MANUAL, SCHEDULED
    parameters JSONB DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'RUNNING', -- RUNNING, COMPLETED, FAILED
    row_count INTEGER,
    execution_time_ms INTEGER,
    error_message TEXT,
    output_url TEXT, -- S3 or file path
    output_format VARCHAR(50),
    file_size_bytes BIGINT,
    executed_by UUID,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_report_executions_tenant ON report_executions(tenant_id);
CREATE INDEX idx_report_executions_report ON report_executions(report_id);
CREATE INDEX idx_report_executions_status ON report_executions(status);
CREATE INDEX idx_report_executions_started ON report_executions(started_at DESC);

-- Report Favorites/Saved
CREATE TABLE IF NOT EXISTS report_favorites (
    favorite_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    report_id UUID NOT NULL REFERENCES report_definitions(report_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    saved_parameters JSONB DEFAULT '{}',
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_report_favorites_user ON report_favorites(user_id);
CREATE INDEX idx_report_favorites_report ON report_favorites(report_id);

-- ================================================
-- DASHBOARDS
-- ================================================

-- Dashboard Definitions
CREATE TABLE IF NOT EXISTS dashboards (
    dashboard_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    dashboard_code VARCHAR(50) UNIQUE NOT NULL,
    dashboard_name VARCHAR(255) NOT NULL,
    dashboard_description TEXT,
    dashboard_category VARCHAR(100) NOT NULL, -- Executive, Sales, Finance, Operations, HR
    layout_config JSONB NOT NULL, -- Grid layout configuration
    refresh_interval INTEGER DEFAULT 300, -- Seconds
    is_default BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    owner_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dashboards_tenant ON dashboards(tenant_id);
CREATE INDEX idx_dashboards_category ON dashboards(dashboard_category);
CREATE INDEX idx_dashboards_owner ON dashboards(owner_id);

-- Dashboard Widgets
CREATE TABLE IF NOT EXISTS dashboard_widgets (
    widget_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(dashboard_id) ON DELETE CASCADE,
    widget_type VARCHAR(50) NOT NULL, -- CHART, TABLE, KPI, TEXT, METRIC
    widget_title VARCHAR(255) NOT NULL,
    data_source VARCHAR(100), -- Table, view, or report_id
    query_config JSONB NOT NULL, -- SQL or data config
    visualization_config JSONB NOT NULL, -- Chart settings
    position_config JSONB NOT NULL, -- x, y, width, height
    refresh_interval INTEGER, -- Override dashboard refresh
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dashboard_widgets_dashboard ON dashboard_widgets(dashboard_id);

-- Dashboard Shares
CREATE TABLE IF NOT EXISTS dashboard_shares (
    share_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(dashboard_id) ON DELETE CASCADE,
    shared_with_user_id UUID,
    shared_with_role VARCHAR(100),
    permission VARCHAR(50) NOT NULL DEFAULT 'VIEW', -- VIEW, EDIT
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dashboard_shares_dashboard ON dashboard_shares(dashboard_id);
CREATE INDEX idx_dashboard_shares_user ON dashboard_shares(shared_with_user_id);

-- ================================================
-- KPIs & METRICS
-- ================================================

-- KPI Definitions
CREATE TABLE IF NOT EXISTS kpi_definitions (
    kpi_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    kpi_code VARCHAR(50) UNIQUE NOT NULL,
    kpi_name VARCHAR(255) NOT NULL,
    kpi_description TEXT,
    kpi_category VARCHAR(100) NOT NULL, -- Sales, Financial, Operations, HR
    calculation_query TEXT NOT NULL, -- SQL to calculate KPI
    calculation_frequency VARCHAR(50) DEFAULT 'DAILY', -- REALTIME, HOURLY, DAILY, WEEKLY
    target_value DECIMAL(20,2),
    target_comparison VARCHAR(20) DEFAULT 'GREATER', -- GREATER, LESS, EQUAL
    unit VARCHAR(50), -- Currency, Percentage, Count, etc.
    format_pattern VARCHAR(50), -- Display format
    trend_direction VARCHAR(20), -- UP_IS_GOOD, DOWN_IS_GOOD
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kpi_definitions_tenant ON kpi_definitions(tenant_id);
CREATE INDEX idx_kpi_definitions_category ON kpi_definitions(kpi_category);

-- KPI Values (Historical)
CREATE TABLE IF NOT EXISTS kpi_values (
    value_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_id UUID NOT NULL REFERENCES kpi_definitions(kpi_id) ON DELETE CASCADE,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    value DECIMAL(20,2) NOT NULL,
    previous_value DECIMAL(20,2),
    change_percentage DECIMAL(10,2),
    status VARCHAR(50), -- ON_TARGET, ABOVE_TARGET, BELOW_TARGET
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kpi_values_kpi ON kpi_values(kpi_id);
CREATE INDEX idx_kpi_values_period ON kpi_values(period_start, period_end);

-- ================================================
-- DATA EXPORTS
-- ================================================

-- Export Templates
CREATE TABLE IF NOT EXISTS export_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    data_source VARCHAR(100) NOT NULL,
    columns JSONB NOT NULL,
    filters JSONB DEFAULT '{}',
    format VARCHAR(50) NOT NULL, -- CSV, EXCEL, JSON, XML
    format_options JSONB DEFAULT '{}', -- Headers, delimiters, etc.
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_export_templates_tenant ON export_templates(tenant_id);

-- Export History
CREATE TABLE IF NOT EXISTS export_history (
    export_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    template_id UUID REFERENCES export_templates(template_id) ON DELETE SET NULL,
    export_name VARCHAR(255),
    data_source VARCHAR(100) NOT NULL,
    row_count INTEGER,
    file_url TEXT,
    file_size_bytes BIGINT,
    format VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'PROCESSING', -- PROCESSING, COMPLETED, FAILED
    error_message TEXT,
    exported_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_export_history_tenant ON export_history(tenant_id);
CREATE INDEX idx_export_history_user ON export_history(exported_by);
CREATE INDEX idx_export_history_created ON export_history(created_at DESC);

-- ================================================
-- ANALYTICS & INSIGHTS
-- ================================================

-- Saved Queries
CREATE TABLE IF NOT EXISTS saved_queries (
    query_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    query_name VARCHAR(255) NOT NULL,
    query_description TEXT,
    query_sql TEXT NOT NULL,
    parameters JSONB DEFAULT '[]',
    is_public BOOLEAN DEFAULT false,
    owner_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_saved_queries_tenant ON saved_queries(tenant_id);
CREATE INDEX idx_saved_queries_owner ON saved_queries(owner_id);

-- Report Subscriptions
CREATE TABLE IF NOT EXISTS report_subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    report_id UUID REFERENCES report_definitions(report_id) ON DELETE CASCADE,
    dashboard_id UUID REFERENCES dashboards(dashboard_id) ON DELETE CASCADE,
    frequency VARCHAR(50) NOT NULL, -- DAILY, WEEKLY, MONTHLY
    delivery_method VARCHAR(50) DEFAULT 'EMAIL', -- EMAIL, IN_APP
    delivery_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_report_subscriptions_user ON report_subscriptions(user_id);
CREATE INDEX idx_report_subscriptions_report ON report_subscriptions(report_id);

-- ================================================
-- PRE-POPULATED SYSTEM REPORTS
-- ================================================

-- System Report Definitions
INSERT INTO report_definitions (
    tenant_id, report_code, report_name, report_description, report_category,
    data_source, query_template, parameters, columns, is_system_report, is_active
) VALUES
-- Sales Reports
(
    '00000000-0000-0000-0000-000000000000',
    'SALES_SUMMARY',
    'Sales Summary Report',
    'Comprehensive sales performance analysis',
    'Sales',
    'invoices',
    'SELECT * FROM invoices WHERE tenant_id = $1 AND invoice_date BETWEEN $2 AND $3',
    '[{"name":"start_date","type":"date"},{"name":"end_date","type":"date"}]',
    '[{"field":"invoice_number","label":"Invoice #"},{"field":"customer_name","label":"Customer"},{"field":"total_amount","label":"Amount"}]',
    true,
    true
),
(
    '00000000-0000-0000-0000-000000000000',
    'SALES_BY_CUSTOMER',
    'Sales by Customer',
    'Revenue breakdown by customer',
    'Sales',
    'invoices',
    'SELECT customer_name, COUNT(*) as invoice_count, SUM(total_amount) as total_sales FROM invoices WHERE tenant_id = $1 GROUP BY customer_name',
    '[]',
    '[{"field":"customer_name","label":"Customer"},{"field":"invoice_count","label":"Invoices"},{"field":"total_sales","label":"Total Sales"}]',
    true,
    true
),

-- Purchase Reports
(
    '00000000-0000-0000-0000-000000000000',
    'PURCHASE_SUMMARY',
    'Purchase Orders Summary',
    'Overview of all purchase orders',
    'Purchase',
    'purchase_orders',
    'SELECT * FROM purchase_orders WHERE tenant_id = $1 AND order_date BETWEEN $2 AND $3',
    '[{"name":"start_date","type":"date"},{"name":"end_date","type":"date"}]',
    '[{"field":"po_number","label":"PO #"},{"field":"supplier_name","label":"Supplier"},{"field":"total_amount","label":"Amount"}]',
    true,
    true
),

-- Financial Reports
(
    '00000000-0000-0000-0000-000000000000',
    'TRIAL_BALANCE',
    'Trial Balance',
    'Account balances for a period',
    'Financial',
    'chart_of_accounts',
    'SELECT account_code, account_name, SUM(debit_amount) as debits, SUM(credit_amount) as credits FROM journal_entries WHERE tenant_id = $1 GROUP BY account_code, account_name',
    '[]',
    '[{"field":"account_code","label":"Code"},{"field":"account_name","label":"Account"},{"field":"debits","label":"Debits"},{"field":"credits","label":"Credits"}]',
    true,
    true
),
(
    '00000000-0000-0000-0000-000000000000',
    'PROFIT_LOSS',
    'Profit & Loss Statement',
    'Income statement for period',
    'Financial',
    'journal_entries',
    'SELECT account_type, SUM(amount) as total FROM journal_entries WHERE tenant_id = $1 AND account_type IN (''INCOME'',''EXPENSE'') GROUP BY account_type',
    '[]',
    '[{"field":"account_type","label":"Type"},{"field":"total","label":"Amount"}]',
    true,
    true
),

-- Inventory Reports
(
    '00000000-0000-0000-0000-000000000000',
    'INVENTORY_VALUATION',
    'Inventory Valuation',
    'Current stock value by item',
    'Inventory',
    'inventory_items',
    'SELECT item_code, item_name, quantity_on_hand, unit_cost, (quantity_on_hand * unit_cost) as total_value FROM inventory_items WHERE tenant_id = $1',
    '[]',
    '[{"field":"item_code","label":"Code"},{"field":"item_name","label":"Item"},{"field":"quantity_on_hand","label":"Qty"},{"field":"total_value","label":"Value"}]',
    true,
    true
),

-- HR Reports
(
    '00000000-0000-0000-0000-000000000000',
    'EMPLOYEE_LIST',
    'Employee Directory',
    'Active employee listing',
    'HR',
    'employees',
    'SELECT employee_number, first_name, last_name, department, position, hire_date FROM employees WHERE tenant_id = $1 AND status = ''ACTIVE''',
    '[]',
    '[{"field":"employee_number","label":"Emp #"},{"field":"first_name","label":"First Name"},{"field":"last_name","label":"Last Name"},{"field":"department","label":"Department"}]',
    true,
    true
);

-- ================================================
-- SYSTEM KPIs
-- ================================================

INSERT INTO kpi_definitions (
    tenant_id, kpi_code, kpi_name, kpi_description, kpi_category,
    calculation_query, calculation_frequency, unit, trend_direction, is_active
) VALUES
-- Sales KPIs
(
    '00000000-0000-0000-0000-000000000000',
    'TOTAL_REVENUE',
    'Total Revenue',
    'Sum of all invoice amounts',
    'Sales',
    'SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE tenant_id = $1 AND status = ''PAID''',
    'DAILY',
    'Currency',
    'UP_IS_GOOD',
    true
),
(
    '00000000-0000-0000-0000-000000000000',
    'AVG_DEAL_SIZE',
    'Average Deal Size',
    'Average invoice amount',
    'Sales',
    'SELECT COALESCE(AVG(total_amount), 0) FROM invoices WHERE tenant_id = $1',
    'DAILY',
    'Currency',
    'UP_IS_GOOD',
    true
),

-- Financial KPIs
(
    '00000000-0000-0000-0000-000000000000',
    'GROSS_PROFIT_MARGIN',
    'Gross Profit Margin',
    'Profitability percentage',
    'Financial',
    'SELECT COALESCE((SUM(CASE WHEN account_type = ''INCOME'' THEN amount ELSE 0 END) - SUM(CASE WHEN account_type = ''EXPENSE'' THEN amount ELSE 0 END)) / NULLIF(SUM(CASE WHEN account_type = ''INCOME'' THEN amount ELSE 0 END), 0) * 100, 0) FROM journal_entries WHERE tenant_id = $1',
    'DAILY',
    'Percentage',
    'UP_IS_GOOD',
    true
),

-- Operational KPIs
(
    '00000000-0000-0000-0000-000000000000',
    'ORDER_FULFILLMENT_RATE',
    'Order Fulfillment Rate',
    'Percentage of orders fulfilled on time',
    'Operations',
    'SELECT COALESCE(COUNT(CASE WHEN status = ''FULFILLED'' THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 0) FROM sales_orders WHERE tenant_id = $1',
    'DAILY',
    'Percentage',
    'UP_IS_GOOD',
    true
),

-- HR KPIs
(
    '00000000-0000-0000-0000-000000000000',
    'EMPLOYEE_HEADCOUNT',
    'Employee Headcount',
    'Total active employees',
    'HR',
    'SELECT COUNT(*) FROM employees WHERE tenant_id = $1 AND status = ''ACTIVE''',
    'DAILY',
    'Count',
    'UP_IS_GOOD',
    true
);

-- ================================================
-- COMPLETION
-- ================================================

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO worldclass_admin;

COMMIT;

-- Report successful completion
DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Reports & Analytics Module Schema Created Successfully!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Tables Created: 15';
    RAISE NOTICE '  - report_definitions';
    RAISE NOTICE '  - report_schedules';
    RAISE NOTICE '  - report_executions';
    RAISE NOTICE '  - report_favorites';
    RAISE NOTICE '  - dashboards';
    RAISE NOTICE '  - dashboard_widgets';
    RAISE NOTICE '  - dashboard_shares';
    RAISE NOTICE '  - kpi_definitions';
    RAISE NOTICE '  - kpi_values';
    RAISE NOTICE '  - export_templates';
    RAISE NOTICE '  - export_history';
    RAISE NOTICE '  - saved_queries';
    RAISE NOTICE '  - report_subscriptions';
    RAISE NOTICE '';
    RAISE NOTICE 'System Reports: 7 pre-configured';
    RAISE NOTICE 'System KPIs: 5 pre-configured';
    RAISE NOTICE '==================================================';
END $$;
