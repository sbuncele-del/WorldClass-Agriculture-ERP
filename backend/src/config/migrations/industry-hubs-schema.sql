-- ============================================================================
-- INDUSTRY HUBS DATABASE SCHEMA
-- Created: December 12, 2025
-- Purpose: Tenant-aware tables for Mining, Agriculture, Construction, Property, Communications
-- ============================================================================

-- ============================================================================
-- MINING MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mining_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    location_lat DECIMAL(10, 6),
    location_lng DECIMAL(10, 6),
    province VARCHAR(100),
    address TEXT,
    site_type VARCHAR(50) NOT NULL DEFAULT 'underground', -- underground, open-pit, alluvial
    mineral_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'operational', -- operational, maintenance, suspended, closed
    employees_count INTEGER DEFAULT 0,
    daily_capacity DECIMAL(15, 2), -- tonnes
    mining_rights_number VARCHAR(100),
    mining_rights_expiry DATE,
    environmental_license VARCHAR(100),
    environmental_license_expiry DATE,
    safety_rating VARCHAR(10),
    last_inspection_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS mining_production (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES mining_sites(id) ON DELETE CASCADE,
    production_date DATE NOT NULL,
    shift VARCHAR(10),
    tonnes_extracted DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tonnes_processed DECIMAL(15, 2) DEFAULT 0,
    grade DECIMAL(10, 4), -- mineral grade/quality
    recovery_rate DECIMAL(5, 2), -- percentage
    notes TEXT,
    recorded_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mining_safety_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES mining_sites(id) ON DELETE CASCADE,
    incident_date TIMESTAMP NOT NULL,
    incident_type VARCHAR(100) NOT NULL, -- injury, near-miss, environmental, equipment
    severity VARCHAR(50) NOT NULL, -- minor, moderate, serious, fatal
    description TEXT NOT NULL,
    location_in_site VARCHAR(200),
    employees_involved INTEGER DEFAULT 0,
    injuries_count INTEGER DEFAULT 0,
    fatalities_count INTEGER DEFAULT 0,
    root_cause TEXT,
    corrective_actions TEXT,
    status VARCHAR(50) DEFAULT 'open', -- open, investigating, resolved, closed
    reported_by UUID,
    investigated_by UUID,
    closed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mining_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    site_id UUID REFERENCES mining_sites(id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    equipment_type VARCHAR(100) NOT NULL, -- haul_truck, loader, drill, crusher, conveyor
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    year_manufactured INTEGER,
    serial_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'operational', -- operational, maintenance, repair, retired
    capacity DECIMAL(15, 2),
    capacity_unit VARCHAR(50),
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    operating_hours DECIMAL(10, 1) DEFAULT 0,
    purchase_date DATE,
    purchase_cost DECIMAL(15, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, code)
);

-- ============================================================================
-- AGRICULTURE MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    location_lat DECIMAL(10, 6),
    location_lng DECIMAL(10, 6),
    province VARCHAR(100),
    address TEXT,
    size_hectares DECIMAL(15, 2) NOT NULL,
    farm_type VARCHAR(100) NOT NULL, -- vineyard, grain, livestock, mixed, sugarcane, citrus
    status VARCHAR(50) DEFAULT 'operational',
    manager_id UUID,
    manager_name VARCHAR(200),
    water_source VARCHAR(100), -- borehole, dam, river, irrigation
    soil_type VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS farm_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    size_hectares DECIMAL(10, 2) NOT NULL,
    soil_type VARCHAR(100),
    irrigation_type VARCHAR(100),
    current_crop VARCHAR(100),
    planting_date DATE,
    expected_harvest_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- active, fallow, preparing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, farm_id, code)
);

CREATE TABLE IF NOT EXISTS crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    field_id UUID REFERENCES farm_fields(id) ON DELETE SET NULL,
    crop_name VARCHAR(100) NOT NULL,
    variety VARCHAR(100),
    planting_date DATE NOT NULL,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    area_planted DECIMAL(10, 2) NOT NULL,
    expected_yield DECIMAL(15, 2),
    actual_yield DECIMAL(15, 2),
    yield_unit VARCHAR(50) DEFAULT 'tonnes',
    status VARCHAR(50) DEFAULT 'planted', -- planted, growing, harvesting, harvested
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS livestock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    tag_number VARCHAR(50) NOT NULL,
    animal_type VARCHAR(100) NOT NULL, -- cattle, sheep, goat, pig, poultry
    breed VARCHAR(100),
    gender VARCHAR(20),
    birth_date DATE,
    purchase_date DATE,
    purchase_price DECIMAL(15, 2),
    weight DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'active', -- active, sold, deceased, transferred
    health_status VARCHAR(50) DEFAULT 'healthy',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, tag_number)
);

CREATE TABLE IF NOT EXISTS farm_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    field_id UUID REFERENCES farm_fields(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    task_type VARCHAR(100) NOT NULL, -- planting, irrigation, fertilizing, spraying, harvesting, maintenance
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
    scheduled_date DATE,
    completed_date DATE,
    assigned_to UUID,
    assigned_to_name VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CONSTRUCTION MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS construction_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    client_name VARCHAR(200),
    client_id UUID,
    location_address TEXT,
    province VARCHAR(100),
    project_type VARCHAR(100) NOT NULL, -- commercial, residential, civil, industrial
    cidb_grade VARCHAR(20), -- South African CIDB grading
    contract_value DECIMAL(18, 2),
    currency VARCHAR(3) DEFAULT 'ZAR',
    status VARCHAR(50) DEFAULT 'active', -- planning, active, on_hold, completed, cancelled
    progress_percentage INTEGER DEFAULT 0,
    start_date DATE,
    target_completion DATE,
    actual_completion DATE,
    project_manager_id UUID,
    project_manager_name VARCHAR(200),
    safety_officer_id UUID,
    safety_officer_name VARCHAR(200),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS construction_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES construction_projects(id) ON DELETE CASCADE,
    phase_number INTEGER NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE,
    target_end_date DATE,
    actual_end_date DATE,
    progress_percentage INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- pending, active, completed
    budget DECIMAL(18, 2),
    actual_cost DECIMAL(18, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS construction_safety (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES construction_projects(id) ON DELETE CASCADE,
    incident_date TIMESTAMP NOT NULL,
    incident_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    location_on_site VARCHAR(200),
    injuries_count INTEGER DEFAULT 0,
    fatalities_count INTEGER DEFAULT 0,
    treatment_given TEXT,
    root_cause TEXT,
    corrective_action TEXT,
    status VARCHAR(50) DEFAULT 'open',
    reported_by VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS construction_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES construction_projects(id) ON DELETE CASCADE,
    material_code VARCHAR(50) NOT NULL,
    material_name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(50) NOT NULL,
    quantity_required DECIMAL(15, 2) NOT NULL,
    quantity_delivered DECIMAL(15, 2) DEFAULT 0,
    quantity_used DECIMAL(15, 2) DEFAULT 0,
    unit_cost DECIMAL(15, 2),
    supplier_name VARCHAR(200),
    delivery_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PROPERTY MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    property_type VARCHAR(100) NOT NULL, -- commercial, residential, industrial, mixed
    sub_type VARCHAR(100), -- office, retail, apartments, warehouse
    address TEXT NOT NULL,
    province VARCHAR(100),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    total_units INTEGER DEFAULT 1,
    total_area_sqm DECIMAL(15, 2),
    market_value DECIMAL(18, 2),
    purchase_date DATE,
    purchase_price DECIMAL(18, 2),
    manager_id UUID,
    manager_name VARCHAR(200),
    status VARCHAR(50) DEFAULT 'active', -- active, under_renovation, for_sale, sold
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS property_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_number VARCHAR(50) NOT NULL,
    floor_number INTEGER,
    unit_type VARCHAR(100), -- studio, 1bed, 2bed, office, retail
    area_sqm DECIMAL(10, 2),
    bedrooms INTEGER,
    bathrooms INTEGER,
    monthly_rent DECIMAL(15, 2),
    status VARCHAR(50) DEFAULT 'vacant', -- vacant, occupied, under_maintenance, reserved
    current_tenant_id UUID,
    current_tenant_name VARCHAR(200),
    lease_start_date DATE,
    lease_end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, property_id, unit_number)
);

CREATE TABLE IF NOT EXISTS property_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    tenant_type VARCHAR(50) NOT NULL, -- individual, company
    id_number VARCHAR(50), -- SA ID or Company Reg
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, blacklisted
    credit_score INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS property_leases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES property_units(id) ON DELETE CASCADE,
    property_tenant_id UUID NOT NULL REFERENCES property_tenants(id) ON DELETE CASCADE,
    lease_number VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_rent DECIMAL(15, 2) NOT NULL,
    deposit_amount DECIMAL(15, 2),
    deposit_paid BOOLEAN DEFAULT false,
    escalation_rate DECIMAL(5, 2), -- annual increase %
    payment_due_day INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'active', -- draft, active, expired, terminated
    termination_date DATE,
    termination_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, lease_number)
);

CREATE TABLE IF NOT EXISTS property_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES property_units(id) ON DELETE SET NULL,
    request_number VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- plumbing, electrical, hvac, structural, general
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open', -- open, assigned, in_progress, completed, cancelled
    reported_by VARCHAR(200),
    reported_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_to VARCHAR(200),
    scheduled_date DATE,
    completed_date DATE,
    cost DECIMAL(15, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, request_number)
);

-- ============================================================================
-- COMMUNICATIONS MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general', -- general, urgent, hr, finance, technology
    priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high, urgent
    author_id UUID NOT NULL,
    author_name VARCHAR(200),
    status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, published, archived
    published_at TIMESTAMP,
    scheduled_at TIMESTAMP,
    expires_at TIMESTAMP,
    audience JSONB DEFAULT '["all"]', -- array of audience groups
    is_pinned BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    channel_type VARCHAR(50) DEFAULT 'public', -- public, private, department
    created_by UUID NOT NULL,
    is_archived BOOLEAN DEFAULT false,
    member_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name)
);

CREATE TABLE IF NOT EXISTS chat_channel_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(50) DEFAULT 'member', -- admin, moderator, member
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP,
    UNIQUE(channel_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_name VARCHAR(200),
    message_type VARCHAR(50) DEFAULT 'text', -- text, file, image, system
    content TEXT NOT NULL,
    attachments JSONB,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false,
    parent_message_id UUID REFERENCES chat_messages(id),
    reactions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_name VARCHAR(200),
    recipient_id UUID NOT NULL,
    recipient_name VARCHAR(200),
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    attachments JSONB,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    is_deleted_by_sender BOOLEAN DEFAULT false,
    is_deleted_by_recipient BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(100) NOT NULL, -- announcement, message, task, approval, system
    reference_type VARCHAR(100), -- what entity this relates to
    reference_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    action_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mining_sites_tenant ON mining_sites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mining_production_tenant ON mining_production(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mining_production_site ON mining_production(site_id);
CREATE INDEX IF NOT EXISTS idx_mining_safety_tenant ON mining_safety_incidents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mining_equipment_tenant ON mining_equipment(tenant_id);

CREATE INDEX IF NOT EXISTS idx_farms_tenant ON farms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_farm_fields_tenant ON farm_fields(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crops_tenant ON crops(tenant_id);
CREATE INDEX IF NOT EXISTS idx_livestock_tenant ON livestock(tenant_id);
CREATE INDEX IF NOT EXISTS idx_farm_tasks_tenant ON farm_tasks(tenant_id);

CREATE INDEX IF NOT EXISTS idx_construction_projects_tenant ON construction_projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_construction_phases_tenant ON construction_phases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_construction_safety_tenant ON construction_safety(tenant_id);
CREATE INDEX IF NOT EXISTS idx_construction_materials_tenant ON construction_materials(tenant_id);

CREATE INDEX IF NOT EXISTS idx_properties_tenant ON properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_property_units_tenant ON property_units(tenant_id);
CREATE INDEX IF NOT EXISTS idx_property_tenants_tenant ON property_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_property_leases_tenant ON property_leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_property_maintenance_tenant ON property_maintenance(tenant_id);

CREATE INDEX IF NOT EXISTS idx_announcements_tenant ON announcements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_channels_tenant ON chat_channels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_tenant ON chat_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_tenant ON direct_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient ON direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_tenant ON user_notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id);
