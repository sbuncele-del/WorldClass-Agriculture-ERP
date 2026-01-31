-- Migration: 031_missing_tables.sql
-- Description: Add missing tables referenced by V2 controllers
-- Date: December 2025

-- ============================================================
-- PROJECTS MODULE
-- ============================================================

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    project_type VARCHAR(100),
    client_id UUID,
    manager_id UUID,
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15,2),
    actual_cost DECIMAL(15,2) DEFAULT 0,
    priority VARCHAR(20) DEFAULT 'medium',
    progress_percentage INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project tasks table
CREATE TABLE IF NOT EXISTS project_tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    project_id UUID REFERENCES projects(project_id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES project_tasks(task_id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_to UUID,
    estimated_hours DECIMAL(10,2),
    actual_hours DECIMAL(10,2) DEFAULT 0,
    start_date DATE,
    due_date DATE,
    completed_date DATE,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MESSAGING MODULE (Driver-Dispatch)
-- ============================================================

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    recipient_id UUID,
    recipient_type VARCHAR(50) DEFAULT 'user', -- user, group, broadcast
    subject VARCHAR(255),
    body TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'general', -- general, dispatch, alert, notification
    priority VARCHAR(20) DEFAULT 'normal',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    parent_message_id UUID REFERENCES messages(message_id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DELIVERY VERIFICATION (POD)
-- ============================================================

-- Delivery verifications table
CREATE TABLE IF NOT EXISTS delivery_verifications (
    verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    trip_id UUID,
    stop_id UUID,
    order_id UUID,
    verified_by UUID,
    recipient_name VARCHAR(255),
    verification_method VARCHAR(50), -- signature, photo, pin, biometric
    signature_url TEXT,
    photo_urls JSONB, -- Array of photo URLs
    notes TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    device_info JSONB,
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery events table
CREATE TABLE IF NOT EXISTS delivery_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    delivery_id UUID,
    trip_id UUID,
    stop_id UUID,
    event_type VARCHAR(50) NOT NULL, -- picked_up, in_transit, arrived, delivered, failed, returned
    event_status VARCHAR(50),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    address TEXT,
    event_data JSONB,
    recorded_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI CHAT LOGS
-- ============================================================

-- AI chat logs table
CREATE TABLE IF NOT EXISTS ai_chat_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    session_id UUID,
    conversation_id UUID,
    message_role VARCHAR(20) NOT NULL, -- user, assistant, system
    message TEXT NOT NULL,
    response TEXT,
    model VARCHAR(100),
    provider VARCHAR(50), -- openai, anthropic
    tokens_input INTEGER,
    tokens_output INTEGER,
    cost_usd DECIMAL(10,6),
    latency_ms INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BUDGET SCENARIOS (Financial What-If)
-- ============================================================

-- Budget scenarios table
CREATE TABLE IF NOT EXISTS budget_scenarios (
    scenario_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_budget_id UUID,
    scenario_type VARCHAR(50) DEFAULT 'what-if', -- what-if, forecast, variance
    status VARCHAR(50) DEFAULT 'draft',
    assumptions JSONB,
    adjustments JSONB,
    results JSONB,
    created_by UUID,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LOGISTICS EXTENSIONS
-- ============================================================

-- Driver status table (real-time tracking)
CREATE TABLE IF NOT EXISTS driver_status (
    status_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    driver_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL, -- available, on_trip, break, offline, emergency
    current_trip_id UUID,
    current_vehicle_id UUID,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    heading DECIMAL(5,2),
    speed DECIMAL(6,2),
    battery_level INTEGER,
    last_activity VARCHAR(255),
    shift_start TIMESTAMPTZ,
    shift_end TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Emergency alerts table
CREATE TABLE IF NOT EXISTS emergency_alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    alert_type VARCHAR(50) NOT NULL, -- sos, accident, breakdown, security, medical
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    title VARCHAR(255),
    message TEXT NOT NULL,
    source_entity_type VARCHAR(50), -- driver, vehicle, trip, geofence
    source_entity_id UUID,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    address TEXT,
    reported_by UUID,
    assigned_to UUID,
    status VARCHAR(50) DEFAULT 'active', -- active, acknowledged, resolved, false_alarm
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracking providers table
CREATE TABLE IF NOT EXISTS tracking_providers (
    provider_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    provider_type VARCHAR(50), -- gps_device, mobile_app, telematics, api
    api_endpoint TEXT,
    api_key_encrypted TEXT,
    credentials JSONB,
    vehicle_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    sync_interval_seconds INTEGER DEFAULT 30,
    last_sync_at TIMESTAMPTZ,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FINANCIAL EXTENSIONS
-- ============================================================

-- Variance analysis table
CREATE TABLE IF NOT EXISTS variance_analysis (
    analysis_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    period_id UUID,
    fiscal_year_id UUID,
    account_id UUID,
    department_id UUID,
    cost_center_id UUID,
    analysis_type VARCHAR(50) DEFAULT 'budget_vs_actual', -- budget_vs_actual, period_comparison, forecast_vs_actual
    budget_amount DECIMAL(15,2),
    actual_amount DECIMAL(15,2),
    forecast_amount DECIMAL(15,2),
    prior_period_amount DECIMAL(15,2),
    variance_amount DECIMAL(15,2),
    variance_percentage DECIMAL(10,4),
    variance_type VARCHAR(20), -- favorable, unfavorable, on_target
    explanation TEXT,
    action_required BOOLEAN DEFAULT FALSE,
    action_notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(tenant_id, manager_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_tenant ON project_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON project_tasks(tenant_id, project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned ON project_tasks(tenant_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks(tenant_id, status);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(tenant_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(tenant_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(tenant_id, recipient_id, is_read) WHERE is_read = FALSE;

-- Delivery indexes
CREATE INDEX IF NOT EXISTS idx_delivery_verifications_tenant ON delivery_verifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_delivery_verifications_trip ON delivery_verifications(tenant_id, trip_id);
CREATE INDEX IF NOT EXISTS idx_delivery_events_tenant ON delivery_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_delivery_events_trip ON delivery_events(tenant_id, trip_id);
CREATE INDEX IF NOT EXISTS idx_delivery_events_type ON delivery_events(tenant_id, event_type);

-- AI chat indexes
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_tenant ON ai_chat_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_user ON ai_chat_logs(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_session ON ai_chat_logs(tenant_id, session_id);

-- Budget scenarios indexes
CREATE INDEX IF NOT EXISTS idx_budget_scenarios_tenant ON budget_scenarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budget_scenarios_base ON budget_scenarios(tenant_id, base_budget_id);

-- Logistics indexes
CREATE INDEX IF NOT EXISTS idx_driver_status_tenant ON driver_status(tenant_id);
CREATE INDEX IF NOT EXISTS idx_driver_status_driver ON driver_status(tenant_id, driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_status_status ON driver_status(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_tenant ON emergency_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_severity ON emergency_alerts(tenant_id, severity);
CREATE INDEX IF NOT EXISTS idx_tracking_providers_tenant ON tracking_providers(tenant_id);

-- Variance analysis indexes
CREATE INDEX IF NOT EXISTS idx_variance_analysis_tenant ON variance_analysis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_variance_analysis_period ON variance_analysis(tenant_id, period_id);
CREATE INDEX IF NOT EXISTS idx_variance_analysis_account ON variance_analysis(tenant_id, account_id);

-- ============================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE projects IS 'Project management - tracks projects with budgets, timelines, and progress';
COMMENT ON TABLE project_tasks IS 'Project tasks - individual work items within projects';
COMMENT ON TABLE messages IS 'Internal messaging system for driver-dispatch and team communication';
COMMENT ON TABLE delivery_verifications IS 'Proof of delivery records with signatures and photos';
COMMENT ON TABLE delivery_events IS 'Timeline of delivery status changes and events';
COMMENT ON TABLE ai_chat_logs IS 'AI assistant conversation history for analytics and debugging';
COMMENT ON TABLE budget_scenarios IS 'Financial what-if scenarios for budget planning';
COMMENT ON TABLE driver_status IS 'Real-time driver availability and location tracking';
COMMENT ON TABLE emergency_alerts IS 'Emergency and safety alerts from drivers and vehicles';
COMMENT ON TABLE tracking_providers IS 'GPS and telematics provider configurations';
COMMENT ON TABLE variance_analysis IS 'Budget vs actual variance analysis records';
