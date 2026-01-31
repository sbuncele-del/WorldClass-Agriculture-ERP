/**
 * Ant Design Theme Configuration for AetherOS ERP
 * Enterprise-grade styling with custom brand colors
 */

import type { ThemeConfig } from 'antd';

export const erpTheme: ThemeConfig = {
  token: {
    // Brand Colors - Maintaining your gradient identity
    colorPrimary: '#667eea',
    colorSuccess: '#10B981',
    colorWarning: '#F59E0B',
    colorError: '#EF4444',
    colorInfo: '#3B82F6',
    
    // Typography
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    fontSizeHeading1: 32,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 16,
    fontSizeHeading5: 14,
    
    // Layout
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    
    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingXL: 32,
    
    // Shadows (enterprise = subtle)
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.12)',
    
    // Colors for status
    colorTextBase: '#1e293b',
    colorBgContainer: '#ffffff',
    colorBorder: '#e2e8f0',
    colorBorderSecondary: '#f1f5f9',
  },
  
  components: {
    // Table - Critical for logistics data display
    Table: {
      headerBg: '#f8fafc',
      headerColor: '#475569',
      rowHoverBg: '#f1f5f9',
      headerSortActiveBg: '#e2e8f0',
      headerSortHoverBg: '#f1f5f9',
      bodySortBg: '#fafafa',
      fixedHeaderSortActiveBg: '#e2e8f0',
    },
    
    // Card - KPI metrics and dashboards
    Card: {
      paddingLG: 24,
      borderRadiusLG: 12,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
    
    // Button - Actions and CTAs
    Button: {
      primaryShadow: '0 2px 4px rgba(102, 126, 234, 0.3)',
      dangerShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
      borderRadius: 8,
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
    },
    
    // Form - Trip creation, settings
    Form: {
      labelFontSize: 14,
      labelColor: '#475569',
      verticalLabelPadding: '0 0 8px',
    },
    
    // Modal - Dialogs and popups
    Modal: {
      borderRadiusLG: 12,
      paddingContentHorizontalLG: 24,
    },
    
    // Select/Input - Form controls
    Select: {
      borderRadius: 8,
      controlHeight: 40,
    },
    
    Input: {
      borderRadius: 8,
      controlHeight: 40,
      paddingBlock: 8,
      paddingInline: 12,
    },
    
    // DatePicker - Critical for logistics date filtering
    DatePicker: {
      borderRadius: 8,
      controlHeight: 40,
    },
    
    // Statistic - KPI display cards
    Statistic: {
      titleFontSize: 14,
      contentFontSize: 28,
    },
    
    // Tag - Status badges
    Tag: {
      borderRadiusSM: 6,
    },
    
    // Menu - Navigation
    Menu: {
      itemBorderRadius: 8,
      itemMarginInline: 4,
    },
    
    // Notification - Alerts and toasts
    Notification: {
      width: 400,
    },
    
    // Progress - Trip progress bars
    Progress: {
      circleTextFontSize: '1em',
    },
  },
  
  // Algorithm for dark mode (future)
  // algorithm: theme.darkAlgorithm,
};

// Color palette for custom components (your gradients)
export const customColors = {
  gradient: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    warning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    danger: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    info: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
  },
  status: {
    active: '#10B981',
    inactive: '#94A3B8',
    warning: '#F59E0B',
    danger: '#EF4444',
    planned: '#3B82F6',
    inTransit: '#8B5CF6',
    delivered: '#10B981',
    cancelled: '#EF4444',
  },
  chart: {
    colors: ['#667eea', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'],
  },
};

// Export as both names for compatibility
export const antdTheme = erpTheme;
export default erpTheme;
