import { Pool, PoolClient } from 'pg';

/**
 * ============================================================================
 * PRACTICE MANAGEMENT INTEGRATION MIGRATION
 * ============================================================================
 * 
 * Extends Worldclass ERP with Practice Management capabilities:
 * - Client Projects & Engagements
 * - Time Tracking & Billing
 * - Team Resource Management
 * - Client Health & Intelligence
 * - Knowledge Management
 * 
 * Integrates with existing: customers, employees, sales_invoices
 * ============================================================================
 */

export async function runPracticeIntegrationMigration(pool: Pool): Promise<void> {
  const client: PoolClient = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🎯 Starting Practice Management Integration migration...');

    // ============================================================================
    // EXTEND EXISTING TABLES
    // ============================================================================
    
    // Drop dependent views before altering customers table
    console.log('   🔄 Dropping dependent views on customers table...');
    await client.query(`DROP VIEW IF EXISTS customer_summary CASCADE`);
    await client.query(`DROP VIEW IF EXISTS sales_pipeline CASCADE`);
    await client.query(`DROP VIEW IF EXISTS aged_receivables CASCADE`);
    console.log('   ✅ Dependent views dropped');
    
    // Extend customers table with practice management fields
    await client.query(`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS practice_client_id UUID DEFAULT gen_random_uuid(),
      ADD COLUMN IF NOT EXISTS relationship_manager_id INTEGER REFERENCES employees(employee_id),
      ADD COLUMN IF NOT EXISTS service_tier VARCHAR(20) DEFAULT 'Standard',
      ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 75,
      ADD COLUMN IF NOT EXISTS churn_risk VARCHAR(10) DEFAULT 'low',
      ADD COLUMN IF NOT EXISTS last_health_check_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS primary_service_line VARCHAR(50)
    `);
    console.log('   ✅ Extended customers table with practice fields');
    
    // Recreate the views
    console.log('   🔄 Recreating dependent views...');
    await client.query(`
      CREATE OR REPLACE VIEW customer_summary AS
      SELECT 
        c.*,
        COUNT(DISTINCT so.id) as total_order_count,
        COUNT(DISTINCT si.id) as total_invoice_count,
        COALESCE(SUM(si.total_amount), 0) as lifetime_sales,
        COALESCE(SUM(si.amount_due), 0) as current_outstanding,
        MAX(so.order_date) as most_recent_order_date
      FROM customers c
      LEFT JOIN sales_orders so ON c.id = so.customer_id
      LEFT JOIN sales_invoices si ON c.id = si.customer_id
      GROUP BY c.id;
    `);
    
    await client.query(`
      CREATE OR REPLACE VIEW sales_pipeline AS
      SELECT 
        q.id,
        q.quotation_number,
        q.quotation_date,
        c.customer_name,
        q.total_amount,
        q.status,
        q.probability,
        q.expected_close_date,
        q.sales_person,
        CASE 
          WHEN q.status = 'DRAFT' THEN 1
          WHEN q.status = 'SENT' THEN 2
          WHEN q.status = 'NEGOTIATION' THEN 3
          WHEN q.status = 'WON' THEN 4
          WHEN q.status = 'LOST' THEN 5
          ELSE 0
        END as stage_order
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      WHERE q.status NOT IN ('CANCELLED', 'EXPIRED')
      ORDER BY q.expected_close_date ASC;
    `);
    
    await client.query(`
      CREATE OR REPLACE VIEW aged_receivables AS
      SELECT 
        c.id as customer_id,
        c.customer_code,
        c.customer_name,
        si.invoice_number,
        si.invoice_date,
        si.due_date,
        si.total_amount,
        si.amount_due,
        CURRENT_DATE - si.due_date as days_overdue,
        CASE 
          WHEN CURRENT_DATE <= si.due_date THEN 'CURRENT'
          WHEN CURRENT_DATE - si.due_date BETWEEN 1 AND 30 THEN '1-30 DAYS'
          WHEN CURRENT_DATE - si.due_date BETWEEN 31 AND 60 THEN '31-60 DAYS'
          WHEN CURRENT_DATE - si.due_date BETWEEN 61 AND 90 THEN '61-90 DAYS'
          ELSE '90+ DAYS'
        END as aging_bucket
      FROM sales_invoices si
      JOIN customers c ON si.customer_id = c.id
      WHERE si.amount_due > 0
      ORDER BY days_overdue DESC;
    `);
    console.log('   ✅ Dependent views recreated');

    // ============================================================================
    // TABLE 1: CLIENT PROJECTS
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS client_projects (
        project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        project_number VARCHAR(50) UNIQUE NOT NULL,
        project_name VARCHAR(200) NOT NULL,
        project_type VARCHAR(50) NOT NULL, -- Audit, Tax, Advisory, Compliance, Consulting
        status VARCHAR(20) DEFAULT 'Planning', -- Planning, Active, On Hold, Completed, Cancelled
        priority VARCHAR(10) DEFAULT 'Medium', -- Low, Medium, High, Critical
        
        -- Dates
        start_date DATE,
        target_end_date DATE,
        actual_end_date DATE,
        
        -- Budget & Actuals
        budget_hours DECIMAL(10,2),
        actual_hours DECIMAL(10,2) DEFAULT 0,
        budget_amount DECIMAL(15,2),
        actual_cost DECIMAL(15,2) DEFAULT 0,
        billed_amount DECIMAL(15,2) DEFAULT 0,
        
        -- Team
        project_manager_id INTEGER REFERENCES employees(employee_id),
        project_partner_id INTEGER REFERENCES employees(employee_id),
        
        -- Additional Info
        description TEXT,
        deliverables TEXT[],
        risks TEXT[],
        notes TEXT,
        
        -- Tracking
        completion_percentage INTEGER DEFAULT 0,
        profitability_status VARCHAR(20), -- On Track, At Risk, Over Budget
        last_status_update TIMESTAMP,
        
        -- Audit
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES employees(employee_id),
        updated_by INTEGER REFERENCES employees(employee_id)
      )
    `);
    console.log('   ✅ client_projects table created');

    // ============================================================================
    // TABLE 2: PROJECT TEAM MEMBERS
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_team_members (
        assignment_id SERIAL PRIMARY KEY,
        project_id UUID NOT NULL REFERENCES client_projects(project_id) ON DELETE CASCADE,
        employee_id INTEGER NOT NULL REFERENCES employees(employee_id),
        role VARCHAR(50) NOT NULL, -- Partner, Manager, Senior, Staff, Admin
        
        -- Allocation
        allocated_hours DECIMAL(8,2),
        actual_hours DECIMAL(8,2) DEFAULT 0,
        utilization_percentage DECIMAL(5,2),
        
        -- Rates
        hourly_cost_rate DECIMAL(10,2), -- From employee cost
        hourly_billing_rate DECIMAL(10,2), -- Client billing rate
        
        -- Dates
        assignment_date DATE DEFAULT CURRENT_DATE,
        start_date DATE,
        end_date DATE,
        is_active BOOLEAN DEFAULT true,
        
        -- Skills & Development
        assignment_reason TEXT, -- e.g., "Industry expertise", "Career development"
        skills_utilized VARCHAR(100)[],
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(project_id, employee_id, role)
      )
    `);
    console.log('   ✅ project_team_members table created');

    // ============================================================================
    // TABLE 3: TIME ENTRIES
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS time_entries (
        entry_id SERIAL PRIMARY KEY,
        project_id UUID NOT NULL REFERENCES client_projects(project_id),
        employee_id INTEGER NOT NULL REFERENCES employees(employee_id),
        
        -- Time Details
        entry_date DATE NOT NULL,
        hours DECIMAL(5,2) NOT NULL CHECK (hours >= 0 AND hours <= 24),
        billable BOOLEAN DEFAULT true,
        overtime BOOLEAN DEFAULT false,
        
        -- Activity
        activity_code VARCHAR(50), -- ADMIN, RESEARCH, MEETING, REVIEW, PREP, etc.
        task_description TEXT,
        work_location VARCHAR(50), -- Office, Client Site, Remote
        
        -- Status & Approval
        status VARCHAR(20) DEFAULT 'Draft', -- Draft, Submitted, Approved, Rejected, Billed, Locked
        submitted_at TIMESTAMP,
        approved_at TIMESTAMP,
        approved_by INTEGER REFERENCES employees(employee_id),
        rejection_reason TEXT,
        
        -- AI Features
        suggested_by_ai BOOLEAN DEFAULT false,
        ai_confidence_score DECIMAL(3,2), -- 0.00 - 1.00
        ai_evidence JSONB, -- Calendar events, emails, documents
        
        -- Billing
        billing_rate DECIMAL(10,2),
        billing_amount DECIMAL(10,2),
        invoiced_in_invoice_id INTEGER, -- Link to sales_invoices when billed
        
        -- Audit
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES employees(employee_id)
      )
    `);
    console.log('   ✅ time_entries table created');

    // ============================================================================
    // TABLE 4: CLIENT INTERACTIONS
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS client_interactions (
        interaction_id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        project_id UUID REFERENCES client_projects(project_id),
        
        -- Interaction Details
        interaction_type VARCHAR(50) NOT NULL, -- Email, Call, Meeting, Document, Site Visit
        interaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        employee_id INTEGER NOT NULL REFERENCES employees(employee_id),
        
        -- Content
        subject VARCHAR(200),
        summary TEXT,
        full_content TEXT,
        
        -- AI Analysis
        sentiment_score DECIMAL(3,2), -- -1.0 (negative) to 1.0 (positive)
        sentiment_label VARCHAR(20), -- Very Positive, Positive, Neutral, Negative, Very Negative
        key_topics VARCHAR(100)[],
        action_items TEXT[],
        urgency_level VARCHAR(10), -- Low, Medium, High
        
        -- Metadata
        duration_minutes INTEGER, -- For calls/meetings
        attendees VARCHAR(100)[], -- Other participants
        related_documents VARCHAR(200)[],
        
        -- Follow-up
        requires_followup BOOLEAN DEFAULT false,
        followup_date DATE,
        followup_completed BOOLEAN DEFAULT false,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES employees(employee_id)
      )
    `);
    console.log('   ✅ client_interactions table created');

    // ============================================================================
    // TABLE 5: CLIENT HEALTH LOG
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS client_health_log (
        log_id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        check_date DATE NOT NULL DEFAULT CURRENT_DATE,
        
        -- Overall Health
        health_score INTEGER NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
        health_grade VARCHAR(2), -- A+, A, B, C, D, F
        
        -- Component Scores
        financial_score INTEGER, -- Payment reliability, revenue trend, profitability
        engagement_score INTEGER, -- Interaction frequency, sentiment, project activity
        operational_score INTEGER, -- Delivery quality, scope changes, disputes
        
        -- Detailed Metrics
        factors JSONB NOT NULL, -- Detailed breakdown of calculations
        
        -- Predictions
        churn_risk VARCHAR(10), -- low, medium, high
        churn_probability DECIMAL(5,4), -- 0.0000 - 1.0000
        revenue_forecast_12m DECIMAL(15,2),
        
        -- Recommendations
        recommendations TEXT[],
        alert_level VARCHAR(10), -- None, Info, Warning, Critical
        recommended_actions JSONB,
        
        -- Tracking
        actioned BOOLEAN DEFAULT false,
        actioned_by INTEGER REFERENCES employees(employee_id),
        actioned_at TIMESTAMP,
        action_notes TEXT,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ client_health_log table created');

    // ============================================================================
    // TABLE 6: PROJECT TASKS
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_tasks (
        task_id SERIAL PRIMARY KEY,
        project_id UUID NOT NULL REFERENCES client_projects(project_id) ON DELETE CASCADE,
        parent_task_id INTEGER REFERENCES project_tasks(task_id),
        
        -- Task Details
        task_number VARCHAR(50),
        task_name VARCHAR(200) NOT NULL,
        description TEXT,
        task_type VARCHAR(50), -- Planning, Execution, Review, Admin
        
        -- Assignment
        assigned_to INTEGER REFERENCES employees(employee_id),
        assigned_date DATE,
        
        -- Schedule
        planned_start_date DATE,
        planned_end_date DATE,
        actual_start_date DATE,
        actual_end_date DATE,
        
        -- Effort
        estimated_hours DECIMAL(8,2),
        actual_hours DECIMAL(8,2) DEFAULT 0,
        
        -- Status
        status VARCHAR(20) DEFAULT 'Not Started', -- Not Started, In Progress, Blocked, Review, Completed
        completion_percentage INTEGER DEFAULT 0,
        priority VARCHAR(10) DEFAULT 'Medium',
        
        -- Dependencies
        dependencies INTEGER[], -- Array of task_ids this task depends on
        blocking_issues TEXT[],
        
        -- Quality
        requires_review BOOLEAN DEFAULT false,
        reviewed_by INTEGER REFERENCES employees(employee_id),
        reviewed_at TIMESTAMP,
        review_notes TEXT,
        
        -- AI Predictions
        predicted_completion_date DATE,
        risk_of_delay DECIMAL(5,4), -- 0.0000 - 1.0000
        bottleneck_likelihood VARCHAR(10), -- Low, Medium, High
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ project_tasks table created');

    // ============================================================================
    // TABLE 7: KNOWLEDGE BASE
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_base (
        kb_id SERIAL PRIMARY KEY,
        
        -- Content
        title VARCHAR(200) NOT NULL,
        content_type VARCHAR(50) NOT NULL, -- Best Practice, Template, Research, Case Study, Lesson Learned
        category VARCHAR(50), -- Technical, Process, Industry, Regulatory
        
        -- Document
        content TEXT NOT NULL,
        summary TEXT,
        tags VARCHAR(50)[],
        
        -- Context
        related_projects UUID[], -- Array of project_ids
        related_clients INTEGER[], -- Array of customer_ids
        industry VARCHAR(50),
        service_line VARCHAR(50),
        
        -- Search & Discovery
        search_vector tsvector, -- Full-text search
        -- embedding_vector VECTOR(1536), -- For AI similarity search (requires pgvector extension)
        
        -- Usage
        view_count INTEGER DEFAULT 0,
        helpful_count INTEGER DEFAULT 0,
        usage_count INTEGER DEFAULT 0,
        last_used_date DATE,
        
        -- Ownership
        created_by INTEGER REFERENCES employees(employee_id),
        expert_contributors INTEGER[], -- Array of employee_ids
        
        -- Metadata
        version INTEGER DEFAULT 1,
        status VARCHAR(20) DEFAULT 'Published', -- Draft, Under Review, Published, Archived
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ knowledge_base table created');

    // ============================================================================
    // TABLE 8: EMPLOYEE SKILLS & EXPERTISE
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS employee_skills (
        skill_id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(employee_id),
        
        -- Skill Details
        skill_name VARCHAR(100) NOT NULL,
        skill_category VARCHAR(50), -- Technical, Industry, Software, Language, Certification
        proficiency_level VARCHAR(20), -- Beginner, Intermediate, Advanced, Expert
        proficiency_score INTEGER CHECK (proficiency_score >= 0 AND proficiency_score <= 100),
        
        -- Validation
        years_experience DECIMAL(4,1),
        certified BOOLEAN DEFAULT false,
        certification_name VARCHAR(100),
        certification_date DATE,
        certification_expiry DATE,
        
        -- Usage & Development
        last_used_on_project UUID REFERENCES client_projects(project_id),
        last_used_date DATE,
        training_completed TEXT[],
        wants_to_develop BOOLEAN DEFAULT false,
        
        -- Endorsements
        endorsed_by INTEGER[], -- Array of employee_ids
        endorsement_count INTEGER DEFAULT 0,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(employee_id, skill_name)
      )
    `);
    console.log('   ✅ employee_skills table created');

    // ============================================================================
    // INDEXES FOR PERFORMANCE
    // ============================================================================
    
    // Client Projects
    await client.query('CREATE INDEX IF NOT EXISTS idx_client_projects_customer ON client_projects(customer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_client_projects_status ON client_projects(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_client_projects_manager ON client_projects(project_manager_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_client_projects_dates ON client_projects(start_date, target_end_date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_client_projects_type ON client_projects(project_type)');
    
    // Project Team
    await client.query('CREATE INDEX IF NOT EXISTS idx_project_team_project ON project_team_members(project_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_project_team_employee ON project_team_members(employee_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_project_team_active ON project_team_members(is_active)');
    
    // Time Entries
    await client.query('CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_time_entries_employee ON time_entries(employee_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(entry_date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_time_entries_status ON time_entries(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_time_entries_billable ON time_entries(billable)');
    
    // Client Interactions
    await client.query('CREATE INDEX IF NOT EXISTS idx_client_interactions_customer ON client_interactions(customer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_client_interactions_project ON client_interactions(project_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_client_interactions_date ON client_interactions(interaction_date DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_client_interactions_type ON client_interactions(interaction_type)');
    
    // Client Health
    await client.query('CREATE INDEX IF NOT EXISTS idx_client_health_customer ON client_health_log(customer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_client_health_date ON client_health_log(check_date DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_client_health_score ON client_health_log(health_score)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_client_health_risk ON client_health_log(churn_risk)');
    
    // Tasks
    await client.query('CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON project_tasks(project_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned ON project_tasks(assigned_to)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks(status)');
    
    // Knowledge Base
    await client.query('CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_base(category)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_knowledge_type ON knowledge_base(content_type)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON knowledge_base USING GIN(tags)');
    
    // Skills
    await client.query('CREATE INDEX IF NOT EXISTS idx_employee_skills_employee ON employee_skills(employee_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_employee_skills_name ON employee_skills(skill_name)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_employee_skills_category ON employee_skills(skill_category)');
    
    console.log('   📇 Created 30+ indexes for performance');

    // ============================================================================
    // VIEWS FOR REPORTING
    // ============================================================================
    
    // View 1: Project Health Dashboard
    await client.query(`
      CREATE OR REPLACE VIEW v_project_health AS
      SELECT 
        cp.project_id,
        cp.project_number,
        cp.project_name,
        cp.customer_id,
        c.customer_name,
        cp.project_type,
        cp.status,
        cp.budget_hours,
        cp.actual_hours,
        CASE 
          WHEN cp.budget_hours > 0 THEN ROUND((cp.actual_hours / cp.budget_hours * 100)::numeric, 1)
          ELSE 0 
        END as hours_utilization_percentage,
        cp.budget_amount,
        cp.actual_cost,
        cp.billed_amount,
        CASE 
          WHEN cp.billed_amount > 0 THEN ROUND(((cp.billed_amount - cp.actual_cost) / cp.billed_amount * 100)::numeric, 1)
          ELSE 0
        END as profit_margin_percentage,
        cp.completion_percentage,
        cp.target_end_date,
        CASE 
          WHEN cp.target_end_date < CURRENT_DATE AND cp.status NOT IN ('Completed', 'Cancelled') 
          THEN 'Overdue'
          WHEN cp.actual_hours > cp.budget_hours * 0.9 AND cp.completion_percentage < 90 
          THEN 'At Risk'
          ELSE 'On Track'
        END as health_status,
        pm.first_name || ' ' || pm.last_name as project_manager,
        (SELECT COUNT(*) FROM project_team_members WHERE project_id = cp.project_id AND is_active = true) as team_size
      FROM client_projects cp
      JOIN customers c ON cp.customer_id = c.id
      LEFT JOIN employees pm ON cp.project_manager_id = pm.employee_id
    `);
    console.log('   👁️  v_project_health view created');

    // View 2: Client 360 View
    await client.query(`
      CREATE OR REPLACE VIEW v_client_360 AS
      SELECT 
        c.id,
        c.customer_name,
        c.health_score,
        c.churn_risk,
        c.service_tier,
        rm.first_name || ' ' || rm.last_name as relationship_manager,
        
        -- Financial Metrics
        COALESCE(SUM(si.total_amount), 0) as total_revenue_ytd,
        COALESCE(SUM(CASE WHEN si.status = 'Unpaid' THEN si.total_amount ELSE 0 END), 0) as outstanding_balance,
        
        -- Project Metrics
        COUNT(DISTINCT cp.project_id) as total_projects,
        COUNT(DISTINCT CASE WHEN cp.status = 'Active' THEN cp.project_id END) as active_projects,
        COUNT(DISTINCT CASE WHEN cp.status = 'Completed' THEN cp.project_id END) as completed_projects,
        
        -- Interaction Metrics
        COUNT(DISTINCT ci.interaction_id) as total_interactions,
        MAX(ci.interaction_date) as last_interaction_date,
        AVG(ci.sentiment_score) as avg_sentiment_score,
        
        -- Time Metrics
        COALESCE(SUM(te.hours), 0) as total_hours_worked
        
      FROM customers c
      LEFT JOIN employees rm ON c.relationship_manager_id = rm.employee_id
      LEFT JOIN sales_invoices si ON c.id = si.customer_id 
        AND si.invoice_date >= DATE_TRUNC('year', CURRENT_DATE)
      LEFT JOIN client_projects cp ON c.id = cp.customer_id
      LEFT JOIN client_interactions ci ON c.id = ci.customer_id
        AND ci.interaction_date >= CURRENT_DATE - INTERVAL '90 days'
      LEFT JOIN time_entries te ON cp.project_id = te.project_id
        AND te.entry_date >= DATE_TRUNC('year', CURRENT_DATE)
      GROUP BY c.id, c.customer_name, c.health_score, c.churn_risk, 
               c.service_tier, rm.first_name, rm.last_name
    `);
    console.log('   👁️  v_client_360 view created');

    // View 3: Employee Utilization
    await client.query(`
      CREATE OR REPLACE VIEW v_employee_utilization AS
      SELECT 
        e.employee_id,
        e.employee_number,
        e.first_name || ' ' || e.last_name as employee_name,
        d.department_name,
        p.position_title,
        
        -- Current Month
        COALESCE(SUM(CASE 
          WHEN te.entry_date >= DATE_TRUNC('month', CURRENT_DATE) 
          AND te.billable = true 
          THEN te.hours ELSE 0 
        END), 0) as billable_hours_this_month,
        COALESCE(SUM(CASE 
          WHEN te.entry_date >= DATE_TRUNC('month', CURRENT_DATE) 
          THEN te.hours ELSE 0 
        END), 0) as total_hours_this_month,
        
        -- Active Projects
        COUNT(DISTINCT ptm.project_id) as active_projects,
        
        -- Allocated vs Actual
        COALESCE(SUM(ptm.allocated_hours), 0) as allocated_hours,
        COALESCE(SUM(ptm.actual_hours), 0) as actual_hours,
        
        -- Utilization Rate
        CASE 
          WHEN SUM(ptm.allocated_hours) > 0 
          THEN ROUND((SUM(ptm.actual_hours) / SUM(ptm.allocated_hours) * 100)::numeric, 1)
          ELSE 0 
        END as utilization_rate
        
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.department_id
      LEFT JOIN positions p ON e.position_id = p.position_id
      LEFT JOIN time_entries te ON e.employee_id = te.employee_id
      LEFT JOIN project_team_members ptm ON e.employee_id = ptm.employee_id 
        AND ptm.is_active = true
      WHERE e.employment_status = 'Active'
      GROUP BY e.employee_id, e.employee_number, e.first_name, e.last_name, 
               d.department_name, p.position_title
    `);
    console.log('   👁️  v_employee_utilization view created');

    await client.query('COMMIT');
    console.log('✅ Practice Management Integration migration completed successfully!');
    console.log('   📊 8 new tables created');
    console.log('   📇 30+ indexes created');
    console.log('   👁️  3 views created');
    console.log('   🔗 Extended customers table with practice fields');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Practice Management Integration migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}
