import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import type { GradientTheme } from './HubHeader';

export interface StatusStat {
  title: string;
  value: number | string;
  prefix?: React.ReactNode | string;
  suffix?: string;
  valueStyle?: React.CSSProperties;
  span?: number;
}

interface StatusBannerProps {
  gradient: GradientTheme;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  stats: StatusStat[];
}

/**
 * StatusBanner - The signature AetherOS gradient status banner
 * 
 * Features:
 * - Gradient background matching theme
 * - Badge section with icon, title, subtitle
 * - Flexible stats grid
 * 
 * Usage:
 * ```tsx
 * <StatusBanner
 *   gradient="cyan"
 *   icon={<BankOutlined />}
 *   title="Payroll Overview"
 *   subtitle="December 2025"
 *   stats={[
 *     { title: 'Employees', value: 156, prefix: <TeamOutlined /> },
 *     { title: 'Gross Payroll', value: 6250000, prefix: 'R' },
 *     { title: 'Net Payroll', value: 4850000, prefix: 'R', valueStyle: { color: '#86efac' } },
 *   ]}
 * />
 * ```
 */
export const StatusBanner: React.FC<StatusBannerProps> = ({
  gradient,
  icon,
  title,
  subtitle,
  stats
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
    green: '0 8px 24px rgba(16, 185, 129, 0.25)',
    blue: '0 8px 24px rgba(102, 126, 234, 0.25)',
    cyan: '0 8px 24px rgba(6, 182, 212, 0.25)',
    purple: '0 8px 24px rgba(139, 92, 246, 0.25)',
    pink: '0 8px 24px rgba(236, 72, 153, 0.25)',
    orange: '0 8px 24px rgba(245, 158, 11, 0.25)',
    red: '0 8px 24px rgba(239, 68, 68, 0.25)',
  };

  // Calculate span distribution
  const totalSpan = 24;
  const badgeSpan = 5;
  const remainingSpan = totalSpan - badgeSpan;
  const defaultStatSpan = Math.floor(remainingSpan / stats.length);

  return (
    <Card 
      className="status-banner"
      style={{ 
        background: gradientMap[gradient],
        boxShadow: shadowMap[gradient]
      }}
    >
      <Row gutter={24} align="middle">
        <Col span={badgeSpan}>
          <div className="status-badge">
            <span className="status-icon">{icon}</span>
            <div>
              <span className="status-title">{title}</span>
              <span className="status-subtitle">{subtitle}</span>
            </div>
          </div>
        </Col>
        {stats.map((stat, index) => (
          <Col key={index} span={stat.span || defaultStatSpan}>
            <Statistic
              title={stat.title}
              value={stat.value}
              prefix={stat.prefix}
              suffix={stat.suffix}
              valueStyle={{ 
                color: 'white',
                fontSize: '18px',
                ...stat.valueStyle 
              }}
            />
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default StatusBanner;
