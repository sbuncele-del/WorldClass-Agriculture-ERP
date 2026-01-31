-- Delivery Verification & POD System
-- Migration: 20251209_delivery_verification.sql

-- Delivery Verifications Table
CREATE TABLE IF NOT EXISTS delivery_verifications (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL UNIQUE,
    verification_code VARCHAR(6) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER DEFAULT 0,
    verified_at TIMESTAMP,
    verified_by INTEGER,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Proof of Delivery Table
CREATE TABLE IF NOT EXISTS proof_of_delivery (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL,
    pod_reference VARCHAR(50) UNIQUE NOT NULL,
    verification_id INTEGER REFERENCES delivery_verifications(id),
    status VARCHAR(20) DEFAULT 'pending_upload', -- pending_upload, uploaded, confirmed, rejected
    files JSONB DEFAULT '[]',
    customer_signature TEXT,
    notes TEXT,
    uploaded_at TIMESTAMP,
    uploaded_by INTEGER,
    confirmed_at TIMESTAMP,
    confirmed_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Delivery Events Log (audit trail)
CREATE TABLE IF NOT EXISTS delivery_events (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- verification_sent, code_verified, pod_uploaded, delivery_completed
    event_data JSONB DEFAULT '{}',
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Messages Table (for driver-dispatch chat)
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(100),
    sender_id INTEGER NOT NULL,
    sender_type VARCHAR(20) NOT NULL, -- driver, dispatch, customer, system
    sender_name VARCHAR(100),
    recipient_type VARCHAR(20), -- driver, dispatch, customer, all
    recipient_id INTEGER,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- text, alert, workflow, emergency
    metadata JSONB DEFAULT '{}',
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Invoices Table (basic for now)
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, pending_approval, approved, sent, paid
    amount DECIMAL(12,2),
    created_by INTEGER,
    approved_by INTEGER,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add verified_phone to customers if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'verified_phone') THEN
        ALTER TABLE customers ADD COLUMN verified_phone VARCHAR(20);
    END IF;
END $$;

-- Logistics trips additions
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'logistics_trips' AND column_name = 'arrived_at') THEN
        ALTER TABLE logistics_trips ADD COLUMN arrived_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'logistics_trips' AND column_name = 'delivered_at') THEN
        ALTER TABLE logistics_trips ADD COLUMN delivered_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'logistics_trips' AND column_name = 'delivery_notes') THEN
        ALTER TABLE logistics_trips ADD COLUMN delivery_notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'logistics_trips' AND column_name = 'completed_by') THEN
        ALTER TABLE logistics_trips ADD COLUMN completed_by INTEGER;
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_delivery_verifications_trip ON delivery_verifications(trip_id);
CREATE INDEX IF NOT EXISTS idx_proof_of_delivery_trip ON proof_of_delivery(trip_id);
CREATE INDEX IF NOT EXISTS idx_delivery_events_trip ON delivery_events(trip_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- Grant permissions
GRANT ALL ON delivery_verifications TO PUBLIC;
GRANT ALL ON proof_of_delivery TO PUBLIC;
GRANT ALL ON delivery_events TO PUBLIC;
GRANT ALL ON messages TO PUBLIC;
GRANT ALL ON invoices TO PUBLIC;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;
