/**
 * Loading Skeleton Components
 * Beautiful skeleton screens for loading states
 */

import React from 'react';
import { Skeleton, Card, Row, Col, Space } from 'antd';

// Dashboard skeleton with KPI cards
export const DashboardSkeleton: React.FC = () => (
  <div style={{ padding: 24 }}>
    <Row gutter={[16, 16]}>
      {[1, 2, 3, 4].map((i) => (
        <Col xs={24} sm={12} lg={6} key={i}>
          <Card>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        </Col>
      ))}
    </Row>
    <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
      <Col xs={24} lg={16}>
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </Col>
    </Row>
  </div>
);

// Table skeleton
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div style={{ padding: 24 }}>
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Skeleton.Input active style={{ width: 300 }} />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} active paragraph={{ rows: 1 }} title={false} />
        ))}
      </Space>
    </Card>
  </div>
);

// Form skeleton
export const FormSkeleton: React.FC = () => (
  <div style={{ padding: 24 }}>
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <Skeleton.Input active style={{ width: 100, marginBottom: 8 }} size="small" />
            <Skeleton.Input active style={{ width: '100%' }} />
          </div>
        ))}
        <div style={{ marginTop: 16 }}>
          <Skeleton.Button active style={{ width: 120 }} />
        </div>
      </Space>
    </Card>
  </div>
);

// Chart skeleton
export const ChartSkeleton: React.FC = () => (
  <Card>
    <Skeleton.Input active style={{ width: 200, marginBottom: 16 }} />
    <div style={{ 
      height: 300, 
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: 8
    }} />
    <style>{`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  </Card>
);

// Profile/Detail page skeleton
export const DetailSkeleton: React.FC = () => (
  <div style={{ padding: 24 }}>
    <Card>
      <Row gutter={24}>
        <Col span={6}>
          <Skeleton.Avatar active size={120} shape="square" />
        </Col>
        <Col span={18}>
          <Skeleton active paragraph={{ rows: 4 }} />
        </Col>
      </Row>
    </Card>
    <Card style={{ marginTop: 16 }}>
      <Skeleton active paragraph={{ rows: 6 }} />
    </Card>
  </div>
);

// List skeleton
export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => (
  <Card>
    <Space direction="vertical" style={{ width: '100%' }}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0' }}>
          <Skeleton.Avatar active size={40} />
          <div style={{ flex: 1 }}>
            <Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
          </div>
        </div>
      ))}
    </Space>
  </Card>
);

// Sidebar skeleton
export const SidebarSkeleton: React.FC = () => (
  <div style={{ padding: 16 }}>
    <Skeleton.Avatar active size={40} style={{ marginBottom: 24 }} />
    <Space direction="vertical" style={{ width: '100%' }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton.Input key={i} active style={{ width: '100%' }} />
      ))}
    </Space>
  </div>
);

export default {
  DashboardSkeleton,
  TableSkeleton,
  FormSkeleton,
  ChartSkeleton,
  DetailSkeleton,
  ListSkeleton,
  SidebarSkeleton,
};
