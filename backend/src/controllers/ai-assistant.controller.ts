/**
 * AI Assistant Controller
 * Handle AI agent interactions
 */

import { Request, Response } from 'express';
import aiAgentService from '../services/ai-agent.service';

/**
 * List all available AI agents
 */
export const getAgents = async (req: Request, res: Response) => {
    try {
        const agents = await aiAgentService.listAgents();
        res.json(agents);
    } catch (error: any) {
        console.error('Error fetching agents:', error);
        res.status(500).json({ error: 'Failed to fetch agents' });
    }
};

/**
 * Get specific agent details
 */
export const getAgent = async (req: Request, res: Response) => {
    try {
        const { agentCode } = req.params;
        const agent = await aiAgentService.getAgent(agentCode);

        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        res.json(agent);
    } catch (error: any) {
        console.error('Error fetching agent:', error);
        res.status(500).json({ error: 'Failed to fetch agent' });
    }
};

/**
 * Chat with an AI agent
 */
export const chat = async (req: Request, res: Response) => {
    try {
        const { agentCode } = req.params;
        const { message, contextData } = req.body;
        const tenantId = (req as any).user.tenantId;
        const userId = (req as any).user.userId;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const result = await aiAgentService.chatWithAgent(
            agentCode,
            tenantId,
            userId,
            message,
            contextData || {}
        );

        res.json(result);
    } catch (error: any) {
        console.error('Error in chat:', error);
        res.status(500).json({ error: error.message || 'Failed to process chat' });
    }
};

/**
 * Stream chat with an AI agent (SSE)
 */
export const streamChat = async (req: Request, res: Response) => {
    try {
        const { agentCode } = req.params;
        const { message, contextData } = req.body;
        const tenantId = (req as any).user.tenantId;
        const userId = (req as any).user.userId;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = aiAgentService.streamChatWithAgent(
            agentCode,
            tenantId,
            userId,
            message,
            contextData || {}
        );

        for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error: any) {
        console.error('Error in stream chat:', error);
        res.status(500).json({ error: error.message || 'Failed to process chat' });
    }
};

/**
 * Get user's conversations
 */
export const getConversations = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const userId = (req as any).user.userId;
        const includeArchived = req.query.includeArchived === 'true';

        const conversations = await aiAgentService.getUserConversations(tenantId, userId, includeArchived);
        res.json(conversations);
    } catch (error: any) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
};

/**
 * Get conversation history
 */
export const getConversationHistory = async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;

        const history = await aiAgentService.getConversationHistory(conversationId, limit);
        res.json(history);
    } catch (error: any) {
        console.error('Error fetching conversation history:', error);
        res.status(500).json({ error: 'Failed to fetch conversation history' });
    }
};

/**
 * Archive a conversation
 */
export const archiveConversation = async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        await aiAgentService.archiveConversation(conversationId);
        res.json({ message: 'Conversation archived successfully' });
    } catch (error: any) {
        console.error('Error archiving conversation:', error);
        res.status(500).json({ error: 'Failed to archive conversation' });
    }
};

/**
 * Get AI suggestions for user
 */
export const getSuggestions = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const userId = (req as any).user.userId;

        const suggestions = await aiAgentService.getUserSuggestions(tenantId, userId);
        res.json(suggestions);
    } catch (error: any) {
        console.error('Error fetching suggestions:', error);
        res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
};

/**
 * Update suggestion status
 */
export const updateSuggestionStatus = async (req: Request, res: Response) => {
    try {
        const { suggestionId } = req.params;
        const { status } = req.body;

        if (!['VIEWED', 'ACTIONED', 'DISMISSED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const { Pool } = require('pg');
        const pool = new Pool();

        await pool.query(
            'UPDATE ai_suggestions SET status = $1 WHERE suggestion_id = $2',
            [status, suggestionId]
        );

        res.json({ message: 'Suggestion status updated successfully' });
    } catch (error: any) {
        console.error('Error updating suggestion status:', error);
        res.status(500).json({ error: 'Failed to update suggestion status' });
    }
};

/**
 * Get agent capabilities
 */
export const getAgentCapabilities = async (req: Request, res: Response) => {
    try {
        const { agentCode } = req.params;
        const capabilities = await aiAgentService.getAgentCapabilities(agentCode);
        res.json({ capabilities });
    } catch (error: any) {
        console.error('Error fetching capabilities:', error);
        res.status(500).json({ error: 'Failed to fetch capabilities' });
    }
};

/**
 * Sales Assistant - Specific helper endpoints
 */
export const salesAssistant = {
    /**
     * Analyze customer for upsell opportunities
     */
    analyzeCustomer: async (req: Request, res: Response) => {
        try {
            const { customerId } = req.params;
            const tenantId = (req as any).user.tenantId;
            const userId = (req as any).user.userId;

            const contextData = { customerId, action: 'analyze_customer' };
            const message = `Analyze customer ${customerId} and suggest upsell opportunities based on their purchase history.`;

            const result = await aiAgentService.chatWithAgent(
                'SALES_ASSISTANT',
                tenantId,
                userId,
                message,
                contextData
            );

            res.json(result);
        } catch (error: any) {
            console.error('Error analyzing customer:', error);
            res.status(500).json({ error: 'Failed to analyze customer' });
        }
    },

    /**
     * Generate quotation with AI assistance
     */
    generateQuotation: async (req: Request, res: Response) => {
        try {
            const { customerId, items } = req.body;
            const tenantId = (req as any).user.tenantId;
            const userId = (req as any).user.userId;

            const contextData = { customerId, items, action: 'generate_quotation' };
            const message = `Create a professional quotation for customer ${customerId} with these items: ${JSON.stringify(items)}`;

            const result = await aiAgentService.chatWithAgent(
                'SALES_ASSISTANT',
                tenantId,
                userId,
                message,
                contextData
            );

            res.json(result);
        } catch (error: any) {
            console.error('Error generating quotation:', error);
            res.status(500).json({ error: 'Failed to generate quotation' });
        }
    },

    /**
     * Forecast sales
     */
    forecastSales: async (req: Request, res: Response) => {
        try {
            const { period } = req.query; // 'month', 'quarter', 'year'
            const tenantId = (req as any).user.tenantId;
            const userId = (req as any).user.userId;

            const message = `Generate a sales forecast for the next ${period || 'month'} based on historical data and current trends.`;

            const result = await aiAgentService.chatWithAgent(
                'SALES_ASSISTANT',
                tenantId,
                userId,
                message,
                { action: 'forecast_sales', period }
            );

            res.json(result);
        } catch (error: any) {
            console.error('Error forecasting sales:', error);
            res.status(500).json({ error: 'Failed to forecast sales' });
        }
    }
};

/**
 * Compliance Assistant - Specific helper endpoints
 */
export const complianceAssistant = {
    /**
     * Check compliance status
     */
    checkCompliance: async (req: Request, res: Response) => {
        try {
            const tenantId = (req as any).user.tenantId;
            const userId = (req as any).user.userId;

            const message = 'Check current compliance status and highlight any overdue items or upcoming deadlines.';

            const result = await aiAgentService.chatWithAgent(
                'COMPLIANCE_ASSISTANT',
                tenantId,
                userId,
                message,
                { action: 'check_compliance' }
            );

            res.json(result);
        } catch (error: any) {
            console.error('Error checking compliance:', error);
            res.status(500).json({ error: 'Failed to check compliance' });
        }
    },

    /**
     * Assess risk
     */
    assessRisk: async (req: Request, res: Response) => {
        try {
            const { area } = req.query; // 'financial', 'operational', 'regulatory'
            const tenantId = (req as any).user.tenantId;
            const userId = (req as any).user.userId;

            const message = `Perform a risk assessment for ${area || 'all areas'} and suggest mitigation strategies.`;

            const result = await aiAgentService.chatWithAgent(
                'COMPLIANCE_ASSISTANT',
                tenantId,
                userId,
                message,
                { action: 'assess_risk', area }
            );

            res.json(result);
        } catch (error: any) {
            console.error('Error assessing risk:', error);
            res.status(500).json({ error: 'Failed to assess risk' });
        }
    }
};

/**
 * Finance Assistant - Specific helper endpoints
 */
export const financeAssistant = {
    /**
     * Explain variance
     */
    explainVariance: async (req: Request, res: Response) => {
        try {
            const { accountCode, period } = req.query;
            const tenantId = (req as any).user.tenantId;
            const userId = (req as any).user.userId;

            const message = `Explain the variance in account ${accountCode} for ${period}. Analyze the contributing factors and suggest corrective actions if needed.`;

            const result = await aiAgentService.chatWithAgent(
                'FINANCE_ASSISTANT',
                tenantId,
                userId,
                message,
                { action: 'explain_variance', accountCode, period }
            );

            res.json(result);
        } catch (error: any) {
            console.error('Error explaining variance:', error);
            res.status(500).json({ error: 'Failed to explain variance' });
        }
    },

    /**
     * Reconcile account
     */
    reconcileAccount: async (req: Request, res: Response) => {
        try {
            const { accountCode } = req.params;
            const tenantId = (req as any).user.tenantId;
            const userId = (req as any).user.userId;

            const message = `Help me reconcile account ${accountCode}. Identify any discrepancies and suggest how to resolve them.`;

            const result = await aiAgentService.chatWithAgent(
                'FINANCE_ASSISTANT',
                tenantId,
                userId,
                message,
                { action: 'reconcile_account', accountCode }
            );

            res.json(result);
        } catch (error: any) {
            console.error('Error reconciling account:', error);
            res.status(500).json({ error: 'Failed to reconcile account' });
        }
    }
};
