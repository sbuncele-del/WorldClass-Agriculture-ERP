-- AI Learning System Database Migration
-- SiyaBusa ERP - Machine Learning for AI Assistant
-- This enables the AI to learn and improve over time

-- ============================================================================
-- AI CONVERSATIONS (Learning from every interaction)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_conversations (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  session_id VARCHAR(100) NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  was_helpful BOOLEAN,
  feedback TEXT,
  topic_category VARCHAR(100),
  action_taken VARCHAR(200),
  response_time_ms INTEGER,
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ai_conversations_tenant ON ai_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_category ON ai_conversations(topic_category);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_helpful ON ai_conversations(was_helpful);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created ON ai_conversations(created_at DESC);

-- ============================================================================
-- AI LEARNED PATTERNS (Successful response patterns)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_learned_patterns (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(100) NOT NULL,
  pattern TEXT NOT NULL,
  response_template TEXT NOT NULL,
  category VARCHAR(100),
  confidence_score DECIMAL(5,4) DEFAULT 0.5,
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,4) DEFAULT 0.5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_patterns_tenant ON ai_learned_patterns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_patterns_confidence ON ai_learned_patterns(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_patterns_category ON ai_learned_patterns(category);

-- ============================================================================
-- AI FAQ (Frequently Asked Questions learned from conversations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_faq (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(100),  -- NULL means global FAQ
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100),
  helpful_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_faq_tenant ON ai_faq(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_faq_featured ON ai_faq(is_featured);
CREATE INDEX IF NOT EXISTS idx_ai_faq_category ON ai_faq(category);

-- ============================================================================
-- AI USER PREFERENCES (Personalization)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_user_preferences (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  preferred_response_style VARCHAR(50) DEFAULT 'detailed',
  preferred_language VARCHAR(10) DEFAULT 'en',
  common_topics TEXT[],
  last_context JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_user_prefs_user ON ai_user_preferences(tenant_id, user_id);

-- ============================================================================
-- SEED INITIAL FAQs (Global, helpful for all tenants)
-- ============================================================================
INSERT INTO ai_faq (tenant_id, question, answer, category, is_featured) VALUES
(NULL, 'How do I create an invoice?', 'Go to Sales Hub → New Invoice. Select your customer, add line items with quantities and prices, review the totals including VAT, then click Save or Save & Send to email it directly to your customer.', 'sales', true),

(NULL, 'How do I reconcile my bank account?', 'Go to Banking Hub → Reconciliation. Import your bank statement (CSV or OFX format), then match each bank transaction to your recorded transactions. The system will auto-match where possible. Confirm the reconciliation once all items are matched.', 'banking', true),

(NULL, 'How do I process payroll?', 'Go to HR Hub → Payroll → Run Payroll. Select the pay period, review each employee''s earnings and deductions (including PAYE, UIF, and SDL), approve the calculations, then process. The system will generate payslips and a bank payment file.', 'hr', true),

(NULL, 'When is my VAT return due?', 'VAT returns are due by the 25th of the month following your VAT period. For example, if your VAT period ends on 31 May, your return is due by 25 June. Go to SARS Sentinel to see your upcoming deadlines and prepare your return.', 'compliance', true),

(NULL, 'How do I check my cash position?', 'Go to Cash Management for a real-time view of your cash across all bank accounts, plus pending receivables (money owed to you) and payables (money you owe). The dashboard shows your net cash position and forecast.', 'banking', true),

(NULL, 'How do I add a new employee?', 'Go to HR Hub → Employees → Add Employee. Enter their personal details, tax number, salary or hourly rate, bank details for payment, and start date. The system will automatically calculate their PAYE, UIF, and other statutory deductions.', 'hr', true),

(NULL, 'What is a journal entry?', 'A journal entry is an accounting record that records a financial transaction. It has two sides: debits and credits, which must balance. Journal entries are used for adjustments, corrections, and transactions that don''t fit standard documents like invoices.', 'financial', true),

(NULL, 'How do I check stock levels?', 'Go to Inventory Hub to see all your products with current stock quantities. You can filter by category, warehouse, or search for specific items. Click on any product to see detailed stock movements and locations.', 'inventory', true),

(NULL, 'How do I create a purchase order?', 'Go to Purchase Hub → New PO. Select your supplier, add the items you want to order with quantities and agreed prices, then send the PO to your supplier. When goods arrive, use Receive Goods to record receipt.', 'purchase', true),

(NULL, 'How do I run a trial balance?', 'Go to Financial Hub → Reports → Trial Balance. Select the date and any filters (like cost center), then click Generate. The trial balance shows all account balances and verifies that your debits equal credits.', 'financial', true),

(NULL, 'What is PAYE?', 'PAYE (Pay As You Earn) is income tax deducted from employee salaries and paid to SARS monthly. The system calculates PAYE automatically based on tax tables. You submit the monthly EMP201 through SARS Sentinel.', 'compliance', false),

(NULL, 'What is UIF?', 'UIF (Unemployment Insurance Fund) is a contribution for unemployment benefits. Both employer and employee contribute 1% of salary (2% total), capped at a maximum threshold. It''s reported monthly to SARS on the EMP201.', 'compliance', false),

(NULL, 'How do I close the month?', 'Complete these steps: 1) Ensure all transactions are recorded, 2) Import and reconcile bank statements, 3) Run depreciation on assets, 4) Review accruals and prepayments, 5) Run trial balance and fix any errors, 6) Generate financial statements, 7) Close the period in Financial Hub → Period Close.', 'financial', true),

(NULL, 'How do I track project costs?', 'Go to Projects Hub, select your project, and view the Costs tab. You can see all costs allocated to the project including labour (from timesheets), materials (from purchases), and other expenses. Compare actual vs budget.', 'projects', false),

(NULL, 'How do I set up a new customer?', 'Go to Sales Hub → Customers → Add Customer. Enter their company name, contact details, billing address, VAT number (if registered), payment terms, and credit limit if you extend credit.', 'sales', false)

ON CONFLICT DO NOTHING;

-- ============================================================================
-- FUNCTION: Auto-generate FAQs from conversations
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_faqs_from_conversations(p_tenant_id VARCHAR)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_row RECORD;
BEGIN
  -- Find frequently asked, helpful questions
  FOR v_row IN 
    SELECT user_message, ai_response, topic_category, COUNT(*) as frequency
    FROM ai_conversations
    WHERE tenant_id = p_tenant_id 
    AND was_helpful = true
    AND user_message IS NOT NULL
    AND ai_response IS NOT NULL
    GROUP BY user_message, ai_response, topic_category
    HAVING COUNT(*) >= 3
    ORDER BY COUNT(*) DESC
    LIMIT 20
  LOOP
    -- Insert or update FAQ
    INSERT INTO ai_faq (tenant_id, question, answer, category, helpful_count, total_count, is_featured)
    VALUES (
      p_tenant_id, 
      v_row.user_message, 
      v_row.ai_response, 
      v_row.topic_category,
      v_row.frequency,
      v_row.frequency,
      v_row.frequency >= 10
    )
    ON CONFLICT (tenant_id, question) WHERE tenant_id IS NOT NULL
    DO UPDATE SET 
      answer = EXCLUDED.answer,
      helpful_count = EXCLUDED.helpful_count,
      total_count = EXCLUDED.total_count,
      is_featured = EXCLUDED.is_featured,
      updated_at = CURRENT_TIMESTAMP;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEW: AI Learning Analytics
-- ============================================================================
CREATE OR REPLACE VIEW ai_analytics_summary AS
SELECT 
  tenant_id,
  COUNT(*) as total_conversations,
  COUNT(*) FILTER (WHERE was_helpful = true) as helpful_count,
  COUNT(*) FILTER (WHERE was_helpful = false) as unhelpful_count,
  COUNT(*) FILTER (WHERE was_helpful IS NULL) as unrated_count,
  ROUND(
    CASE 
      WHEN COUNT(*) FILTER (WHERE was_helpful IS NOT NULL) > 0 
      THEN (COUNT(*) FILTER (WHERE was_helpful = true)::DECIMAL / 
            COUNT(*) FILTER (WHERE was_helpful IS NOT NULL) * 100)
      ELSE 0 
    END, 1
  ) as helpful_percentage,
  COUNT(DISTINCT topic_category) as categories_used,
  COUNT(DISTINCT user_id) as unique_users,
  MAX(created_at) as last_conversation
FROM ai_conversations
GROUP BY tenant_id;

COMMENT ON TABLE ai_conversations IS 'Stores all AI assistant conversations for learning and analytics';
COMMENT ON TABLE ai_learned_patterns IS 'Stores successful response patterns learned from user feedback';
COMMENT ON TABLE ai_faq IS 'Frequently asked questions generated from conversations';
COMMENT ON TABLE ai_user_preferences IS 'User preferences for personalized AI responses';

SELECT 'AI Learning tables created successfully!' as status;
