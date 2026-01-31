-- Communications Hub Tables
-- Complete schema for internal communications

-- ============================================================================
-- CHAT CHANNELS
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    channel_type VARCHAR(20) DEFAULT 'public', -- public, private, department
    department_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_channels_tenant ON chat_channels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_channels_type ON chat_channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_chat_channels_active ON chat_channels(is_active) WHERE is_active = TRUE;

-- Channel members
CREATE TABLE IF NOT EXISTS chat_channel_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- admin, moderator, member
    joined_at TIMESTAMP DEFAULT NOW(),
    last_read_at TIMESTAMP,
    UNIQUE(channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_members_channel ON chat_channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user ON chat_channel_members(user_id);

-- ============================================================================
-- CHAT MESSAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- text, file, image, system
    attachments JSONB DEFAULT '[]',
    mentions JSONB DEFAULT '[]', -- Array of user IDs mentioned
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP,
    parent_message_id UUID REFERENCES chat_messages(id), -- For threading
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_tenant ON chat_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);

-- ============================================================================
-- DIRECT MESSAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    recipient_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    attachments JSONB DEFAULT '[]',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dm_tenant ON direct_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_recipient ON direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_dm_conversation ON direct_messages(LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id));
CREATE INDEX IF NOT EXISTS idx_dm_unread ON direct_messages(recipient_id, is_read) WHERE is_read = FALSE;

-- ============================================================================
-- USER NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    notification_type VARCHAR(50) DEFAULT 'info', -- info, success, warning, error, mention, task, approval
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    related_type VARCHAR(50), -- invoice, task, approval, message, etc.
    related_id UUID,
    action_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON user_notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON user_notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON user_notifications(notification_type);

-- ============================================================================
-- VIDEO MEETINGS (Daily.co integration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    room_name VARCHAR(100) NOT NULL,
    room_url VARCHAR(500),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    meeting_type VARCHAR(30) DEFAULT 'instant', -- instant, scheduled, recurring
    host_id UUID NOT NULL REFERENCES users(id),
    scheduled_start TIMESTAMP,
    scheduled_end TIMESTAMP,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    max_participants INTEGER DEFAULT 50,
    is_private BOOLEAN DEFAULT FALSE,
    waiting_room BOOLEAN DEFAULT FALSE,
    recording_enabled BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, live, ended, cancelled
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meetings_tenant ON video_meetings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meetings_host ON video_meetings(host_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON video_meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled ON video_meetings(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_meetings_room ON video_meetings(room_name);

-- Meeting participants
CREATE TABLE IF NOT EXISTS video_meeting_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES video_meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    email VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'participant', -- host, co-host, participant
    invite_status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined
    joined_at TIMESTAMP,
    left_at TIMESTAMP,
    UNIQUE(meeting_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON video_meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_user ON video_meeting_participants(user_id);

-- ============================================================================
-- MESSAGE TEMPLATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    template_type VARCHAR(50) DEFAULT 'email', -- email, sms, notification, announcement
    category VARCHAR(50), -- sales, support, hr, general
    variables JSONB DEFAULT '[]', -- Array of variable placeholders
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_tenant ON message_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON message_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_templates_category ON message_templates(category);

-- ============================================================================
-- COMMUNICATION CAMPAIGNS
-- ============================================================================
CREATE TABLE IF NOT EXISTS communication_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(50) DEFAULT 'email', -- email, sms, notification
    template_id UUID REFERENCES message_templates(id),
    target_audience JSONB DEFAULT '{}', -- filters for recipients
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'draft', -- draft, scheduled, sending, sent, cancelled
    stats JSONB DEFAULT '{}', -- sent, delivered, opened, clicked, etc.
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON communication_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON communication_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled ON communication_campaigns(scheduled_at);

-- ============================================================================
-- CONTACTS (External contacts for communications)
-- ============================================================================
CREATE TABLE IF NOT EXISTS communication_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    contact_type VARCHAR(50) DEFAULT 'general', -- customer, vendor, partner, general
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    is_subscribed BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON communication_contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON communication_contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON communication_contacts(contact_type);

-- ============================================================================
-- Add tenant_id to announcements if missing
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'announcements' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE announcements ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        CREATE INDEX idx_announcements_tenant ON announcements(tenant_id);
    END IF;
END $$;

-- Add missing columns to announcements
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'is_active') THEN
        ALTER TABLE announcements ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'expires_at') THEN
        ALTER TABLE announcements ADD COLUMN expires_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'created_by_user_id') THEN
        ALTER TABLE announcements ADD COLUMN created_by_user_id UUID REFERENCES users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'priority') THEN
        ALTER TABLE announcements ADD COLUMN priority VARCHAR(20) DEFAULT 'normal';
    END IF;
END $$;

-- ============================================================================
-- Insert sample data for testing
-- ============================================================================

-- Create a default General channel for each tenant
INSERT INTO chat_channels (tenant_id, name, description, channel_type)
SELECT id, 'General', 'General discussion channel', 'public'
FROM tenants
WHERE NOT EXISTS (
    SELECT 1 FROM chat_channels cc 
    WHERE cc.tenant_id = tenants.id AND cc.name = 'General'
);

COMMENT ON TABLE chat_channels IS 'Chat channels for team communication';
COMMENT ON TABLE chat_messages IS 'Messages within chat channels';
COMMENT ON TABLE direct_messages IS 'Private messages between two users';
COMMENT ON TABLE user_notifications IS 'User notifications for various events';
COMMENT ON TABLE video_meetings IS 'Video meeting rooms using Daily.co';
COMMENT ON TABLE message_templates IS 'Reusable message templates';
COMMENT ON TABLE communication_campaigns IS 'Bulk communication campaigns';
