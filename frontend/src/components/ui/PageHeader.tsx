/**
 * Page Header Component
 * Consistent page headers with title, breadcrumbs, and actions
 */

import React from 'react';
import { PageHeader as AntPageHeader, Breadcrumb, Space, Typography, Button, Tooltip, Tag } from 'antd';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface BreadcrumbItem {
  title: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  tags?: Array<{ label: string; color?: string }>;
  helpText?: string;
  loading?: boolean;
  onRefresh?: () => void;
  extra?: React.ReactNode;
  ghost?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  showBack = false,
  onBack,
  actions,
  tags,
  helpText,
  loading,
  onRefresh,
  extra,
  ghost = true,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      style={{
        background: ghost ? 'transparent' : '#fff',
        padding: ghost ? '0 0 16px 0' : '16px 24px',
        marginBottom: 16,
        borderBottom: ghost ? 'none' : '1px solid #f0f0f0',
      }}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb
          style={{ marginBottom: 12 }}
          items={breadcrumbs.map((item, index) => ({
            key: index,
            title: item.path ? (
              <Link to={item.path}>{item.title}</Link>
            ) : (
              item.title
            ),
          }))}
        />
      )}

      {/* Title Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {showBack && (
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              style={{ padding: 0, height: 'auto' }}
            />
          )}

          <div>
            <Space align="center" size={8}>
              <Title level={4} style={{ margin: 0 }}>
                {title}
              </Title>
              {tags?.map((tag, index) => (
                <Tag key={index} color={tag.color}>
                  {tag.label}
                </Tag>
              ))}
              {helpText && (
                <Tooltip title={helpText}>
                  <QuestionCircleOutlined style={{ color: '#8c8c8c', cursor: 'help' }} />
                </Tooltip>
              )}
            </Space>

            {subtitle && (
              <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                {subtitle}
              </Text>
            )}
          </div>
        </div>

        <Space wrap>
          {onRefresh && (
            <Tooltip title="Refresh">
              <Button
                icon={<ReloadOutlined spin={loading} />}
                onClick={onRefresh}
                disabled={loading}
              />
            </Tooltip>
          )}
          {actions}
          {extra}
        </Space>
      </div>
    </div>
  );
}

// Simple section header for within-page sections
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  divider?: boolean;
}

export function SectionHeader({
  title,
  subtitle,
  actions,
  divider = false,
}: SectionHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: divider ? 12 : 0,
        borderBottom: divider ? '1px solid #f0f0f0' : 'none',
      }}
    >
      <div>
        <Title level={5} style={{ margin: 0 }}>
          {title}
        </Title>
        {subtitle && (
          <Text type="secondary" style={{ fontSize: 13 }}>
            {subtitle}
          </Text>
        )}
      </div>
      {actions && <Space>{actions}</Space>}
    </div>
  );
}

export default PageHeader;
