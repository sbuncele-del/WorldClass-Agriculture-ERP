/**
 * AI Learning System for SiyaBusa ERP
 * 
 * This service handles:
 * 1. Storing conversation history for learning
 * 2. Tracking which responses were helpful
 * 3. Building FAQ from common questions
 * 4. Continuous improvement through feedback
 */

import { Pool } from 'pg';
import { pool } from '../../config/database';

export interface ConversationEntry {
  id?: number;
  tenant_id: string;
  user_id: string;
  session_id: string;
  user_message: string;
  ai_response: string;
  was_helpful?: boolean;
  feedback?: string;
  topic_category?: string;
  action_taken?: string;
  created_at?: Date;
}

export interface LearnedPattern {
  id?: number;
  tenant_id: string;
  pattern: string;
  response_template: string;
  category: string;
  confidence_score: number;
  usage_count: number;
  success_rate: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface FAQ {
  id?: number;
  tenant_id: string;
  question: string;
  answer: string;
  category: string;
  helpful_count: number;
  total_count: number;
  is_featured: boolean;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Database migrations for AI learning tables
 */
export const AI_LEARNING_MIGRATIONS = `
-- Conversation history for learning
CREATE TABLE IF NOT EXISTS ai_conversations (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  session_id VARCHAR(100) NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  was_helpful BOOLEAN,
  feedback TEXT,
  topic_category VARCHAR(100),
  action_taken VARCHAR(200),
  response_time_ms INTEGER,
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_ai_conversations_tenant ON ai_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_category ON ai_conversations(topic_category);

-- Learned patterns from successful interactions
CREATE TABLE IF NOT EXISTS ai_learned_patterns (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(100) NOT NULL,
  pattern TEXT NOT NULL,
  response_template TEXT NOT NULL,
  category VARCHAR(100),
  confidence_score DECIMAL(5,4) DEFAULT 0.5,
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,4) DEFAULT 0.5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_patterns_tenant ON ai_learned_patterns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_patterns_confidence ON ai_learned_patterns(confidence_score DESC);

-- FAQ generated from common questions
CREATE TABLE IF NOT EXISTS ai_faq (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(100),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100),
  helpful_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_faq_tenant ON ai_faq(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_faq_featured ON ai_faq(is_featured);

-- User preferences for AI
CREATE TABLE IF NOT EXISTS ai_user_preferences (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  preferred_response_style VARCHAR(50) DEFAULT 'detailed',
  preferred_language VARCHAR(10) DEFAULT 'en',
  common_topics TEXT[],
  last_context JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, user_id)
);
`;

export class AILearningService {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  /**
   * Initialize database tables
   */
  async initializeTables(): Promise<void> {
    try {
      await this.pool.query(AI_LEARNING_MIGRATIONS);
      console.log('AI Learning tables initialized');
    } catch (error) {
      console.error('Failed to initialize AI learning tables:', error);
    }
  }

  /**
   * Store a conversation for learning
   */
  async storeConversation(entry: ConversationEntry): Promise<number | null> {
    try {
      const result = await this.pool.query(
        `INSERT INTO ai_conversations 
         (tenant_id, user_id, session_id, user_message, ai_response, topic_category, action_taken)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          entry.tenant_id,
          entry.user_id,
          entry.session_id,
          entry.user_message,
          entry.ai_response,
          entry.topic_category,
          entry.action_taken
        ]
      );
      return result.rows[0]?.id;
    } catch (error) {
      console.error('Failed to store conversation:', error);
      return null;
    }
  }

  /**
   * Record feedback on a conversation
   */
  async recordFeedback(
    conversationId: number,
    wasHelpful: boolean,
    feedback?: string
  ): Promise<boolean> {
    try {
      await this.pool.query(
        `UPDATE ai_conversations 
         SET was_helpful = $1, feedback = $2
         WHERE id = $3`,
        [wasHelpful, feedback, conversationId]
      );

      // If helpful, potentially create a learned pattern
      if (wasHelpful) {
        await this.potentiallyLearnPattern(conversationId);
      }

      return true;
    } catch (error) {
      console.error('Failed to record feedback:', error);
      return false;
    }
  }

  /**
   * Attempt to learn a pattern from a helpful conversation
   */
  private async potentiallyLearnPattern(conversationId: number): Promise<void> {
    try {
      // Get the conversation
      const conv = await this.pool.query(
        `SELECT * FROM ai_conversations WHERE id = $1`,
        [conversationId]
      );

      if (!conv.rows[0]) return;

      const { tenant_id, user_message, ai_response, topic_category } = conv.rows[0];

      // Check if similar pattern exists
      const existing = await this.pool.query(
        `SELECT * FROM ai_learned_patterns 
         WHERE tenant_id = $1 
         AND pattern ILIKE $2
         AND category = $3`,
        [tenant_id, `%${this.extractKeywords(user_message).join('%')}%`, topic_category]
      );

      if (existing.rows[0]) {
        // Update existing pattern
        await this.pool.query(
          `UPDATE ai_learned_patterns 
           SET usage_count = usage_count + 1,
               success_rate = (success_rate * usage_count + 1) / (usage_count + 1),
               confidence_score = LEAST(1, confidence_score + 0.05),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [existing.rows[0].id]
        );
      } else {
        // Create new pattern
        const pattern = this.createPatternFromMessage(user_message);
        await this.pool.query(
          `INSERT INTO ai_learned_patterns 
           (tenant_id, pattern, response_template, category, confidence_score)
           VALUES ($1, $2, $3, $4, 0.6)`,
          [tenant_id, pattern, ai_response, topic_category]
        );
      }
    } catch (error) {
      console.error('Failed to learn pattern:', error);
    }
  }

  /**
   * Extract keywords from a message
   */
  private extractKeywords(message: string): string[] {
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 
                       'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
                       'would', 'could', 'should', 'may', 'might', 'must', 'shall',
                       'can', 'need', 'to', 'of', 'in', 'for', 'on', 'with', 'at',
                       'by', 'from', 'as', 'into', 'through', 'during', 'before',
                       'after', 'above', 'below', 'between', 'under', 'again',
                       'further', 'then', 'once', 'here', 'there', 'when', 'where',
                       'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other',
                       'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so',
                       'than', 'too', 'very', 'just', 'i', 'me', 'my', 'myself',
                       'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they'];

    return message
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
  }

  /**
   * Create a generalized pattern from a message
   */
  private createPatternFromMessage(message: string): string {
    return this.extractKeywords(message).slice(0, 5).join(' ');
  }

  /**
   * Find matching learned patterns
   */
  async findMatchingPatterns(
    tenantId: string,
    message: string,
    limit: number = 3
  ): Promise<LearnedPattern[]> {
    try {
      const keywords = this.extractKeywords(message);
      if (keywords.length === 0) return [];

      // Build search query
      const searchConditions = keywords.map((_, i) => `pattern ILIKE $${i + 2}`);
      const searchValues = keywords.map(k => `%${k}%`);

      const result = await this.pool.query(
        `SELECT * FROM ai_learned_patterns 
         WHERE tenant_id = $1 
         AND (${searchConditions.join(' OR ')})
         AND confidence_score >= 0.5
         ORDER BY confidence_score DESC, success_rate DESC
         LIMIT $${keywords.length + 2}`,
        [tenantId, ...searchValues, limit]
      );

      return result.rows;
    } catch (error) {
      console.error('Failed to find matching patterns:', error);
      return [];
    }
  }

  /**
   * Get frequently asked questions for a tenant
   */
  async getFAQs(tenantId: string, category?: string): Promise<FAQ[]> {
    try {
      let query = `
        SELECT * FROM ai_faq 
        WHERE (tenant_id = $1 OR tenant_id IS NULL)
      `;
      const params: any[] = [tenantId];

      if (category) {
        query += ` AND category = $2`;
        params.push(category);
      }

      query += ` ORDER BY helpful_count DESC, is_featured DESC LIMIT 20`;

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Failed to get FAQs:', error);
      return [];
    }
  }

  /**
   * Add or update an FAQ
   */
  async upsertFAQ(faq: FAQ): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO ai_faq (tenant_id, question, answer, category, is_featured)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
         answer = EXCLUDED.answer,
         category = EXCLUDED.category,
         updated_at = CURRENT_TIMESTAMP`,
        [faq.tenant_id, faq.question, faq.answer, faq.category, faq.is_featured || false]
      );
    } catch (error) {
      console.error('Failed to upsert FAQ:', error);
    }
  }

  /**
   * Get recent conversation context for a user
   */
  async getRecentContext(
    tenantId: string,
    userId: string,
    limit: number = 5
  ): Promise<ConversationEntry[]> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM ai_conversations 
         WHERE tenant_id = $1 AND user_id = $2
         ORDER BY created_at DESC
         LIMIT $3`,
        [tenantId, userId, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Failed to get recent context:', error);
      return [];
    }
  }

  /**
   * Get conversation analytics
   */
  async getAnalytics(tenantId: string): Promise<{
    totalConversations: number;
    helpfulRate: number;
    topCategories: { category: string; count: number }[];
    commonQuestions: string[];
  }> {
    try {
      const total = await this.pool.query(
        `SELECT COUNT(*) as count FROM ai_conversations WHERE tenant_id = $1`,
        [tenantId]
      );

      const helpful = await this.pool.query(
        `SELECT 
           COUNT(*) FILTER (WHERE was_helpful = true) as helpful,
           COUNT(*) FILTER (WHERE was_helpful IS NOT NULL) as rated
         FROM ai_conversations WHERE tenant_id = $1`,
        [tenantId]
      );

      const categories = await this.pool.query(
        `SELECT topic_category as category, COUNT(*) as count 
         FROM ai_conversations 
         WHERE tenant_id = $1 AND topic_category IS NOT NULL
         GROUP BY topic_category 
         ORDER BY count DESC 
         LIMIT 5`,
        [tenantId]
      );

      const questions = await this.pool.query(
        `SELECT user_message 
         FROM ai_conversations 
         WHERE tenant_id = $1 
         AND was_helpful = true
         ORDER BY created_at DESC 
         LIMIT 10`,
        [tenantId]
      );

      return {
        totalConversations: parseInt(total.rows[0]?.count || '0'),
        helpfulRate: helpful.rows[0]?.rated > 0 
          ? helpful.rows[0]?.helpful / helpful.rows[0]?.rated 
          : 0,
        topCategories: categories.rows,
        commonQuestions: questions.rows.map(r => r.user_message)
      };
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return {
        totalConversations: 0,
        helpfulRate: 0,
        topCategories: [],
        commonQuestions: []
      };
    }
  }

  /**
   * Generate FAQ from conversation history
   */
  async generateFAQsFromHistory(tenantId: string): Promise<void> {
    try {
      // Find frequently asked, helpful questions
      const result = await this.pool.query(
        `SELECT user_message, ai_response, topic_category, COUNT(*) as frequency
         FROM ai_conversations
         WHERE tenant_id = $1 AND was_helpful = true
         GROUP BY user_message, ai_response, topic_category
         HAVING COUNT(*) >= 3
         ORDER BY frequency DESC
         LIMIT 20`,
        [tenantId]
      );

      for (const row of result.rows) {
        await this.upsertFAQ({
          tenant_id: tenantId,
          question: row.user_message,
          answer: row.ai_response,
          category: row.topic_category,
          helpful_count: row.frequency,
          total_count: row.frequency,
          is_featured: row.frequency >= 10
        });
      }
    } catch (error) {
      console.error('Failed to generate FAQs:', error);
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(tenantId: string, userId: string): Promise<any> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM ai_user_preferences WHERE tenant_id = $1 AND user_id = $2`,
        [tenantId, userId]
      );
      return result.rows[0] || { preferred_response_style: 'detailed', preferred_language: 'en' };
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return { preferred_response_style: 'detailed', preferred_language: 'en' };
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    tenantId: string,
    userId: string,
    preferences: Partial<{
      preferred_response_style: string;
      preferred_language: string;
      common_topics: string[];
      last_context: any;
    }>
  ): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO ai_user_preferences (tenant_id, user_id, preferred_response_style, preferred_language, common_topics, last_context)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (tenant_id, user_id) DO UPDATE SET
         preferred_response_style = COALESCE($3, ai_user_preferences.preferred_response_style),
         preferred_language = COALESCE($4, ai_user_preferences.preferred_language),
         common_topics = COALESCE($5, ai_user_preferences.common_topics),
         last_context = COALESCE($6, ai_user_preferences.last_context),
         updated_at = CURRENT_TIMESTAMP`,
        [
          tenantId,
          userId,
          preferences.preferred_response_style,
          preferences.preferred_language,
          preferences.common_topics,
          JSON.stringify(preferences.last_context)
        ]
      );
    } catch (error) {
      console.error('Failed to update user preferences:', error);
    }
  }
}

// Singleton instance
let learningServiceInstance: AILearningService | null = null;

export function getAILearningService(): AILearningService {
  if (!learningServiceInstance) {
    learningServiceInstance = new AILearningService();
  }
  return learningServiceInstance;
}

export default AILearningService;
