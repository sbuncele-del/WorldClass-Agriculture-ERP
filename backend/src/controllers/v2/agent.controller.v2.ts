/**
 * AI Agent Controller v2 - Tenant-Hardened
 * 
 * API endpoints for the Actionable AI Agent that can execute business actions.
 * 
 * Features:
 * - Main chat interface for authenticated users
 * - Demo chat for landing page (no auth)
 * - Conversation history management
 * - Available actions discovery
 * - Session management
 */

import { Request, Response } from 'express';
import { actionableAIAgent, AgentMessage, ConversationContext } from '../../services/ai/ActionableAIAgent';

// Tenant-aware request type - avoid extending Request.user which has its own type
interface TenantUser {
  id: string;
  email: string;
  role: string;
  tenantId?: string;
}

interface AuthenticatedRequest extends Request {
  tenantId?: string;
  tenant?: { id: string };
}

// =============================================================================
// CHAT HANDLERS
// =============================================================================

/**
 * POST /api/v2/agent/chat
 * Main chat endpoint for the AI agent
 */
export async function chat(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = (req as any).user as TenantUser | undefined;
  const tenantId = req.tenantId || req.tenant?.id || user?.tenantId;
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const { message, sessionId } = req.body;

  if (!message) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  try {
    // Get user from request (cast to any for flexibility)
    const user = (req as any).user as TenantUser | undefined;
    
    // Generate session ID if not provided
    const effectiveSessionId = sessionId || `session_${user?.id || 'anon'}_${Date.now()}`;
    const userId = String(user?.id || 'unknown');

    const response: AgentMessage = await actionableAIAgent.processMessage(
      effectiveSessionId,
      tenantId,
      userId,
      message
    );

    res.json({
      success: true,
      sessionId: effectiveSessionId,
      message: response
    });

  } catch (error: any) {
    console.error('Agent chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process message'
    });
  }
}

/**
 * POST /api/v2/agent/demo
 * Demo chat endpoint (no auth required for landing page)
 */
export async function demoChat(req: Request, res: Response): Promise<void> {
  const { message, sessionId } = req.body;

  if (!message) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  try {
    const effectiveSessionId = sessionId || `demo_${Date.now()}`;

    const response: AgentMessage = await actionableAIAgent.processMessage(
      effectiveSessionId,
      'demo',
      'demo-user',
      message
    );

    res.json({
      success: true,
      sessionId: effectiveSessionId,
      message: response
    });

  } catch (error: any) {
    console.error('Agent demo error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process message'
    });
  }
}

// =============================================================================
// CONVERSATION HANDLERS
// =============================================================================

/**
 * GET /api/v2/agent/conversation/:sessionId
 * Get conversation history for a session
 */
export async function getConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = req.tenantId || req.tenant?.id;
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const { sessionId } = req.params;

  try {
    const context = actionableAIAgent.getConversation(sessionId);

    if (!context) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Verify tenant ownership
    if (context.tenantId !== tenantId && context.tenantId !== 'demo') {
      res.status(403).json({ error: 'Access denied to this conversation' });
      return;
    }

    res.json({
      success: true,
      data: {
        sessionId,
        tenantId: context.tenantId,
        userId: context.userId,
        messages: context.messageHistory,
        currentAction: context.currentAction,
        collectedData: context.collectedData
      }
    });

  } catch (error: any) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get conversation'
    });
  }
}

/**
 * DELETE /api/v2/agent/conversation/:sessionId
 * Clear conversation history
 */
export async function clearConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = req.tenantId || req.tenant?.id;
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const { sessionId } = req.params;

  try {
    const context = actionableAIAgent.getConversation(sessionId);

    if (!context) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Verify tenant ownership
    if (context.tenantId !== tenantId && context.tenantId !== 'demo') {
      res.status(403).json({ error: 'Access denied to this conversation' });
      return;
    }

    actionableAIAgent.clearConversation(sessionId);

    res.json({
      success: true,
      message: 'Conversation cleared'
    });

  } catch (error: any) {
    console.error('Clear conversation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear conversation'
    });
  }
}

// =============================================================================
// ACTION HANDLERS
// =============================================================================

/**
 * GET /api/v2/agent/actions
 * Get list of available actions the agent can perform
 */
export async function getAvailableActions(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = req.tenantId || req.tenant?.id;
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const user = (req as any).user as TenantUser | undefined;
  const userRole = user?.role;

  try {
    // Define available actions based on user role
    const allActions = [
      {
        category: 'financial',
        actions: [
          { id: 'create_invoice', name: 'Create Invoice', description: 'Generate a new invoice', requiredRole: 'user' },
          { id: 'record_payment', name: 'Record Payment', description: 'Record a payment received', requiredRole: 'user' },
          { id: 'create_journal', name: 'Create Journal Entry', description: 'Create a journal entry', requiredRole: 'accountant' },
          { id: 'reconcile_bank', name: 'Bank Reconciliation', description: 'Reconcile bank statements', requiredRole: 'accountant' }
        ]
      },
      {
        category: 'inventory',
        actions: [
          { id: 'check_stock', name: 'Check Stock', description: 'Check inventory levels', requiredRole: 'user' },
          { id: 'create_po', name: 'Create Purchase Order', description: 'Create a new purchase order', requiredRole: 'user' },
          { id: 'receive_goods', name: 'Receive Goods', description: 'Record goods receipt', requiredRole: 'warehouse' }
        ]
      },
      {
        category: 'hr',
        actions: [
          { id: 'submit_leave', name: 'Submit Leave Request', description: 'Request time off', requiredRole: 'user' },
          { id: 'approve_leave', name: 'Approve Leave', description: 'Approve pending leave requests', requiredRole: 'manager' },
          { id: 'run_payroll', name: 'Run Payroll', description: 'Process payroll', requiredRole: 'hr' }
        ]
      },
      {
        category: 'reports',
        actions: [
          { id: 'generate_report', name: 'Generate Report', description: 'Create a report', requiredRole: 'user' },
          { id: 'export_data', name: 'Export Data', description: 'Export data to CSV/Excel', requiredRole: 'user' },
          { id: 'schedule_report', name: 'Schedule Report', description: 'Set up scheduled reports', requiredRole: 'manager' }
        ]
      }
    ];

    // Filter based on user role (admin sees all)
    const roleHierarchy: Record<string, number> = {
      'user': 1,
      'warehouse': 2,
      'accountant': 2,
      'hr': 2,
      'manager': 3,
      'admin': 4
    };

    const userLevel = roleHierarchy[userRole?.toLowerCase() || 'user'] || 1;

    const filteredActions = allActions.map(category => ({
      ...category,
      actions: category.actions.filter(action => {
        const requiredLevel = roleHierarchy[action.requiredRole] || 1;
        return userLevel >= requiredLevel;
      })
    })).filter(category => category.actions.length > 0);

    res.json({
      success: true,
      data: filteredActions
    });

  } catch (error: any) {
    console.error('Get actions error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get available actions'
    });
  }
}

/**
 * POST /api/v2/agent/execute
 * Execute a specific action directly (bypasses NLP)
 */
export async function executeAction(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = req.tenantId || req.tenant?.id;
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const { actionId, parameters, sessionId } = req.body;
  const user = (req as any).user as TenantUser | undefined;

  if (!actionId) {
    res.status(400).json({ error: 'Action ID is required' });
    return;
  }

  try {
    const effectiveSessionId = sessionId || `action_${user?.id || 'anon'}_${Date.now()}`;
    const userId = String(user?.id || 'unknown');

    // Construct action message for the agent
    const actionMessage = `Execute action: ${actionId} with parameters: ${JSON.stringify(parameters || {})}`;

    const response: AgentMessage = await actionableAIAgent.processMessage(
      effectiveSessionId,
      tenantId,
      userId,
      actionMessage
    );

    res.json({
      success: true,
      sessionId: effectiveSessionId,
      actionId,
      result: response
    });

  } catch (error: any) {
    console.error('Execute action error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute action'
    });
  }
}

// =============================================================================
// SESSION HANDLERS
// =============================================================================

/**
 * GET /api/v2/agent/sessions
 * Get all active sessions for current user
 * Note: The current ActionableAIAgent doesn't expose session listing,
 * so this returns an empty array. Future implementation could add this.
 */
export async function getSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = req.tenantId || req.tenant?.id;
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const user = (req as any).user as TenantUser | undefined;
  const userId = user?.id;

  try {
    // Note: ActionableAIAgent uses an in-memory Map for conversations
    // getUserSessions would need to be implemented to list sessions
    // For now, return empty array as sessions are ephemeral
    res.json({
      success: true,
      data: [],
      message: 'Session listing not yet implemented - conversations are ephemeral'
    });

  } catch (error: any) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get sessions'
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // Chat
  chat,
  demoChat,
  
  // Conversations
  getConversation,
  clearConversation,
  
  // Actions
  getAvailableActions,
  executeAction,
  
  // Sessions
  getSessions
};
