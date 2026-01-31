/**
 * Command Palette (Cmd+K)
 * Quick navigation and actions like VS Code / Spotlight
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, Input, List, Typography, Tag, Space, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  SearchOutlined,
  DashboardOutlined,
  ShoppingOutlined,
  DollarOutlined,
  TeamOutlined,
  BoxPlotOutlined,
  TruckOutlined,
  BankOutlined,
  SettingOutlined,
  FileTextOutlined,
  PlusOutlined,
  SafetyOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  category: 'navigation' | 'action' | 'search' | 'settings';
  keywords: string[];
  action: () => void;
}

interface CommandPaletteProps {
  visible: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ visible, onClose }) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  // Define all commands
  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    { id: 'nav-dashboard', title: 'Go to Dashboard', icon: <DashboardOutlined />, category: 'navigation', keywords: ['home', 'main', 'overview'], action: () => navigate('/') },
    { id: 'nav-sales', title: 'Go to Sales', icon: <ShoppingOutlined />, category: 'navigation', keywords: ['crm', 'customers', 'revenue'], action: () => navigate('/sales') },
    { id: 'nav-purchase', title: 'Go to Purchases', icon: <ShoppingOutlined />, category: 'navigation', keywords: ['suppliers', 'vendors', 'orders'], action: () => navigate('/purchase') },
    { id: 'nav-financial', title: 'Go to Financial', icon: <DollarOutlined />, category: 'navigation', keywords: ['accounting', 'journal', 'ledger', 'gl'], action: () => navigate('/financial') },
    { id: 'nav-inventory', title: 'Go to Inventory', icon: <BoxPlotOutlined />, category: 'navigation', keywords: ['stock', 'products', 'items'], action: () => navigate('/inventory') },
    { id: 'nav-hr', title: 'Go to HR & Payroll', icon: <TeamOutlined />, category: 'navigation', keywords: ['employees', 'salary', 'leave'], action: () => navigate('/hr') },
    { id: 'nav-logistics', title: 'Go to Logistics', icon: <TruckOutlined />, category: 'navigation', keywords: ['shipping', 'delivery', 'tracking'], action: () => navigate('/logistics') },
    { id: 'nav-cash', title: 'Go to Cash Management', icon: <BankOutlined />, category: 'navigation', keywords: ['bank', 'reconciliation', 'cash flow'], action: () => navigate('/cash') },
    { id: 'nav-audit', title: 'Go to Audit Ready', icon: <SafetyOutlined />, category: 'navigation', keywords: ['compliance', 'sox', 'controls'], action: () => navigate('/audit') },
    
    // Quick Actions
    { id: 'action-new-invoice', title: 'Create New Invoice', description: 'Create a sales invoice', icon: <PlusOutlined />, category: 'action', keywords: ['add', 'invoice', 'bill'], action: () => navigate('/sales/invoices/new') },
    { id: 'action-new-customer', title: 'Add New Customer', description: 'Add a customer to CRM', icon: <PlusOutlined />, category: 'action', keywords: ['add', 'customer', 'client'], action: () => navigate('/sales/customers/new') },
    { id: 'action-new-journal', title: 'Create Journal Entry', description: 'Record a transaction', icon: <PlusOutlined />, category: 'action', keywords: ['add', 'journal', 'entry', 'transaction'], action: () => navigate('/financial/journal/new') },
    { id: 'action-new-employee', title: 'Add New Employee', description: 'Add an employee', icon: <PlusOutlined />, category: 'action', keywords: ['add', 'employee', 'hire'], action: () => navigate('/hr/employees/new') },
    
    // Settings
    { id: 'settings-profile', title: 'My Profile', description: 'View and edit your profile', icon: <UserOutlined />, category: 'settings', keywords: ['account', 'me', 'personal'], action: () => navigate('/profile') },
    { id: 'settings-tenant', title: 'Tenant Settings', description: 'Manage company settings', icon: <SettingOutlined />, category: 'settings', keywords: ['company', 'organization', 'config'], action: () => navigate('/tenant-settings') },
    { id: 'settings-users', title: 'User Management', description: 'Manage users and permissions', icon: <TeamOutlined />, category: 'settings', keywords: ['users', 'roles', 'permissions'], action: () => navigate('/users') },
    { id: 'settings-system', title: 'System Settings', description: 'Configure system options', icon: <SettingOutlined />, category: 'settings', keywords: ['system', 'config', 'options'], action: () => navigate('/settings') },
    
    // Other
    { id: 'other-help', title: 'Help Center', description: 'Get help and support', icon: <QuestionCircleOutlined />, category: 'navigation', keywords: ['help', 'support', 'faq', 'docs'], action: () => navigate('/help') },
    { id: 'other-notifications', title: 'View Notifications', description: 'See your notifications', icon: <BellOutlined />, category: 'action', keywords: ['alerts', 'messages', 'inbox'], action: () => {} },
    { id: 'other-logout', title: 'Sign Out', description: 'Sign out of your account', icon: <LogoutOutlined />, category: 'action', keywords: ['logout', 'exit', 'signout'], action: () => { localStorage.clear(); window.location.href = '/login'; } },
  ], [navigate]);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search) return commands;
    
    const lowerSearch = search.toLowerCase();
    return commands.filter(cmd => 
      cmd.title.toLowerCase().includes(lowerSearch) ||
      cmd.description?.toLowerCase().includes(lowerSearch) ||
      cmd.keywords.some(kw => kw.includes(lowerSearch))
    );
  }, [commands, search]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      navigation: [],
      action: [],
      settings: [],
    };
    
    filteredCommands.forEach(cmd => {
      groups[cmd.category].push(cmd);
    });
    
    return groups;
  }, [filteredCommands]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!visible) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
          setSearch('');
        }
        break;
      case 'Escape':
        onClose();
        setSearch('');
        break;
    }
  }, [visible, filteredCommands, selectedIndex, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'navigation': return 'Go to';
      case 'action': return 'Actions';
      case 'settings': return 'Settings';
      default: return category;
    }
  };

  let flatIndex = -1;

  return (
    <Modal
      open={visible}
      onCancel={() => { onClose(); setSearch(''); }}
      footer={null}
      closable={false}
      width={600}
      style={{ top: 100 }}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ borderBottom: '1px solid #f0f0f0' }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          placeholder="Type a command or search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          bordered={false}
          size="large"
          autoFocus
          style={{ padding: '16px 20px' }}
        />
      </div>
      
      <div style={{ maxHeight: 400, overflow: 'auto', padding: '8px 0' }}>
        {filteredCommands.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Text type="secondary">No commands found</Text>
          </div>
        ) : (
          Object.entries(groupedCommands).map(([category, items]) => {
            if (items.length === 0) return null;
            
            return (
              <div key={category}>
                <div style={{ padding: '8px 20px' }}>
                  <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase' }}>
                    {getCategoryLabel(category)}
                  </Text>
                </div>
                {items.map((cmd) => {
                  flatIndex++;
                  const isSelected = flatIndex === selectedIndex;
                  
                  return (
                    <div
                      key={cmd.id}
                      onClick={() => {
                        cmd.action();
                        onClose();
                        setSearch('');
                      }}
                      style={{
                        padding: '12px 20px',
                        cursor: 'pointer',
                        background: isSelected ? '#f5f5f5' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        transition: 'background 0.2s',
                      }}
                    >
                      <span style={{ 
                        fontSize: 18, 
                        color: isSelected ? '#667eea' : '#8c8c8c',
                        width: 24,
                        textAlign: 'center'
                      }}>
                        {cmd.icon}
                      </span>
                      <div style={{ flex: 1 }}>
                        <Text strong={isSelected}>{cmd.title}</Text>
                        {cmd.description && (
                          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                            {cmd.description}
                          </Text>
                        )}
                      </div>
                      {isSelected && (
                        <Tag color="blue" style={{ marginRight: 0 }}>Enter ↵</Tag>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
      
      <div style={{ 
        borderTop: '1px solid #f0f0f0', 
        padding: '8px 16px',
        display: 'flex',
        gap: 16,
        fontSize: 12,
        color: '#8c8c8c'
      }}>
        <span>↑↓ Navigate</span>
        <span>↵ Select</span>
        <span>Esc Close</span>
      </div>
    </Modal>
  );
};

// Hook to use command palette
export const useCommandPalette = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    visible,
    open: () => setVisible(true),
    close: () => setVisible(false),
    toggle: () => setVisible(prev => !prev),
  };
};

export default CommandPalette;
