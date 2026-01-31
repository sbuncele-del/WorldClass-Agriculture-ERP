# AI Agents Module - Complete Documentation

## Overview
The AI Agents module adds intelligent assistants to every module of the Worldclass ERP system. Each assistant is context-aware, module-specific, and powered by OpenAI (GPT-4) or Anthropic (Claude).

## Architecture

### Components
1. **Database Schema** (`018_ai_agents_module.sql`)
   - 8 tables for AI infrastructure
   - 9 pre-configured agents
   - Sample actions for Sales Assistant

2. **AI Service** (`ai-agent.service.ts`)
   - Core AI logic and conversation management
   - OpenAI/Anthropic integration
   - Usage tracking and analytics

3. **Controller** (`ai-assistant.controller.ts`)
   - REST API endpoints
   - Module-specific helper functions
   - Streaming support

4. **Routes** (`ai-assistant.routes.ts`)
   - 20+ API endpoints
   - Authentication middleware
   - Module-specific routes

## Pre-configured AI Agents

### 1. Sales Assistant (`SALES_ASSISTANT`)
**Purpose**: Help with sales operations, quotations, and customer insights

**Capabilities**:
- Create quotations
- Analyze customer history
- Forecast revenue
- Suggest upsell opportunities
- Check inventory availability
- Generate sales reports

**Specific Endpoints**:
```bash
POST /api/ai/sales/analyze-customer/:customerId
POST /api/ai/sales/generate-quotation
GET /api/ai/sales/forecast?period=month
```

**Example Usage**:
```javascript
// Analyze customer for upsell
const response = await fetch('/api/ai/sales/analyze-customer/cust-123', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <token>' }
});

// Generate quotation with AI
const quotation = await fetch('/api/ai/sales/generate-quotation', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <token>', 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerId: 'cust-123',
    items: [
      { productId: 'prod-456', quantity: 10 },
      { productId: 'prod-789', quantity: 5 }
    ]
  })
});
```

### 2. Procurement Assistant (`PROCUREMENT_ASSISTANT`)
**Purpose**: Optimize purchasing and supplier management

**Capabilities**:
- Optimize purchase orders
- Compare supplier prices
- Track deliveries
- Suggest reorder points
- Analyze spending patterns
- Generate PO reports

**Example Chat**:
```javascript
const response = await fetch('/api/ai/agents/PROCUREMENT_ASSISTANT/chat', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <token>', 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Which supplier should I use for office supplies? I need 100 reams of paper.',
    contextData: { category: 'office_supplies' }
  })
});
```

### 3. Finance Assistant (`FINANCE_ASSISTANT`)
**Purpose**: Financial analysis and accounting support

**Capabilities**:
- Reconcile accounts
- Analyze financial statements
- Generate reports
- Explain variances
- Suggest cost optimizations
- Monitor cash flow

**Specific Endpoints**:
```bash
GET /api/ai/finance/explain-variance?accountCode=1000&period=2024-01
POST /api/ai/finance/reconcile/:accountCode
```

**Example Usage**:
```javascript
// Explain variance
const variance = await fetch('/api/ai/finance/explain-variance?accountCode=4000&period=2024-01', {
  headers: { 'Authorization': 'Bearer <token>' }
});

// Reconcile account
const reconciliation = await fetch('/api/ai/finance/reconcile/1000', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <token>' }
});
```

### 4. HR Assistant (`HR_ASSISTANT`)
**Purpose**: Human resources and payroll support

**Capabilities**:
- Onboard employees
- Calculate payroll
- Manage leave requests
- Answer HR policies
- Track performance
- Generate HR reports

**Example Chat**:
```javascript
const response = await fetch('/api/ai/agents/HR_ASSISTANT/chat', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <token>', 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'How many days of annual leave does an employee with 3 years service get?'
  })
});
```

### 5. Compliance Assistant (`COMPLIANCE_ASSISTANT`)
**Purpose**: Regulatory compliance and risk management

**Capabilities**:
- Track SARS deadlines
- Assess compliance risks
- Monitor policy acknowledgments
- Generate compliance reports
- Suggest mitigation actions
- Alert on overdue items

**Specific Endpoints**:
```bash
GET /api/ai/compliance/check
GET /api/ai/compliance/assess-risk?area=financial
```

**Example Usage**:
```javascript
// Check compliance status
const status = await fetch('/api/ai/compliance/check', {
  headers: { 'Authorization': 'Bearer <token>' }
});

// Assess risks
const risks = await fetch('/api/ai/compliance/assess-risk?area=regulatory', {
  headers: { 'Authorization': 'Bearer <token>' }
});
```

### 6. Analytics Assistant (`ANALYTICS_ASSISTANT`)
**Purpose**: Business intelligence and data insights

**Capabilities**:
- Analyze trends
- Create custom reports
- Explain KPIs
- Suggest metrics
- Identify anomalies
- Generate dashboards

**Example Chat**:
```javascript
const response = await fetch('/api/ai/agents/ANALYTICS_ASSISTANT/chat', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <token>', 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Show me sales trends for Q4 2023 and predict Q1 2024'
  })
});
```

### 7. Treasury Assistant (`TREASURY_ASSISTANT`)
**Purpose**: Cash management and treasury operations

**Capabilities**:
- Forecast cash flow
- Optimize liquidity
- Analyze investments
- Monitor FX rates
- Suggest payment timing
- Generate treasury reports

**Example Chat**:
```javascript
const response = await fetch('/api/ai/agents/TREASURY_ASSISTANT/chat', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <token>', 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Should I convert USD to ZAR today or wait? I have $50,000 to convert.'
  })
});
```

### 8. Inventory Assistant (`INVENTORY_ASSISTANT`)
**Purpose**: Stock optimization and warehouse management

**Capabilities**:
- Optimize stock levels
- Forecast demand
- Suggest reorder points
- Track inventory turns
- Identify slow movers
- Generate stock reports

### 9. Logistics Assistant (`LOGISTICS_ASSISTANT`)
**Purpose**: Delivery and fleet management

**Capabilities**:
- Optimize routes
- Track shipments
- Monitor fleet
- Calculate costs
- Suggest improvements
- Generate logistics reports

## General API Endpoints

### List All Agents
```bash
GET /api/ai/agents
```
Returns all available AI agents with their capabilities.

### Get Agent Details
```bash
GET /api/ai/agents/:agentCode
```
Get specific agent configuration and system prompt.

### Chat with Agent
```bash
POST /api/ai/agents/:agentCode/chat
```
**Body**:
```json
{
  "message": "Your question or request",
  "contextData": {
    "customerId": "optional-context",
    "orderId": "optional-context"
  }
}
```

**Response**:
```json
{
  "response": "AI assistant's response",
  "conversationId": "uuid-of-conversation"
}
```

### Stream Chat (Real-time)
```bash
POST /api/ai/agents/:agentCode/stream
```
Returns Server-Sent Events (SSE) for real-time streaming response.

**Example Usage**:
```javascript
const eventSource = new EventSource('/api/ai/agents/SALES_ASSISTANT/stream', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <token>' },
  body: JSON.stringify({ message: 'Create a quotation for customer XYZ' })
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.content) {
    console.log(data.content); // Stream content chunk by chunk
  }
};
```

### Get Conversations
```bash
GET /api/ai/conversations?includeArchived=false
```
List user's conversation history with all agents.

### Get Conversation History
```bash
GET /api/ai/conversations/:conversationId/history?limit=50
```
Retrieve messages from a specific conversation.

### Archive Conversation
```bash
POST /api/ai/conversations/:conversationId/archive
```
Archive a conversation (removes from active list).

## AI Suggestions (Proactive Insights)

The system can generate proactive suggestions that appear in the user's notification center.

### Get Suggestions
```bash
GET /api/ai/suggestions
```
Returns pending AI-generated suggestions for the user.

**Response Example**:
```json
[
  {
    "suggestion_id": "uuid",
    "agent_name": "Sales Assistant",
    "suggestion_type": "OPPORTUNITY",
    "title": "Upsell Opportunity",
    "description": "Customer ABC Corp hasn't ordered Product X in 6 months. They historically order this quarterly.",
    "action_url": "/sales/customers/abc-corp",
    "priority": "MEDIUM",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### Update Suggestion Status
```bash
PATCH /api/ai/suggestions/:suggestionId
```
**Body**:
```json
{
  "status": "VIEWED" | "ACTIONED" | "DISMISSED"
}
```

## Environment Configuration

Add these environment variables to `.env`:

```bash
# AI Provider (choose one or both)
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Default model (optional, defaults to gpt-4)
AI_DEFAULT_MODEL=gpt-4

# Token limits (optional)
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
```

## Database Tables

### ai_agents
Stores agent definitions (9 pre-configured).

**Key Columns**:
- `agent_code`: Unique identifier (e.g., 'SALES_ASSISTANT')
- `agent_name`: Display name
- `module_name`: Associated ERP module
- `system_prompt`: AI instructions
- `capabilities`: JSON array of features
- `model_name`: AI model to use

### ai_conversations
Stores conversation sessions between users and agents.

**Key Columns**:
- `conversation_id`: UUID
- `tenant_id`, `user_id`: Multi-tenant support
- `agent_id`: Which agent
- `context_data`: Relevant data (customer ID, order ID, etc.)
- `is_archived`: Active or archived

### ai_messages
Stores individual messages in conversations.

**Key Columns**:
- `conversation_id`: Parent conversation
- `role`: 'USER', 'ASSISTANT', 'SYSTEM'
- `content`: Message text
- `tokens_used`: For billing/tracking
- `function_calls`: If agent executed actions

### ai_suggestions
Proactive AI-generated insights.

**Key Columns**:
- `suggestion_type`: 'ALERT', 'OPPORTUNITY', 'OPTIMIZATION'
- `priority`: 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
- `status`: 'PENDING', 'VIEWED', 'ACTIONED', 'DISMISSED'
- `expires_at`: Optional expiration

### ai_usage_analytics
Daily usage tracking per tenant/agent.

**Key Columns**:
- `usage_date`: Date
- `total_conversations`, `total_messages`: Counts
- `total_tokens`: Token usage
- `unique_users`: Active users

## Usage Examples

### React/TypeScript Frontend Example

```typescript
import { useState } from 'react';

function ChatWithSalesAssistant() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);

  const sendMessage = async () => {
    const response = await fetch('/api/ai/agents/SALES_ASSISTANT/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    
    setConversation([
      ...conversation,
      { role: 'user', content: message },
      { role: 'assistant', content: data.response }
    ]);
    
    setMessage('');
  };

  return (
    <div>
      <div className="conversation">
        {conversation.map((msg, idx) => (
          <div key={idx} className={msg.role}>
            {msg.content}
          </div>
        ))}
      </div>
      <input 
        value={message} 
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask sales assistant..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
```

### Streaming Example

```typescript
function StreamingChat() {
  const [response, setResponse] = useState('');

  const streamChat = async (message: string) => {
    const res = await fetch('/api/ai/agents/SALES_ASSISTANT/stream', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          if (data.content) {
            setResponse(prev => prev + data.content);
          }
        }
      }
    }
  };

  return (
    <div>
      <div className="streaming-response">{response}</div>
      <button onClick={() => streamChat('Generate sales forecast')}>
        Start Streaming
      </button>
    </div>
  );
}
```

## Best Practices

### 1. Context is Key
Always provide relevant context data:
```javascript
{
  message: 'Analyze this customer',
  contextData: {
    customerId: 'cust-123',
    lastOrderDate: '2024-01-01',
    totalSpent: 50000
  }
}
```

### 2. Use Specific Agents
Don't ask the Sales Assistant about HR policies. Use the right agent for the job.

### 3. Archive Old Conversations
Keep the conversation list clean by archiving completed chats.

### 4. Monitor Token Usage
Check `ai_usage_analytics` table to track costs and usage patterns.

### 5. Set Token Limits
Configure monthly limits per tenant to control costs.

## Security

1. **Authentication**: All routes require valid JWT token
2. **Multi-tenant Isolation**: Agents only access tenant's own data
3. **API Key Security**: Store AI provider keys in environment variables
4. **Rate Limiting**: API rate limiter applied to all AI endpoints

## Monitoring & Analytics

Query usage analytics:
```sql
-- Monthly token usage by agent
SELECT 
  a.agent_name,
  SUM(ua.total_tokens) as total_tokens,
  SUM(ua.total_messages) as total_messages,
  COUNT(DISTINCT ua.usage_date) as active_days
FROM ai_usage_analytics ua
JOIN ai_agents a ON ua.agent_id = a.agent_id
WHERE ua.usage_date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY a.agent_name
ORDER BY total_tokens DESC;
```

## Extending the System

### Add New Agent

1. Insert into `ai_agents` table:
```sql
INSERT INTO ai_agents (agent_code, agent_name, module_name, system_prompt, capabilities)
VALUES (
  'PROJECT_ASSISTANT',
  'Project Assistant',
  'Projects',
  'You are a project management assistant...',
  '["Track tasks", "Manage timelines", "Resource allocation"]'
);
```

2. Add module-specific routes (optional):
```typescript
router.get('/projects/analyze-timeline', async (req, res) => {
  const result = await aiAgentService.chatWithAgent(
    'PROJECT_ASSISTANT',
    tenantId,
    userId,
    'Analyze current project timelines and identify delays'
  );
  res.json(result);
});
```

### Add Agent Actions (Function Calling)

```sql
INSERT INTO ai_agent_actions (agent_id, action_code, function_definition, endpoint_url)
VALUES (
  (SELECT agent_id FROM ai_agents WHERE agent_code = 'SALES_ASSISTANT'),
  'CHECK_INVENTORY',
  '{"name": "check_inventory", "parameters": {...}}',
  '/api/inventory/check'
);
```

## Troubleshooting

### "No AI provider configured"
- Ensure `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is set in `.env`
- Restart backend after adding keys

### "Agent not found"
- Check `agent_code` is correct (uppercase, underscore-separated)
- Ensure agent is `is_active = true` in database

### High token usage
- Reduce `max_tokens` in agent configuration
- Limit conversation history (currently last 10 messages)
- Use cheaper models (gpt-3.5-turbo instead of gpt-4)

### Slow responses
- Use streaming endpoint for better UX
- Consider caching common queries
- Optimize system prompts to be more concise

## Roadmap

### Planned Features
- [ ] Function calling integration (agents can execute ERP actions)
- [ ] Voice input/output support
- [ ] Multi-language support
- [ ] Agent-to-agent collaboration
- [ ] Fine-tuned models per module
- [ ] Embeddings for document search
- [ ] Custom agent training on tenant data

## Support

For issues or questions:
1. Check this documentation
2. Review conversation history for errors
3. Check `ai_usage_analytics` for usage patterns
4. Contact system administrator

---

**Version**: 1.0.0  
**Last Updated**: November 2024  
**Module**: AI Agents & Assistants
