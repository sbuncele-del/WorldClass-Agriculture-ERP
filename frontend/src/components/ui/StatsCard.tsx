/**
 * Statistics Cards with Animations
 * Beautiful, animated stat displays for dashboards
 */

import React, { useEffect, useState } from 'react';
import { Card, Statistic, Space, Typography, Progress, Tooltip, Row, Col } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { StatisticProps } from 'antd';

const { Text } = Typography;

// Animated number counter
interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

export function AnimatedNumber({
  value,
  duration = 1000,
  decimals = 0,
  prefix = '',
  suffix = '',
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const difference = value - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + difference * easeOut;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// Single stat card
interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: string;
  trend?: {
    value: number;
    label?: string;
    isPositiveGood?: boolean;
  };
  icon?: React.ReactNode;
  color?: string;
  tooltip?: string;
  loading?: boolean;
  onClick?: () => void;
  animated?: boolean;
  decimals?: number;
  progress?: {
    value: number;
    target: number;
    showTarget?: boolean;
  };
}

export function StatCard({
  title,
  value,
  prefix,
  suffix,
  trend,
  icon,
  color = '#1890ff',
  tooltip,
  loading = false,
  onClick,
  animated = true,
  decimals = 0,
  progress,
}: StatCardProps) {
  const isPositive = trend && trend.value >= 0;
  const trendColor = trend
    ? (trend.isPositiveGood !== false ? (isPositive ? '#52c41a' : '#ff4d4f') : (isPositive ? '#ff4d4f' : '#52c41a'))
    : undefined;

  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      loading={loading}
      style={{ height: '100%' }}
      styles={{ body: { padding: 20 } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <Space align="center" size={4}>
            <Text type="secondary" style={{ fontSize: 14 }}>{title}</Text>
            {tooltip && (
              <Tooltip title={tooltip}>
                <InfoCircleOutlined style={{ color: '#bfbfbf', fontSize: 12 }} />
              </Tooltip>
            )}
          </Space>

          <div style={{ marginTop: 8 }}>
            {typeof value === 'number' && animated ? (
              <AnimatedNumber
                value={value}
                decimals={decimals}
                prefix={typeof prefix === 'string' ? prefix : ''}
                suffix={suffix}
              />
            ) : (
              <Statistic
                value={value}
                prefix={prefix}
                suffix={suffix}
                valueStyle={{ fontSize: 28, fontWeight: 600 }}
              />
            )}
          </div>

          {trend && (
            <Space size={4} style={{ marginTop: 8 }}>
              {isPositive ? (
                <ArrowUpOutlined style={{ color: trendColor }} />
              ) : (
                <ArrowDownOutlined style={{ color: trendColor }} />
              )}
              <Text style={{ color: trendColor }}>
                {Math.abs(trend.value)}%
              </Text>
              {trend.label && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {trend.label}
                </Text>
              )}
            </Space>
          )}

          {progress && (
            <div style={{ marginTop: 12 }}>
              <Progress
                percent={Math.round((progress.value / progress.target) * 100)}
                size="small"
                strokeColor={color}
              />
              {progress.showTarget && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {progress.value.toLocaleString()} / {progress.target.toLocaleString()}
                </Text>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              background: `${color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              color: color,
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

// Stats grid with multiple cards
interface StatsGridProps {
  stats: StatCardProps[];
  columns?: number;
  gutter?: number;
  loading?: boolean;
}

export function StatsGrid({
  stats,
  columns = 4,
  gutter = 16,
  loading = false,
}: StatsGridProps) {
  const span = 24 / columns;

  return (
    <Row gutter={[gutter, gutter]}>
      {stats.map((stat, index) => (
        <Col key={index} xs={24} sm={12} md={span} lg={span}>
          <StatCard {...stat} loading={loading || stat.loading} />
        </Col>
      ))}
    </Row>
  );
}

// Mini stat for inline display
interface MiniStatProps {
  label: string;
  value: string | number;
  trend?: number;
  icon?: React.ReactNode;
}

export function MiniStat({ label, value, trend, icon }: MiniStatProps) {
  return (
    <Space size={8}>
      {icon}
      <div>
        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
          {label}
        </Text>
        <Space size={4}>
          <Text strong>{value}</Text>
          {trend !== undefined && (
            <Text
              style={{
                fontSize: 12,
                color: trend >= 0 ? '#52c41a' : '#ff4d4f',
              }}
            >
              {trend >= 0 ? '+' : ''}{trend}%
            </Text>
          )}
        </Space>
      </div>
    </Space>
  );
}

// Comparison stat (current vs previous)
interface ComparisonStatProps {
  title: string;
  current: number;
  previous: number;
  format?: (value: number) => string;
  icon?: React.ReactNode;
}

export function ComparisonStat({
  title,
  current,
  previous,
  format = (v) => v.toLocaleString(),
  icon,
}: ComparisonStatProps) {
  const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <Card size="small">
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Space>
          {icon}
          <Text type="secondary">{title}</Text>
        </Space>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text strong style={{ fontSize: 24 }}>{format(current)}</Text>
          <Space size={4}>
            {isPositive ? (
              <ArrowUpOutlined style={{ color: '#52c41a' }} />
            ) : (
              <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
            )}
            <Text style={{ color: isPositive ? '#52c41a' : '#ff4d4f' }}>
              {Math.abs(change).toFixed(1)}%
            </Text>
          </Space>
        </div>

        <Text type="secondary" style={{ fontSize: 12 }}>
          Previous: {format(previous)}
        </Text>
      </Space>
    </Card>
  );
}

export default {
  AnimatedNumber,
  StatCard,
  StatsGrid,
  MiniStat,
  ComparisonStat,
};
