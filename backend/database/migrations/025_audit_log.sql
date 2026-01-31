-- =====================================================
-- Audit Log Table for SOX/GDPR Compliance
-- Enterprise-grade audit trail for all data changes
-- =====================================================

-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    
    -- Who
    user_id INTEGER,
    user_email VARCHAR(255),
    tenant_id INTEGER,
    
    -- What
    action VARCHAR(50) NOT NULL,  -- CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, etc.
    entity_type VARCHAR(100) NOT NULL,  -- e.g., 'logistics', 'vehicles', 'drivers'
    entity_id VARCHAR(255),  -- ID of the affected record
    
    -- Changes
    old_values JSONB,  -- Previous values (for UPDATE/DELETE)
    new_values JSONB,  -- New values (for CREATE/UPDATE)
    changed_fields TEXT[],  -- List of fields that changed
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    request_method VARCHAR(10),
    request_path VARCHAR(500),
    status_code INTEGER,
    
    -- Additional metadata
    metadata JSONB,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type ON audit_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_id ON audit_log(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_entity ON audit_log(tenant_id, entity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_action ON audit_log(user_id, action, created_at DESC);

-- Partial index for compliance queries (modifications only)
CREATE INDEX IF NOT EXISTS idx_audit_log_modifications 
ON audit_log(tenant_id, entity_type, created_at DESC) 
WHERE action IN ('CREATE', 'UPDATE', 'DELETE');

-- Add comment for documentation
COMMENT ON TABLE audit_log IS 'Enterprise audit trail for SOX, GDPR, and regulatory compliance. Immutable record of all data changes.';

-- Create view for recent activity
CREATE OR REPLACE VIEW recent_audit_activity AS
SELECT 
    id,
    user_email,
    action,
    entity_type,
    entity_id,
    changed_fields,
    ip_address,
    created_at
FROM audit_log
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Create function to prevent audit log modifications (immutability)
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit log entries cannot be modified or deleted for compliance reasons';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent updates/deletes on audit_log
DROP TRIGGER IF EXISTS audit_log_immutable ON audit_log;
CREATE TRIGGER audit_log_immutable
    BEFORE UPDATE OR DELETE ON audit_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_modification();

-- Grant permissions (adjust as needed for your roles)
-- GRANT SELECT ON audit_log TO readonly_user;
-- GRANT INSERT ON audit_log TO application_user;

COMMENT ON COLUMN audit_log.old_values IS 'JSON snapshot of record before modification (sensitive fields redacted)';
COMMENT ON COLUMN audit_log.new_values IS 'JSON snapshot of record after modification (sensitive fields redacted)';
COMMENT ON COLUMN audit_log.changed_fields IS 'Array of field names that were modified';
COMMENT ON COLUMN audit_log.metadata IS 'Additional context like request duration, query parameters';
