/**
 * AI Assistant API Routes
 * 
 * Endpoints for the natural language business assistant
 */

import { Router, Request, Response } from 'express';
import { createAIAssistant, AIAssistantService } from '../services/ai/AIAssistantService';
import { tenantMiddleware } from '../middleware/tenant';

const router = Router();

// Apply tenant middleware to all AI routes
router.use(tenantMiddleware);

// Singleton AI assistant instance
let aiAssistant: AIAssistantService | null = null;

function getAIAssistant(): AIAssistantService {
  if (!aiAssistant) {
    try {
      aiAssistant = createAIAssistant();
    } catch (error: any) {
      throw new Error(`AI Assistant not configured: ${error.message}`);
    }
  }
  return aiAssistant;
}

/**
 * POST /api/ai/chat
 * Send a message to the AI assistant
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }

    // Get user context from auth (or use defaults for demo)
    const tenantId = (req as any).user?.tenantId || 'demo-tenant';
    const userId = (req as any).user?.id || 'demo-user';
    const session = sessionId || `session_${Date.now()}`;

    const assistant = getAIAssistant();
    
    const response = await assistant.processMessage(message, {
      tenantId,
      userId,
      sessionId: session
    });

    res.json({
      success: true,
      sessionId: session,
      message: response
    });

  } catch (error: any) {
    console.error('AI Chat Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process message'
    });
  }
});

/**
 * POST /api/ai/confirm
 * Confirm a pending action
 */
router.post('/confirm', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Session ID is required' 
      });
    }

    const assistant = getAIAssistant();
    const response = await assistant.confirmAction(sessionId);

    res.json({
      success: true,
      message: response
    });

  } catch (error: any) {
    console.error('AI Confirm Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to confirm action'
    });
  }
});

/**
 * POST /api/ai/cancel
 * Cancel a pending action
 */
router.post('/cancel', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Session ID is required' 
      });
    }

    const assistant = getAIAssistant();
    const response = await assistant.cancelAction(sessionId);

    res.json({
      success: true,
      message: response
    });

  } catch (error: any) {
    console.error('AI Cancel Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel action'
    });
  }
});

/**
 * GET /api/ai/conversation/:sessionId
 * Get conversation history
 */
router.get('/conversation/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const assistant = getAIAssistant();
    const conversation = assistant.getConversation(sessionId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      conversation: {
        sessionId,
        messages: conversation.messages,
        currentAction: conversation.currentAction
      }
    });

  } catch (error: any) {
    console.error('Get Conversation Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/ai/conversation/:sessionId
 * Clear conversation history
 */
router.delete('/conversation/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const assistant = getAIAssistant();
    assistant.clearConversation(sessionId);

    res.json({
      success: true,
      message: 'Conversation cleared'
    });

  } catch (error: any) {
    console.error('Clear Conversation Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai/usage/:sessionId
 * Get token usage for billing
 */
router.get('/usage/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const assistant = getAIAssistant();
    const usage = assistant.getSessionTokenUsage(sessionId);

    res.json({
      success: true,
      usage: {
        sessionId,
        totalTokens: usage.tokens,
        estimatedCostUSD: usage.estimatedCostUSD,
        estimatedCostZAR: usage.estimatedCostUSD * 18 // Approximate exchange rate
      }
    });

  } catch (error: any) {
    console.error('Get Usage Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai/suggestions
 * Get suggested prompts based on context
 */
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
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

    res.json({
      success: true,
      suggestions
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
