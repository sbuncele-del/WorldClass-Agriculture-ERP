/**
 * AetherOS AI Assistant Chat Component
 * 
 * A beautiful, interactive AI chat interface that converts
 * natural language into business operations.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Bot, User, Loader2, Check, X, AlertTriangle, 
  Sparkles, Shield, FileText, Package, DollarSign,
  RefreshCw, Copy, ChevronDown, Zap
} from 'lucide-react';
import './AIAssistant.css';

// Types
interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  action?: AIAction;
  confirmationRequired?: boolean;
  isTyping?: boolean;
}

interface AIAction {
  type: string;
  status: 'pending' | 'confirmed' | 'executed' | 'cancelled';
  data: Record<string, any>;
  description: string;
  requiresConfirmation: boolean;
  validations?: AIValidation[];
}

interface AIValidation {
  field: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  value?: any;
}

interface AIAssistantProps {
  onAction?: (action: AIAction) => void;
  isDemo?: boolean;
  className?: string;
}

// Demo conversation for landing page
const DEMO_CONVERSATION: AIMessage[] = [
  {
    id: 'demo-1',
    role: 'user',
    content: 'We just sold 500 units of Product A to ABC Corp for R50,000',
    timestamp: new Date()
  }
];

const DEMO_RESPONSE: AIMessage = {
  id: 'demo-2',
  role: 'assistant',
  content: "I've analyzed the transaction. Please confirm:",
  timestamp: new Date(),
  confirmationRequired: true,
  action: {
    type: 'create_invoice',
    status: 'pending',
    requiresConfirmation: true,
    description: 'Create sales invoice for ABC Corp',
    data: {
      customer: 'ABC Corp',
      customerCreditLimit: 75000,
      availableCredit: 42500,
      product: 'Product A',
      quantity: 500,
      unitPrice: 100,
      total: 50000,
      stockAvailable: 847,
      warehouse: 'Warehouse A',
      paymentTerms: 'Net 30'
    },
    validations: [
      { field: 'Customer', status: 'pass', message: 'ABC Corp (Credit limit: R75,000 | Available: R42,500)' },
      { field: 'Product', status: 'pass', message: 'Product A — 500 units @ R100/unit' },
      { field: 'Total', status: 'pass', message: 'R50,000 (excl. tax)' },
      { field: 'Stock', status: 'pass', message: '✓ 847 units in Warehouse A' },
      { field: 'Payment', status: 'pass', message: 'Net 30 (per customer agreement)' }
    ]
  }
};

const DEMO_SUCCESS: AIMessage = {
  id: 'demo-3',
  role: 'assistant',
  content: "✅ Invoice INV-2025-0847 created successfully!\n\n• Customer: ABC Corp\n• Amount: R50,000 (+ R7,500 VAT)\n• Due: 30 days\n\nInventory updated. Would you like me to email this invoice to the customer?",
  timestamp: new Date(),
  action: {
    type: 'create_invoice',
    status: 'executed',
    requiresConfirmation: false,
    description: 'Invoice created',
    data: { invoiceNumber: 'INV-2025-0847' }
  }
};

// Suggested prompts
const SUGGESTIONS = [
  'Check inventory levels',
  'Process a refund',
  'Show cash position',
  'Create a quote',
  'Run sales report'
];

export const AIAssistant: React.FC<AIAssistantProps> = ({ 
  onAction, 
  isDemo = false,
  className = ''
}) => {
  const [messages, setMessages] = useState<AIMessage[]>(isDemo ? DEMO_CONVERSATION : []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(`session_${Date.now()}`);
  const [showSuggestions, setShowSuggestions] = useState(!isDemo);
  const [demoStep, setDemoStep] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Demo mode: auto-play conversation
  useEffect(() => {
    if (isDemo && demoStep === 0) {
      const timer = setTimeout(() => {
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
          setMessages(prev => [...prev, DEMO_RESPONSE]);
          setDemoStep(1);
        }, 1500);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isDemo, demoStep]);

  // Send message to AI Agent
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowSuggestions(false);

    if (isDemo) {
      // Demo mode - simulate response
      setTimeout(() => {
        setIsLoading(false);
        setMessages(prev => [...prev, DEMO_RESPONSE]);
      }, 1500);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // Use the new V2 execute-command endpoint for actionable AI
      const endpoint = '/api/v2/ai/execute-command';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Check if this is a confirmation message
      const isConfirmation = text.toLowerCase().includes('yes') || 
                            text.toLowerCase().includes('confirm') ||
                            text.toLowerCase().includes('proceed');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          command: text, 
          confirm: isConfirmation,
          sessionId 
        })
      });

      const data = await response.json();

      if (data.success && data.data) {
        const result = data.data;
        
        // Handle different response statuses
        if (result.status === 'clarification_needed') {
          setMessages(prev => [...prev, {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: `${result.message}\n\n${result.suggestions?.map((s: string) => `• ${s}`).join('\n') || ''}`,
            timestamp: new Date()
          }]);
        } else if (result.status === 'pending_confirmation') {
          // Show confirmation dialog
          setMessages(prev => [...prev, {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: result.message,
            timestamp: new Date(),
            confirmationRequired: true,
            action: {
              type: result.intent,
              status: 'pending',
              data: result.entities,
              description: result.message,
              requiresConfirmation: true,
              validations: Object.entries(result.entities || {})
                .filter(([_, v]) => v !== undefined)
                .map(([key, value]) => ({
                  field: key.charAt(0).toUpperCase() + key.slice(1),
                  status: 'pass' as const,
                  message: String(value)
                }))
            }
          }]);
        } else if (result.status === 'executed') {
          setMessages(prev => [...prev, {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: result.message,
            timestamp: new Date(),
            action: {
              type: 'executed',
              status: 'executed',
              data: result.result || {},
              description: result.message,
              requiresConfirmation: false
            }
          }]);
        } else {
          // Generic response
          setMessages(prev => [...prev, {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: result.message || 'Command processed.',
            timestamp: new Date()
          }]);
        }
        
        if (data.sessionId) {
          setSessionId(data.sessionId);
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle action confirmation - execute the pending action
  const handleConfirm = async () => {
    if (isDemo) {
      setMessages(prev => [...prev, DEMO_SUCCESS]);
      setDemoStep(2);
      return;
    }

    // Find the pending action message
    const pendingMsg = messages.find(m => m.action?.status === 'pending');
    if (!pendingMsg?.action) return;

    // Mark as loading
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Re-send the ORIGINAL command that created this action, but with confirm: true
      // The original text is in the user message just before this assistant message
      const pendingMsgIndex = messages.findIndex(m => m.id === pendingMsg.id);
      const originalUserMsg = messages.slice(0, pendingMsgIndex).reverse().find(m => m.role === 'user');
      const originalCommand = originalUserMsg?.content || pendingMsg.action.description;

      const response = await fetch('/api/v2/ai/execute-command', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          command: originalCommand, 
          confirm: true,
          sessionId 
        })
      });

      const data = await response.json();

      // Update the pending action status
      setMessages(prev => prev.map(m => 
        m.id === pendingMsg.id 
          ? { ...m, action: { ...m.action!, status: 'executed' as const }, confirmationRequired: false }
          : m
      ));

      if (data.success && data.data) {
        setMessages(prev => [...prev, {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: data.data.message || 'Action completed successfully!',
          timestamp: new Date(),
          action: {
            type: 'executed',
            status: 'executed',
            data: data.data.result || {},
            description: data.data.message,
            requiresConfirmation: false
          }
        }]);
      } else {
        throw new Error(data.error || 'Action failed');
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `❌ Error: ${error.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle action cancellation
  const handleCancel = async () => {
    if (isDemo) {
      setMessages(prev => [...prev, {
        id: `cancel_${Date.now()}`,
        role: 'assistant',
        content: 'Action cancelled. How else can I help you?',
        timestamp: new Date()
      }]);
      return;
    }

    // Mark action as cancelled and notify user
    setMessages(prev => prev.map(m => 
      m.action?.status === 'pending' 
        ? { ...m, action: { ...m.action, status: 'cancelled' as const }, confirmationRequired: false }
        : m
    ));
    setMessages(prev => [...prev, {
      id: `cancel_${Date.now()}`,
      role: 'assistant',
      content: 'Action cancelled. How else can I help you?',
      timestamp: new Date()
    }]);
  };

  // Check if there's a pending action
  const hasPendingAction = messages.some(m => 
    m.action?.status === 'pending' && m.confirmationRequired
  );

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Get status icon
  const getStatusIcon = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass': return <Check className="status-icon pass" size={14} />;
      case 'warning': return <AlertTriangle className="status-icon warning" size={14} />;
      case 'fail': return <X className="status-icon fail" size={14} />;
    }
  };

  // Get last message with pending action
  const pendingAction = messages.find(m => 
    m.action?.status === 'pending' && m.action?.requiresConfirmation
  );

  return (
    <div className={`ai-assistant ${className}`}>
      {/* Header */}
      <div className="ai-header">
        <div className="ai-avatar">
          <Bot size={20} />
        </div>
        <div className="ai-info">
          <h3>SiyaBusa AI Assistant</h3>
          <span className="ai-status">
            <span className="status-dot"></span>
            Always online
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="ai-messages">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`message ${message.role}`}
            >
              {message.role === 'user' ? (
                <div className="message-bubble user-bubble">
                  {message.content}
                </div>
              ) : (
                <div className="message-bubble assistant-bubble">
                  {/* AI Label */}
                  <div className="ai-label">
                    <Sparkles size={12} />
                    <span>SIYABUSA AI</span>
                  </div>

                  {/* Processing indicator */}
                  {message.isTyping && (
                    <div className="processing">
                      <Loader2 className="spin" size={14} />
                      <span>Processing sale transaction...</span>
                    </div>
                  )}

                  {/* Confirmation required */}
                  {message.confirmationRequired && message.action?.status === 'pending' && (
                    <div className="confirmation-badge">
                      <AlertTriangle size={14} />
                      <span>CONFIRMATION REQUIRED</span>
                    </div>
                  )}

                  {/* Message content */}
                  <div className="message-content">
                    {message.content}
                  </div>

                  {/* Validations */}
                  {message.action?.validations && message.action.validations.length > 0 && (
                    <div className="validations">
                      {message.action.validations.map((v, i) => (
                        <div key={i} className={`validation-item ${v.status}`}>
                          {getStatusIcon(v.status)}
                          <span className="validation-field">{v.field}:</span>
                          <span className="validation-message">{v.message}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  {message.action?.status === 'pending' && message.action?.requiresConfirmation && (
                    <div className="action-buttons">
                      <button 
                        className="btn-confirm"
                        onClick={handleConfirm}
                        disabled={isLoading}
                      >
                        <Check size={16} />
                        Confirm & Create Invoice
                      </button>
                      <button 
                        className="btn-cancel"
                        onClick={handleCancel}
                        disabled={isLoading}
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Executed action indicator */}
                  {message.action?.status === 'executed' && (
                    <div className="executed-badge">
                      <Check size={14} />
                      <span>Action Completed</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="message assistant"
          >
            <div className="message-bubble assistant-bubble">
              <div className="ai-label">
                <Sparkles size={12} />
                <span>SIYABUSA AI</span>
              </div>
              <div className="processing">
                <Loader2 className="spin" size={14} />
                <span>Processing your request...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="ai-input-container">
        <div className="ai-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Try: 'Check inventory levels' or 'Process a refund'"
            disabled={isLoading || (isDemo && demoStep < 2)}
          />
          <button 
            className="send-button"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
          >
            <Send size={18} />
          </button>
        </div>

        {/* Suggestions */}
        {showSuggestions && !isDemo && (
          <div className="suggestions">
            {SUGGESTIONS.map((suggestion, i) => (
              <button
                key={i}
                className="suggestion-chip"
                onClick={() => {
                  setInput(suggestion);
                  inputRef.current?.focus();
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Compliance badges */}
      <div className="ai-footer">
        <div className="compliance-badges">
          <span className="badge">
            <Shield size={12} />
            Audit Ready
          </span>
          <span className="badge">
            <FileText size={12} />
            SOC 2 Compliant
          </span>
          <span className="badge">
            <DollarSign size={12} />
            IFRS/GAAP
          </span>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
