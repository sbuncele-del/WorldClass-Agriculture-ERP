import React from 'react';
import { Typography, Button, Space, Badge } from 'antd';

const { Title, Text } = Typography;

export type GradientTheme = 'green' | 'blue' | 'cyan' | 'purple' | 'pink' | 'orange' | 'red';

interface HubHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  actions?: React.ReactNode;
  gradient?: GradientTheme;
}

/**
 * HubHeader - Standardized header for all AetherOS Hub pages
 * 
 * Features:
 * - Gradient logo icon
 * - Title and subtitle
 * - Action buttons area
 * 
 * Usage:
 * ```tsx
 * <HubHeader
 *   title="HR & Payroll"
 *   subtitle="RSA-Compliant Payroll Management"
 *   icon={<TeamOutlined />}
 *   gradient="cyan"
 *   actions={
 *     <>
 *       <Button>Action 1</Button>
 *       <Button type="primary">Primary Action</Button>
 *     </>
 *   }
 * />
 * ```
 */
export const HubHeader: React.FC<HubHeaderProps> = ({
  title,
  subtitle,
  icon,
  actions,
  gradient = 'blue'
}) => {
  const gradientMap: Record<GradientTheme, string> = {
    green: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    blue: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    cyan: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    purple: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    pink: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    orange: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
    red: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  };

  const shadowMap: Record<GradientTheme, string> = {
    green: '0 4px 12px rgba(16, 185, 129, 0.3)',
    blue: '0 4px 12px rgba(102, 126, 234, 0.3)',
    cyan: '0 4px 12px rgba(6, 182, 212, 0.3)',
    purple: '0 4px 12px rgba(139, 92, 246, 0.3)',
    pink: '0 4px 12px rgba(236, 72, 153, 0.3)',
    orange: '0 4px 12px rgba(245, 158, 11, 0.3)',
    red: '0 4px 12px rgba(239, 68, 68, 0.3)',
  };

  return (
    <div className="hub-header">
      <div className="hub-title-section">
        <div 
          className="hub-logo"
          style={{ 
            background: gradientMap[gradient],
            boxShadow: shadowMap[gradient]
          }}
        >
          <span className="hub-logo-icon">{icon}</span>
        </div>
        <div>
          <Title level={2} style={{ margin: 0 }}>{title}</Title>
          <Text type="secondary">{subtitle}</Text>
        </div>
      </div>
      {actions && (
        <div className="hub-actions">
          <Space>{actions}</Space>
        </div>
      )}
    </div>
  );
};

export default HubHeader;
