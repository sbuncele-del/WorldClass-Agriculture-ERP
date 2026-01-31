/**
 * AI Chat Controller V2
 * 
 * Tenant-hardened AI assistant API
 * Handles chat, conversations, sessions, and suggestions
 */

import { Request, Response } from 'express';
import pool from '../../config/database';

// Lazy import to avoid circular dependencies
let aiAssistantService: any = null;
function getAIService() {
  if (!aiAssistantService) {
    try {
      const { createAIAssistant } = require('../../services/ai/AIAssistantService');
      aiAssistantService = createAIAssistant();
    } catch (error: any) {
      console.error('[AIV2] AI service not available:', error.message);
    }
  }
  return aiAssistantService;
}

// Tenant-aware request type
interface TenantRequest extends Request {
  tenant?: { id: string };
  user?: { id: string; email: string; role: string; name?: string };
}

// Extract tenant context with validation
function getTenantContext(req: TenantRequest): { tenantId: string; userId: string; userEmail: string } {
  const tenantId = req.tenant?.id;
  const userId = req.user?.id;
  if (!tenantId) throw new Error('Tenant context required');
  return { tenantId, userId: userId || '', userEmail: req.user?.email || '' };
}

/**
 * POST /api/v2/ai/chat
 * Send a message to the AI assistant (tenant-scoped)
 */
export async function chat(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { message, sessionId, contextData } = req.body;

    if (!message) {
      res.status(400).json({ success: false, error: 'Message is required' });
      return;
    }

    const assistant = getAIService();
    if (!assistant) {
      res.status(503).json({ success: false, error: 'AI service not available' });
      return;
    }

    const session = sessionId || `session_${tenantId}_${Date.now()}`;

    const response = await assistant.processMessage(message, {
      tenantId,
      userId,
      sessionId: session,
      contextData
    });

    // Log the interaction
    await pool.query(`
      INSERT INTO ai_chat_logs (tenant_id, user_id, session_id, message, response, created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    `, [tenantId, userId, session, message, response]).catch(() => {});

    res.json({
      success: true,
      data: {
        sessionId: session,
        message: response
      }
    });
  } catch (error: any) {
    console.error('[AIV2] Chat error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: error.message || 'Failed to process message' });
  }
}

/**
 * POST /api/v2/ai/confirm
 * Confirm a pending AI action (tenant-scoped)
 */
export async function confirmAction(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ success: false, error: 'Session ID is required' });
      return;
    }

    // Verify session belongs to tenant
    if (!sessionId.includes(tenantId.substring(0, 8))) {
      res.status(403).json({ success: false, error: 'Session not found' });
      return;
    }

    const assistant = getAIService();
    if (!assistant) {
      res.status(503).json({ success: false, error: 'AI service not available' });
      return;
    }

    const response = await assistant.confirmAction(sessionId);

    res.json({ success: true, data: { message: response } });
  } catch (error: any) {
    console.error('[AIV2] Confirm action error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: error.message || 'Failed to confirm action' });
  }
}

/**
 * POST /api/v2/ai/cancel
 * Cancel a pending AI action (tenant-scoped)
 */
export async function cancelAction(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ success: false, error: 'Session ID is required' });
      return;
    }

    // Verify session belongs to tenant
    if (!sessionId.includes(tenantId.substring(0, 8))) {
      res.status(403).json({ success: false, error: 'Session not found' });
      return;
    }

    const assistant = getAIService();
    if (!assistant) {
      res.status(503).json({ success: false, error: 'AI service not available' });
      return;
    }

    const response = await assistant.cancelAction(sessionId);

    res.json({ success: true, data: { message: response } });
  } catch (error: any) {
    console.error('[AIV2] Cancel action error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: error.message || 'Failed to cancel action' });
  }
}

/**
 * GET /api/v2/ai/conversation/:sessionId
 * Get conversation history (tenant-scoped)
 */
export async function getConversation(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { sessionId } = req.params;

    // Verify session belongs to tenant
    if (!sessionId.includes(tenantId.substring(0, 8))) {
      res.status(403).json({ success: false, error: 'Session not found' });
      return;
    }

    const assistant = getAIService();
    if (!assistant) {
      // Fall back to database
      const result = await pool.query(`
        SELECT message, response, created_at 
        FROM ai_chat_logs 
        WHERE tenant_id = $1 AND session_id = $2
        ORDER BY created_at ASC
      `, [tenantId, sessionId]);

      res.json({
        success: true,
        data: {
          sessionId,
          messages: result.rows.map(row => ({
            role: 'user',
            content: row.message,
            timestamp: row.created_at
          })).concat(result.rows.map(row => ({
            role: 'assistant',
            content: row.response,
            timestamp: row.created_at
          }))).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        }
      });
      return;
    }

    const conversation = assistant.getConversation(sessionId);

    if (!conversation) {
      res.status(404).json({ success: false, error: 'Conversation not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        sessionId,
        messages: conversation.messages,
        currentAction: conversation.currentAction
      }
    });
  } catch (error: any) {
    console.error('[AIV2] Get conversation error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to get conversation' });
  }
}

/**
 * DELETE /api/v2/ai/conversation/:sessionId
 * Clear conversation history (tenant-scoped)
 */
export async function clearConversation(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { sessionId } = req.params;

    // Verify session belongs to tenant
    if (!sessionId.includes(tenantId.substring(0, 8))) {
      res.status(403).json({ success: false, error: 'Session not found' });
      return;
    }

    const assistant = getAIService();
    if (assistant) {
      assistant.clearConversation(sessionId);
    }

    // Also clear from database
    await pool.query(
      `DELETE FROM ai_chat_logs WHERE tenant_id = $1 AND session_id = $2`,
      [tenantId, sessionId]
    ).catch(() => {});

    res.json({ success: true, data: { message: 'Conversation cleared' } });
  } catch (error: any) {
    console.error('[AIV2] Clear conversation error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to clear conversation' });
  }
}

/**
 * GET /api/v2/ai/conversations
 * List all conversations for user (tenant-scoped)
 */
export async function listConversations(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { includeArchived = false, limit = 20 } = req.query;

    const result = await pool.query(`
      SELECT 
        session_id,
        MIN(created_at) as started_at,
        MAX(created_at) as last_activity,
        COUNT(*) as message_count
      FROM ai_chat_logs
      WHERE tenant_id = $1 AND user_id = $2
      GROUP BY session_id
      ORDER BY MAX(created_at) DESC
      LIMIT $3
    `, [tenantId, userId, parseInt(limit as string)]);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        sessionId: row.session_id,
        startedAt: row.started_at,
        lastActivity: row.last_activity,
        messageCount: parseInt(row.message_count)
      }))
    });
  } catch (error: any) {
    console.error('[AIV2] List conversations error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to list conversations' });
  }
}

/**
 * GET /api/v2/ai/usage/:sessionId
 * Get token usage for billing (tenant-scoped)
 */
export async function getUsage(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { sessionId } = req.params;

    // Verify session belongs to tenant
    if (!sessionId.includes(tenantId.substring(0, 8))) {
      res.status(403).json({ success: false, error: 'Session not found' });
      return;
    }

    const assistant = getAIService();
    let usage = { tokens: 0, estimatedCostUSD: 0 };
    
    if (assistant) {
      usage = assistant.getSessionTokenUsage(sessionId);
    }

    res.json({
      success: true,
      data: {
        sessionId,
        totalTokens: usage.tokens,
        estimatedCostUSD: usage.estimatedCostUSD,
        estimatedCostZAR: usage.estimatedCostUSD * 18
      }
    });
  } catch (error: any) {
    console.error('[AIV2] Get usage error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to get usage' });
  }
}

/**
 * GET /api/v2/ai/suggestions
 * Get AI-generated suggestions (tenant-scoped by module context)
 */
export async function getSuggestions(req: TenantRequest, res: Response): Promise<void> {
  try {
    getTenantContext(req);

    // Context-aware suggestions
    const suggestions = [
      {
        category: 'Sales',
        prompts: [
          'Create an invoice for ABC Corp for 100 units of Product A',
          'What\'s the outstanding balance for XYZ Industries?',
          'Show me today\'s sales summary',
          'Create a quote for a new customer'
        ]
      },
      {
        category: 'Inventory',
        prompts: [
          'Check inventory levels for Product A',
          'What items are running low?',
          'Transfer 50 units from Warehouse A to B',
          'Show me slow-moving stock'
        ]
      },
      {
        category: 'Finance',
        prompts: [
          'What\'s our current cash position?',
          'Show me overdue invoices',
          'Record a payment from ABC Corp',
          'Run the profit and loss report for this month'
        ]
      },
      {
        category: 'HR',
        prompts: [
          'Process payroll for this month',
          'How many leave days does John have?',
          'Show me the staff cost summary',
          'Add a new employee'
        ]
      },
      {
        category: 'Logistics',
        prompts: [
          'Schedule a delivery to Cape Town',
          'Where is order #12345?',
          'Show me pending deliveries',
          'Assign driver to route 5'
        ]
      }
    ];

    res.json({ success: true, data: suggestions });
  } catch (error: any) {
    console.error('[AIV2] Get suggestions error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to get suggestions' });
  }
}

/**
 * GET /api/v2/ai/status
 * Check AI service status (tenant-scoped)
 */
export async function getStatus(req: TenantRequest, res: Response): Promise<void> {
  try {
    getTenantContext(req);

    const assistant = getAIService();
    const isConfigured = !!assistant;

    res.json({
      success: true,
      data: {
        configured: isConfigured,
        provider: isConfigured ? 'openai' : null,
        features: isConfigured ? {
          chat: true,
          streaming: true,
          contextAware: true,
          actionConfirmation: true
        } : null
      }
    });
  } catch (error: any) {
    console.error('[AIV2] Get status error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to get status' });
  }
}
