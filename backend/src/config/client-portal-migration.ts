import { Pool, PoolClient } from 'pg';

/**
 * ============================================================================
 * CLIENT PORTAL & DOCUMENT MANAGEMENT MIGRATION
 * ============================================================================
 * 
 * Creates comprehensive client communication and document management system:
 * - Client Portal (secure client access)
 * - Document Storage & Versioning
 * - Proposal Templates & Generation
 * - Progress Notifications & Updates
 * - Secure Messaging
 * - File Sharing with Permissions
 * 
 * Enhanced kaRBON-style client collaboration
 * ============================================================================
 */

export async function runClientPortalMigration(pool: Pool): Promise<void> {
  const client: PoolClient = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('📱 Starting Client Portal & Document Management migration...');

    // ============================================================================
    // TABLE 1: CLIENT PORTAL USERS
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS client_portal_users (
        portal_user_id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        
        -- Authentication
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        reset_token VARCHAR(255),
        reset_token_expiry TIMESTAMP,
        
        -- Profile
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        job_title VARCHAR(100),
        phone VARCHAR(50),
        
        -- Permissions
        role VARCHAR(50) DEFAULT 'Client User', -- Primary Contact, Billing Contact, User
        can_approve_proposals BOOLEAN DEFAULT false,
        can_upload_documents BOOLEAN DEFAULT true,
        can_view_invoices BOOLEAN DEFAULT true,
        can_view_all_projects BOOLEAN DEFAULT false,
        
        -- Access Control
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        email_verification_token VARCHAR(255),
        last_login TIMESTAMP,
        login_count INTEGER DEFAULT 0,
        
        -- Notifications
        notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": false}',
        receive_progress_updates BOOLEAN DEFAULT true,
        receive_document_notifications BOOLEAN DEFAULT true,
        receive_invoice_alerts BOOLEAN DEFAULT true,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES employees(employee_id)
      )
    `);
    console.log('   ✅ client_portal_users table created');

    // ============================================================================
    // TABLE 2: DOCUMENT STORAGE
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        -- Ownership
        customer_id INTEGER REFERENCES customers(id),
        project_id UUID REFERENCES client_projects(project_id),
        
        -- File Information
        file_name VARCHAR(255) NOT NULL,
        original_file_name VARCHAR(255) NOT NULL,
        file_extension VARCHAR(10),
        file_size_bytes BIGINT,
        mime_type VARCHAR(100),
        
        -- Storage
        storage_provider VARCHAR(50) DEFAULT 'local', -- local, s3, azure, google
        storage_path TEXT NOT NULL,
        storage_bucket VARCHAR(100),
        file_hash VARCHAR(64), -- SHA-256 for deduplication
        
        -- Organization
        folder_path TEXT, -- /Clients/ABC Corp/2024 Audit/
        document_type VARCHAR(50), -- Financial Statement, Tax Return, Contract, Invoice, etc.
        category VARCHAR(50), -- Client Documents, Internal, Templates, Proposals
        tags VARCHAR(50)[],
        
        -- Versioning
        version_number INTEGER DEFAULT 1,
        is_latest_version BOOLEAN DEFAULT true,
        parent_document_id UUID REFERENCES documents(document_id),
        
        -- Metadata
        title VARCHAR(200),
        description TEXT,
        custom_metadata JSONB,
        
        -- Security & Access
        is_confidential BOOLEAN DEFAULT false,
        access_level VARCHAR(20) DEFAULT 'private', -- public, client, team, private
        password_protected BOOLEAN DEFAULT false,
        password_hash VARCHAR(255),
        expiry_date DATE,
        
        -- Client Portal
        visible_to_client BOOLEAN DEFAULT false,
        shared_with_portal_users INTEGER[], -- Array of portal_user_ids
        client_can_download BOOLEAN DEFAULT true,
        client_can_comment BOOLEAN DEFAULT true,
        
        -- AI Features
        ocr_text TEXT, -- Extracted text from OCR
        ai_summary TEXT,
        extracted_entities JSONB, -- Dates, amounts, parties, etc.
        
        -- Tracking
        view_count INTEGER DEFAULT 0,
        download_count INTEGER DEFAULT 0,
        last_viewed_at TIMESTAMP,
        last_downloaded_at TIMESTAMP,
        
        -- Audit
        uploaded_by INTEGER REFERENCES employees(employee_id),
        uploaded_by_client INTEGER REFERENCES client_portal_users(portal_user_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP, -- Soft delete
        deleted_by INTEGER REFERENCES employees(employee_id)
      )
    `);
    console.log('   ✅ documents table created');

    // ============================================================================
    // TABLE 3: DOCUMENT ACCESS LOG
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS document_access_log (
        log_id SERIAL PRIMARY KEY,
        document_id UUID NOT NULL REFERENCES documents(document_id),
        
        -- Who
        employee_id INTEGER REFERENCES employees(employee_id),
        portal_user_id INTEGER REFERENCES client_portal_users(portal_user_id),
        
        -- What
        action VARCHAR(50) NOT NULL, -- view, download, upload, edit, delete, share
        access_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- How
        ip_address VARCHAR(45),
        user_agent TEXT,
        device_info JSONB,
        
        -- Context
        project_id UUID REFERENCES client_projects(project_id),
        session_id VARCHAR(100)
      )
    `);
    console.log('   ✅ document_access_log table created');

    // ============================================================================
    // TABLE 4: PROPOSAL TEMPLATES
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS proposal_templates (
        template_id SERIAL PRIMARY KEY,
        
        -- Template Info
        template_name VARCHAR(200) NOT NULL,
        template_code VARCHAR(50) UNIQUE,
        description TEXT,
        
        -- Categorization
        service_type VARCHAR(50) NOT NULL, -- Audit, Tax, Advisory, Consulting, Compliance
        industry VARCHAR(50), -- Manufacturing, Retail, Technology, etc.
        complexity_level VARCHAR(20), -- Simple, Standard, Complex, Enterprise
        
        -- Content
        cover_page_html TEXT,
        executive_summary_html TEXT,
        scope_of_work_html TEXT,
        methodology_html TEXT,
        deliverables_html TEXT,
        timeline_html TEXT,
        team_structure_html TEXT,
        pricing_structure_html TEXT,
        terms_conditions_html TEXT,
        
        -- Merge Fields
        available_merge_fields JSONB, -- {client_name}, {project_start_date}, etc.
        
        -- Pricing Components
        default_pricing_components JSONB, -- Array of fee structures
        hourly_rate_bands JSONB,
        
        -- Branding
        header_image_url TEXT,
        footer_text TEXT,
        color_scheme JSONB,
        
        -- Analytics
        usage_count INTEGER DEFAULT 0,
        win_rate DECIMAL(5,2), -- Percentage of accepted proposals
        average_deal_size DECIMAL(15,2),
        last_used_date DATE,
        
        -- Status
        is_active BOOLEAN DEFAULT true,
        requires_partner_review BOOLEAN DEFAULT false,
        
        -- Versioning
        version VARCHAR(20) DEFAULT '1.0',
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES employees(employee_id)
      )
    `);
    console.log('   ✅ proposal_templates table created');

    // ============================================================================
    // TABLE 5: PROPOSALS
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS proposals (
        proposal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        project_id UUID REFERENCES client_projects(project_id),
        template_id INTEGER REFERENCES proposal_templates(template_id),
        
        -- Proposal Details
        proposal_number VARCHAR(50) UNIQUE NOT NULL,
        proposal_title VARCHAR(200) NOT NULL,
        proposal_date DATE DEFAULT CURRENT_DATE,
        valid_until DATE,
        
        -- Generated Content (from template with merged data)
        generated_html TEXT,
        generated_pdf_url TEXT,
        
        -- Pricing
        total_fee DECIMAL(15,2),
        payment_terms TEXT,
        pricing_breakdown JSONB,
        
        -- Status & Workflow
        status VARCHAR(30) DEFAULT 'Draft', -- Draft, Under Review, Sent, Viewed, Accepted, Rejected, Expired
        internal_approval_status VARCHAR(30) DEFAULT 'Pending', -- Pending, Approved, Rejected
        approved_by_partner INTEGER REFERENCES employees(employee_id),
        approved_at TIMESTAMP,
        
        sent_to_client_at TIMESTAMP,
        first_viewed_by_client_at TIMESTAMP,
        last_viewed_at TIMESTAMP,
        view_count INTEGER DEFAULT 0,
        
        -- Client Response
        client_decision VARCHAR(20), -- Accepted, Rejected, Negotiating
        client_decision_date TIMESTAMP,
        client_decision_by INTEGER REFERENCES client_portal_users(portal_user_id),
        client_comments TEXT,
        client_signature_data TEXT, -- E-signature data
        
        -- Negotiation
        negotiation_notes TEXT,
        revised_proposal_id UUID REFERENCES proposals(proposal_id),
        revision_number INTEGER DEFAULT 1,
        
        -- Conversion
        converted_to_project_id UUID REFERENCES client_projects(project_id),
        converted_at TIMESTAMP,
        
        -- Team
        proposal_owner INTEGER REFERENCES employees(employee_id),
        contributors INTEGER[], -- Array of employee_ids
        
        -- Audit
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES employees(employee_id)
      )
    `);
    console.log('   ✅ proposals table created');

    // ============================================================================
    // TABLE 6: CLIENT MESSAGES
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS client_messages (
        message_id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        project_id UUID REFERENCES client_projects(project_id),
        
        -- Thread
        parent_message_id INTEGER REFERENCES client_messages(message_id),
        thread_id INTEGER, -- Groups related messages
        
        -- Sender
        sent_by_employee INTEGER REFERENCES employees(employee_id),
        sent_by_portal_user INTEGER REFERENCES client_portal_users(portal_user_id),
        sender_type VARCHAR(20), -- staff, client
        
        -- Message Content
        subject VARCHAR(200),
        message_body TEXT NOT NULL,
        message_type VARCHAR(30) DEFAULT 'general', -- general, document_request, status_update, question
        priority VARCHAR(10) DEFAULT 'normal', -- low, normal, high, urgent
        
        -- Attachments
        attachment_document_ids UUID[], -- Array of document_ids
        
        -- Status
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMP,
        read_by INTEGER,
        requires_response BOOLEAN DEFAULT false,
        is_internal_note BOOLEAN DEFAULT false, -- Not visible to client
        
        -- Sentiment
        ai_sentiment_score DECIMAL(3,2),
        ai_urgency_level VARCHAR(10),
        ai_suggested_response TEXT,
        
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ client_messages table created');

    // ============================================================================
    // TABLE 7: PROJECT PROGRESS UPDATES
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_progress_updates (
        update_id SERIAL PRIMARY KEY,
        project_id UUID NOT NULL REFERENCES client_projects(project_id),
        
        -- Update Content
        update_title VARCHAR(200) NOT NULL,
        update_type VARCHAR(30), -- Milestone Reached, Status Change, Deliverable Ready, Issue Alert
        description TEXT,
        
        -- Progress Metrics
        completion_percentage INTEGER,
        hours_consumed DECIMAL(10,2),
        budget_consumed_percentage DECIMAL(5,2),
        
        -- Status
        current_status VARCHAR(30),
        previous_status VARCHAR(30),
        
        -- Milestones
        milestone_name VARCHAR(100),
        milestone_achieved BOOLEAN,
        next_milestone VARCHAR(100),
        expected_completion_date DATE,
        
        -- Deliverables
        deliverable_name VARCHAR(200),
        deliverable_document_id UUID REFERENCES documents(document_id),
        
        -- Issues/Risks
        issues_identified TEXT[],
        risks_identified TEXT[],
        mitigation_actions TEXT[],
        
        -- Client Notification
        notify_client BOOLEAN DEFAULT true,
        notification_sent BOOLEAN DEFAULT false,
        notification_sent_at TIMESTAMP,
        client_acknowledged BOOLEAN DEFAULT false,
        client_acknowledged_at TIMESTAMP,
        
        -- Auto-generated
        is_auto_generated BOOLEAN DEFAULT false,
        generation_trigger VARCHAR(50), -- milestone_reached, status_change, scheduled
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES employees(employee_id)
      )
    `);
    console.log('   ✅ project_progress_updates table created');

    // ============================================================================
    // TABLE 8: NOTIFICATION QUEUE
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_queue (
        notification_id SERIAL PRIMARY KEY,
        
        -- Recipient
        customer_id INTEGER REFERENCES customers(id),
        portal_user_id INTEGER REFERENCES client_portal_users(portal_user_id),
        employee_id INTEGER REFERENCES employees(employee_id),
        
        -- Notification Content
        notification_type VARCHAR(50) NOT NULL, -- project_update, document_shared, proposal_sent, message_received, invoice_due
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        
        -- Context
        related_project_id UUID REFERENCES client_projects(project_id),
        related_document_id UUID REFERENCES documents(document_id),
        related_proposal_id UUID REFERENCES proposals(proposal_id),
        related_message_id INTEGER REFERENCES client_messages(message_id),
        
        -- Delivery
        channel VARCHAR(20) DEFAULT 'email', -- email, sms, push, in_app
        priority VARCHAR(10) DEFAULT 'normal', -- low, normal, high, urgent
        
        -- Status
        status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, failed, read
        scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP,
        read_at TIMESTAMP,
        failed_reason TEXT,
        
        -- Tracking
        email_open_count INTEGER DEFAULT 0,
        link_click_count INTEGER DEFAULT 0,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ notification_queue table created');

    // ============================================================================
    // TABLE 9: CLIENT PORTAL ACTIVITY LOG
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS client_portal_activity (
        activity_id SERIAL PRIMARY KEY,
        portal_user_id INTEGER REFERENCES client_portal_users(portal_user_id),
        customer_id INTEGER REFERENCES customers(id),
        
        -- Activity
        activity_type VARCHAR(50) NOT NULL, -- login, document_view, document_download, proposal_view, message_sent, profile_update
        activity_description TEXT,
        
        -- Context
        project_id UUID REFERENCES client_projects(project_id),
        document_id UUID REFERENCES documents(document_id),
        proposal_id UUID REFERENCES proposals(proposal_id),
        
        -- Session
        session_id VARCHAR(100),
        ip_address VARCHAR(45),
        user_agent TEXT,
        
        -- Timing
        duration_seconds INTEGER,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ client_portal_activity table created');

    // ============================================================================
    // INDEXES FOR PERFORMANCE
    // ============================================================================
    
    // Portal Users
    await client.query('CREATE INDEX IF NOT EXISTS idx_portal_users_customer ON client_portal_users(customer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_portal_users_email ON client_portal_users(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_portal_users_active ON client_portal_users(is_active)');
    
    // Documents
    await client.query('CREATE INDEX IF NOT EXISTS idx_documents_customer ON documents(customer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_documents_visible_to_client ON documents(visible_to_client)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags)');
    
    // Document Access Log
    await client.query('CREATE INDEX IF NOT EXISTS idx_doc_access_document ON document_access_log(document_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_doc_access_timestamp ON document_access_log(access_timestamp DESC)');
    
    // Proposals
    await client.query('CREATE INDEX IF NOT EXISTS idx_proposals_customer ON proposals(customer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_proposals_project ON proposals(project_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_proposals_template ON proposals(template_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_proposals_owner ON proposals(proposal_owner)');
    
    // Messages
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_customer ON client_messages(customer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_project ON client_messages(project_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_thread ON client_messages(thread_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_unread ON client_messages(is_read) WHERE is_read = false');
    
    // Progress Updates
    await client.query('CREATE INDEX IF NOT EXISTS idx_progress_project ON project_progress_updates(project_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_progress_notify ON project_progress_updates(notify_client, notification_sent)');
    
    // Notifications
    await client.query('CREATE INDEX IF NOT EXISTS idx_notifications_portal_user ON notification_queue(portal_user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_notifications_status ON notification_queue(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notification_queue(scheduled_for)');
    
    // Activity Log
    await client.query('CREATE INDEX IF NOT EXISTS idx_activity_portal_user ON client_portal_activity(portal_user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_activity_customer ON client_portal_activity(customer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_activity_created ON client_portal_activity(created_at DESC)');
    
    console.log('   📇 Created 25+ indexes for performance');

    // ============================================================================
    // VIEWS FOR CLIENT PORTAL
    // ============================================================================
    
    // View 1: Client Portal Dashboard
    await client.query(`
      CREATE OR REPLACE VIEW v_client_portal_dashboard AS
      SELECT 
        c.id as customer_id,
        c.customer_name,
        
        -- Active Projects
        COUNT(DISTINCT cp.project_id) FILTER (WHERE cp.status = 'Active') as active_projects,
        COUNT(DISTINCT cp.project_id) FILTER (WHERE cp.status = 'Completed') as completed_projects,
        
        -- Recent Documents
        COUNT(DISTINCT d.document_id) FILTER (
          WHERE d.visible_to_client = true 
          AND d.created_at >= CURRENT_DATE - INTERVAL '30 days'
        ) as new_documents_30d,
        
        -- Unread Messages
        COUNT(DISTINCT cm.message_id) FILTER (
          WHERE cm.is_read = false 
          AND cm.sent_by_employee IS NOT NULL
        ) as unread_messages,
        
        -- Pending Proposals
        COUNT(DISTINCT p.proposal_id) FILTER (
          WHERE p.status = 'Sent' 
          AND p.client_decision IS NULL
        ) as pending_proposals,
        
        -- Recent Activity
        MAX(cpa.created_at) as last_portal_login,
        
        -- Outstanding Invoices
        COALESCE(SUM(si.total_amount) FILTER (WHERE si.status = 'Unpaid'), 0) as outstanding_balance
        
      FROM customers c
      LEFT JOIN client_projects cp ON c.id = cp.customer_id
      LEFT JOIN documents d ON c.id = d.customer_id
      LEFT JOIN client_messages cm ON c.id = cm.customer_id
      LEFT JOIN proposals p ON c.id = p.customer_id
      LEFT JOIN client_portal_activity cpa ON c.id = cpa.customer_id
      LEFT JOIN sales_invoices si ON c.id = si.customer_id
      GROUP BY c.id, c.customer_name
    `);
    console.log('   👁️  v_client_portal_dashboard view created');

    // View 2: Document Library View
    await client.query(`
      CREATE OR REPLACE VIEW v_client_document_library AS
      SELECT 
        d.document_id,
        d.customer_id,
        c.customer_name,
        d.project_id,
        cp.project_name,
        d.file_name,
        d.original_file_name,
        d.file_extension,
        d.file_size_bytes,
        ROUND(d.file_size_bytes / 1024.0 / 1024.0, 2) as file_size_mb,
        d.document_type,
        d.category,
        d.tags,
        d.version_number,
        d.is_latest_version,
        d.title,
        d.description,
        d.visible_to_client,
        d.client_can_download,
        d.view_count,
        d.download_count,
        d.created_at,
        CASE 
          WHEN d.uploaded_by IS NOT NULL THEN e.first_name || ' ' || e.last_name
          WHEN d.uploaded_by_client IS NOT NULL THEN cpu.first_name || ' ' || cpu.last_name
        END as uploaded_by_name,
        d.last_viewed_at,
        d.last_downloaded_at
      FROM documents d
      LEFT JOIN customers c ON d.customer_id = c.id
      LEFT JOIN client_projects cp ON d.project_id = cp.project_id
      LEFT JOIN employees e ON d.uploaded_by = e.employee_id
      LEFT JOIN client_portal_users cpu ON d.uploaded_by_client = cpu.portal_user_id
      WHERE d.deleted_at IS NULL
    `);
    console.log('   👁️  v_client_document_library view created');

    // View 3: Proposal Analytics
    await client.query(`
      CREATE OR REPLACE VIEW v_proposal_analytics AS
      SELECT 
        pt.template_id,
        pt.template_name,
        pt.service_type,
        pt.industry,
        COUNT(p.proposal_id) as total_proposals,
        COUNT(p.proposal_id) FILTER (WHERE p.status = 'Sent') as sent_count,
        COUNT(p.proposal_id) FILTER (WHERE p.client_decision = 'Accepted') as won_count,
        COUNT(p.proposal_id) FILTER (WHERE p.client_decision = 'Rejected') as lost_count,
        ROUND(
          COUNT(p.proposal_id) FILTER (WHERE p.client_decision = 'Accepted')::numeric / 
          NULLIF(COUNT(p.proposal_id) FILTER (WHERE p.status = 'Sent'), 0) * 100, 
          2
        ) as win_rate,
        AVG(p.total_fee) FILTER (WHERE p.client_decision = 'Accepted') as avg_won_deal_size,
        SUM(p.total_fee) FILTER (WHERE p.client_decision = 'Accepted') as total_won_value,
        AVG(EXTRACT(EPOCH FROM (p.client_decision_date - p.sent_to_client_at)) / 86400) 
          FILTER (WHERE p.client_decision IS NOT NULL) as avg_decision_days
      FROM proposal_templates pt
      LEFT JOIN proposals p ON pt.template_id = p.template_id
      GROUP BY pt.template_id, pt.template_name, pt.service_type, pt.industry
    `);
    console.log('   👁️  v_proposal_analytics view created');

    await client.query('COMMIT');
    console.log('✅ Client Portal & Document Management migration completed successfully!');
    console.log('   📊 9 new tables created');
    console.log('   📇 25+ indexes created');
    console.log('   👁️  3 views created');
    console.log('   🔒 Secure client access enabled');
    console.log('   📁 Document management ready');
    console.log('   📝 Proposal system ready');
    console.log('   💬 Client messaging enabled');
    console.log('   📢 Progress notifications ready');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Client Portal & Document Management migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}
