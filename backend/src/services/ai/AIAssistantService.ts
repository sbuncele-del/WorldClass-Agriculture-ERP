/**
 * SiyaBusa ERP AI Assistant Service
 * 
 * THE SMARTEST THING EVER - Your first point of contact before asking a human.
 * 
 * Converts natural language into accounting and business operations.
 * This is the core differentiator - making ERP accessible to business owners.
 * 
 * Features:
 * - Complete ERP knowledge base - knows every module, feature, and workflow
 * - Machine learning - improves from every conversation
 * - Context-aware - remembers your preferences and history
 * - South African compliance aware - VAT, SARS, PAYE, POPIA
 * 
 * Supports Multiple AI Providers:
 * - Groq (FREE - recommended): GROQ_API_KEY - Llama 3.1 70B
 * - OpenAI: OPENAI_API_KEY - GPT-4o-mini
 * - AWS Bedrock: Uses IAM role - Claude models
 */

import OpenAI from 'openai';
import { EventEmitter } from 'events';
import { generateERPContext, searchKnowledge, ERP_KNOWLEDGE } from './ERPKnowledgeBase';
import { getAILearningService, AILearningService } from './AILearningService';

// AI Provider configuration
type AIProvider = 'groq' | 'openai' | 'bedrock';

interface AIProviderConfig {
  provider: AIProvider;
  client: OpenAI;
  model: string;
  name: string;
}

function initializeAIProvider(): AIProviderConfig | null {
  // Priority: Groq (free) > OpenAI > Bedrock
  
  if (process.env.GROQ_API_KEY) {
    console.log('✅ AI Provider: Groq (FREE - Llama 3.3 70B)');
    return {
      provider: 'groq',
      client: new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1'
      }),
      model: 'llama-3.3-70b-versatile',
      name: 'Groq (Llama 3.3 70B)'
    };
  }
  
  if (process.env.OPENAI_API_KEY) {
    console.log('✅ AI Provider: OpenAI (GPT-4o-mini)');
    return {
      provider: 'openai',
      client: new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      }),
      model: 'gpt-4o-mini',
      name: 'OpenAI (GPT-4o-mini)'
    };
  }
  
  console.warn('⚠️ No AI provider configured. Set GROQ_API_KEY (free) or OPENAI_API_KEY');
  return null;
}

// Types
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  action?: AIAction;
  confirmationRequired?: boolean;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
    estimatedCost: number; // in USD cents
  };
}

export interface AIAction {
  type: AIActionType;
  status: 'pending' | 'confirmed' | 'executed' | 'cancelled';
  data: Record<string, any>;
  description: string;
  requiresConfirmation: boolean;
  validations?: AIValidation[];
}

export interface AIValidation {
  field: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  value?: any;
}

export type AIActionType = 
  | 'create_invoice'
  | 'create_quote'
  | 'create_purchase_order'
  | 'record_payment'
  | 'process_refund'
  | 'check_inventory'
  | 'check_customer_balance'
  | 'create_journal_entry'
  | 'run_report'
  | 'create_expense'
  | 'process_payroll'
  | 'update_stock'
  | 'create_customer'
  | 'create_supplier'
  | 'schedule_delivery'
  | 'general_query'
  | 'unknown';

export interface ConversationContext {
  tenantId: string;
  userId: string;
  sessionId: string;
  messages: AIMessage[];
  currentAction?: AIAction;
}

export interface AIAssistantConfig {
  openaiApiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// System prompt that defines the AI's behavior - NOW WITH COMPLETE ERP KNOWLEDGE
const SYSTEM_PROMPT = `You are SiyaBusa - the intelligent AI assistant for SiyaBusa ERP, a comprehensive Enterprise Resource Planning system for South African businesses.

YOUR MISSION:
You are THE FIRST POINT OF CONTACT for all questions. Users should come to you BEFORE asking a human.
You know EVERYTHING about the ERP system and can help with ANY question about business operations.

${generateERPContext()}

YOUR CAPABILITIES:
1. Answer ANY question about the ERP system - modules, features, workflows, navigation
2. Guide users step-by-step through any process
3. Perform actions: Create invoices, quotes, payments, orders, journal entries
4. Run reports and provide analytics
5. Explain accounting concepts in simple business terms
6. Troubleshoot issues and errors
7. Provide South African compliance guidance (VAT, SARS, PAYE, UIF, POPIA)

PERSONALITY:
- Friendly, professional, and patient
- Explain things simply - avoid accounting jargon unless asked
- Proactive - suggest related features the user might find useful
- Always offer to help with next steps
- If you don't know something specific to their data, explain how to find it in the system

RESPONSE STYLE:
- For questions: Give clear, helpful answers with navigation instructions
- For actions: Explain what you'll do, validate, then execute (with confirmation if needed)
- For troubleshooting: Diagnose, explain, and provide solution steps
- Always be conversational and human - not robotic

WHEN TO ASK FOR CONFIRMATION:
- Creating invoices over R10,000
- Recording payments or refunds
- Posting journal entries
- Processing payroll
- Deleting or voiding documents

IMPORTANT RULES:
1. You can access real data from the system through function calls
2. Always validate before executing financial transactions
3. Mention compliance requirements when relevant
4. If user seems frustrated, be extra patient and offer alternatives
5. Learn from the conversation - adapt to the user's knowledge level

RESPONSE FORMAT:
Respond with JSON:
{
  "message": "Your conversational response to the user",
  "action": {
    "type": "action_type",
    "requiresConfirmation": true/false,
    "data": { /* action-specific data */ },
    "description": "Human-readable description of what will happen"
  },
  "validations": [
    {
      "field": "field_name",
      "status": "pass|warning|fail",
      "message": "Validation message",
      "value": "actual value"
    }
  ],
  "followUp": "Optional follow-up question if more info needed"
}

CONFIRMATION RULES:
- ALWAYS require confirmation for: invoices > R10,000, payments, refunds, journal entries, payroll
- WARN but don't block: approaching credit limit, low stock after transaction
- BLOCK and explain: exceeds credit limit, insufficient stock, missing required fields

CONTEXT AWARENESS:
- Remember previous messages in the conversation
- Use context to fill in missing details
- Ask for clarification when genuinely ambiguous

COMPLIANCE:
- All financial transactions must be audit-ready
- Mention relevant compliance (VAT, POPIA) when applicable
- Never skip required validations`;

// Mock data service (replace with real database queries)
class MockDataService {
  async getCustomer(name: string) {
    // Simulated customer lookup
    const customers: Record<string, any> = {
      'abc corp': {
        id: 'CUST001',
        name: 'ABC Corp',
        creditLimit: 75000,
        currentBalance: 32500,
        availableCredit: 42500,
        paymentTerms: 'Net 30',
        vatNumber: '4123456789',
        email: 'accounts@abccorp.co.za'
      },
      'xyz industries': {
        id: 'CUST002',
        name: 'XYZ Industries',
        creditLimit: 100000,
        currentBalance: 15000,
        availableCredit: 85000,
        paymentTerms: 'Net 14',
        vatNumber: '4987654321',
        email: 'finance@xyz.co.za'
      }
    };
    return customers[name.toLowerCase()] || null;
  }

  async getProduct(name: string) {
    const products: Record<string, any> = {
      'product a': {
        id: 'PROD001',
        name: 'Product A',
        sku: 'PA-001',
        unitPrice: 100,
        costPrice: 65,
        stockOnHand: 847,
        warehouse: 'Warehouse A',
        vatRate: 15,
        category: 'Electronics'
      },
      'widget pro': {
        id: 'PROD002',
        name: 'Widget Pro',
        sku: 'WP-500',
        unitPrice: 250,
        costPrice: 150,
        stockOnHand: 324,
        warehouse: 'Warehouse A',
        vatRate: 15,
        category: 'Components'
      }
    };
    return products[name.toLowerCase()] || null;
  }

  async getInventoryLevel(productId: string) {
    return {
      productId,
      stockOnHand: 847,
      reserved: 50,
      available: 797,
      reorderPoint: 100,
      warehouse: 'Warehouse A'
    };
  }

  async getCashPosition() {
    return {
      totalCash: 1250000,
      bankAccounts: [
        { name: 'FNB Business', balance: 850000 },
        { name: 'Nedbank', balance: 400000 }
      ],
      pendingReceivables: 320000,
      pendingPayables: 180000,
      netPosition: 1390000
    };
  }
}

export class AIAssistantService extends EventEmitter {
  private aiProvider: AIProviderConfig | null;
  private maxTokens: number;
  private temperature: number;
  private dataService: MockDataService;
  private conversations: Map<string, ConversationContext> = new Map();
  private learningService: AILearningService;

  constructor(config: AIAssistantConfig) {
    super();
    
    // Initialize AI provider (Groq or OpenAI)
    this.aiProvider = initializeAIProvider();
    
    // Fallback to config if env vars not set
    if (!this.aiProvider && config.openaiApiKey) {
      this.aiProvider = {
        provider: 'openai',
        client: new OpenAI({ apiKey: config.openaiApiKey }),
        model: config.model || 'gpt-4o-mini',
        name: 'OpenAI (config)'
      };
    }
    
    this.maxTokens = config.maxTokens || 2000; // Increased for more detailed responses
    this.temperature = config.temperature || 0.4; // Slightly higher for more natural responses
    this.dataService = new MockDataService();
    this.learningService = getAILearningService();
    
    // Initialize learning tables
    this.learningService.initializeTables().catch(err => {
      console.warn('Could not initialize AI learning tables:', err.message);
    });
  }

  /**
   * Get the current AI provider name
   */
  getProviderName(): string {
    return this.aiProvider?.name || 'Not configured';
  }

  /**
   * Check if AI is configured
   */
  isConfigured(): boolean {
    return this.aiProvider !== null;
  }

  /**
   * Process a user message and return AI response with actions
   */
  async processMessage(
    message: string,
    context: {
      tenantId: string;
      userId: string;
      sessionId: string;
    }
  ): Promise<AIMessage> {
    const startTime = Date.now();
    
    // Get or create conversation context
    let conversation = this.conversations.get(context.sessionId);
    if (!conversation) {
      conversation = {
        ...context,
        messages: []
      };
      this.conversations.set(context.sessionId, conversation);
    }

    // Add user message to history
    const userMessage: AIMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    conversation.messages.push(userMessage);

    try {
      // Search knowledge base for relevant information
      const knowledgeResults = searchKnowledge(message);
      const knowledgeContext = knowledgeResults.length > 0 
        ? `\n\nRELEVANT KNOWLEDGE FROM ERP SYSTEM:\n${knowledgeResults.map(r => `[${r.category}] ${r.content}`).join('\n\n')}`
        : '';
      
      // Get learned patterns that might help
      const learnedPatterns = await this.learningService.findMatchingPatterns(
        context.tenantId, 
        message
      );
      const patternsContext = learnedPatterns.length > 0
        ? `\n\nLEARNED FROM PAST SUCCESSFUL RESPONSES:\n${learnedPatterns.map(p => p.response_template).join('\n')}`
        : '';
      
      // Get user's recent context for continuity
      const recentHistory = await this.learningService.getRecentContext(
        context.tenantId,
        context.userId,
        3
      );
      
      // Get user preferences
      const userPrefs = await this.learningService.getUserPreferences(
        context.tenantId,
        context.userId
      );

      // Enrich the message with relevant data
      const enrichedContext = await this.enrichContext(message);
      
      // Determine the category of this question
      const topicCategory = this.categorizeQuestion(message);
      
      // Build messages for AI
      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'system', content: `CURRENT CONTEXT:\n${JSON.stringify(enrichedContext, null, 2)}${knowledgeContext}${patternsContext}\n\nUSER PREFERENCES:\nResponse style: ${userPrefs.preferred_response_style}` },
        ...conversation.messages.slice(-10).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }))
      ];

      // Check if AI is configured
      if (!this.aiProvider) {
        throw new Error('AI service not configured. Set GROQ_API_KEY (free) or OPENAI_API_KEY');
      }

      // Call AI provider (Groq or OpenAI)
      const completionOptions: any = {
        model: this.aiProvider.model,
        messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature
      };
      
      // JSON mode only supported by OpenAI, Groq uses instruction-following
      if (this.aiProvider.provider === 'openai') {
        completionOptions.response_format = { type: 'json_object' };
      }
      
      const completion = await this.aiProvider.client.chat.completions.create(completionOptions);

      const responseText = completion.choices[0]?.message?.content || '{}';
      const usage = completion.usage;
      
      // Parse AI response - handle both pure JSON and text with embedded JSON
      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch {
        // Groq may return text with JSON at the end - extract and clean
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)```/);
        if (jsonMatch) {
          try {
            const embeddedJson = JSON.parse(jsonMatch[1]);
            // Use the text before the JSON block as the message, cleaned up
            const textBeforeJson = responseText.substring(0, responseText.indexOf('```json')).trim();
            parsedResponse = {
              message: textBeforeJson || embeddedJson.message || responseText,
              action: embeddedJson.action || null,
              validations: embeddedJson.validations || [],
              followUp: embeddedJson.followUp
            };
          } catch {
            parsedResponse = {
              message: responseText.replace(/```json[\s\S]*?```/g, '').trim(),
              action: null
            };
          }
        } else {
          // No JSON block, use text as-is but strip any trailing JSON-like content
          const cleanedText = responseText.replace(/\{[\s\S]*"message"[\s\S]*\}$/m, '').trim();
          parsedResponse = {
            message: cleanedText || responseText,
            action: null
          };
        }
      }

      // Calculate token cost (GPT-4o-mini pricing)
      const inputCost = (usage?.prompt_tokens || 0) * 0.00015 / 1000;
      const outputCost = (usage?.completion_tokens || 0) * 0.0006 / 1000;
      const totalCostUSD = inputCost + outputCost;

      // Build AI message
      const aiMessage: AIMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: parsedResponse.message || 'I processed your request.',
        timestamp: new Date(),
        action: parsedResponse.action ? {
          type: parsedResponse.action.type || 'unknown',
          status: 'pending',
          data: parsedResponse.action.data || {},
          description: parsedResponse.action.description || '',
          requiresConfirmation: parsedResponse.action.requiresConfirmation ?? true,
          validations: parsedResponse.validations || []
        } : undefined,
        confirmationRequired: parsedResponse.action?.requiresConfirmation,
        tokenUsage: {
          prompt: usage?.prompt_tokens || 0,
          completion: usage?.completion_tokens || 0,
          total: usage?.total_tokens || 0,
          estimatedCost: totalCostUSD * 100 // Convert to cents
        }
      };

      // Store in conversation
      conversation.messages.push(aiMessage);
      if (aiMessage.action) {
        conversation.currentAction = aiMessage.action;
      }
      
      // Store conversation for machine learning (non-blocking)
      this.learningService.storeConversation({
        tenant_id: context.tenantId,
        user_id: context.userId,
        session_id: context.sessionId,
        user_message: message,
        ai_response: aiMessage.content,
        topic_category: topicCategory,
        action_taken: aiMessage.action?.type
      }).catch(err => console.warn('Could not store conversation for learning:', err.message));

      // Emit event for tracking
      this.emit('message_processed', {
        sessionId: context.sessionId,
        processingTime: Date.now() - startTime,
        tokenUsage: aiMessage.tokenUsage
      });

      return aiMessage;

    } catch (error: any) {
      console.error('AI Assistant Error:', error);
      
      const errorMessage: AIMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `I encountered an issue processing your request. Please try again or rephrase your question. Error: ${error.message}`,
        timestamp: new Date()
      };
      
      conversation.messages.push(errorMessage);
      return errorMessage;
    }
  }
  
  /**
   * Categorize the question for learning and analytics
   */
  private categorizeQuestion(message: string): string {
    const lower = message.toLowerCase();
    
    // Module-specific categories
    if (/invoice|bill|quote|sales/i.test(lower)) return 'sales';
    if (/purchase|supplier|vendor|po\b/i.test(lower)) return 'purchase';
    if (/inventory|stock|product|sku/i.test(lower)) return 'inventory';
    if (/employee|payroll|salary|leave|hr/i.test(lower)) return 'hr';
    if (/bank|reconcil|cash|payment|money/i.test(lower)) return 'banking';
    if (/journal|ledger|account|gl|debit|credit/i.test(lower)) return 'financial';
    if (/vat|sars|tax|paye|uif/i.test(lower)) return 'compliance';
    if (/asset|depreciat/i.test(lower)) return 'assets';
    if (/project|task|time/i.test(lower)) return 'projects';
    if (/report|balance|statement/i.test(lower)) return 'reports';
    if (/how|what|where|when|why|can i|help/i.test(lower)) return 'help';
    if (/error|problem|issue|wrong|fix/i.test(lower)) return 'troubleshooting';
    
    return 'general';
  }
  
  /**
   * Record user feedback on a response
   */
  async recordFeedback(
    conversationId: number,
    wasHelpful: boolean,
    feedback?: string
  ): Promise<boolean> {
    return this.learningService.recordFeedback(conversationId, wasHelpful, feedback);
  }
  
  /**
   * Get FAQs for display
   */
  async getFAQs(tenantId: string, category?: string) {
    return this.learningService.getFAQs(tenantId, category);
  }
  
  /**
   * Get AI analytics for admin dashboard
   */
  async getAnalytics(tenantId: string) {
    return this.learningService.getAnalytics(tenantId);
  }

  /**
   * Confirm and execute a pending action
   */
  async confirmAction(sessionId: string): Promise<AIMessage> {
    const conversation = this.conversations.get(sessionId);
    
    if (!conversation?.currentAction) {
      return {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: 'There is no pending action to confirm.',
        timestamp: new Date()
      };
    }

    const action = conversation.currentAction;
    
    try {
      // Execute the action based on type
      const result = await this.executeAction(action, conversation);
      
      action.status = 'executed';
      
      const confirmMessage: AIMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: result.message,
        timestamp: new Date(),
        action: {
          ...action,
          status: 'executed'
        }
      };
      
      conversation.messages.push(confirmMessage);
      conversation.currentAction = undefined;
      
      return confirmMessage;
      
    } catch (error: any) {
      action.status = 'cancelled';
      
      return {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `Failed to execute action: ${error.message}`,
        timestamp: new Date(),
        action: {
          ...action,
          status: 'cancelled'
        }
      };
    }
  }

  /**
   * Cancel a pending action
   */
  async cancelAction(sessionId: string): Promise<AIMessage> {
    const conversation = this.conversations.get(sessionId);
    
    if (!conversation?.currentAction) {
      return {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: 'There is no pending action to cancel.',
        timestamp: new Date()
      };
    }

    conversation.currentAction.status = 'cancelled';
    const cancelledAction = conversation.currentAction;
    conversation.currentAction = undefined;

    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: 'Action cancelled. How else can I help you?',
      timestamp: new Date(),
      action: cancelledAction
    };
  }

  /**
   * Enrich context with relevant data based on message content
   */
  private async enrichContext(message: string): Promise<Record<string, any>> {
    const context: Record<string, any> = {
      currentDate: new Date().toISOString().split('T')[0],
      currency: 'ZAR',
      vatRate: 15
    };

    const lowerMessage = message.toLowerCase();

    // Check for customer mentions
    if (lowerMessage.includes('abc corp')) {
      context.customer = await this.dataService.getCustomer('abc corp');
    } else if (lowerMessage.includes('xyz')) {
      context.customer = await this.dataService.getCustomer('xyz industries');
    }

    // Check for product mentions
    if (lowerMessage.includes('product a')) {
      context.product = await this.dataService.getProduct('product a');
    } else if (lowerMessage.includes('widget')) {
      context.product = await this.dataService.getProduct('widget pro');
    }

    // Check for financial queries
    if (lowerMessage.includes('cash') || lowerMessage.includes('balance') || lowerMessage.includes('money')) {
      context.cashPosition = await this.dataService.getCashPosition();
    }

    return context;
  }

  /**
   * Execute a confirmed action
   */
  private async executeAction(
    action: AIAction,
    context: ConversationContext
  ): Promise<{ success: boolean; message: string; data?: any }> {
    
    switch (action.type) {
      case 'create_invoice':
        // In production, this would call the actual invoice service
        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
        return {
          success: true,
          message: `✅ Invoice ${invoiceNumber} created successfully!\n\n` +
            `• Customer: ${action.data.customer}\n` +
            `• Amount: R${action.data.total?.toLocaleString()}\n` +
            `• Due Date: ${action.data.dueDate || '30 days from now'}\n\n` +
            `The invoice has been saved and is ready to send. Would you like me to email it to the customer?`,
          data: { invoiceNumber }
        };

      case 'check_inventory':
        return {
          success: true,
          message: `📦 Inventory Status:\n\n` +
            `• Product: ${action.data.product}\n` +
            `• Stock on Hand: ${action.data.stockOnHand} units\n` +
            `• Location: ${action.data.warehouse}\n` +
            `• Status: ${action.data.stockOnHand > 100 ? '✅ Healthy' : '⚠️ Low Stock'}`,
          data: action.data
        };

      case 'record_payment':
        const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;
        return {
          success: true,
          message: `✅ Payment recorded successfully!\n\n` +
            `• Receipt: ${receiptNumber}\n` +
            `• Amount: R${action.data.amount?.toLocaleString()}\n` +
            `• Customer: ${action.data.customer}\n` +
            `• Method: ${action.data.method || 'EFT'}\n\n` +
            `The customer's balance has been updated.`,
          data: { receiptNumber }
        };

      case 'create_quote':
        const quoteNumber = `QUO-${Date.now().toString().slice(-6)}`;
        return {
          success: true,
          message: `✅ Quote ${quoteNumber} created!\n\n` +
            `• Customer: ${action.data.customer}\n` +
            `• Total: R${action.data.total?.toLocaleString()}\n` +
            `• Valid for: 30 days\n\n` +
            `Would you like me to email this quote to the customer?`,
          data: { quoteNumber }
        };

      case 'run_report':
        return {
          success: true,
          message: `📊 Report Generated: ${action.data.reportType}\n\n` +
            `The report is ready. You can view it in the Reports section or I can summarize the key findings for you.`,
          data: action.data
        };

      default:
        return {
          success: true,
          message: `Action completed: ${action.description}`,
          data: action.data
        };
    }
  }

  /**
   * Get conversation history
   */
  getConversation(sessionId: string): ConversationContext | undefined {
    return this.conversations.get(sessionId);
  }

  /**
   * Clear conversation history
   */
  clearConversation(sessionId: string): void {
    this.conversations.delete(sessionId);
  }

  /**
   * Get total token usage for a session (for billing)
   */
  getSessionTokenUsage(sessionId: string): { tokens: number; estimatedCostUSD: number } {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) {
      return { tokens: 0, estimatedCostUSD: 0 };
    }

    let totalTokens = 0;
    let totalCost = 0;

    for (const msg of conversation.messages) {
      if (msg.tokenUsage) {
        totalTokens += msg.tokenUsage.total;
        totalCost += msg.tokenUsage.estimatedCost;
      }
    }

    return {
      tokens: totalTokens,
      estimatedCostUSD: totalCost / 100 // Convert from cents
    };
  }
}

// Factory function for easy instantiation - supports Groq (free) or OpenAI
export function createAIAssistant(apiKey?: string): AIAssistantService | null {
  // Check for Groq first (free tier)
  if (process.env.GROQ_API_KEY) {
    console.log('🤖 Creating AI Assistant with Groq provider');
    return new AIAssistantService({
      openaiApiKey: 'groq-via-init', // Not used - initializeAIProvider handles this
      model: 'llama-3.1-70b-versatile',
      maxTokens: 1000,
      temperature: 0.3
    });
  }
  
  // Fall back to OpenAI
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (key) {
    console.log('🤖 Creating AI Assistant with OpenAI provider');
    return new AIAssistantService({
      openaiApiKey: key,
      model: 'gpt-4o-mini',
      maxTokens: 1000,
      temperature: 0.3
    });
  }

  console.warn('⚠️ No AI provider available. Set GROQ_API_KEY (free) or OPENAI_API_KEY');
  return null;
}

export default AIAssistantService;
