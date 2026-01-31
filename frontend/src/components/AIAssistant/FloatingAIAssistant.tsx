/**
 * Floating AI Assistant Button & Panel
 * 
 * A floating chat widget that can be toggled from anywhere in the app.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import AIAssistant from './AIAssistant';
import './FloatingAIAssistant.css';

interface FloatingAIAssistantProps {
  isDemo?: boolean;
}

export const FloatingAIAssistant: React.FC<FloatingAIAssistantProps> = ({ 
  isDemo = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        className={`floating-ai-button ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: 'spring', 
          stiffness: 260, 
          damping: 20,
          delay: 0.5
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="button-content"
            >
              <Sparkles className="sparkle-icon" size={16} />
              <MessageCircle size={24} />
            </motion.span>
          )}
        </AnimatePresence>
        
        {/* Notification badge when not interacted */}
        {!hasInteracted && !isOpen && (
          <motion.span 
            className="notification-dot"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="floating-ai-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              className="floating-ai-panel"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <AIAssistant isDemo={isDemo} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Tooltip on first load */}
      {!hasInteracted && !isOpen && (
        <motion.div
          className="ai-tooltip"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 }}
        >
          <Sparkles size={14} />
          <span>Ask me anything about your business</span>
        </motion.div>
      )}
    </>
  );
};

export default FloatingAIAssistant;
