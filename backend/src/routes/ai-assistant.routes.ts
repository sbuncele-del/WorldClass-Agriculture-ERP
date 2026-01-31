/**
 * AI Assistant Routes
 * API endpoints for AI agent interactions
 */

import express from 'express';
import {
    getAgents,
    getAgent,
    chat,
    streamChat,
    getConversations,
    getConversationHistory,
    archiveConversation,
    getSuggestions,
    updateSuggestionStatus,
    getAgentCapabilities,
    salesAssistant,
    complianceAssistant,
    financeAssistant
} from '../controllers/ai-assistant.controller';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

// ================================================
// GENERAL AI AGENT ROUTES
// ================================================

/**
 * GET /api/ai/agents
 * List all available AI agents
 */
router.get('/agents', getAgents);

/**
 * GET /api/ai/agents/:agentCode
 * Get specific agent details
 */
router.get('/agents/:agentCode', getAgent);

/**
 * GET /api/ai/agents/:agentCode/capabilities
 * Get agent capabilities
 */
router.get('/agents/:agentCode/capabilities', getAgentCapabilities);

/**
 * POST /api/ai/agents/:agentCode/chat
 * Chat with an AI agent
 * Body: { message: string, contextData?: object }
 */
router.post('/agents/:agentCode/chat', chat);

/**
 * POST /api/ai/agents/:agentCode/stream
 * Stream chat with an AI agent (Server-Sent Events)
 * Body: { message: string, contextData?: object }
 */
router.post('/agents/:agentCode/stream', streamChat);

// ================================================
// CONVERSATION MANAGEMENT
// ================================================

/**
 * GET /api/ai/conversations
 * Get user's conversations
 * Query: ?includeArchived=true
 */
router.get('/conversations', getConversations);

/**
 * GET /api/ai/conversations/:conversationId/history
 * Get conversation message history
 * Query: ?limit=50
 */
router.get('/conversations/:conversationId/history', getConversationHistory);

/**
 * POST /api/ai/conversations/:conversationId/archive
 * Archive a conversation
 */
router.post('/conversations/:conversationId/archive', archiveConversation);

// ================================================
// AI SUGGESTIONS
// ================================================

/**
 * GET /api/ai/suggestions
 * Get AI-generated suggestions for user
 */
router.get('/suggestions', getSuggestions);

/**
 * PATCH /api/ai/suggestions/:suggestionId
 * Update suggestion status
 * Body: { status: 'VIEWED' | 'ACTIONED' | 'DISMISSED' }
 */
router.patch('/suggestions/:suggestionId', updateSuggestionStatus);

// ================================================
// MACHINE LEARNING & KNOWLEDGE BASE
// ================================================

/**
 * POST /api/ai/feedback/:conversationId
 * Record feedback on an AI response (for learning)
 * Body: { wasHelpful: boolean, feedback?: string }
 */
router.post('/feedback/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { wasHelpful, feedback } = req.body;
        const tenantId = (req as any).tenant?.id;
        
        if (typeof wasHelpful !== 'boolean') {
            return res.status(400).json({ success: false, error: 'wasHelpful (boolean) is required' });
        }
        
        const { pool } = require('../config/database');
        await pool.query(
            `UPDATE ai_conversations SET was_helpful = $1, feedback = $2 WHERE id = $3 AND tenant_id = $4`,
            [wasHelpful, feedback || null, conversationId, tenantId]
        );
        
        res.json({ success: true, message: 'Thank you for your feedback! This helps me improve.' });
    } catch (error) {
        console.error('Feedback error:', error);
        res.status(500).json({ success: false, error: 'Failed to record feedback' });
    }
});

/**
 * GET /api/ai/faq
 * Get frequently asked questions (learned from conversations)
 * Query: ?category=sales|hr|financial|etc
 */
router.get('/faq', async (req, res) => {
    try {
        const tenantId = (req as any).tenant?.id;
        const category = req.query.category as string | undefined;
        
        const { pool } = require('../config/database');
        const result = await pool.query(
            `SELECT id, question, answer, category, helpful_count, is_featured
             FROM ai_faq
             WHERE (tenant_id = $1 OR tenant_id IS NULL)
             ${category ? 'AND category = $2' : ''}
             ORDER BY is_featured DESC, helpful_count DESC
             LIMIT 20`,
            category ? [tenantId, category] : [tenantId]
        );
        
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('FAQ error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch FAQs' });
    }
});

/**
 * GET /api/ai/analytics
 * Get AI usage analytics (for admin dashboard)
 */
router.get('/analytics', async (req, res) => {
    try {
        const tenantId = (req as any).tenant?.id;
        const { pool } = require('../config/database');
        
        const [total, helpful, categories] = await Promise.all([
            pool.query(`SELECT COUNT(*) FROM ai_conversations WHERE tenant_id = $1`, [tenantId]),
            pool.query(
                `SELECT COUNT(*) FILTER (WHERE was_helpful = true) as helpful,
                        COUNT(*) FILTER (WHERE was_helpful IS NOT NULL) as rated
                 FROM ai_conversations WHERE tenant_id = $1`,
                [tenantId]
            ),
            pool.query(
                `SELECT topic_category, COUNT(*) as count 
                 FROM ai_conversations WHERE tenant_id = $1 AND topic_category IS NOT NULL
                 GROUP BY topic_category ORDER BY count DESC LIMIT 5`,
                [tenantId]
            )
        ]);
        
        const rated = parseInt(helpful.rows[0]?.rated || '0');
        const helpfulCount = parseInt(helpful.rows[0]?.helpful || '0');
        
        res.json({
            success: true,
            data: {
                totalConversations: parseInt(total.rows[0]?.count || '0'),
                helpfulRate: rated > 0 ? `${(helpfulCount / rated * 100).toFixed(1)}%` : 'N/A',
                topCategories: categories.rows,
                learningStatus: 'Active - Improving with every conversation'
            }
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
    }
});

/**
 * GET /api/ai/knowledge
 * Get ERP knowledge base for help center
 * Query: ?module=sales|hr|financial|etc
 */
router.get('/knowledge', async (req, res) => {
    try {
        const module = req.query.module as string | undefined;
        const { ERP_KNOWLEDGE } = await import('../services/ai/ERPKnowledgeBase');
        
        if (module && (ERP_KNOWLEDGE.modules as any)[module]) {
            res.json({
                success: true,
                data: {
                    module: (ERP_KNOWLEDGE.modules as any)[module],
                    glossary: ERP_KNOWLEDGE.glossary
                }
            });
        } else {
            res.json({
                success: true,
                data: {
                    systemOverview: ERP_KNOWLEDGE.systemOverview,
                    modules: Object.entries(ERP_KNOWLEDGE.modules).map(([key, m]: [string, any]) => ({
                        key,
                        name: m.name,
                        description: m.description,
                        navigation: m.navigation
                    })),
                    glossary: ERP_KNOWLEDGE.glossary,
                    compliance: ERP_KNOWLEDGE.compliance
                }
            });
        }
    } catch (error) {
        console.error('Knowledge error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch knowledge base' });
    }
});

/**
 * GET /api/ai/knowledge/search
 * Search the ERP knowledge base
 * Query: ?q=search+term
 */
router.get('/knowledge/search', async (req, res) => {
    try {
        const query = req.query.q as string;
        if (!query) {
            return res.status(400).json({ success: false, error: 'Search query (q) is required' });
        }
        
        const { searchKnowledge } = await import('../services/ai/ERPKnowledgeBase');
        const results = searchKnowledge(query);
        
        res.json({
            success: true,
            data: { query, results, resultsCount: results.length }
        });
    } catch (error) {
        console.error('Knowledge search error:', error);
        res.status(500).json({ success: false, error: 'Failed to search knowledge base' });
    }
});

// ================================================
// SALES ASSISTANT - SPECIFIC ENDPOINTS
// ================================================

/**
 * POST /api/ai/sales/analyze-customer/:customerId
 * Analyze customer for upsell opportunities
 */
router.post('/sales/analyze-customer/:customerId', salesAssistant.analyzeCustomer);

/**
 * POST /api/ai/sales/generate-quotation
 * Generate quotation with AI assistance
 * Body: { customerId: string, items: array }
 */
router.post('/sales/generate-quotation', salesAssistant.generateQuotation);

/**
 * GET /api/ai/sales/forecast
 * Forecast sales
 * Query: ?period=month|quarter|year
 */
router.get('/sales/forecast', salesAssistant.forecastSales);

// ================================================
// COMPLIANCE ASSISTANT - SPECIFIC ENDPOINTS
// ================================================

/**
 * GET /api/ai/compliance/check
 * Check current compliance status
 */
router.get('/compliance/check', complianceAssistant.checkCompliance);

/**
 * GET /api/ai/compliance/assess-risk
 * Assess compliance risks
 * Query: ?area=financial|operational|regulatory
 */
router.get('/compliance/assess-risk', complianceAssistant.assessRisk);

// ================================================
// FINANCE ASSISTANT - SPECIFIC ENDPOINTS
// ================================================

/**
 * GET /api/ai/finance/explain-variance
 * Explain account variance
 * Query: ?accountCode=xxx&period=2024-01
 */
router.get('/finance/explain-variance', financeAssistant.explainVariance);

/**
 * POST /api/ai/finance/reconcile/:accountCode
 * Help reconcile account
 */
router.post('/finance/reconcile/:accountCode', financeAssistant.reconcileAccount);

// ================================================
// ADDITIONAL MODULE-SPECIFIC ROUTES
// (Can be extended for other assistants)
// ================================================

/**
 * POST /api/ai/procurement/optimize-po
 * Procurement assistant - optimize purchase order
 */
router.post('/procurement/optimize-po', async (req, res) => {
    // TODO: Implement procurement-specific logic
    res.status(501).json({ message: 'Coming soon' });
});

/**
 * POST /api/ai/hr/onboard-employee
 * HR assistant - guide employee onboarding
 */
router.post('/hr/onboard-employee', async (req, res) => {
    // TODO: Implement HR-specific logic
    res.status(501).json({ message: 'Coming soon' });
});

/**
 * GET /api/ai/analytics/insights
 * Analytics assistant - generate data insights
 */
router.get('/analytics/insights', async (req, res) => {
    // TODO: Implement analytics-specific logic
    res.status(501).json({ message: 'Coming soon' });
});

/**
 * GET /api/ai/treasury/optimize-cash
 * Treasury assistant - optimize cash position
 */
router.get('/treasury/optimize-cash', async (req, res) => {
    // TODO: Implement treasury-specific logic
    res.status(501).json({ message: 'Coming soon' });
});

export default router;
