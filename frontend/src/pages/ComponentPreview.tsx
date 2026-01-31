/**
 * ComponentPreview - Preview page for individual components
 * Access without login at /preview/components
 */

import React, { useState, Suspense, lazy } from 'react';
import { Card, Tabs, Layout, ConfigProvider, Spin } from 'antd';
import { antdTheme } from '../theme/antd.theme';

// Import components to preview - Premium Hub Design Only
import BankReconciliationHub from '../components/BankReconciliationHub';
import MyWorkspaceHub from '../components/MyWorkspaceHub';
import PremiumSidebar from '../components/layout/PremiumSidebar';
import PremiumTopBar from '../components/layout/PremiumTopBar';

// Lazy load Banking Hub for preview
const BankingHub = lazy(() => import('../modules/banking/BankingHub'));

// Context providers needed
import { ClientProvider } from '../contexts/ClientContext';
import { CurrencyProvider } from '../contexts/CurrencyContext';
import { UserProvider } from '../contexts/UserContext';

const { Content } = Layout;

const ComponentPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState('banking-hub');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const tabItems = [
    {
      key: 'banking-hub',
      label: '🏦 Banking Hub (Full Module)',
      children: (
        <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>
          <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><Spin size="large" tip="Loading Banking Hub..." /></div>}>
            <BankingHub />
          </Suspense>
        </div>
      )
    },
    {
      key: 'bank-reconciliation',
      label: '💳 Bank Reconciliation (Standalone)',
      children: (
        <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>
          <BankReconciliationHub />
        </div>
      )
    },
    {
      key: 'my-workspace',
      label: '👤 My Workspace (Role-Based)',
      children: (
        <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>
          <MyWorkspaceHub />
        </div>
      )
    },
    {
      key: 'premium-layout',
      label: '✨ Premium Layout (Sidebar + Header)',
      children: (
        <Layout style={{ minHeight: '100vh' }}>
          <PremiumSidebar 
            isCollapsed={sidebarCollapsed} 
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <Layout>
            <PremiumTopBar />
            <Content style={{ padding: 24, background: '#f0f2f5' }}>
              <Card>
                <h2>Premium Layout Preview</h2>
                <p>This shows the Premium Sidebar and Premium TopBar together.</p>
                <p>Click on sidebar items to see the active state styling.</p>
                <p>The sidebar can be collapsed using the toggle.</p>
              </Card>
            </Content>
          </Layout>
        </Layout>
      )
    },
  ];

  return (
    <ConfigProvider theme={antdTheme}>
      <UserProvider>
        <ClientProvider>
          <CurrencyProvider>
            <div style={{ padding: 0 }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '16px 24px',
                color: 'white',
                marginBottom: 0
              }}>
                <h1 style={{ margin: 0, color: 'white' }}>🔍 Component Preview</h1>
                <p style={{ margin: '8px 0 0', opacity: 0.9 }}>
                  Preview the updated components without login
                </p>
              </div>
              
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                tabBarStyle={{ 
                  padding: '0 24px', 
                  background: '#fff',
                  marginBottom: 0
                }}
                size="large"
              />
            </div>
          </CurrencyProvider>
        </ClientProvider>
      </UserProvider>
    </ConfigProvider>
  );
};

export default ComponentPreview;
