import React, { useState, useEffect } from 'react';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import apiClient from '../../services/api';
import '../../styles/erp-ui.css';

interface Load {
  id: number;
  customer: string;
  route: string;
  weight: number;
  assigned: boolean;
}

interface Vehicle {
  reg: string;
  driver: string;
  capacity: number;
  currentLoad: number;
  assignedLoads: Load[];
}

const LoadPlanningEnhanced: React.FC = () => {
  const [loads, setLoads] = useState<Load[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [loadsRes, vehiclesRes] = await Promise.all([
          apiClient.get('/api/logistics/loads'),
          apiClient.get('/api/logistics/vehicles')
        ]);
        setLoads((loadsRes.data.loads || loadsRes.data || []).map((l: any) => ({
          id: l.id,
          customer: l.customer || l.customer_name,
          route: l.route || `${l.origin} → ${l.destination}`,
          weight: l.weight || 0,
          assigned: l.assigned || false
        })));
        setVehicles((vehiclesRes.data.vehicles || vehiclesRes.data || []).map((v: any) => ({
          reg: v.reg || v.registration,
          driver: v.driver || v.driver_name,
          capacity: v.capacity || 28000,
          currentLoad: v.currentLoad || v.current_load || 0,
          assignedLoads: v.assignedLoads || []
        })));
      } catch (error) {
        console.error('Failed to fetch load planning data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/logistics/dashboard' },
    { id: 'fleet', label: 'Fleet Management', path: '/logistics/fleet' },
    { id: 'drivers', label: 'Driver Management', path: '/logistics/drivers' },
    { id: 'trips', label: 'Trip Management', path: '/logistics/trips' },
    { id: 'planning', label: 'Load Planning', path: '/logistics/planning' },
    { id: 'fuel', label: 'Fuel Management', path: '/logistics/fuel' },
    { id: 'reports', label: 'Reports & Analytics', path: '/logistics/reports' }
  ];

  const breadcrumbs = [
    { label: 'Logistics', path: '/logistics' },
    { label: 'Load & Route Planning' }
  ];

  const handleAssignLoad = (loadId: number, vehicleReg: string) => {
    const load = loads.find(l => l.id === loadId);
    const vehicle = vehicles.find(v => v.reg === vehicleReg);
    
    if (!load || !vehicle || load.assigned) return;
    
    if (vehicle.currentLoad + load.weight > vehicle.capacity) {
      alert(`⚠️ Cannot assign!\n\nVehicle ${vehicle.reg} does not have enough capacity.\n\nAvailable: ${vehicle.capacity - vehicle.currentLoad} kg\nRequired: ${load.weight} kg`);
      return;
    }

    setLoads(loads.map(l => 
      l.id === loadId ? { ...l, assigned: true } : l
    ));

    setVehicles(vehicles.map(v => 
      v.reg === vehicleReg 
        ? { 
            ...v, 
            currentLoad: v.currentLoad + load.weight,
            assignedLoads: [...v.assignedLoads, load]
          } 
        : v
    ));

    alert(`✅ Load Assigned!\n\n${load.customer} (${load.weight} kg)\nassigned to ${vehicle.driver}\n\nVehicle: ${vehicle.reg}\nNew Load: ${vehicle.currentLoad + load.weight} / ${vehicle.capacity} kg`);
  };

  const handleUnassignLoad = (loadId: number, vehicleReg: string) => {
    const vehicle = vehicles.find(v => v.reg === vehicleReg);
    const load = vehicle?.assignedLoads.find(l => l.id === loadId);
    
    if (!load || !vehicle) return;

    setLoads(loads.map(l => 
      l.id === loadId ? { ...l, assigned: false } : l
    ));

    setVehicles(vehicles.map(v => 
      v.reg === vehicleReg 
        ? { 
            ...v, 
            currentLoad: v.currentLoad - load.weight,
            assignedLoads: v.assignedLoads.filter(l => l.id !== loadId)
          } 
        : v
    ));
  };

  const unassignedLoads = loads.filter(l => !l.assigned);
  const totalUnassignedWeight = unassignedLoads.reduce((sum, l) => sum + l.weight, 0);

  return (
    <EnterpriseLayout
      moduleTitle="Load & Route Planning"
      moduleSubtitle="Optimize routes and vehicle load allocation"
      breadcrumbs={breadcrumbs}
      tabs={tabs}
    >
      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeftColor: '#667eea' }}>
          <div className="metric-header">
            <span className="metric-label">Unassigned Loads</span>
            <span className="metric-icon" style={{ fontSize: '1.5rem' }}>📦</span>
          </div>
          <div className="metric-value">{unassignedLoads.length}</div>
          <div className="metric-footer">
            <span className="metric-change">{(totalUnassignedWeight / 1000).toFixed(1)} tons</span>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeftColor: '#10b981' }}>
          <div className="metric-header">
            <span className="metric-label">Available Vehicles</span>
            <span className="metric-icon" style={{ fontSize: '1.5rem' }}>🚚</span>
          </div>
          <div className="metric-value">{vehicles.filter(v => v.currentLoad === 0).length}</div>
          <div className="metric-footer">
            <span className="metric-change success">Ready for assignment</span>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeftColor: '#8b5cf6' }}>
          <div className="metric-header">
            <span className="metric-label">Fleet Utilization</span>
            <span className="metric-icon" style={{ fontSize: '1.5rem' }}>📊</span>
          </div>
          <div className="metric-value">
            {vehicles.length > 0 
              ? Math.round((vehicles.reduce((sum, v) => sum + (v.currentLoad / v.capacity * 100), 0) / vehicles.length))
              : 0}%
          </div>
          <div className="metric-footer">
            <span className="metric-change">Average load</span>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeftColor: '#f59e0b' }}>
          <div className="metric-header">
            <span className="metric-label">Total Capacity</span>
            <span className="metric-icon" style={{ fontSize: '1.5rem' }}>⚖️</span>
          </div>
          <div className="metric-value">
            {(vehicles.reduce((sum, v) => sum + v.capacity, 0) / 1000).toFixed(1)}t
          </div>
          <div className="metric-footer">
            <span className="metric-change">Combined fleet</span>
          </div>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <h2 className="card-title">Unassigned Loads ({unassignedLoads.length})</h2>
        </div>
        <div className="card-content">
          {unassignedLoads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>All Loads Assigned!</h3>
              <p>No pending loads waiting for assignment</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {unassignedLoads.map((load) => (
                <div
                  key={load.id}
                  style={{
                    padding: '1.25rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '0.75rem',
                    background: 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        {load.customer}
                      </h3>
                      <p style={{ fontSize: '0.9375rem', color: '#64748b', marginBottom: '0.5rem' }}>
                        📍 {load.route}
                      </p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                        📦 {load.weight.toLocaleString()} kg
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {vehicles.map(vehicle => (
                        <button
                          key={vehicle.reg}
                          onClick={() => handleAssignLoad(load.id, vehicle.reg)}
                          className="action-button"
                          style={{
                            padding: '0.625rem 1rem',
                            fontSize: '0.8125rem'
                          }}
                        >
                          {vehicle.reg}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <h2 className="card-title">Fleet Load Status</h2>
        </div>
        <div className="card-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {vehicles.map((vehicle) => {
              const utilization = (vehicle.currentLoad / vehicle.capacity) * 100;
              return (
                <div
                  key={vehicle.reg}
                  style={{
                    padding: '1.5rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '0.75rem',
                    background: 'white'
                  }}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      {vehicle.reg}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.75rem' }}>
                      👨‍✈️ {vehicle.driver}
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                      Load: {vehicle.currentLoad.toLocaleString()} / {vehicle.capacity.toLocaleString()} kg
                    </div>
                    <div style={{
                      width: '100%',
                      height: '12px',
                      background: '#e2e8f0',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{
                        width: `${utilization}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                      }}></div>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>
                      {utilization.toFixed(1)}% Utilized
                    </div>
                  </div>

                  {vehicle.assignedLoads.length > 0 && (
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                        Assigned Loads:
                      </div>
                      {vehicle.assignedLoads.map(load => (
                        <div
                          key={load.id}
                          style={{
                            padding: '0.75rem',
                            background: '#f8fafc',
                            borderRadius: '0.5rem',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                              {load.customer}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {load.weight.toLocaleString()} kg
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnassignLoad(load.id, vehicle.reg)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              border: 'none',
                              borderRadius: '0.375rem',
                              background: '#fee2e2',
                              color: '#991b1b',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </EnterpriseLayout>
  );
};

export default LoadPlanningEnhanced;
