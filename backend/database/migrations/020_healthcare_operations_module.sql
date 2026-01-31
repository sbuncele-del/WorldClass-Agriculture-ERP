-- ================================================
-- Healthcare Operations Intelligence Module
-- ================================================
-- Proactive operational intelligence for healthcare facilities
-- Focus: Actionable insights, not just data storage
-- Integration Philosophy: Leverage existing ERP modules
-- Tables: 18 (reduced from 20 via integration)
-- ================================================
--
-- INTEGRATION APPROACH:
-- ----------------------
-- This module is NOT standalone - it's integrated with the ERP ecosystem:
--
-- 1. STAFF MANAGEMENT → Uses HR Module
--    - healthcare_staff_schedules references employees table (HR module)
--    - Staff master data (names, payroll, contracts) stays in HR
--    - Healthcare adds: shift assignments, department context, utilization
--
-- 2. EQUIPMENT MANAGEMENT → Uses Asset Management Module
--    - healthcare_equipment references assets table (Asset Management)
--    - Asset registry (purchase, depreciation, transfers) in Asset Management
--    - Healthcare adds: medical categorization, criticality, operational context
--
-- 3. MEDICAL INVENTORY → Uses Inventory Module
--    - medical_inventory links to inventory_items table (Inventory module)
--    - Stock management (quantities, locations, reordering) in Inventory
--    - Healthcare adds: expiry tracking, criticality, medical categorization
--
-- 4. REVENUE & BILLING → Uses Financial Accounting + GoodX
--    - GoodX (external) handles patient billing and medical aid claims
--    - goodx_revenue_capture auto-creates journal_entries (Financial module)
--    - Revenue flows to GL accounts automatically
--
-- WHAT HEALTHCARE MODULE OWNS:
-- - Facilities, wards, beds (healthcare-specific)
-- - Patients, visits, appointments (core healthcare)
-- - Clinical workflows (vitals, triage, notes, labs, prescriptions)
-- - Operational intelligence (dashboards, analytics, bottlenecks)
-- - Facility communications (healthcare context)
-- - GoodX integration bridge (revenue automation)
--
-- See: HEALTHCARE-MODULE-INTEGRATION.md for full integration guide
-- ================================================

-- ================================================
-- SECTION 1: FACILITY MANAGEMENT
-- ================================================

-- Healthcare Facilities
CREATE TABLE IF NOT EXISTS healthcare_facilities (
    facility_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_id UUID REFERENCES entities(entity_id),
    
    -- Basic Info
    facility_code VARCHAR(50) NOT NULL,
    facility_name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(50) NOT NULL, -- HOSPITAL, CLINIC, DAY_CLINIC, PHARMACY, LAB
    
    -- Location
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    gps_coordinates POINT,
    
    -- Capacity
    total_beds INTEGER DEFAULT 0,
    total_consultation_rooms INTEGER DEFAULT 0,
    total_theatre_rooms INTEGER DEFAULT 0,
    total_icu_beds INTEGER DEFAULT 0,
    
    -- Contact
    phone VARCHAR(50),
    email VARCHAR(255),
    emergency_phone VARCHAR(50),
    
    -- Operating Hours
    operating_hours JSONB, -- {mon: "08:00-17:00", tue: "08:00-17:00", ...}
    timezone VARCHAR(50) DEFAULT 'Africa/Johannesburg',
    
    -- Integrations
    goodx_facility_id VARCHAR(100),
    goodx_api_url VARCHAR(500),
    has_goodx_integration BOOLEAN DEFAULT false,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_24_hour BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, facility_code)
);

CREATE INDEX idx_healthcare_facilities_tenant ON healthcare_facilities(tenant_id);
CREATE INDEX idx_healthcare_facilities_entity ON healthcare_facilities(entity_id);

-- Live Facility Status (Real-time operational state)
CREATE TABLE IF NOT EXISTS facility_operational_status (
    status_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES healthcare_facilities(facility_id),
    
    -- Overall Status
    overall_status VARCHAR(20) NOT NULL, -- OPERATIONAL, NEEDS_ATTENTION, CRITICAL, EMERGENCY
    status_reason TEXT,
    
    -- Bed Status
    beds_occupied INTEGER DEFAULT 0,
    beds_available INTEGER DEFAULT 0,
    beds_under_maintenance INTEGER DEFAULT 0,
    bed_occupancy_percentage DECIMAL(5,2),
    
    -- Patient Flow
    patients_checked_in INTEGER DEFAULT 0,
    patients_in_consultation INTEGER DEFAULT 0,
    patients_waiting INTEGER DEFAULT 0,
    average_wait_time_minutes INTEGER,
    
    -- Staff Status
    staff_on_duty INTEGER DEFAULT 0,
    staff_required INTEGER DEFAULT 0,
    staff_utilization_percentage DECIMAL(5,2),
    
    -- Equipment Status
    equipment_operational INTEGER DEFAULT 0,
    equipment_down INTEGER DEFAULT 0,
    critical_equipment_down BOOLEAN DEFAULT false,
    
    -- Revenue Cycle
    days_revenue_outstanding DECIMAL(5,2),
    outstanding_claims_count INTEGER DEFAULT 0,
    
    -- Critical Alerts Count
    critical_alerts_count INTEGER DEFAULT 0,
    
    -- Last Updated
    snapshot_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_facility_operational_status_facility ON facility_operational_status(facility_id);
CREATE INDEX idx_facility_operational_status_time ON facility_operational_status(snapshot_time DESC);

-- Operational KPIs (Track key metrics over time)
CREATE TABLE IF NOT EXISTS facility_operational_kpis (
    kpi_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES healthcare_facilities(facility_id),
    
    kpi_date DATE NOT NULL,
    
    -- Patient Metrics
    total_patients_seen INTEGER DEFAULT 0,
    new_patients INTEGER DEFAULT 0,
    return_patients INTEGER DEFAULT 0,
    average_consultation_time_minutes DECIMAL(5,2),
    
    -- Wait Time Metrics
    average_wait_time_minutes DECIMAL(5,2),
    max_wait_time_minutes INTEGER,
    patients_waited_over_30min INTEGER DEFAULT 0,
    
    -- Bed Utilization
    average_bed_occupancy_percentage DECIMAL(5,2),
    peak_bed_occupancy_percentage DECIMAL(5,2),
    
    -- Staff Metrics
    average_staff_utilization_percentage DECIMAL(5,2),
    overtime_hours DECIMAL(8,2) DEFAULT 0,
    
    -- Revenue Metrics
    revenue_captured DECIMAL(15,2) DEFAULT 0,
    insurance_claims_submitted INTEGER DEFAULT 0,
    cash_patients INTEGER DEFAULT 0,
    
    -- Quality Metrics
    patient_satisfaction_score DECIMAL(3,2), -- 0-5 scale
    readmission_rate DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(facility_id, kpi_date)
);

CREATE INDEX idx_facility_operational_kpis_facility ON facility_operational_kpis(facility_id);
CREATE INDEX idx_facility_operational_kpis_date ON facility_operational_kpis(kpi_date DESC);

-- ================================================
-- SECTION 2: PATIENT JOURNEY MANAGEMENT
-- ================================================

-- Patients (Reference only - actual records in GoodX)
CREATE TABLE IF NOT EXISTS healthcare_patients (
    patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    facility_id UUID REFERENCES healthcare_facilities(facility_id),
    
    -- GoodX Integration
    goodx_patient_id VARCHAR(100) UNIQUE,
    external_patient_id VARCHAR(100),
    
    -- Basic Info (Cached from GoodX)
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20),
    id_number VARCHAR(50),
    
    -- Contact
    phone VARCHAR(50),
    email VARCHAR(255),
    
    -- Insurance
    medical_aid_name VARCHAR(255),
    medical_aid_number VARCHAR(100),
    medical_aid_plan VARCHAR(100),
    
    -- Tags for quick filtering
    is_vip BOOLEAN DEFAULT false,
    is_chronic BOOLEAN DEFAULT false,
    risk_level VARCHAR(20) DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, CRITICAL
    
    -- Sync
    last_synced_from_goodx TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_healthcare_patients_tenant ON healthcare_patients(tenant_id);
CREATE INDEX idx_healthcare_patients_facility ON healthcare_patients(facility_id);
CREATE INDEX idx_healthcare_patients_goodx ON healthcare_patients(goodx_patient_id);

-- Appointments
CREATE TABLE IF NOT EXISTS healthcare_appointments (
    appointment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES healthcare_facilities(facility_id),
    patient_id UUID NOT NULL REFERENCES healthcare_patients(patient_id),
    
    -- GoodX Integration
    goodx_appointment_id VARCHAR(100) UNIQUE,
    
    -- Appointment Details
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    appointment_type VARCHAR(50) NOT NULL, -- CONSULTATION, FOLLOW_UP, PROCEDURE, VACCINATION
    duration_minutes INTEGER DEFAULT 30,
    
    -- Provider
    provider_name VARCHAR(255),
    provider_id UUID,
    department VARCHAR(100),
    
    -- Location
    room_number VARCHAR(50),
    
    -- Status
    status VARCHAR(50) NOT NULL, -- SCHEDULED, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
    check_in_time TIMESTAMP,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    
    -- Wait Time Tracking
    actual_wait_time_minutes INTEGER,
    is_late BOOLEAN DEFAULT false,
    late_by_minutes INTEGER,
    
    -- Notes
    reason_for_visit TEXT,
    cancellation_reason TEXT,
    notes TEXT,
    
    -- Reminders
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_healthcare_appointments_facility ON healthcare_appointments(facility_id);
CREATE INDEX idx_healthcare_appointments_patient ON healthcare_appointments(patient_id);
CREATE INDEX idx_healthcare_appointments_date ON healthcare_appointments(appointment_date, appointment_time);
CREATE INDEX idx_healthcare_appointments_status ON healthcare_appointments(status);

-- Patient Journey Tracking (Real-time flow)
CREATE TABLE IF NOT EXISTS patient_journey_tracking (
    journey_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES healthcare_facilities(facility_id),
    patient_id UUID NOT NULL REFERENCES healthcare_patients(patient_id),
    appointment_id UUID REFERENCES healthcare_appointments(appointment_id),
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Journey Stages
    stage VARCHAR(50) NOT NULL, -- ARRIVAL, REGISTRATION, TRIAGE, WAITING, CONSULTATION, LAB, PHARMACY, CHECKOUT, COMPLETED
    stage_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    stage_end_time TIMESTAMP,
    stage_duration_minutes INTEGER,
    
    -- Location
    current_location VARCHAR(100),
    
    -- Status
    is_current_stage BOOLEAN DEFAULT true,
    
    -- Notes
    stage_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_patient_journey_facility ON patient_journey_tracking(facility_id);
CREATE INDEX idx_patient_journey_patient ON patient_journey_tracking(patient_id);
CREATE INDEX idx_patient_journey_visit_date ON patient_journey_tracking(visit_date);
CREATE INDEX idx_patient_journey_current ON patient_journey_tracking(is_current_stage) WHERE is_current_stage = true;

-- Patient Flow Bottlenecks (Auto-detected issues)
CREATE TABLE IF NOT EXISTS patient_flow_bottlenecks (
    bottleneck_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES healthcare_facilities(facility_id),
    
    bottleneck_type VARCHAR(50) NOT NULL, -- WAIT_TIME, LAB_DELAY, CONSULTATION_BACKLOG, PHARMACY_QUEUE
    severity VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    
    -- Details
    affected_stage VARCHAR(50),
    description TEXT NOT NULL,
    
    -- Metrics
    affected_patients_count INTEGER DEFAULT 0,
    average_delay_minutes INTEGER,
    
    -- AI Suggestion
    ai_suggestion TEXT,
    suggested_action VARCHAR(255),
    
    -- Status
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, ACKNOWLEDGED, RESOLVED
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_patient_flow_bottlenecks_facility ON patient_flow_bottlenecks(facility_id);
CREATE INDEX idx_patient_flow_bottlenecks_status ON patient_flow_bottlenecks(status);

-- ================================================
-- ================================================
-- SECTION 3: MEDICAL INVENTORY (Integrated with Inventory Module)
-- ================================================
-- NOTE: Stock management lives in Inventory Module (inventory_items table)
-- This section adds healthcare-specific context on top of general inventory
-- - medical_inventory_items can reference inventory_items.item_id (Inventory Module)
-- - Inventory Module owns: stock levels, warehouses, reordering, suppliers
-- - Healthcare adds: expiry tracking, criticality, medical categorization, regulations

-- Medical Inventory Items (Healthcare Context)
CREATE TABLE IF NOT EXISTS medical_inventory_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES healthcare_facilities(facility_id),
    
    -- Item Details
    item_code VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    item_category VARCHAR(100) NOT NULL, -- MEDICATION, EQUIPMENT, SUPPLIES, CONSUMABLES
    item_subcategory VARCHAR(100),
    
    -- Classification
    is_critical BOOLEAN DEFAULT false,
    is_controlled_substance BOOLEAN DEFAULT false,
    requires_prescription BOOLEAN DEFAULT false,
    
    -- Stock Info
    current_stock INTEGER DEFAULT 0,
    unit_of_measure VARCHAR(50) DEFAULT 'UNIT',
    
    -- Thresholds
    reorder_level INTEGER DEFAULT 0,
    minimum_stock INTEGER DEFAULT 0,
    maximum_stock INTEGER DEFAULT 0,
    
    -- Supplier
    preferred_supplier VARCHAR(255),
    supplier_code VARCHAR(100),
    last_order_date DATE,
    
    -- Costing
    unit_cost DECIMAL(15,2),
    last_purchase_price DECIMAL(15,2),
    
    -- Storage
    storage_location VARCHAR(100),
    storage_requirements TEXT, -- Temperature, humidity, etc.
    
    -- Expiry Tracking
    tracks_expiry BOOLEAN DEFAULT true,
    tracks_batch BOOLEAN DEFAULT true,
    
    -- Usage Analytics
    average_daily_usage DECIMAL(10,2),
    usage_trend VARCHAR(20), -- INCREASING, STABLE, DECREASING
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(facility_id, item_code)
);

CREATE INDEX idx_medical_inventory_facility ON medical_inventory_items(facility_id);
CREATE INDEX idx_medical_inventory_category ON medical_inventory_items(item_category);
CREATE INDEX idx_medical_inventory_critical ON medical_inventory_items(is_critical) WHERE is_critical = true;

-- Inventory Stock Batches (Track expiry and batches)
CREATE TABLE IF NOT EXISTS medical_inventory_batches (
    batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES medical_inventory_items(item_id),
    
    batch_number VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    
    -- Dates
    manufacture_date DATE,
    expiry_date DATE,
    received_date DATE DEFAULT CURRENT_DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'AVAILABLE', -- AVAILABLE, RESERVED, IN_USE, EXPIRED, RECALLED
    
    -- Costing
    unit_cost DECIMAL(15,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(item_id, batch_number)
);

CREATE INDEX idx_medical_inventory_batches_item ON medical_inventory_batches(item_id);
CREATE INDEX idx_medical_inventory_batches_expiry ON medical_inventory_batches(expiry_date);

-- Inventory Alerts (Auto-generated)
CREATE TABLE IF NOT EXISTS medical_inventory_alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES healthcare_facilities(facility_id),
    item_id UUID REFERENCES medical_inventory_items(item_id),
    
    alert_type VARCHAR(50) NOT NULL, -- LOW_STOCK, CRITICAL_STOCK, EXPIRING_SOON, EXPIRED, HIGH_USAGE, OVERSTOCKED
    severity VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    
    -- Details
    message TEXT NOT NULL,
    current_stock INTEGER,
    threshold_level INTEGER,
    days_until_stockout INTEGER,
    days_until_expiry INTEGER,
    
    -- AI Recommendation
    ai_recommendation TEXT,
    suggested_action VARCHAR(255),
    
    -- Status
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, ACKNOWLEDGED, RESOLVED, DISMISSED
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medical_inventory_alerts_facility ON medical_inventory_alerts(facility_id);
CREATE INDEX idx_medical_inventory_alerts_status ON medical_inventory_alerts(status);
CREATE INDEX idx_medical_inventory_alerts_severity ON medical_inventory_alerts(severity);

-- Automated Reorder Requests
CREATE TABLE IF NOT EXISTS medical_inventory_reorders (
    reorder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES healthcare_facilities(facility_id),
    item_id UUID NOT NULL REFERENCES medical_inventory_items(item_id),
    
    -- Reorder Details
    reorder_type VARCHAR(50) NOT NULL, -- AUTOMATED, MANUAL, EMERGENCY
    requested_quantity INTEGER NOT NULL,
    estimated_cost DECIMAL(15,2),
    
    -- Supplier
    supplier_name VARCHAR(255),
    supplier_contact VARCHAR(255),
    
    -- Status
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, ORDERED, RECEIVED, CANCELLED
    approval_required BOOLEAN DEFAULT true,
    
    -- Approvals
    requested_by UUID,
    approved_by UUID,
    approved_at TIMESTAMP,
    
    -- Purchase Order
    purchase_order_id UUID,
    order_date DATE,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    
    -- Reasoning (AI-generated)
    reorder_reason TEXT,
    urgency_level VARCHAR(20) DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, URGENT
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medical_inventory_reorders_facility ON medical_inventory_reorders(facility_id);
CREATE INDEX idx_medical_inventory_reorders_status ON medical_inventory_reorders(status);
CREATE INDEX idx_medical_inventory_reorders_item ON medical_inventory_reorders(item_id);

-- Inventory Usage Analytics
CREATE TABLE IF NOT EXISTS medical_inventory_usage (
    usage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES healthcare_facilities(facility_id),
    item_id UUID NOT NULL REFERENCES medical_inventory_items(item_id),
    
    usage_date DATE NOT NULL,
    
    -- Usage Stats
    quantity_used INTEGER DEFAULT 0,
    quantity_wasted INTEGER DEFAULT 0,
    quantity_expired INTEGER DEFAULT 0,
    
    -- Context
    used_in_department VARCHAR(100),
    used_for_patient_count INTEGER DEFAULT 0,
    
    -- Cost
    total_cost DECIMAL(15,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(facility_id, item_id, usage_date)
);

CREATE INDEX idx_medical_inventory_usage_facility ON medical_inventory_usage(facility_id);
CREATE INDEX idx_medical_inventory_usage_date ON medical_inventory_usage(usage_date DESC);

-- ================================================
-- ================================================
-- SECTION 4: STAFF SCHEDULING (Integrated with HR Module)
-- ================================================
-- NOTE: Staff master data lives in HR Module (employees table)
-- This section only handles healthcare-specific scheduling context
-- - staff_id references employees.employee_id (HR Module)
-- - HR Module owns: employee records, contracts, payroll, leave
-- - Healthcare adds: shift assignments, department, utilization metrics

-- Staff Schedules (Healthcare Context)
CREATE TABLE IF NOT EXISTS healthcare_staff_schedules (
    schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES healthcare_facilities(facility_id),
    
    staff_id UUID NOT NULL,
    staff_name VARCHAR(255) NOT NULL,
    staff_role VARCHAR(100) NOT NULL, -- DOCTOR, NURSE, ADMIN, TECHNICIAN, PHARMACIST
    department VARCHAR(100),
    
    -- Schedule
    shift_date DATE NOT NULL,
    shift_start_time TIME NOT NULL,
    shift_end_time TIME NOT NULL,
    shift_type VARCHAR(50), -- DAY, NIGHT, ON_CALL, OVERTIME
    
    -- Status
    status VARCHAR(50) DEFAULT 'SCHEDULED', -- SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    actual_hours_worked DECIMAL(5,2),
    
    -- Alerts
    is_understaffed BOOLEAN DEFAULT false,
    requires_coverage BOOLEAN DEFAULT false,
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_healthcare_staff_schedules_facility ON healthcare_staff_schedules(facility_id);
CREATE INDEX idx_healthcare_staff_schedules_staff ON healthcare_staff_schedules(staff_id);
CREATE INDEX idx_healthcare_staff_schedules_date ON healthcare_staff_schedules(shift_date);

-- Staff Utilization Metrics
CREATE TABLE IF NOT EXISTS healthcare_staff_utilization (
    utilization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES healthcare_facilities(facility_id),
    
    staff_id UUID NOT NULL,
    staff_role VARCHAR(100),
    metric_date DATE NOT NULL,
    
    -- Utilization
    scheduled_hours DECIMAL(5,2) DEFAULT 0,
    actual_hours_worked DECIMAL(5,2) DEFAULT 0,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    utilization_percentage DECIMAL(5,2),
    
    -- Productivity
    patients_seen INTEGER DEFAULT 0,
    consultations_completed INTEGER DEFAULT 0,
    procedures_performed INTEGER DEFAULT 0,
    
    -- Quality
    average_consultation_time_minutes DECIMAL(5,2),
    patient_satisfaction_score DECIMAL(3,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(facility_id, staff_id, metric_date)
);

CREATE INDEX idx_healthcare_staff_utilization_facility ON healthcare_staff_utilization(facility_id);
CREATE INDEX idx_healthcare_staff_utilization_date ON healthcare_staff_utilization(metric_date DESC);

-- ================================================
-- SECTION 5: EQUIPMENT TRACKING (Integrated with Asset Management)
-- ================================================
-- NOTE: Equipment master data lives in Asset Management Module (assets table)
-- This section only handles healthcare-specific equipment context
-- - Equipment should reference assets.asset_id (Asset Management Module)
-- - Asset Management owns: asset registry, maintenance, depreciation, transfers
-- - Healthcare adds: medical categorization, criticality flags, operational status

-- Equipment Registry (Healthcare Context)
CREATE TABLE IF NOT EXISTS healthcare_equipment (
    equipment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES healthcare_facilities(facility_id),
    
    -- Equipment Details
    equipment_code VARCHAR(100) NOT NULL,
    equipment_name VARCHAR(255) NOT NULL,
    equipment_type VARCHAR(100) NOT NULL, -- DIAGNOSTIC, SURGICAL, MONITORING, SUPPORT
    equipment_category VARCHAR(100),
    
    -- Specifications
    manufacturer VARCHAR(255),
    model_number VARCHAR(100),
    serial_number VARCHAR(100),
    
    -- Location
    department VARCHAR(100),
    room_location VARCHAR(100),
    
    -- Status
    operational_status VARCHAR(50) DEFAULT 'OPERATIONAL', -- OPERATIONAL, MAINTENANCE, DOWN, RETIRED
    is_critical BOOLEAN DEFAULT false,
    
    -- Maintenance
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    maintenance_frequency_days INTEGER DEFAULT 90,
    
    -- Warranty
    purchase_date DATE,
    warranty_expiry_date DATE,
    
    -- Usage
    total_usage_hours DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(facility_id, equipment_code)
);

CREATE INDEX idx_healthcare_equipment_facility ON healthcare_equipment(facility_id);
CREATE INDEX idx_healthcare_equipment_status ON healthcare_equipment(operational_status);
CREATE INDEX idx_healthcare_equipment_critical ON healthcare_equipment(is_critical) WHERE is_critical = true;

-- Equipment Maintenance Tracking
CREATE TABLE IF NOT EXISTS healthcare_equipment_maintenance (
    maintenance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES healthcare_equipment(equipment_id),
    
    maintenance_type VARCHAR(50) NOT NULL, -- SCHEDULED, PREVENTIVE, CORRECTIVE, EMERGENCY
    maintenance_date DATE NOT NULL,
    
    -- Details
    issue_description TEXT,
    work_performed TEXT,
    parts_replaced TEXT,
    
    -- Service Provider
    performed_by VARCHAR(255),
    service_provider VARCHAR(255),
    
    -- Cost
    cost DECIMAL(15,2),
    
    -- Downtime
    downtime_start TIMESTAMP,
    downtime_end TIMESTAMP,
    downtime_hours DECIMAL(5,2),
    
    -- Status
    status VARCHAR(50) DEFAULT 'SCHEDULED', -- SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    
    -- Next Maintenance
    next_maintenance_date DATE,
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_healthcare_equipment_maintenance_equipment ON healthcare_equipment_maintenance(equipment_id);
CREATE INDEX idx_healthcare_equipment_maintenance_date ON healthcare_equipment_maintenance(maintenance_date DESC);

-- ================================================
-- SECTION 6: COMMUNICATIONS & REQUESTS
-- ================================================

-- Facility Communication Hub
CREATE TABLE IF NOT EXISTS facility_communications (
    communication_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES healthcare_facilities(facility_id),
    
    -- Participants
    from_user_id UUID NOT NULL,
    from_user_name VARCHAR(255),
    from_department VARCHAR(100),
    
    to_user_id UUID,
    to_user_name VARCHAR(255),
    to_department VARCHAR(100),
    
    -- Message
    communication_type VARCHAR(50) NOT NULL, -- REQUEST, ALERT, NOTIFICATION, MESSAGE
    subject VARCHAR(255),
    message TEXT NOT NULL,
    
    -- Priority
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT, EMERGENCY
    
    -- Status
    status VARCHAR(50) DEFAULT 'SENT', -- SENT, DELIVERED, READ, ACKNOWLEDGED, ACTIONED, CLOSED
    
    -- Actions
    requires_action BOOLEAN DEFAULT false,
    action_required VARCHAR(255),
    action_taken TEXT,
    actioned_by UUID,
    actioned_at TIMESTAMP,
    
    -- Timestamps
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    acknowledged_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_facility_communications_facility ON facility_communications(facility_id);
CREATE INDEX idx_facility_communications_to_user ON facility_communications(to_user_id);
CREATE INDEX idx_facility_communications_status ON facility_communications(status);
CREATE INDEX idx_facility_communications_priority ON facility_communications(priority);

-- Service Requests (Supplies, Maintenance, etc.)
CREATE TABLE IF NOT EXISTS facility_service_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES healthcare_facilities(facility_id),
    
    request_type VARCHAR(50) NOT NULL, -- SUPPLIES, MAINTENANCE, IT_SUPPORT, FACILITIES, TRANSPORT
    request_category VARCHAR(100),
    
    -- Requestor
    requested_by UUID NOT NULL,
    requestor_name VARCHAR(255),
    requestor_department VARCHAR(100),
    
    -- Details
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(100),
    
    -- Priority
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
    urgency_reason TEXT,
    
    -- Assignment
    assigned_to UUID,
    assigned_to_name VARCHAR(255),
    assigned_at TIMESTAMP,
    
    -- Status
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
    
    -- Resolution
    resolution_notes TEXT,
    completed_at TIMESTAMP,
    
    -- SLA
    expected_completion_time TIMESTAMP,
    is_overdue BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_facility_service_requests_facility ON facility_service_requests(facility_id);
CREATE INDEX idx_facility_service_requests_status ON facility_service_requests(status);
CREATE INDEX idx_facility_service_requests_priority ON facility_service_requests(priority);

-- ================================================
-- SECTION 7: GOODX INTEGRATION
-- ================================================

-- GoodX Integration Configuration
CREATE TABLE IF NOT EXISTS goodx_integration_config (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    facility_id UUID REFERENCES healthcare_facilities(facility_id),
    
    -- API Configuration
    api_url VARCHAR(500) NOT NULL,
    api_key_encrypted TEXT,
    api_username VARCHAR(255),
    facility_code_in_goodx VARCHAR(100),
    
    -- Sync Settings
    auto_sync_enabled BOOLEAN DEFAULT true,
    sync_frequency_minutes INTEGER DEFAULT 15,
    last_sync_time TIMESTAMP,
    next_sync_time TIMESTAMP,
    
    -- Sync Scope
    sync_patients BOOLEAN DEFAULT true,
    sync_appointments BOOLEAN DEFAULT true,
    sync_billing BOOLEAN DEFAULT true,
    sync_prescriptions BOOLEAN DEFAULT false,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    connection_status VARCHAR(50) DEFAULT 'NOT_CONNECTED', -- NOT_CONNECTED, CONNECTED, ERROR
    last_error TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, facility_id)
);

CREATE INDEX idx_goodx_integration_config_tenant ON goodx_integration_config(tenant_id);
CREATE INDEX idx_goodx_integration_config_facility ON goodx_integration_config(facility_id);

-- GoodX Sync Logs
CREATE TABLE IF NOT EXISTS goodx_sync_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES goodx_integration_config(config_id),
    facility_id UUID NOT NULL REFERENCES healthcare_facilities(facility_id),
    
    -- Sync Details
    sync_type VARCHAR(50) NOT NULL, -- PATIENTS, APPOINTMENTS, BILLING, FULL
    sync_direction VARCHAR(20) NOT NULL, -- FROM_GOODX, TO_GOODX, BIDIRECTIONAL
    
    -- Results
    sync_status VARCHAR(50) NOT NULL, -- SUCCESS, PARTIAL, FAILED
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    
    -- Timing
    sync_started_at TIMESTAMP NOT NULL,
    sync_completed_at TIMESTAMP,
    duration_seconds INTEGER,
    
    -- Errors
    error_count INTEGER DEFAULT 0,
    error_details JSONB,
    
    -- Data Summary
    sync_summary JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goodx_sync_logs_config ON goodx_sync_logs(config_id);
CREATE INDEX idx_goodx_sync_logs_facility ON goodx_sync_logs(facility_id);
CREATE INDEX idx_goodx_sync_logs_started ON goodx_sync_logs(sync_started_at DESC);

-- GoodX Revenue Capture (Auto-imported from GoodX billing)
CREATE TABLE IF NOT EXISTS goodx_revenue_capture (
    revenue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES healthcare_facilities(facility_id),
    patient_id UUID REFERENCES healthcare_patients(patient_id),
    
    -- GoodX Reference
    goodx_invoice_id VARCHAR(100) UNIQUE,
    goodx_transaction_id VARCHAR(100),
    
    -- Transaction Details
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- CONSULTATION, PROCEDURE, MEDICATION, LAB, IMAGING
    
    -- Financial
    gross_amount DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    net_amount DECIMAL(15,2) NOT NULL,
    
    -- Payment
    payment_method VARCHAR(50), -- CASH, CARD, INSURANCE, MEDICAL_AID
    medical_aid_name VARCHAR(255),
    medical_aid_claim_number VARCHAR(100),
    
    -- Status
    payment_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PAID, PARTIAL, OUTSTANDING
    
    -- ERP Integration
    synced_to_erp BOOLEAN DEFAULT false,
    erp_journal_entry_id UUID,
    synced_at TIMESTAMP,
    
    -- Provider
    provider_name VARCHAR(255),
    department VARCHAR(100),
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goodx_revenue_capture_facility ON goodx_revenue_capture(facility_id);
CREATE INDEX idx_goodx_revenue_capture_date ON goodx_revenue_capture(transaction_date DESC);
CREATE INDEX idx_goodx_revenue_capture_goodx_invoice ON goodx_revenue_capture(goodx_invoice_id);
CREATE INDEX idx_goodx_revenue_capture_synced ON goodx_revenue_capture(synced_to_erp);

-- ================================================
-- COMPLETION NOTICE
-- ================================================

DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Healthcare Operations Intelligence Module Created!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Tables: 20';
    RAISE NOTICE '';
    RAISE NOTICE 'SECTION 1: Facility Management (3 tables)';
    RAISE NOTICE '  - healthcare_facilities';
    RAISE NOTICE '  - facility_operational_status';
    RAISE NOTICE '  - facility_operational_kpis';
    RAISE NOTICE '';
    RAISE NOTICE 'SECTION 2: Patient Journey (4 tables)';
    RAISE NOTICE '  - healthcare_patients';
    RAISE NOTICE '  - healthcare_appointments';
    RAISE NOTICE '  - patient_journey_tracking';
    RAISE NOTICE '  - patient_flow_bottlenecks';
    RAISE NOTICE '';
    RAISE NOTICE 'SECTION 3: Medical Inventory (5 tables)';
    RAISE NOTICE '  - medical_inventory_items';
    RAISE NOTICE '  - medical_inventory_batches';
    RAISE NOTICE '  - medical_inventory_alerts';
    RAISE NOTICE '  - medical_inventory_reorders';
    RAISE NOTICE '  - medical_inventory_usage';
    RAISE NOTICE '';
    RAISE NOTICE 'SECTION 4: Staff & Resources (2 tables)';
    RAISE NOTICE '  - healthcare_staff_schedules';
    RAISE NOTICE '  - healthcare_staff_utilization';
    RAISE NOTICE '';
    RAISE NOTICE 'SECTION 5: Equipment Management (2 tables)';
    RAISE NOTICE '  - healthcare_equipment';
    RAISE NOTICE '  - healthcare_equipment_maintenance';
    RAISE NOTICE '';
    RAISE NOTICE 'SECTION 6: Communications (2 tables)';
    RAISE NOTICE '  - facility_communications';
    RAISE NOTICE '  - facility_service_requests';
    RAISE NOTICE '';
    RAISE NOTICE 'SECTION 7: GoodX Integration (3 tables)';
    RAISE NOTICE '  - goodx_integration_config';
    RAISE NOTICE '  - goodx_sync_logs';
    RAISE NOTICE '  - goodx_revenue_capture';
    RAISE NOTICE '';
    RAISE NOTICE 'Focus: Operational Intelligence, Not Just Storage';
    RAISE NOTICE '  ✓ Real-time facility status';
    RAISE NOTICE '  ✓ Patient journey tracking';
    RAISE NOTICE '  ✓ Auto-detected bottlenecks';
    RAISE NOTICE '  ✓ Predictive inventory alerts';
    RAISE NOTICE '  ✓ Staff utilization analytics';
    RAISE NOTICE '  ✓ Equipment downtime tracking';
    RAISE NOTICE '  ✓ GoodX revenue automation';
    RAISE NOTICE '==================================================';
END $$;
