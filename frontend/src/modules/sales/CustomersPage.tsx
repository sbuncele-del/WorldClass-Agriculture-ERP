import React, { useState, useEffect } from 'react';
import { workspaceApi } from '../../services/api.service';
import EnhancedDataTable from '../../components/data/EnhancedDataTable';
import type { TableColumn, TableAction } from '../../components/data/EnhancedDataTable';
import { Eye, Edit, Mail, Phone, AlertCircle } from 'lucide-react';
import '../../styles/erp-ui.css';

interface Customer {
  customer_id: number;
  customer_code: string;
  customer_name: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PROSPECT';
  credit_limit: number;
  outstanding_balance: number;
  total_purchases: number;
  last_purchase_date: string;
}

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await workspaceApi.sales.getCustomers();
      
      let customersData = [];
      if (response && Array.isArray(response)) {
        customersData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        customersData = response.data;
      } else if (response && response.customers && Array.isArray(response.customers)) {
        customersData = response.customers;
      }
      
      // Map backend data to frontend format
      const mappedCustomers = customersData.map((c: any) => {
        // Handle status - backend returns boolean, frontend expects string
        let statusString = 'ACTIVE';
        if (typeof c.status === 'boolean') {
          statusString = c.status || c.is_active ? 'ACTIVE' : 'INACTIVE';
        } else if (typeof c.status === 'string') {
          statusString = c.status.toUpperCase();
        }
        
        return {
          customer_id: c.id || c.customer_id,
          customer_code: c.customer_code || '-',
          customer_name: c.customer_name || c.company_name || c.name || '-',
          email: c.email || '-',
          phone: c.phone || c.mobile || '-',
          status: statusString as 'ACTIVE' | 'INACTIVE' | 'PROSPECT',
          credit_limit: parseFloat(c.credit_limit) || 0,
          outstanding_balance: parseFloat(c.total_outstanding || c.outstanding_balance || 0),
          total_purchases: parseFloat(c.total_sales || c.total_purchases || 0),
          last_purchase_date: c.last_purchase_date || (c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : '-')
        };
      });
      
      setCustomers(mappedCustomers);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string; }> = {
      'ACTIVE': { bg: '#d1fae5', text: '#065f46' },
      'INACTIVE': { bg: '#f3f4f6', text: '#6b7280' },
      'PROSPECT': { bg: '#fef3c7', text: '#92400e' }
    };
    const color = colors[status] || colors.ACTIVE;
    
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 700,
        background: color.bg,
        color: color.text
      }}>
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: color.text
        }} />
        {status}
      </span>
    );
  };

  // Define table columns
  const columns: TableColumn<Customer>[] = [
    {
      key: 'customer_code' as keyof Customer,
      label: 'Customer Code',
      width: '130px',
      render: (value) => (
        <span style={{ fontWeight: 700, color: '#667eea', fontFamily: 'monospace' }}>
          {value}
        </span>
      )
    },
    {
      key: 'customer_name' as keyof Customer,
      label: 'Customer',
      width: '250px',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>
            {value}
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Mail size={12} />
              {row.email}
            </span>
            {row.phone && row.phone !== '-' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Phone size={12} />
                {row.phone}
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'status' as keyof Customer,
      label: 'Status',
      width: '120px',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'credit_limit' as keyof Customer,
      label: 'Credit Limit',
      width: '140px',
      align: 'right',
      render: (value) => (
        <span style={{ fontWeight: 600, color: '#059669' }}>
          {formatCurrency(value)}
        </span>
      )
    },
    {
      key: 'outstanding_balance' as keyof Customer,
      label: 'Outstanding',
      width: '140px',
      align: 'right',
      render: (value) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
          {value > 0 && <AlertCircle size={14} color="#dc2626" />}
          <span style={{ 
            fontWeight: 600, 
            color: value > 0 ? '#dc2626' : '#10b981'
          }}>
            {formatCurrency(value)}
          </span>
        </div>
      )
    },
    {
      key: 'total_purchases' as keyof Customer,
      label: 'Total Purchases',
      width: '150px',
      align: 'right',
      render: (value) => (
        <span style={{ fontWeight: 600, color: '#374151' }}>
          {formatCurrency(value)}
        </span>
      )
    },
    {
      key: 'last_purchase_date' as keyof Customer,
      label: 'Last Purchase',
      width: '130px',
      render: (value) => value !== '-' ? new Date(value).toLocaleDateString('en-ZA') : '-'
    }
  ];

  // Define row actions
  const actions: TableAction<Customer>[] = [
    {
      label: 'View',
      icon: <Eye size={16} />,
      onClick: (row) => {
        console.log('View customer:', row);
        // Navigate to customer detail page
      },
      variant: 'primary'
    },
    {
      label: 'Edit',
      icon: <Edit size={16} />,
      onClick: (row) => {
        console.log('Edit customer:', row);
        // Open edit drawer
      },
      variant: 'secondary'
    }
  ];

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <EnhancedDataTable
        data={customers}
        columns={columns}
        actions={actions}
        keyField="customer_id"
        searchable={true}
        searchPlaceholder="Search customers by name, code, email..."
        selectable={true}
        pageSize={50}
        emptyMessage="No customers found. Create your first customer to get started."
        loading={loading}
        stickyHeader={true}
      />

      {/* Summary Cards Below Table */}
      <div className="metrics-grid" style={{ marginTop: '2rem' }}>
        <div className="metric-card revenue">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <div className="metric-label">Total Customers</div>
            <div className="metric-value">{customers.length}</div>
            <div className="metric-trend positive">
              <span className="trend-text">{customers.filter(c => c.status === 'ACTIVE').length} Active</span>
            </div>
          </div>
        </div>

        <div className="metric-card expenses">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-label">Total Credit Limit</div>
            <div className="metric-value">
              {formatCurrency(customers.reduce((sum, c) => sum + c.credit_limit, 0))}
            </div>
          </div>
        </div>

        <div className="metric-card profit">
          <div className="metric-icon">⚠️</div>
          <div className="metric-content">
            <div className="metric-label">Outstanding Balance</div>
            <div className="metric-value">
              {formatCurrency(customers.reduce((sum, c) => sum + c.outstanding_balance, 0))}
            </div>
          </div>
        </div>

        <div className="metric-card activity">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <div className="metric-label">Total Purchases</div>
            <div className="metric-value">
              {formatCurrency(customers.reduce((sum, c) => sum + c.total_purchases, 0))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomersPage;
