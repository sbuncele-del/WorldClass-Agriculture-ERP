-- Messages table for driver-dispatch communication
-- Run this migration to add messaging support

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Sender info
    sender_id UUID NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_role VARCHAR(50) NOT NULL DEFAULT 'driver',
    
    -- Recipient info (NULL = broadcast to dispatch)
    recipient_id UUID,
    recipient_name VARCHAR(255),
    
    -- Message content
    content TEXT NOT NULL,
    message_type VARCHAR(50) NOT NULL DEFAULT 'driver_to_dispatch',
    -- Types: driver_to_dispatch, dispatch_to_driver, driver_to_customer, system, emergency
    
    -- Related entities
    trip_id UUID,
    
    -- Priority/Emergency
    is_emergency BOOLEAN DEFAULT FALSE,
    
    -- Additional data
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes for fast queries
    CONSTRAINT fk_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_trip ON messages(trip_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_emergency ON messages(is_emergency) WHERE is_emergency = TRUE;
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(recipient_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- Add notifications table if not exists (for emergency alerts)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    message TEXT,
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, critical
    metadata JSONB DEFAULT '{}',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority) WHERE priority = 'critical';

-- Sample data for testing
-- INSERT INTO messages (sender_id, sender_name, sender_role, content, message_type, is_emergency)
-- VALUES 
--   ('user-uuid-here', 'John Driver', 'driver', 'On my way to delivery location', 'driver_to_dispatch', false),
--   ('user-uuid-here', 'John Driver', 'driver', 'EMERGENCY: Vehicle breakdown on N1', 'emergency', true);

COMMENT ON TABLE messages IS 'Real-time messaging between drivers, dispatch, and customers';
COMMENT ON COLUMN messages.message_type IS 'driver_to_dispatch, dispatch_to_driver, driver_to_customer, system, emergency';
COMMENT ON COLUMN messages.is_emergency IS 'High priority messages that trigger immediate notifications';
