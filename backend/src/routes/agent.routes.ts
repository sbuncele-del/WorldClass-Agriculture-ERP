/**
 * Actionable AI Agent Routes
 * 
 * API endpoints for the AI Agent that can execute real business actions.
 */

import express from 'express';
import { actionableAIAgent, AgentMessage } from '../services/ai/ActionableAIAgent';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();

// Apply tenant middleware to all agent routes
router.use(tenantMiddleware);

/**
 * POST /api/v1/agent/chat
 * Main chat endpoint for the AI agent
 */
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const user = (req as any).user;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Generate session ID if not provided
    const effectiveSessionId = sessionId || `session_${user.userId}_${Date.now()}`;

    const response: AgentMessage = await actionableAIAgent.processMessage(
      effectiveSessionId,
      user.tenantId || 'default',
      user.userId,
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
});

/**
 * POST /api/v1/agent/demo
 * Demo chat endpoint (no auth required for landing page)
 */
router.post('/demo', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

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
});

/**
 * GET /api/v1/agent/conversation/:sessionId
 * Get conversation history
 */
router.get('/conversation/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const context = actionableAIAgent.getConversation(sessionId);

    if (!context) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({
      success: true,
      conversation: {
        sessionId: context.sessionId,
        currentAction: context.currentAction,
        messages: context.messageHistory
      }
    });
  } catch (error: any) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/agent/conversation/:sessionId
 * Clear conversation history
 */
router.delete('/conversation/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    actionableAIAgent.clearConversation(sessionId);
    res.json({ success: true, message: 'Conversation cleared' });
  } catch (error: any) {
    console.error('Clear conversation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/agent/capabilities
 * List all capabilities the agent can perform
 */
router.get('/capabilities', (req, res) => {
  res.json({
    success: true,
    capabilities: [
      {
        action: 'create_invoice',
        name: 'Create Invoice',
        description: 'Create a sales invoice for a customer',
        examples: [
          'Create an invoice for R50,000 to ABC Company',
          'Invoice XYZ Ltd for consulting services',
          'Bill John Smith R5000 for website development'
        ]
      },
      {
        action: 'create_quote',
        name: 'Create Quote',
        description: 'Create a quotation for potential sales',
        examples: [
          'Create a quote for R25,000 for ABC Corp',
          'Quote R10,000 for maintenance services'
        ]
      },
      {
        action: 'record_expense',
        name: 'Record Expense',
        description: 'Record a business expense',
        examples: [
          'Record an expense of R500 for office supplies',
          'I spent R2000 on travel',
          'Log R800 for internet bill'
        ]
      },
      {
        action: 'record_payment',
        name: 'Record Payment',
        description: 'Record a payment received or made',
        examples: [
          'Record payment of R10,000 from ABC Company',
          'We received R5000 for invoice INV-001'
        ]
      },
      {
        action: 'check_balance',
        name: 'Check Balance',
        description: 'Check current account balances',
        examples: [
          'What is our bank balance?',
          'Show me our cash position',
          'How much do we have?'
        ]
      },
      {
        action: 'generate_report',
        name: 'Generate Report',
        description: 'Generate financial reports',
        examples: [
          'Show me the trial balance',
          'Generate P&L report',
          'I need a balance sheet'
        ]
      },
      {
        action: 'create_customer',
        name: 'Create Customer',
        description: 'Add a new customer to the system',
        examples: [
          'Add a new customer called ABC Trading',
          'Create customer John Smith'
        ]
      },
      {
        action: 'create_journal_entry',
        name: 'Create Journal Entry',
        description: 'Create accounting journal entries',
        examples: [
          'Create a journal entry debiting cash R5000',
          'Record adjustment entry'
        ]
      }
    ]
  });
});

export default router;
