/**
 * AI Agent Service
 * Core service for AI-powered assistants
 * Supports: x.ai/Grok, OpenAI, Anthropic
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import pool from '../config/database';

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface AgentConfig {
    agent_id: string;
    agent_code: string;
    agent_name: string;
    module_name: string;
    system_prompt: string;
    capabilities: string[];
    model_name: string;
    temperature: number;
    max_tokens: number;
}

interface ConversationContext {
    conversation_id: string;
    tenant_id: string;
    user_id: string;
    agent_id: string;
    context_data: any;
}

class AIAgentService {
    private openaiClient: OpenAI | null = null;
    private anthropicClient: Anthropic | null = null;
    private xaiClient: OpenAI | null = null;  // x.ai uses OpenAI-compatible API
    private activeProvider: 'xai' | 'openai' | 'anthropic' | null = null;

    constructor() {
        // Initialize x.ai/Grok FIRST (priority)
        if (process.env.XAI_API_KEY) {
            this.xaiClient = new OpenAI({
                apiKey: process.env.XAI_API_KEY,
                baseURL: 'https://api.x.ai/v1',
            });
            this.activeProvider = 'xai';
            console.log('🤖 AI Agent: Using x.ai/Grok');
        }
        // Then try OpenAI
        else if (process.env.OPENAI_API_KEY) {
            this.openaiClient = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
            this.activeProvider = 'openai';
            console.log('🤖 AI Agent: Using OpenAI');
        }
        // Finally try Anthropic
        else if (process.env.ANTHROPIC_API_KEY) {
            this.anthropicClient = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY,
            });
            this.activeProvider = 'anthropic';
            console.log('🤖 AI Agent: Using Anthropic');
        } else {
            console.warn('⚠️ AI Agent: No AI provider configured (XAI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY)');
        }
    }

    /**
     * Check if AI is available
     */
    isAvailable(): boolean {
        return this.activeProvider !== null;
    }

    /**
     * Get active provider name
     */
    getProvider(): string {
        return this.activeProvider || 'none';
    }

    /**
     * Get AI agent configuration
     */
    async getAgent(agentCode: string): Promise<AgentConfig | null> {
        const result = await pool.query(
            'SELECT * FROM ai_agents WHERE agent_code = $1 AND is_active = true',
            [agentCode]
        );

        if (result.rows.length === 0) return null;
        return result.rows[0];
    }

    /**
     * Create or get conversation
     */
    async getOrCreateConversation(
        tenantId: string,
        userId: string,
        agentCode: string,
        contextData: any = {}
    ): Promise<string> {
        const agent = await this.getAgent(agentCode);
        if (!agent) throw new Error('Agent not found');

        // Check for existing active conversation
        const existingResult = await pool.query(
            `SELECT conversation_id FROM ai_conversations 
             WHERE tenant_id = $1 AND user_id = $2 AND agent_id = $3 
             AND is_archived = false 
             ORDER BY last_message_at DESC LIMIT 1`,
            [tenantId, userId, agent.agent_id]
        );

        if (existingResult.rows.length > 0) {
            return existingResult.rows[0].conversation_id;
        }

        // Create new conversation
        const newResult = await pool.query(
            `INSERT INTO ai_conversations (tenant_id, agent_id, user_id, context_data)
             VALUES ($1, $2, $3, $4) RETURNING conversation_id`,
            [tenantId, agent.agent_id, userId, JSON.stringify(contextData)]
        );

        return newResult.rows[0].conversation_id;
    }

    /**
     * Get conversation history
     */
    async getConversationHistory(conversationId: string, limit: number = 50): Promise<Message[]> {
        const result = await pool.query(
            `SELECT role, content FROM ai_messages 
             WHERE conversation_id = $1 
             ORDER BY created_at ASC LIMIT $2`,
            [conversationId, limit]
        );

        return result.rows;
    }

    /**
     * Save message to conversation
     */
    async saveMessage(
        conversationId: string,
        role: 'user' | 'assistant' | 'system',
        content: string,
        tokensUsed?: number,
        functionCalls?: any
    ): Promise<void> {
        await pool.query(
            `INSERT INTO ai_messages (conversation_id, role, content, tokens_used, function_calls)
             VALUES ($1, $2, $3, $4, $5)`,
            [conversationId, role, content, tokensUsed || null, functionCalls ? JSON.stringify(functionCalls) : null]
        );

        // Update last_message_at
        await pool.query(
            'UPDATE ai_conversations SET last_message_at = CURRENT_TIMESTAMP WHERE conversation_id = $1',
            [conversationId]
        );
    }

    /**
     * Chat with agent using OpenAI
     */
    async chatWithAgent(
        agentCode: string,
        tenantId: string,
        userId: string,
        userMessage: string,
        contextData: any = {}
    ): Promise<{ response: string; conversationId: string }> {
        if (!this.xaiClient && !this.openaiClient && !this.anthropicClient) {
            throw new Error('No AI provider configured. Set XAI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY');
        }

        const agent = await this.getAgent(agentCode);
        if (!agent) throw new Error('Agent not found');

        const conversationId = await this.getOrCreateConversation(tenantId, userId, agentCode, contextData);

        // Save user message
        await this.saveMessage(conversationId, 'user', userMessage);

        // Get conversation history
        const history = await this.getConversationHistory(conversationId);

        // Build messages array
        const messages: Message[] = [
            { role: 'system', content: agent.system_prompt },
            ...history.slice(-10), // Last 10 messages for context
        ];

        let assistantResponse: string;
        let tokensUsed: number = 0;

        // Use x.ai/Grok if available (priority)
        if (this.xaiClient) {
            const completion = await this.xaiClient.chat.completions.create({
                model: 'grok-2-latest',
                messages: messages as any,
                temperature: agent.temperature || 0.7,
                max_tokens: agent.max_tokens || 2000,
            });

            assistantResponse = completion.choices[0].message.content || '';
            tokensUsed = completion.usage?.total_tokens || 0;
        }
        // Use OpenAI if available
        else if (this.openaiClient) {
            const completion = await this.openaiClient.chat.completions.create({
                model: agent.model_name || 'gpt-4',
                messages: messages as any,
                temperature: agent.temperature || 0.7,
                max_tokens: agent.max_tokens || 2000,
            });

            assistantResponse = completion.choices[0].message.content || '';
            tokensUsed = completion.usage?.total_tokens || 0;
        } else if (this.anthropicClient) {
            // Use Anthropic as fallback
            const completion = await this.anthropicClient.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: agent.max_tokens || 2000,
                system: agent.system_prompt,
                messages: history.slice(-10).map(m => ({
                    role: m.role === 'assistant' ? 'assistant' : 'user',
                    content: m.content
                }))
            });

            assistantResponse = completion.content[0].type === 'text' ? completion.content[0].text : '';
            tokensUsed = completion.usage.input_tokens + completion.usage.output_tokens;
        } else {
            throw new Error('No AI provider available');
        }

        // Save assistant response
        await this.saveMessage(conversationId, 'assistant', assistantResponse, tokensUsed);

        // Update usage analytics
        await this.updateUsageAnalytics(tenantId, agent.agent_id, tokensUsed);

        return { response: assistantResponse, conversationId };
    }

    /**
     * Stream chat response (for real-time UX)
     */
    async *streamChatWithAgent(
        agentCode: string,
        tenantId: string,
        userId: string,
        userMessage: string,
        contextData: any = {}
    ): AsyncGenerator<string, void, unknown> {
        // Streaming works with x.ai/Grok or OpenAI (both use OpenAI-compatible API)
        const client = this.xaiClient || this.openaiClient;
        if (!client) {
            throw new Error('Streaming requires x.ai or OpenAI API');
        }

        const agent = await this.getAgent(agentCode);
        if (!agent) throw new Error('Agent not found');

        const conversationId = await this.getOrCreateConversation(tenantId, userId, agentCode, contextData);
        await this.saveMessage(conversationId, 'user', userMessage);

        const history = await this.getConversationHistory(conversationId);
        const messages: Message[] = [
            { role: 'system', content: agent.system_prompt },
            ...history.slice(-10),
        ];

        const model = this.xaiClient ? 'grok-2-latest' : (agent.model_name || 'gpt-4');
        const stream = await client.chat.completions.create({
            model,
            messages: messages as any,
            temperature: agent.temperature || 0.7,
            max_tokens: agent.max_tokens || 2000,
            stream: true,
        });

        let fullResponse = '';
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                fullResponse += content;
                yield content;
            }
        }

        // Save complete response
        await this.saveMessage(conversationId, 'assistant', fullResponse);
    }

    /**
     * Generate proactive suggestion
     */
    async generateSuggestion(
        tenantId: string,
        agentCode: string,
        userId: string | null,
        suggestionType: string,
        title: string,
        description: string,
        actionUrl?: string,
        priority: string = 'MEDIUM'
    ): Promise<string> {
        const agent = await this.getAgent(agentCode);
        if (!agent) throw new Error('Agent not found');

        const result = await pool.query(
            `INSERT INTO ai_suggestions 
             (tenant_id, agent_id, user_id, suggestion_type, title, description, action_url, priority)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING suggestion_id`,
            [tenantId, agent.agent_id, userId, suggestionType, title, description, actionUrl, priority]
        );

        return result.rows[0].suggestion_id;
    }

    /**
     * Get pending suggestions for user
     */
    async getUserSuggestions(tenantId: string, userId: string): Promise<any[]> {
        const result = await pool.query(
            `SELECT s.*, a.agent_name, a.agent_code 
             FROM ai_suggestions s
             JOIN ai_agents a ON s.agent_id = a.agent_id
             WHERE s.tenant_id = $1 AND (s.user_id = $2 OR s.user_id IS NULL)
             AND s.status = 'PENDING'
             AND (s.expires_at IS NULL OR s.expires_at > CURRENT_TIMESTAMP)
             ORDER BY 
                CASE s.priority 
                    WHEN 'CRITICAL' THEN 1
                    WHEN 'HIGH' THEN 2
                    WHEN 'MEDIUM' THEN 3
                    ELSE 4
                END,
                s.created_at DESC`,
            [tenantId, userId]
        );

        return result.rows;
    }

    /**
     * Update usage analytics
     */
    private async updateUsageAnalytics(tenantId: string, agentId: string, tokensUsed: number): Promise<void> {
        await pool.query(
            `INSERT INTO ai_usage_analytics (tenant_id, agent_id, usage_date, total_messages, total_tokens)
             VALUES ($1, $2, CURRENT_DATE, 1, $3)
             ON CONFLICT (tenant_id, agent_id, usage_date) 
             DO UPDATE SET 
                total_messages = ai_usage_analytics.total_messages + 1,
                total_tokens = ai_usage_analytics.total_tokens + $3`,
            [tenantId, agentId, tokensUsed]
        );
    }

    /**
     * Get agent capabilities
     */
    async getAgentCapabilities(agentCode: string): Promise<string[]> {
        const agent = await this.getAgent(agentCode);
        return agent?.capabilities || [];
    }

    /**
     * List all available agents
     */
    async listAgents(): Promise<AgentConfig[]> {
        const result = await pool.query(
            'SELECT * FROM ai_agents WHERE is_active = true ORDER BY module_name, agent_name'
        );
        return result.rows;
    }

    /**
     * Archive conversation
     */
    async archiveConversation(conversationId: string): Promise<void> {
        await pool.query(
            'UPDATE ai_conversations SET is_archived = true WHERE conversation_id = $1',
            [conversationId]
        );
    }

    /**
     * Get user's conversations
     */
    async getUserConversations(tenantId: string, userId: string, includeArchived: boolean = false): Promise<any[]> {
        const query = includeArchived
            ? `SELECT c.*, a.agent_name, a.agent_code, a.module_name,
                      (SELECT COUNT(*) FROM ai_messages WHERE conversation_id = c.conversation_id) as message_count
               FROM ai_conversations c
               JOIN ai_agents a ON c.agent_id = a.agent_id
               WHERE c.tenant_id = $1 AND c.user_id = $2
               ORDER BY c.last_message_at DESC`
            : `SELECT c.*, a.agent_name, a.agent_code, a.module_name,
                      (SELECT COUNT(*) FROM ai_messages WHERE conversation_id = c.conversation_id) as message_count
               FROM ai_conversations c
               JOIN ai_agents a ON c.agent_id = a.agent_id
               WHERE c.tenant_id = $1 AND c.user_id = $2 AND c.is_archived = false
               ORDER BY c.last_message_at DESC`;

        const result = await pool.query(query, [tenantId, userId]);
        return result.rows;
    }
}

export default new AIAgentService();
