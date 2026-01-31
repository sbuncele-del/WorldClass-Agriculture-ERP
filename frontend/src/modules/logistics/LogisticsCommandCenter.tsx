import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import apiClient from '../../services/api';
import '../../styles/erp-ui.css';

interface FleetKPI {
  inTransit: number;
  idle: number;
  loading: number;
  maintenance: number;
  total: number;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'maintenance' | 'license' | 'delay' | 'fuel' | 'route';
  title: string;
  message: string;
  vehicleId?: string;
  vehicleNumber?: string;
  timestamp: string;
  actionable: boolean;
}

interface LiveVehicle {
  id: string;
  number: string;
  registration: string;
  driver: string;
  status: 'on-time' | 'delayed' | 'idle' | 'at-risk';
  location: { lat: number; lng: number };
  locationName: string;
  destination: string;
  tripNumber: string;
  eta: string;
  fuelLevel: number;
  speed: number;
  loadPercentage: number;
  delayMinutes?: number;
}

interface PredictiveInsight {
  type: 'route' | 'maintenance' | 'fuel' | 'efficiency';
  severity: 'high' | 'medium' | 'low';
  vehicle: string;
  message: string;
  recommendation: string;
  potentialSavings?: string;
}

const LogisticsCommandCenter: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [fleetKPI, setFleetKPI] = useState<FleetKPI>({
    inTransit: 0,
    idle: 0,
    loading: 0,
    maintenance: 0,
    total: 0
  });

  const [onTimePerformance, setOnTimePerformance] = useState(0);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const [liveVehicles, setLiveVehicles] = useState<LiveVehicle[]>([]);

  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashboardRes, alertsRes, vehiclesRes] = await Promise.all([
          apiClient.get('/api/logistics/dashboard'),
          apiClient.get('/api/logistics/alerts'),
          apiClient.get('/api/logistics/vehicles')
        ]);

        if (dashboardRes.data) {
          const data = dashboardRes.data.data || dashboardRes.data;
          if (data.fleetKPI) setFleetKPI(data.fleetKPI);
          if (data.onTimePerformance) setOnTimePerformance(data.onTimePerformance);
          if (data.predictiveInsights) setPredictiveInsights(data.predictiveInsights);
        }

        if (alertsRes.data) {
          setAlerts(alertsRes.data.data || alertsRes.data || []);
        }

        if (vehiclesRes.data) {
          setLiveVehicles(vehiclesRes.data.data || vehiclesRes.data || []);
        }
      } catch (error) {
        console.error('Error fetching logistics dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const tabs = [
    { id: 'command', label: '🎯 Command Center', path: '/logistics/dashboard' },
    { id: 'planner', label: '📋 Load Planner', path: '/logistics/planner' },
    { id: 'trips', label: '🚚 Trip Management', path: '/logistics/trips' },
    { id: 'fleet', label: '🚛 Fleet', path: '/logistics/fleet' },
    { id: 'drivers', label: '👨‍✈️ Drivers', path: '/logistics/drivers' },
    { id: 'fuel', label: '⛽ Fuel', path: '/logistics/fuel' },
    { id: 'documents', label: '📄 Documents', path: '/logistics/documents' },
    { id: 'reports', label: '📊 Analytics', path: '/logistics/reports' }
  ];

  const breadcrumbs = [
    { label: 'Logistics', path: '/logistics' },
    { label: 'Command Center' }
  ];

  return (
    <EnterpriseLayout
      moduleTitle="🎯 Logistics Command Center"
      moduleSubtitle="Real-time fleet monitoring & dispatch control"
      breadcrumbs={breadcrumbs}
      tabs={tabs}
      actionButtons={[
        {
          label: '📄 Process Document',
          icon: <span>📄</span>,
          variant: 'primary' as const,
          onClick: () => window.location.href = '/logistics/documents'
        },
        {
          label: '+ Dispatch Trip',
          icon: <span>🚚</span>,
          variant: 'secondary' as const,
          onClick: () => window.location.href = '/logistics/trips/new'
        },
        {
          label: 'Optimize Routes',
          icon: <span>🗺️</span>,
          variant: 'secondary' as const,
          onClick: () => window.location.href = '/logistics/planning'
        }
      ]}
    >
      {/* Simple, Clean KPIs */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeftColor: '#10b981' }}>
          <div className="metric-header">
            <span className="metric-label">🚛 Active Trucks on Road</span>
            <span className="metric-icon" style={{ fontSize: '2.5rem' }}>🚛</span>
          </div>
          <div className="metric-value">28</div>
          <div className="metric-footer">
            <span className="metric-change" style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Currently making deliveries
            </span>
            <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              12 idle · 5 loading · 3 in workshop
            </div>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeftColor: '#3b82f6' }}>
          <div className="metric-header">
            <span className="metric-label">📦 Deliveries Today</span>
            <span className="metric-icon" style={{ fontSize: '2.5rem' }}>📦</span>
          </div>
          <div className="metric-value">35</div>
          <div className="metric-footer">
            <span className="metric-change success" style={{ fontSize: '0.875rem' }}>
              Scheduled delivery trips
            </span>
            <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              18 en route · 12 completed · 5 pending
            </div>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeftColor: '#f59e0b' }}>
          <div className="metric-header">
            <span className="metric-label">⏱️ On-Time Delivery Rate</span>
            <span className="metric-icon" style={{ fontSize: '2.5rem' }}>⏱️</span>
          </div>
          <div className="metric-value">87.5%</div>
          <div className="metric-footer">
            <span className="metric-change warning" style={{ fontSize: '0.875rem' }}>
              Of deliveries arrive on time
            </span>
            <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              Target: 95% · Gap: -7.5%
            </div>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeftColor: '#ef4444' }}>
          <div className="metric-header">
            <span className="metric-label">🚨 Urgent Issues</span>
            <span className="metric-icon" style={{ fontSize: '2.5rem' }}>🚨</span>
          </div>
          <div className="metric-value">6</div>
          <div className="metric-footer">
            <span className="metric-change danger" style={{ fontSize: '0.875rem' }}>
              Require immediate attention
            </span>
            <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              2 overdue service · 3 delays · 1 license
            </div>
          </div>
        </div>
      </div>

      {/* Live Map */}
      <div className="content-card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title">
            <span style={{ marginRight: '0.5rem' }}>🗺️</span>
            Live Fleet Tracking
            <span style={{ 
              marginLeft: '0.75rem', 
              padding: '0.25rem 0.75rem', 
              background: '#ef4444', 
              color: 'white', 
              borderRadius: '50px', 
              fontSize: '0.75rem',
              fontWeight: 700
            }}>● LIVE</span>
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="action-button">🔄 Refresh</button>
            <button className="action-button primary">⛶ Full Screen</button>
          </div>
        </div>
        <div className="card-content">
          <div style={{ 
            background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', 
            borderRadius: '12px', 
            padding: '3rem 2rem', 
            textAlign: 'center',
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🗺️</div>
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 700, 
                color: '#334155', 
                marginBottom: '0.75rem'
              }}>
                GPS Telematics Integration
              </h3>
              <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '1rem' }}>
                Connect your GPS provider for real-time vehicle tracking
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <div style={{ 
                  padding: '0.75rem 1.5rem', 
                  background: 'white', 
                  borderRadius: '8px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: '#475569',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  🛰️ Cartrack
                </div>
                <div style={{ 
                  padding: '0.75rem 1.5rem', 
                  background: 'white', 
                  borderRadius: '8px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: '#475569',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  📡 MiX Telematics
                </div>
                <div style={{ 
                  padding: '0.75rem 1.5rem', 
                  background: 'white', 
                  borderRadius: '8px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: '#475569',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  🌐 Ctrack
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column: Alerts + Active Vehicles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Critical Alerts */}
        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">
              <span style={{ marginRight: '0.5rem' }}>🔔</span>
              Critical Alerts ({alerts.length})
            </h2>
          </div>
          <div className="card-content" style={{ padding: '0' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {alerts.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  {loading ? 'Loading alerts...' : 'No alerts'}
                </div>
              ) : (
                alerts.map((alert, index) => {
                  const iconMap: Record<string, string> = {
                    maintenance: '🔧',
                    delay: '⏰',
                    license: '📄',
                    fuel: '⛽',
                    route: '🚨'
                  };
                  const bgColor = alert.type === 'critical' ? '#fef2f2' : '#fffbeb';
                  const textColor = alert.type === 'critical' ? '#ef4444' : '#f59e0b';
                  return (
                    <div 
                      key={alert.id}
                      style={{ 
                        padding: '1rem 1.5rem', 
                        borderBottom: index < alerts.length - 1 ? '1px solid #e2e8f0' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = bgColor}
                      onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <div style={{ fontSize: '1.5rem' }}>{iconMap[alert.category] || '⚠️'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: textColor, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
                          {alert.title}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                          {alert.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Active Vehicles */}
        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">
              <span style={{ marginRight: '0.5rem' }}>🚚</span>
              Active Vehicles ({liveVehicles.length})
            </h2>
          </div>
          <div className="card-content">
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Destination</th>
                    <th>ETA</th>
                    <th>Load</th>
                  </tr>
                </thead>
                <tbody>
                  {liveVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        {loading ? 'Loading vehicles...' : 'No active vehicles'}
                      </td>
                    </tr>
                  ) : (
                    liveVehicles.map((vehicle) => {
                      const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
                        'on-time': { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', label: 'ON TIME' },
                        'delayed': { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', label: 'DELAYED' },
                        'at-risk': { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', label: 'AT RISK' },
                        'idle': { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748b', label: 'IDLE' }
                      };
                      const status = statusConfig[vehicle.status] || statusConfig['idle'];
                      return (
                        <tr key={vehicle.id}>
                          <td>
                            <strong>{vehicle.number}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{vehicle.registration}</div>
                          </td>
                          <td>{vehicle.driver}</td>
                          <td>
                            <span className="status-badge" style={{ background: status.bg, color: status.color }}>
                              {status.label}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.875rem' }}>📍 {vehicle.locationName}</td>
                          <td>{vehicle.destination}</td>
                          <td style={{ fontWeight: 600, color: vehicle.status === 'delayed' ? '#ef4444' : 'inherit' }}>{vehicle.eta}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '50px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${vehicle.loadPercentage}%`, height: '100%', background: vehicle.loadPercentage > 90 ? '#10b981' : '#3b82f6' }}></div>
                              </div>
                              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{vehicle.loadPercentage}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </EnterpriseLayout>
  );
};

export default LogisticsCommandCenter;
