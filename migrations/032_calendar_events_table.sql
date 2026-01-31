-- Calendar Events Table Migration
-- Created: December 31, 2025
-- Purpose: Support calendar functionality in Communications Hub

-- Drop table if exists (for clean reinstall)
-- DROP TABLE IF EXISTS calendar_events CASCADE;

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    
    -- Event details
    title VARCHAR(200) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    event_type VARCHAR(50) DEFAULT 'meeting', -- meeting, task, reminder, deadline, holiday, personal
    
    -- Timing
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_all_day BOOLEAN DEFAULT FALSE,
    
    -- Recurrence (optional - for future enhancement)
    recurrence_rule VARCHAR(255), -- RRULE format (e.g., "FREQ=WEEKLY;BYDAY=MO,WE,FR")
    recurrence_end_date TIMESTAMP,
    
    -- Participants & Notifications
    attendees JSONB DEFAULT '[]', -- Array of user objects: [{"user_id": 1, "email": "user@example.com", "status": "pending"}]
    reminders JSONB DEFAULT '[]', -- Array of reminder configs: [{"type": "email", "minutes_before": 15}]
    
    -- Status & Visibility
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, cancelled, completed, tentative
    visibility VARCHAR(50) DEFAULT 'private', -- private, public, shared
    
    -- Integration
    external_id VARCHAR(255), -- For syncing with external calendars (Google, Outlook, etc.)
    external_source VARCHAR(100), -- google, outlook, apple, etc.
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    
    -- Foreign Keys
    CONSTRAINT fk_calendar_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_calendar_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_calendar_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_calendar_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_calendar_events_tenant ON calendar_events(tenant_id);
CREATE INDEX idx_calendar_events_user ON calendar_events(user_id, tenant_id);
CREATE INDEX idx_calendar_events_dates ON calendar_events(start_date, end_date);
CREATE INDEX idx_calendar_events_type ON calendar_events(tenant_id, event_type);
CREATE INDEX idx_calendar_events_status ON calendar_events(tenant_id, status);
CREATE INDEX idx_calendar_events_date_range ON calendar_events(tenant_id, start_date, end_date);

-- Create a GIN index for JSONB attendees search
CREATE INDEX idx_calendar_events_attendees ON calendar_events USING GIN (attendees);

-- Add trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_events_updated_at();

-- Add comments for documentation
COMMENT ON TABLE calendar_events IS 'Stores calendar events for all tenants with multi-tenant isolation';
COMMENT ON COLUMN calendar_events.tenant_id IS 'Tenant isolation - all queries must filter by this';
COMMENT ON COLUMN calendar_events.attendees IS 'JSON array of attendee objects with user_id, email, and status';
COMMENT ON COLUMN calendar_events.reminders IS 'JSON array of reminder configurations (type, minutes_before)';
COMMENT ON COLUMN calendar_events.recurrence_rule IS 'iCalendar RRULE format for recurring events';
COMMENT ON COLUMN calendar_events.external_id IS 'Used for syncing with external calendar services';

-- Insert sample event for testing (optional)
-- INSERT INTO calendar_events (tenant_id, user_id, title, description, start_date, end_date, event_type, created_by)
-- VALUES 
--     (1, 1, 'Team Standup', 'Daily team standup meeting', '2025-12-31 09:00:00', '2025-12-31 09:30:00', 'meeting', 1),
--     (1, 1, 'Project Deadline', 'Q4 deliverables due', '2025-12-31 17:00:00', '2025-12-31 17:00:00', 'deadline', 1);

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON calendar_events TO erp_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE calendar_events_id_seq TO erp_app_user;

-- Verification query
SELECT 
    schemaname, 
    tablename, 
    indexname 
FROM pg_indexes 
WHERE tablename = 'calendar_events';

-- Success message
SELECT 'Calendar events table created successfully!' AS status;
