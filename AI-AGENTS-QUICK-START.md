# AI Agents Module - Quick Start Guide

**Updated:** January 12, 2026  
**Platform:** SiyaBusa ERP (Cape Town AWS Region)  
**Status:** ✅ Integrated

## Installation (Complete ✅)

The AI Agents module is already installed and integrated. All you need to do is configure your API keys.

## 1. Get API Keys

### Option A: OpenAI (Recommended)
1. Go to https://platform.openai.com/api-keys
2. Create new API key
3. Copy the key (starts with `sk-...`)

### Option B: Anthropic (Alternative)
1. Go to https://console.anthropic.com/
2. Create API key
3. Copy the key (starts with `sk-ant-...`)

### Option C: Both (Fallback support)
You can configure both. OpenAI will be used first, Anthropic as fallback.

## 2. Configure Environment

Add to your `.env` file:

```bash
# Required: At least one API key
OPENAI_API_KEY=sk-your-openai-key-here
# OR
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Optional: Configuration
AI_DEFAULT_MODEL=gpt-4
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
```

## 3. Deploy Database Schema

```bash
# For Cape Town ECS deployment, connect to RDS directly:
# Host: worldclass-erp-db.c92ou2c2e43l.af-south-1.rds.amazonaws.com
# Database: erp_database

# Navigate to backend
cd /workspaces/WorldClass-ERP/backend

# Run migration
psql $DATABASE_URL -f database/migrations/018_ai_agents_module.sql

# Verify
psql $DATABASE_URL -c "SELECT agent_name FROM ai_agents;"
```

Expected output:
```
         agent_name
----------------------------
 Sales Assistant
 Procurement Assistant
 Finance Assistant
 HR Assistant
 Compliance Assistant
 Analytics Assistant
 Treasury Assistant
 Inventory Assistant
 Logistics Assistant
(9 rows)
```

## 4. Restart Backend

```bash
# For ECS deployment, redeploy the service:
aws ecs update-service --cluster worldclass-erp-cluster --service worldclass-erp-backend --force-new-deployment --region af-south-1
```

Look for:
```
🚀 Server running on port 3000
📊 ERP System initialized
```

## 5. Test AI Agents

### Test 1: List Agents
```bash
curl -X GET https://siyabusaerp.co.za/api/ai/agents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Should return 9 agents.

### Test 2: Chat with Sales Assistant
```bash
curl -X POST https://siyabusaerp.co.za/api/ai/agents/SALES_ASSISTANT/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the top 3 tips for closing deals?"
  }'
```

Should return AI response with conversation ID.

### Test 3: Get Suggestions
```bash
curl -X GET https://siyabusaerp.co.za/api/ai/suggestions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 6. Frontend Integration

Add AI chat component to your frontend:

```typescript
// Example: Chat with any agent
async function chatWithAgent(agentCode: string, message: string) {
  const response = await fetch(`/api/ai/agents/${agentCode}/chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  });
  
  return await response.json();
}

// Usage
const result = await chatWithAgent('SALES_ASSISTANT', 'Help me create a quotation');
console.log(result.response);
```

## Available Agents

| Agent Code | Module | Purpose |
|---|---|---|
| `SALES_ASSISTANT` | Sales | Quotations, forecasting, customer insights |
| `PROCUREMENT_ASSISTANT` | Purchase | PO optimization, supplier analysis |
| `FINANCE_ASSISTANT` | Financial | Reconciliation, variance analysis |
| `HR_ASSISTANT` | HR | Onboarding, payroll, policies |
| `COMPLIANCE_ASSISTANT` | Compliance | Risk assessment, deadlines |
| `ANALYTICS_ASSISTANT` | Reports | Data insights, trends |
| `TREASURY_ASSISTANT` | Treasury | Cash flow, FX, investments |
| `INVENTORY_ASSISTANT` | Inventory | Stock optimization, demand forecasting |
| `LOGISTICS_ASSISTANT` | Logistics | Route optimization, fleet tracking |

## Common Use Cases

### Sales: Generate Quotation
```bash
POST /api/ai/sales/generate-quotation
{
  "customerId": "cust-123",
  "items": [{"productId": "prod-456", "quantity": 10}]
}
```

### Compliance: Check Status
```bash
GET /api/ai/compliance/check
```

### Finance: Explain Variance
```bash
GET /api/ai/finance/explain-variance?accountCode=4000&period=2024-01
```

### Sales: Forecast
```bash
GET /api/ai/sales/forecast?period=quarter
```

## Monitoring

### Check Usage
```sql
SELECT 
  a.agent_name,
  SUM(ua.total_messages) as messages,
  SUM(ua.total_tokens) as tokens
FROM ai_usage_analytics ua
JOIN ai_agents a ON ua.agent_id = a.agent_id
WHERE ua.usage_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY a.agent_name;
```

### View Recent Conversations
```sql
SELECT 
  a.agent_name,
  c.conversation_title,
  c.last_message_at,
  (SELECT COUNT(*) FROM ai_messages WHERE conversation_id = c.conversation_id) as message_count
FROM ai_conversations c
JOIN ai_agents a ON c.agent_id = a.agent_id
ORDER BY c.last_message_at DESC
LIMIT 10;
```

## Troubleshooting

### Error: "No AI provider configured"
**Solution**: Add `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` to `.env` and restart backend

### Error: "Agent not found"
**Solution**: 
```bash
# Check if agents exist
psql $DATABASE_URL -c "SELECT * FROM ai_agents WHERE is_active = true;"

# If empty, re-run migration
psql $DATABASE_URL -f database/migrations/018_ai_agents_module.sql
```

### Slow responses
**Solution**: 
- Switch to `gpt-3.5-turbo` (faster, cheaper)
- Use streaming endpoint: `/api/ai/agents/:agentCode/stream`

### High costs
**Solution**:
- Reduce `AI_MAX_TOKENS` in `.env`
- Set monthly limits per tenant
- Use gpt-3.5-turbo instead of gpt-4

## Next Steps

1. ✅ **Module Complete**: AI Agents fully integrated
2. ⏳ **Multi-Entity**: Add multi-entity support (next task)
3. ⏳ **Deployment Packages**: Create deployment packages for all new modules
4. ⏳ **Testing**: Comprehensive testing with user

## Cost Estimation

**OpenAI GPT-4 Pricing** (as of Nov 2024):
- Input: $0.03 per 1K tokens
- Output: $0.06 per 1K tokens

**Example**: 100 conversations/day with 500 tokens each = $3/day = $90/month

**Optimization**:
- Use GPT-3.5-Turbo: ~10x cheaper
- Cache common queries
- Limit token usage per query

## Support

Full documentation: `/backend/AI-AGENTS-DOCUMENTATION.md`

---

**Status**: ✅ DEPLOYED  
**Version**: 1.0.0  
**Updated**: January 2026  
**Live URL**: https://siyabusaerp.co.za
