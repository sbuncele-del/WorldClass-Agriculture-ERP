/**
 * Keyboard Shortcuts Manager
 * Global keyboard shortcuts with visual help overlay
 */

import React, { useEffect, useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { Modal, Typography, Tag, Space, Divider } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text, Title } = Typography;

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
  action: () => void;
  global?: boolean;
}

interface ShortcutsContextType {
  shortcuts: Shortcut[];
  registerShortcut: (shortcut: Shortcut) => void;
  unregisterShortcut: (keys: string[]) => void;
  showHelp: () => void;
}

const ShortcutsContext = createContext<ShortcutsContextType | undefined>(undefined);

// Detect OS for key display
const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const modKey = isMac ? '⌘' : 'Ctrl';

// Format keys for display
function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    mod: modKey,
    ctrl: isMac ? '⌃' : 'Ctrl',
    alt: isMac ? '⌥' : 'Alt',
    shift: '⇧',
    enter: '↵',
    escape: 'Esc',
    arrowup: '↑',
    arrowdown: '↓',
    arrowleft: '←',
    arrowright: '→',
  };
  return keyMap[key.toLowerCase()] || key.toUpperCase();
}

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [helpVisible, setHelpVisible] = useState(false);
  const navigate = useNavigate();

  // Default navigation shortcuts
  const defaultShortcuts: Shortcut[] = [
    {
      keys: ['mod', 'k'],
      description: 'Open Command Palette',
      category: 'General',
      action: () => {
        // Command palette handles its own trigger
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: isMac, ctrlKey: !isMac }));
      },
      global: true,
    },
    {
      keys: ['?'],
      description: 'Show Keyboard Shortcuts',
      category: 'General',
      action: () => setHelpVisible(true),
      global: true,
    },
    {
      keys: ['g', 'h'],
      description: 'Go to Dashboard',
      category: 'Navigation',
      action: () => navigate('/'),
      global: true,
    },
    {
      keys: ['g', 'i'],
      description: 'Go to Inventory',
      category: 'Navigation',
      action: () => navigate('/inventory/items'),
      global: true,
    },
    {
      keys: ['g', 's'],
      description: 'Go to Sales',
      category: 'Navigation',
      action: () => navigate('/sales/invoices'),
      global: true,
    },
    {
      keys: ['g', 'p'],
      description: 'Go to Purchases',
      category: 'Navigation',
      action: () => navigate('/purchasing/orders'),
      global: true,
    },
    {
      keys: ['g', 'f'],
      description: 'Go to Finance',
      category: 'Navigation',
      action: () => navigate('/financial/dashboard'),
      global: true,
    },
    {
      keys: ['g', 'e'],
      description: 'Go to HR',
      category: 'Navigation',
      action: () => navigate('/hr/employees'),
      global: true,
    },
    {
      keys: ['g', 'r'],
      description: 'Go to Reports',
      category: 'Navigation',
      action: () => navigate('/reports'),
      global: true,
    },
    {
      keys: ['escape'],
      description: 'Close Modal / Cancel',
      category: 'General',
      action: () => {},
      global: true,
    },
    {
      keys: ['mod', 's'],
      description: 'Save (when in form)',
      category: 'Forms',
      action: () => {},
      global: false,
    },
    {
      keys: ['mod', 'n'],
      description: 'New Record',
      category: 'Actions',
      action: () => {},
      global: false,
    },
    {
      keys: ['mod', 'f'],
      description: 'Focus Search',
      category: 'General',
      action: () => {
        const searchInput = document.querySelector('input[type="search"], .ant-input-search input') as HTMLInputElement;
        searchInput?.focus();
      },
      global: true,
    },
  ];

  // Initialize with default shortcuts
  useEffect(() => {
    setShortcuts(defaultShortcuts);
  }, []);

  // Track key sequence for multi-key shortcuts
  const [keySequence, setKeySequence] = useState<string[]>([]);
  const sequenceTimeoutRef = React.useRef<NodeJS.Timeout>();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in an input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow ? for help even in inputs
      if (event.key !== '?') return;
    }

    // Build current key combo
    const keys: string[] = [];
    if (event.metaKey || event.ctrlKey) keys.push('mod');
    if (event.altKey) keys.push('alt');
    if (event.shiftKey) keys.push('shift');
    if (event.key !== 'Meta' && event.key !== 'Control' && event.key !== 'Alt' && event.key !== 'Shift') {
      keys.push(event.key.toLowerCase());
    }

    // Check for single-key shortcuts first
    const singleKeyShortcut = shortcuts.find(s => 
      s.keys.length === 1 && s.keys[0].toLowerCase() === event.key.toLowerCase()
    );

    if (singleKeyShortcut) {
      event.preventDefault();
      singleKeyShortcut.action();
      return;
    }

    // Check for modifier shortcuts (e.g., Cmd+K)
    const modifierShortcut = shortcuts.find(s => {
      if (s.keys.length !== keys.length) return false;
      return s.keys.every((k, i) => k.toLowerCase() === keys[i]);
    });

    if (modifierShortcut) {
      event.preventDefault();
      modifierShortcut.action();
      return;
    }

    // Handle key sequences (e.g., g then h)
    const newSequence = [...keySequence, event.key.toLowerCase()];
    setKeySequence(newSequence);

    // Clear sequence after timeout
    clearTimeout(sequenceTimeoutRef.current);
    sequenceTimeoutRef.current = setTimeout(() => setKeySequence([]), 1000);

    // Check for sequence shortcuts
    const sequenceShortcut = shortcuts.find(s => {
      if (s.keys.some(k => ['mod', 'ctrl', 'alt', 'shift'].includes(k.toLowerCase()))) return false;
      if (s.keys.length !== newSequence.length) return false;
      return s.keys.every((k, i) => k.toLowerCase() === newSequence[i]);
    });

    if (sequenceShortcut) {
      event.preventDefault();
      sequenceShortcut.action();
      setKeySequence([]);
    }
  }, [shortcuts, keySequence, navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(sequenceTimeoutRef.current);
    };
  }, [handleKeyDown]);

  const registerShortcut = (shortcut: Shortcut) => {
    setShortcuts(prev => [...prev.filter(s => s.keys.join('+') !== shortcut.keys.join('+')), shortcut]);
  };

  const unregisterShortcut = (keys: string[]) => {
    setShortcuts(prev => prev.filter(s => s.keys.join('+') !== keys.join('+')));
  };

  const showHelp = () => setHelpVisible(true);

  // Group shortcuts by category
  const shortcutsByCategory = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = [];
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <ShortcutsContext.Provider value={{ shortcuts, registerShortcut, unregisterShortcut, showHelp }}>
      {children}

      <Modal
        title={
          <Space>
            <QuestionCircleOutlined />
            <span>Keyboard Shortcuts</span>
          </Space>
        }
        open={helpVisible}
        onCancel={() => setHelpVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {Object.entries(shortcutsByCategory).map(([category, categoryShortcuts]) => (
            <div key={category} style={{ marginBottom: 24 }}>
              <Title level={5} style={{ marginBottom: 12 }}>{category}</Title>
              {categoryShortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <Text>{shortcut.description}</Text>
                  <Space size={4}>
                    {shortcut.keys.map((key, keyIndex) => (
                      <React.Fragment key={keyIndex}>
                        <Tag style={{ margin: 0, fontFamily: 'monospace' }}>
                          {formatKey(key)}
                        </Tag>
                        {keyIndex < shortcut.keys.length - 1 && shortcut.keys[0] !== 'mod' && (
                          <Text type="secondary" style={{ margin: '0 2px' }}>then</Text>
                        )}
                      </React.Fragment>
                    ))}
                  </Space>
                </div>
              ))}
            </div>
          ))}
        </div>

        <Divider />
        <Text type="secondary">
          Press <Tag style={{ fontFamily: 'monospace' }}>?</Tag> anywhere to show this help
        </Text>
      </Modal>
    </ShortcutsContext.Provider>
  );
}

export function useKeyboardShortcuts() {
  const context = useContext(ShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within a KeyboardShortcutsProvider');
  }
  return context;
}

// Hook to register a shortcut from a component
export function useShortcut(keys: string[], description: string, category: string, action: () => void) {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();

  useEffect(() => {
    registerShortcut({ keys, description, category, action });
    return () => unregisterShortcut(keys);
  }, [keys.join('+'), action]);
}

export default KeyboardShortcutsProvider;
