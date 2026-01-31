-- ================================================
-- AI Agents Module
-- ================================================
-- AI-powered assistants for each ERP module
-- Tables: 8
-- ================================================

-- AI Agent Definitions
CREATE TABLE IF NOT EXISTS ai_agents (
    agent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_code VARCHAR(50) UNIQUE NOT NULL,
    agent_name VARCHAR(255) NOT NULL,
    agent_description TEXT,
    module_name VARCHAR(100) NOT NULL, -- Sales, Purchase, Finance, HR, Compliance, etc.
    system_prompt TEXT NOT NULL, -- Base instructions for the agent
    capabilities JSONB NOT NULL, -- List of what agent can do
    model_name VARCHAR(100) DEFAULT 'gpt-4', -- AI model to use
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_agents_module ON ai_agents(module_name);

-- AI Conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
    conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    agent_id UUID NOT NULL REFERENCES ai_agents(agent_id),
    user_id UUID NOT NULL,
    conversation_title VARCHAR(255),
    context_data JSONB DEFAULT '{}', -- Relevant data for conversation
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT false
);

CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_agent ON ai_conversations(agent_id);

-- AI Messages
CREATE TABLE IF NOT EXISTS ai_messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(conversation_id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- USER, ASSISTANT, SYSTEM
    content TEXT NOT NULL,
    tokens_used INTEGER,
    function_calls JSONB, -- Any functions/actions executed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created ON ai_messages(created_at);

-- AI Actions/Tools
CREATE TABLE IF NOT EXISTS ai_agent_actions (
    action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(agent_id),
    action_code VARCHAR(50) NOT NULL,
    action_name VARCHAR(255) NOT NULL,
    action_description TEXT,
    function_definition JSONB NOT NULL, -- OpenAI function format
    endpoint_url VARCHAR(500), -- API endpoint to call
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_ai_agent_actions_agent ON ai_agent_actions(agent_id);

-- AI Suggestions (Proactive recommendations)
CREATE TABLE IF NOT EXISTS ai_suggestions (
    suggestion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    agent_id UUID NOT NULL REFERENCES ai_agents(agent_id),
    user_id UUID,
    suggestion_type VARCHAR(100) NOT NULL, -- ALERT, OPPORTUNITY, OPTIMIZATION
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    action_url VARCHAR(500), -- Link to take action
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, VIEWED, ACTIONED, DISMISSED
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_suggestions_user ON ai_suggestions(user_id);
CREATE INDEX idx_ai_suggestions_status ON ai_suggestions(status);

-- AI Learning (Track what works)
CREATE TABLE IF NOT EXISTS ai_learning_data (
    learning_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(agent_id),
    interaction_type VARCHAR(100) NOT NULL,
    user_feedback VARCHAR(20), -- POSITIVE, NEGATIVE, NEUTRAL
    context_data JSONB,
    outcome_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_learning_agent ON ai_learning_data(agent_id);

-- AI Usage Analytics
CREATE TABLE IF NOT EXISTS ai_usage_analytics (
    analytics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    agent_id UUID NOT NULL REFERENCES ai_agents(agent_id),
    usage_date DATE NOT NULL,
    total_conversations INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER
);

CREATE INDEX idx_ai_usage_tenant ON ai_usage_analytics(tenant_id);
CREATE INDEX idx_ai_usage_date ON ai_usage_analytics(usage_date);

-- AI Configuration
CREATE TABLE IF NOT EXISTS ai_configuration (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    api_provider VARCHAR(50) NOT NULL, -- OPENAI, ANTHROPIC, CUSTOM
    api_key_encrypted TEXT,
    default_model VARCHAR(100),
    monthly_token_limit BIGINT,
    current_usage BIGINT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- PRE-POPULATED AI AGENTS
-- ================================================

INSERT INTO ai_agents (agent_code, agent_name, agent_description, module_name, system_prompt, capabilities) VALUES

-- Sales Assistant
('SALES_ASSISTANT', 'Sales Assistant', 'AI helper for sales operations', 'Sales',
'You are a sales assistant for an ERP system. You help with quotations, customer insights, sales forecasting, and deal management. Be professional, data-driven, and focused on closing deals.',
'["Create quotations", "Analyze customer history", "Forecast revenue", "Suggest upsell opportunities", "Check inventory availability", "Generate sales reports"]'),

-- Procurement Assistant
('PROCUREMENT_ASSISTANT', 'Procurement Assistant', 'AI helper for purchasing', 'Purchase',
'You are a procurement specialist. Help optimize purchase orders, find cost savings, manage suppliers, and ensure timely procurement. Focus on cost efficiency and quality.',
'["Optimize purchase orders", "Compare supplier prices", "Track deliveries", "Suggest reorder points", "Analyze spending patterns", "Generate PO reports"]'),

-- Finance Assistant
('FINANCE_ASSISTANT', 'Finance Assistant', 'AI helper for accounting and finance', 'Financial',
'You are a financial controller assistant. Help with reconciliations, financial analysis, reporting, and compliance. Ensure accuracy and adherence to accounting standards.',
'["Reconcile accounts", "Analyze financial statements", "Generate reports", "Explain variances", "Suggest cost optimizations", "Monitor cash flow"]'),

-- HR Assistant
('HR_ASSISTANT', 'HR Assistant', 'AI helper for human resources', 'HR',
'You are an HR business partner. Assist with employee onboarding, payroll questions, leave management, and compliance. Be empathetic and policy-compliant.',
'["Onboard employees", "Calculate payroll", "Manage leave requests", "Answer HR policies", "Track performance", "Generate HR reports"]'),

-- Compliance Assistant
('COMPLIANCE_ASSISTANT', 'Compliance Assistant', 'AI helper for regulatory compliance', 'Compliance',
'You are a compliance officer. Monitor regulatory requirements, assess risks, track deadlines, and ensure adherence to South African regulations including SARS, POPIA, King IV.',
'["Track SARS deadlines", "Assess compliance risks", "Monitor policy acknowledgments", "Generate compliance reports", "Suggest mitigation actions", "Alert on overdue items"]'),

-- Analytics Assistant
('ANALYTICS_ASSISTANT', 'Analytics Assistant', 'AI helper for data analytics', 'Reports',
'You are a business intelligence analyst. Help users understand their data, create insights, build reports, and make data-driven decisions.',
'["Analyze trends", "Create custom reports", "Explain KPIs", "Suggest metrics", "Identify anomalies", "Generate dashboards"]'),

-- Treasury Assistant
('TREASURY_ASSISTANT', 'Treasury Assistant', 'AI helper for treasury management', 'Treasury',
'You are a treasury specialist. Help optimize cash positions, manage investments, forecast cash flow, and handle FX exposure.',
'["Forecast cash flow", "Optimize liquidity", "Analyze investments", "Monitor FX rates", "Suggest payment timing", "Generate treasury reports"]'),

-- Inventory Assistant
('INVENTORY_ASSISTANT', 'Inventory Assistant', 'AI helper for inventory management', 'Inventory',
'You are an inventory optimization specialist. Help manage stock levels, prevent stockouts, reduce carrying costs, and optimize warehouse operations.',
'["Optimize stock levels", "Forecast demand", "Suggest reorder points", "Track inventory turns", "Identify slow movers", "Generate stock reports"]'),

-- Logistics Assistant
('LOGISTICS_ASSISTANT', 'Logistics Assistant', 'AI helper for logistics', 'Logistics',
'You are a logistics coordinator. Help optimize delivery routes, track shipments, manage fleet, and ensure timely deliveries.',
'["Optimize routes", "Track shipments", "Monitor fleet", "Calculate costs", "Suggest improvements", "Generate logistics reports"]');

-- ================================================
-- SAMPLE AI ACTIONS FOR SALES ASSISTANT
-- ================================================

INSERT INTO ai_agent_actions (agent_id, action_code, action_name, action_description, function_definition, endpoint_url) VALUES
(
    (SELECT agent_id FROM ai_agents WHERE agent_code = 'SALES_ASSISTANT'),
    'CREATE_QUOTATION',
    'Create Sales Quotation',
    'Generate a new sales quotation for a customer',
    '{"name": "create_quotation", "description": "Create a sales quotation", "parameters": {"type": "object", "properties": {"customer_id": {"type": "string"}, "items": {"type": "array"}, "valid_days": {"type": "number"}}, "required": ["customer_id", "items"]}}',
    '/api/sales/quotations'
),
(
    (SELECT agent_id FROM ai_agents WHERE agent_code = 'SALES_ASSISTANT'),
    'GET_CUSTOMER_HISTORY',
    'Get Customer Purchase History',
    'Retrieve customer''s past orders and spending',
    '{"name": "get_customer_history", "description": "Get customer purchase history", "parameters": {"type": "object", "properties": {"customer_id": {"type": "string"}}, "required": ["customer_id"]}}',
    '/api/sales/customers/:id/history'
);

-- ================================================
-- COMPLETION
-- ================================================

DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'AI Agents Module Schema Created!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Tables: 8';
    RAISE NOTICE '  - ai_agents (agent definitions)';
    RAISE NOTICE '  - ai_conversations (chat sessions)';
    RAISE NOTICE '  - ai_messages (conversation history)';
    RAISE NOTICE '  - ai_agent_actions (available tools)';
    RAISE NOTICE '  - ai_suggestions (proactive insights)';
    RAISE NOTICE '  - ai_learning_data (feedback tracking)';
    RAISE NOTICE '  - ai_usage_analytics (usage metrics)';
    RAISE NOTICE '  - ai_configuration (API settings)';
    RAISE NOTICE '';
    RAISE NOTICE 'AI Agents Pre-configured: 9';
    RAISE NOTICE '  - Sales Assistant';
    RAISE NOTICE '  - Procurement Assistant';
    RAISE NOTICE '  - Finance Assistant';
    RAISE NOTICE '  - HR Assistant';
    RAISE NOTICE '  - Compliance Assistant';
    RAISE NOTICE '  - Analytics Assistant';
    RAISE NOTICE '  - Treasury Assistant';
    RAISE NOTICE '  - Inventory Assistant';
    RAISE NOTICE '  - Logistics Assistant';
    RAISE NOTICE '==================================================';
END $$;
