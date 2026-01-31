-- ============================================================================
-- MIGRATION: 032_communications_and_logistics_complete.sql
-- Description: Create Communications Hub and Logistics schema tables
-- Date: December 21, 2025
-- Purpose: Fix 500 errors on Communications and Logistics modules
-- ============================================================================

-- ============================================================================
-- COMMUNICATIONS HUB TABLES
-- ============================================================================

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by_user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    category VARCHAR(50) DEFAULT 'general',
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    target_audience VARCHAR(50) DEFAULT 'all', -- all, department, team, individual
    audience JSONB DEFAULT '["all"]',
    author_id UUID REFERENCES users(id),
    author_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
    expires_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    is_pinned BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_announcements_tenant ON announcements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(tenant_id, priority);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(tenant_id, is_active) WHERE is_active = true;

-- Chat Channels table
CREATE TABLE IF NOT EXISTS chat_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by_user_id UUID REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    channel_type VARCHAR(30) DEFAULT 'general', -- general, project, department, private, support
    is_private BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    settings JSONB DEFAULT '{}',
    last_message_at TIMESTAMPTZ,
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_channels_tenant ON chat_channels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_channels_type ON chat_channels(tenant_id, channel_type);
CREATE INDEX IF NOT EXISTS idx_chat_channels_active ON chat_channels(tenant_id, is_active) WHERE is_active = true;

-- Chat Channel Members table
CREATE TABLE IF NOT EXISTS chat_channel_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- admin, moderator, member
    last_read_at TIMESTAMPTZ,
    notification_preference VARCHAR(20) DEFAULT 'all', -- all, mentions, none
    is_muted BOOLEAN DEFAULT false,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_channel_members_channel ON chat_channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_channel_members_user ON chat_channel_members(user_id);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    parent_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- text, file, image, system
    attachments JSONB DEFAULT '[]',
    mentions JSONB DEFAULT '[]',
    reactions JSONB DEFAULT '{}',
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(channel_id, created_at DESC);

-- Direct Messages table
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    recipient_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    attachments JSONB DEFAULT '[]',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    is_deleted_by_sender BOOLEAN DEFAULT false,
    is_deleted_by_recipient BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_tenant ON direct_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient ON direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_unread ON direct_messages(recipient_id, is_read) WHERE is_read = false;

-- Video Meetings table
CREATE TABLE IF NOT EXISTS video_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by_user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    meeting_type VARCHAR(30) DEFAULT 'instant', -- instant, scheduled, recurring
    room_url VARCHAR(500),
    room_name VARCHAR(100),
    provider VARCHAR(50) DEFAULT 'daily', -- daily, zoom, teams, google_meet
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    duration_minutes INTEGER,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, active, ended, cancelled
    max_participants INTEGER DEFAULT 50,
    is_recorded BOOLEAN DEFAULT false,
    recording_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_video_meetings_tenant ON video_meetings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_video_meetings_status ON video_meetings(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_video_meetings_scheduled ON video_meetings(tenant_id, scheduled_start);

-- Video Meeting Participants table
CREATE TABLE IF NOT EXISTS video_meeting_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    meeting_id UUID NOT NULL REFERENCES video_meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    participant_name VARCHAR(255),
    participant_email VARCHAR(255),
    role VARCHAR(20) DEFAULT 'attendee', -- host, co-host, attendee
    status VARCHAR(20) DEFAULT 'invited', -- invited, joined, left, declined
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    UNIQUE(meeting_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON video_meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_user ON video_meeting_participants(user_id);

-- User Notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- announcement, message, mention, meeting, system
    title VARCHAR(255) NOT NULL,
    message TEXT,
    source_type VARCHAR(50), -- announcement, channel, dm, meeting
    source_id UUID,
    action_url TEXT,
    priority VARCHAR(20) DEFAULT 'normal',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    is_dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON user_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON user_notifications(user_id, type);

-- ============================================================================
-- LOGISTICS SCHEMA
-- ============================================================================

-- Create logistics schema if not exists
CREATE SCHEMA IF NOT EXISTS logistics;

-- Vehicles table
CREATE TABLE IF NOT EXISTS logistics.vehicles (
    vehicle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    vehicle_registration VARCHAR(20) NOT NULL,
    make VARCHAR(100),
    model VARCHAR(100),
    vehicle_type VARCHAR(50), -- TRUCK, VAN, BAKKIE, TRAILER
    year INTEGER,
    vin VARCHAR(50),
    color VARCHAR(50),
    fuel_type VARCHAR(20) DEFAULT 'DIESEL', -- DIESEL, PETROL, ELECTRIC
    fuel_capacity DECIMAL(10,2),
    payload_capacity_kg DECIMAL(10,2),
    volume_capacity_m3 DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, MAINTENANCE, OUT_OF_SERVICE
    current_odometer INTEGER,
    current_driver_id UUID,
    current_location VARCHAR(255),
    last_service_date DATE,
    next_service_date DATE,
    license_expiry DATE,
    insurance_expiry DATE,
    gps_device_id VARCHAR(100),
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_logistics_vehicles_tenant ON logistics.vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_logistics_vehicles_status ON logistics.vehicles(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_logistics_vehicles_reg ON logistics.vehicles(vehicle_registration);

-- Drivers table
CREATE TABLE IF NOT EXISTS logistics.drivers (
    driver_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    id_number VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    license_number VARCHAR(50),
    license_type VARCHAR(20), -- CODE10, CODE14, PDP
    license_expiry DATE,
    pdp_expiry DATE,
    status VARCHAR(20) DEFAULT 'AVAILABLE', -- AVAILABLE, ON_TRIP, OFF_DUTY, SUSPENDED
    rating DECIMAL(3,2) DEFAULT 5.00,
    total_trips INTEGER DEFAULT 0,
    total_km DECIMAL(12,2) DEFAULT 0,
    hire_date DATE,
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_logistics_drivers_tenant ON logistics.drivers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_logistics_drivers_status ON logistics.drivers(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_logistics_drivers_user ON logistics.drivers(user_id);

-- Routes table
CREATE TABLE IF NOT EXISTS logistics.routes (
    route_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    route_name VARCHAR(255) NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    distance_km DECIMAL(10,2),
    estimated_duration_hours DECIMAL(5,2),
    route_type VARCHAR(50), -- REGULAR, EXPRESS, OVERNIGHT
    waypoints JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    toll_costs DECIMAL(10,2) DEFAULT 0,
    fuel_estimate DECIMAL(10,2),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logistics_routes_tenant ON logistics.routes(tenant_id);

-- Trips table (core logistics operations)
CREATE TABLE IF NOT EXISTS logistics.trips (
    trip_id VARCHAR(50) PRIMARY KEY,
    tenant_id UUID NOT NULL,
    route_id UUID REFERENCES logistics.routes(route_id),
    vehicle_id UUID REFERENCES logistics.vehicles(vehicle_id),
    driver_id UUID REFERENCES logistics.drivers(driver_id),
    customer VARCHAR(255),
    customer_id UUID,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    driver VARCHAR(255),
    vehicle_reg VARCHAR(20),
    cargo_description TEXT,
    weight_kg DECIMAL(10,2),
    status VARCHAR(30) DEFAULT 'Planned', -- Planned, In Transit, Loading, Delivered, Completed, Cancelled
    pod_status VARCHAR(30) DEFAULT 'Pending', -- Pending, Signed, Uploaded, Verified
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    eta TIMESTAMPTZ,
    distance_km DECIMAL(10,2),
    fuel_used DECIMAL(10,2),
    revenue DECIMAL(15,2),
    cost DECIMAL(15,2),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logistics_trips_tenant ON logistics.trips(tenant_id);
CREATE INDEX IF NOT EXISTS idx_logistics_trips_status ON logistics.trips(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_logistics_trips_driver ON logistics.trips(tenant_id, driver_id);
CREATE INDEX IF NOT EXISTS idx_logistics_trips_vehicle ON logistics.trips(tenant_id, vehicle_id);
CREATE INDEX IF NOT EXISTS idx_logistics_trips_eta ON logistics.trips(tenant_id, eta);

-- Shipments table
CREATE TABLE IF NOT EXISTS logistics.shipments (
    shipment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    shipment_number VARCHAR(50) UNIQUE,
    trip_id VARCHAR(50) REFERENCES logistics.trips(trip_id),
    customer_id UUID,
    origin_address TEXT,
    destination_address TEXT,
    scheduled_pickup_date DATE,
    scheduled_delivery_date DATE,
    actual_pickup_date DATE,
    actual_delivery_date DATE,
    weight DECIMAL(10,2),
    volume DECIMAL(10,2),
    package_count INTEGER DEFAULT 1,
    status VARCHAR(30) DEFAULT 'PENDING', -- PENDING, PICKED_UP, IN_TRANSIT, DELIVERED, CANCELLED
    priority VARCHAR(20) DEFAULT 'NORMAL',
    special_instructions TEXT,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logistics_shipments_tenant ON logistics.shipments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_logistics_shipments_status ON logistics.shipments(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_logistics_shipments_trip ON logistics.shipments(trip_id);

-- Fuel transactions table
CREATE TABLE IF NOT EXISTS logistics.fuel_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    vehicle_id UUID REFERENCES logistics.vehicles(vehicle_id),
    driver_id UUID REFERENCES logistics.drivers(driver_id),
    trip_id VARCHAR(50) REFERENCES logistics.trips(trip_id),
    transaction_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    fuel_type VARCHAR(20) DEFAULT 'DIESEL',
    quantity_liters DECIMAL(10,2) NOT NULL,
    price_per_liter DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    odometer_reading INTEGER,
    station_name VARCHAR(255),
    station_location VARCHAR(255),
    receipt_number VARCHAR(100),
    payment_method VARCHAR(50), -- FLEET_CARD, CASH, EFT
    card_number VARCHAR(50),
    notes TEXT,
    reconciled BOOLEAN DEFAULT false,
    reconciled_at TIMESTAMPTZ,
    reconciled_by UUID,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logistics_fuel_tenant ON logistics.fuel_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_logistics_fuel_vehicle ON logistics.fuel_transactions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_logistics_fuel_date ON logistics.fuel_transactions(tenant_id, transaction_date);

-- Geofences table
CREATE TABLE IF NOT EXISTS logistics.geofences (
    geofence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    geofence_type VARCHAR(50) DEFAULT 'ZONE', -- ZONE, DEPOT, CUSTOMER, RESTRICTED
    geometry JSONB NOT NULL, -- GeoJSON polygon
    center_lat DECIMAL(10,8),
    center_lng DECIMAL(11,8),
    radius_meters INTEGER,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    alert_on_entry BOOLEAN DEFAULT true,
    alert_on_exit BOOLEAN DEFAULT true,
    speed_limit INTEGER,
    dwell_time_alert_minutes INTEGER,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logistics_geofences_tenant ON logistics.geofences(tenant_id);

-- Incidents table
CREATE TABLE IF NOT EXISTS logistics.incidents (
    incident_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    trip_id VARCHAR(50) REFERENCES logistics.trips(trip_id),
    vehicle_id UUID REFERENCES logistics.vehicles(vehicle_id),
    driver_id UUID REFERENCES logistics.drivers(driver_id),
    incident_type VARCHAR(50) NOT NULL, -- ACCIDENT, BREAKDOWN, THEFT, HIJACKING, SPEEDING
    severity VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    description TEXT NOT NULL,
    location VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    incident_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'REPORTED', -- REPORTED, INVESTIGATING, RESOLVED, CLOSED
    resolution TEXT,
    police_case_number VARCHAR(100),
    insurance_claim_number VARCHAR(100),
    estimated_cost DECIMAL(12,2),
    actual_cost DECIMAL(12,2),
    reported_by UUID,
    assigned_to UUID,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logistics_incidents_tenant ON logistics.incidents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_logistics_incidents_status ON logistics.incidents(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_logistics_incidents_trip ON logistics.incidents(trip_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE announcements IS 'Company-wide announcements for internal communications';
COMMENT ON TABLE chat_channels IS 'Chat channels for team collaboration';
COMMENT ON TABLE chat_messages IS 'Messages within chat channels';
COMMENT ON TABLE direct_messages IS 'Private messages between users';
COMMENT ON TABLE video_meetings IS 'Video conferencing meetings (Daily.co integration)';
COMMENT ON TABLE user_notifications IS 'User notification inbox';

COMMENT ON TABLE logistics.vehicles IS 'Fleet vehicles master data';
COMMENT ON TABLE logistics.drivers IS 'Driver profiles and information';
COMMENT ON TABLE logistics.routes IS 'Predefined routes between locations';
COMMENT ON TABLE logistics.trips IS 'Individual delivery trips';
COMMENT ON TABLE logistics.shipments IS 'Cargo shipments on trips';
COMMENT ON TABLE logistics.fuel_transactions IS 'Fuel purchases and consumption tracking';
COMMENT ON TABLE logistics.geofences IS 'Geofenced zones for alerts';
COMMENT ON TABLE logistics.incidents IS 'Safety and operational incidents';

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample announcement (will be tenant-specific in real usage)
-- Uncomment and modify tenant_id for testing:
-- INSERT INTO announcements (tenant_id, title, content, status, is_pinned, priority)
-- VALUES ('YOUR-TENANT-ID', 'Welcome to SiyaBusa ERP', 'Welcome to our new ERP system. Explore all the modules available to you.', 'published', true, 'high');

