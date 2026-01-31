import React from 'react';
import { Tabs } from 'antd';
import type { GradientTheme } from './HubHeader';

const { TabPane } = Tabs;

export interface HubTab {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}

interface HubTabsProps {
  tabs: HubTab[];
  activeKey?: string;
  onChange?: (key: string) => void;
  theme?: GradientTheme;
}

/**
 * HubTabs - Standardized tab navigation for AetherOS Hub pages
 * 
 * Features:
 * - White background tab bar
 * - Active state with theme-colored highlight
 * - Consistent padding and styling
 * 
 * Usage:
 * ```tsx
 * <HubTabs
 *   theme="cyan"
 *   tabs={[
 *     { key: 'dashboard', label: 'Dashboard', icon: <DashboardOutlined />, children: <DashboardContent /> },
 *     { key: 'reports', label: 'Reports', icon: <FileTextOutlined />, children: <ReportsContent /> },
 *   ]}
 * />
 * ```
 */
export const HubTabs: React.FC<HubTabsProps> = ({
  tabs,
  activeKey,
  onChange,
  theme = 'blue'
}) => {
  const themeColorMap: Record<GradientTheme, string> = {
    green: '#f0fdf4',
    blue: '#f0f5ff',
    cyan: '#ecfeff',
    purple: '#faf5ff',
    pink: '#fdf2f8',
    orange: '#fff7ed',
    red: '#fef2f2',
  };

  return (
    <Tabs 
      activeKey={activeKey}
      onChange={onChange}
      className={`hub-tabs hub-tabs-${theme}`}
      style={{ 
        '--hub-tab-active-bg': themeColorMap[theme] 
      } as React.CSSProperties}
    >
      {tabs.map(tab => (
        <TabPane
          key={tab.key}
          tab={
            <span>
              {tab.icon} {tab.label}
            </span>
          }
          disabled={tab.disabled}
        >
          {tab.children}
        </TabPane>
      ))}
    </Tabs>
  );
};

export default HubTabs;
