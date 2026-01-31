/**
 * Empty State Components
 * Beautiful illustrations and CTAs for empty data states
 */

import React from 'react';
import { Empty, Button, Typography, Space } from 'antd';
import { 
  PlusOutlined, 
  FileAddOutlined, 
  SearchOutlined,
  InboxOutlined,
  FileTextOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  BoxPlotOutlined,
  TruckOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  showAction?: boolean;
}

// Generic empty state
export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data',
  description = 'No records found',
  actionText = 'Create New',
  onAction,
  icon,
  showAction = true,
}) => (
  <div style={{ 
    padding: '60px 20px', 
    textAlign: 'center',
    background: '#fafafa',
    borderRadius: 12,
    margin: 16
  }}>
    <Empty
      image={icon || Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <Space direction="vertical" size={4}>
          <Title level={5} style={{ marginBottom: 0 }}>{title}</Title>
          <Text type="secondary">{description}</Text>
        </Space>
      }
    >
      {showAction && onAction && (
        <Button type="primary" icon={<PlusOutlined />} onClick={onAction}>
          {actionText}
        </Button>
      )}
    </Empty>
  </div>
);

// Invoices empty state
export const EmptyInvoices: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <EmptyState
    title="No Invoices Yet"
    description="Create your first invoice to start tracking revenue"
    actionText="Create Invoice"
    onAction={onAction}
    icon={<FileTextOutlined style={{ fontSize: 64, color: '#667eea' }} />}
  />
);

// Customers empty state
export const EmptyCustomers: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <EmptyState
    title="No Customers"
    description="Add your first customer to start building relationships"
    actionText="Add Customer"
    onAction={onAction}
    icon={<TeamOutlined style={{ fontSize: 64, color: '#667eea' }} />}
  />
);

// Products empty state
export const EmptyProducts: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <EmptyState
    title="No Products"
    description="Add products to your inventory to start selling"
    actionText="Add Product"
    onAction={onAction}
    icon={<BoxPlotOutlined style={{ fontSize: 64, color: '#667eea' }} />}
  />
);

// Orders empty state
export const EmptyOrders: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <EmptyState
    title="No Orders"
    description="Orders from your customers will appear here"
    actionText="Create Order"
    onAction={onAction}
    icon={<ShoppingCartOutlined style={{ fontSize: 64, color: '#667eea' }} />}
  />
);

// Transactions empty state
export const EmptyTransactions: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <EmptyState
    title="No Transactions"
    description="Financial transactions will be recorded here"
    actionText="Add Transaction"
    onAction={onAction}
    icon={<DollarOutlined style={{ fontSize: 64, color: '#667eea' }} />}
  />
);

// Shipments empty state
export const EmptyShipments: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <EmptyState
    title="No Shipments"
    description="Track your deliveries and shipments here"
    actionText="Create Shipment"
    onAction={onAction}
    icon={<TruckOutlined style={{ fontSize: 64, color: '#667eea' }} />}
  />
);

// Search results empty state
export const EmptySearchResults: React.FC<{ query?: string }> = ({ query }) => (
  <div style={{ 
    padding: '60px 20px', 
    textAlign: 'center',
    background: '#fafafa',
    borderRadius: 12,
    margin: 16
  }}>
    <SearchOutlined style={{ fontSize: 64, color: '#bfbfbf', marginBottom: 16 }} />
    <Title level={5}>No Results Found</Title>
    <Text type="secondary">
      {query 
        ? `No matches for "${query}". Try a different search term.`
        : 'Try adjusting your search or filters.'
      }
    </Text>
  </div>
);

// File upload empty state
export const EmptyUpload: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <div 
    style={{ 
      padding: '40px', 
      textAlign: 'center',
      background: '#fafafa',
      border: '2px dashed #d9d9d9',
      borderRadius: 12,
      cursor: 'pointer',
      transition: 'all 0.3s'
    }}
    onClick={onAction}
  >
    <InboxOutlined style={{ fontSize: 48, color: '#667eea', marginBottom: 16 }} />
    <Title level={5} style={{ marginBottom: 4 }}>Drop files here or click to upload</Title>
    <Text type="secondary">Support for CSV, Excel, PDF files</Text>
  </div>
);

// Generic error state
export const ErrorState: React.FC<{ 
  title?: string; 
  description?: string; 
  onRetry?: () => void 
}> = ({ 
  title = 'Something went wrong', 
  description = 'We encountered an error loading this data',
  onRetry 
}) => (
  <div style={{ 
    padding: '60px 20px', 
    textAlign: 'center',
    background: '#fff1f0',
    borderRadius: 12,
    margin: 16
  }}>
    <Empty
      image={Empty.PRESENTED_IMAGE_DEFAULT}
      description={
        <Space direction="vertical" size={4}>
          <Title level={5} type="danger" style={{ marginBottom: 0 }}>{title}</Title>
          <Text type="secondary">{description}</Text>
        </Space>
      }
    >
      {onRetry && (
        <Button type="primary" danger onClick={onRetry}>
          Try Again
        </Button>
      )}
    </Empty>
  </div>
);

export default {
  EmptyState,
  EmptyInvoices,
  EmptyCustomers,
  EmptyProducts,
  EmptyOrders,
  EmptyTransactions,
  EmptyShipments,
  EmptySearchResults,
  EmptyUpload,
  ErrorState,
};
