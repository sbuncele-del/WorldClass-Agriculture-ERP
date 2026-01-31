/**
 * Multi-Client Consolidated Dashboard
 * Overview of all clients with consolidated metrics and portfolio view
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  DollarSign,
  AlertTriangle,
  Download,
  Plus,
  Settings,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { useClient } from '../contexts/ClientContext';
import { useCurrency } from '../contexts/CurrencyContext';
import type { ConsolidatedMetrics } from '../types/multi-tenant.types';
import { API_BASE_URL } from '../services/api.service';
import './MultiClientDashboard.css';

const MultiClientDashboard: React.FC = () => {
  const { availableClients } = useClient();
  const { formatCurrency, displayCurrency } = useCurrency();
  const [metrics, setMetrics] = useState<ConsolidatedMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConsolidatedMetrics();
  }, [displayCurrency]);

  const fetchConsolidatedMetrics = async () => {
    setIsLoading(true);
    try {
            const response = await fetch(`${API_BASE_URL}/api/dashboard/consolidated?currency=${displayCurrency}`);
      
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      } else {
        // Use mock data
        setMetrics(getMockConsolidatedMetrics());
      }
    } catch (err) {
      console.error('Error fetching consolidated metrics:', err);
      setMetrics(getMockConsolidatedMetrics());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockConsolidatedMetrics = (): ConsolidatedMetrics => ({
    currency: displayCurrency,
    period: {
      fiscalYear: 2025,
      periodNumber: 11,
      periodName: 'November 2025',
      startDate: '2025-11-01',
      endDate: '2025-11-30',
    },
    revenue: {
      total: 12847320,
      byClient: [
        { clientId: 'client-001', clientName: 'Global Enterprises', amount: 5245670 },
        { clientId: 'client-002', clientName: 'Manufacturing First', amount: 3892450 },
        { clientId: 'client-003', clientName: 'Retail Dynamics', amount: 2709200 },
        { clientId: 'client-004', clientName: 'Logistics Solutions', amount: 800000 },
        { clientId: 'client-005', clientName: 'Financial Corp', amount: 200000 },
      ],
      growth: 8.2,
      comparison: 'INCREASE',
    },
    cashPosition: {
      total: 11847320,
      available: 9847320,
      restricted: 2000000,
      byBank: [
        { bankName: 'Standard Bank', accountNumber: '**** 1234', balance: 5245670 },
        { bankName: 'FNB', accountNumber: '**** 5678', balance: 3892450 },
        { bankName: 'Nedbank', accountNumber: '**** 9012', balance: 2709200 },
      ],
      byCurrency: [
        { currency: 'ZAR', amount: 9500000, converted: 9500000 },
        { currency: 'USD', amount: 100000, converted: 1852000 },
        { currency: 'EUR', amount: 25000, converted: 510000 },
      ],
    },
    inventory: {
      totalValue: 8923150,
      totalUnits: 45678,
      warehouses: 12,
      byWarehouse: [
        { warehouseId: 'wh-001', name: 'Johannesburg Main', value: 3500000 },
        { warehouseId: 'wh-002', name: 'Durban Distribution', value: 2800000 },
        { warehouseId: 'wh-003', name: 'Cape Town Retail', value: 1623150 },
        { warehouseId: 'wh-004', name: 'Pretoria Logistics', value: 1000000 },
      ],
      status: 'OPTIMAL',
    },
    operations: {
      manufacturingUnits: { total: 5, operational: 4, capacity: 85 },
      warehouseUtilization: { total: 12, utilized: 10, percentage: 92 },
      ordersFulfilled: 1428,
      pendingOrders: 124,
    },
    fxExposure: {
      totalExposure: 2324180,
      byCurrency: [
        { currency: 'USD', exposure: 1852000, risk: 'MEDIUM' },
        { currency: 'EUR', exposure: 510000, risk: 'LOW' },
        { currency: 'GBP', exposure: -37820, risk: 'LOW' },
      ],
      unrealizedGainLoss: 45000,
    },
    users: {
      total: 24,
      active: 22,
      online: 3,
      byClient: [
        { clientId: 'client-001', clientName: 'Global Enterprises', count: 8 },
        { clientId: 'client-002', clientName: 'Manufacturing First', count: 6 },
        { clientId: 'client-003', clientName: 'Retail Dynamics', count: 5 },
        { clientId: 'client-004', clientName: 'Logistics Solutions', count: 3 },
        { clientId: 'client-005', clientName: 'Financial Corp', count: 2 },
      ],
    },
  });

  if (isLoading || !metrics) {
    return (
      <div className="multi-client-dashboard loading">
        <div className="loading-spinner">
          <RefreshCw size={32} className="spin" />
          <p>Loading consolidated metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="multi-client-dashboard">
      {/* Header */}
      <div className="dashboard-header-section">
        <div className="header-content">
          <div className="header-title-group">
            <h1 className="dashboard-title">Multi-Client Dashboard</h1>
            <p className="dashboard-subtitle">
              Consolidated view across {availableClients.length} clients and {metrics.period.periodName}
            </p>
          </div>
          <div className="header-actions">
            <button className="action-button secondary">
              <Download size={18} />
              Export Data
            </button>
            <button className="action-button secondary">
              <Settings size={18} />
              Settings
            </button>
            <button className="action-button primary">
              <Plus size={18} />
              New Client
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        {/* Consolidated Revenue */}
        <div className="metric-card revenue">
          <div className="card-header">
            <div className="card-title">Consolidated Revenue</div>
            <div className="card-icon">
              <BarChart3 size={24} />
            </div>
          </div>
          <div className="card-value">{formatCurrency(metrics.revenue.total)}</div>
          <div className="card-description">Across {availableClients.length} business units</div>
          <div className="card-footer success">
            <TrendingUp size={16} />
            <span>{metrics.revenue.growth}% increase from last period</span>
          </div>
          <div className="card-progress">
            <div className="progress-bar" style={{ width: '82%' }} />
          </div>
        </div>

        {/* Global Inventory */}
        <div className="metric-card inventory">
          <div className="card-header">
            <div className="card-title">Global Inventory</div>
            <div className="card-icon">
              <Package size={24} />
            </div>
          </div>
          <div className="card-value">{formatCurrency(metrics.inventory.totalValue)}</div>
          <div className="card-description">Across {metrics.inventory.warehouses} warehouses</div>
          <div className="card-footer">
            <span className="badge success">Optimal Levels</span>
          </div>
          <div className="card-progress">
            <div className="progress-bar" style={{ width: '75%' }} />
          </div>
        </div>

        {/* FX Exposure */}
        <div className="metric-card fx">
          <div className="card-header">
            <div className="card-title">FX Exposure</div>
            <div className="card-icon">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="card-value">{formatCurrency(metrics.fxExposure.totalExposure)}</div>
          <div className="card-description">Across {metrics.cashPosition.byCurrency.length} currencies</div>
          <div className="card-footer warning">
            <AlertTriangle size={16} />
            <span>USD position needs review</span>
          </div>
          <div className="card-progress">
            <div className="progress-bar warning" style={{ width: '65%' }} />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content-grid">
        {/* Bank Accounts Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3 className="section-title">Consolidated Bank Accounts</h3>
            <Link to="/cash-management" className="section-link">
              View All Transactions →
            </Link>
          </div>
          <div className="bank-accounts-grid">
            {metrics.cashPosition.byBank.map((bank, index) => (
              <div key={index} className="bank-account-card">
                <div className="bank-name">{bank.bankName}</div>
                <div className="bank-account">{bank.accountNumber}</div>
                <div className="bank-balance">{formatCurrency(bank.balance)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Client Portfolio */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3 className="section-title">Client Portfolio</h3>
            <Link to="/clients" className="section-link">
              Manage Clients →
            </Link>
          </div>
          <div className="client-portfolio-list">
            {availableClients.map((client) => {
              const clientRevenue = metrics.revenue.byClient.find(c => c.clientId === client.id);
              const clientUsers = metrics.users.byClient.find(c => c.clientId === client.id);
              
              return (
                <div key={client.id} className="client-portfolio-item">
                  <div className="client-avatar">{client.code}</div>
                  <div className="client-info">
                    <div className="client-name">{client.name}</div>
                    <div className="client-details">
                      {client.type} • {client.businessUnits} business units
                    </div>
                  </div>
                  <div className="client-metrics">
                    <div className="client-metric">
                      <span className="metric-label">Revenue</span>
                      <span className="metric-value">
                        {clientRevenue ? formatCurrency(clientRevenue.amount) : 'N/A'}
                      </span>
                    </div>
                    <div className="client-metric">
                      <span className="metric-label">Users</span>
                      <span className="metric-value">{clientUsers?.count || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operations Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3 className="section-title">Global Operations</h3>
            <Link to="/operations" className="section-link">
              View Details →
            </Link>
          </div>
          <div className="operations-grid">
            <div className="operation-card">
              <div className="operation-title">Manufacturing Units</div>
              <div className="operation-status">
                <span className={`status-dot ${metrics.operations.manufacturingUnits.operational === metrics.operations.manufacturingUnits.total ? 'success' : 'warning'}`} />
                {metrics.operations.manufacturingUnits.operational} of {metrics.operations.manufacturingUnits.total} Operational
              </div>
              <div className="operation-value">{metrics.operations.manufacturingUnits.capacity}%</div>
              <div className="operation-label">Capacity Utilization</div>
            </div>
            
            <div className="operation-card">
              <div className="operation-title">Warehouse Network</div>
              <div className="operation-status">
                <span className={`status-dot ${metrics.operations.warehouseUtilization.percentage > 85 ? 'warning' : 'success'}`} />
                {metrics.operations.warehouseUtilization.utilized} of {metrics.operations.warehouseUtilization.total} Optimal
              </div>
              <div className="operation-value">{metrics.operations.warehouseUtilization.percentage}%</div>
              <div className="operation-label">Utilization Rate</div>
            </div>
          </div>
        </div>

        {/* Users Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3 className="section-title">User Access</h3>
            <Link to="/users" className="section-link">
              Manage Users →
            </Link>
          </div>
          <div className="users-summary">
            <div className="users-stat">
              <div className="stat-value">{metrics.users.total}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="users-stat">
              <div className="stat-value">{metrics.users.active}</div>
              <div className="stat-label">Active</div>
            </div>
            <div className="users-stat">
              <div className="stat-value online">{metrics.users.online}</div>
              <div className="stat-label">Online Now</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiClientDashboard;
