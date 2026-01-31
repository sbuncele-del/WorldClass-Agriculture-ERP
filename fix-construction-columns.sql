-- Add missing columns to construction_projects

ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS project_type VARCHAR(100);
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS expected_end_date DATE;
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS contract_value DECIMAL(15,2);
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS completion_percentage DECIMAL(5,2) DEFAULT 0;
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS site_address TEXT;
ALTER TABLE construction_projects ADD COLUMN IF NOT EXISTS project_manager VARCHAR(255);

-- Add missing columns to intercompany_transactions
ALTER TABLE intercompany_transactions ADD COLUMN IF NOT EXISTS from_entity_id UUID;
ALTER TABLE intercompany_transactions ADD COLUMN IF NOT EXISTS to_entity_id UUID;
ALTER TABLE intercompany_transactions ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(50);
ALTER TABLE intercompany_transactions ADD COLUMN IF NOT EXISTS amount DECIMAL(15,2);
ALTER TABLE intercompany_transactions ADD COLUMN IF NOT EXISTS transaction_date DATE;

-- Make sure project_tasks table exists with proper structure
CREATE TABLE IF NOT EXISTS project_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    project_id UUID,
    task_name VARCHAR(255),
    description TEXT,
    status VARCHAR(30) DEFAULT 'todo',
    priority VARCHAR(30) DEFAULT 'medium',
    assignee_id UUID,
    due_date DATE,
    estimated_hours DECIMAL(10,2),
    actual_hours DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_tasks_tenant ON project_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON project_tasks(project_id);

SELECT 'Construction and project columns added' as status;
