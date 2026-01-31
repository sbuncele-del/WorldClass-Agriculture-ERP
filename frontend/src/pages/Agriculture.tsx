import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import './Agriculture.css';

// Financial Integration Interface
interface FinancialTransaction {
  glAccount: string;
  amount: number;
  description: string;
  type: 'revenue' | 'expense' | 'asset';
}

const Agriculture: React.FC = () => {
  const [activeTab, setActiveTab] = useState('crops');
  const [crops, setCrops] = useState<any[]>([]);
  const [livestock, setLivestock] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [planning, setPlanning] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Financial Integration: GL Account Mapping
  const financialAccounts = {
    cropRevenue: '4100-CROP-SALES',
    livestockRevenue: '4200-LIVESTOCK-SALES', 
    equipmentAsset: '1500-EQUIPMENT',
    operatingExpense: '5100-FARM-OPERATIONS',
    laborExpense: '5200-LABOR-COSTS',
    inventoryAsset: '1300-CROP-INVENTORY'
  };

  // Function to record crop sales to financial system
  const recordCropSale = (cropId: string, amount: number): FinancialTransaction[] => {
    return [
      {
        glAccount: '1100-ACCOUNTS-RECEIVABLE',
        amount: amount,
        description: `Crop Sale ${cropId}`,
        type: 'asset'
      },
      {
        glAccount: financialAccounts.cropRevenue,
        amount: -amount,
        description: `Crop Revenue ${cropId}`,
        type: 'revenue'
      }
    ];
  };

  // Function to record equipment depreciation
  const recordEquipmentDepreciation = (equipmentId: string, depAmount: number): FinancialTransaction[] => {
    return [
      {
        glAccount: '6100-DEPRECIATION-EXPENSE',
        amount: depAmount,
        description: `Equipment Depreciation ${equipmentId}`,
        type: 'expense'
      },
      {
        glAccount: '1510-ACCUMULATED-DEPRECIATION',
        amount: -depAmount,
        description: `Accumulated Depreciation ${equipmentId}`,
        type: 'asset'
      }
    ];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cropsRes, livestockRes, equipmentRes, planningRes] = await Promise.all([
          apiClient.get('/api/agriculture/crops'),
          apiClient.get('/api/agriculture/livestock'),
          apiClient.get('/api/agriculture/equipment'),
          apiClient.get('/api/agriculture/planning')
        ]);
        setCrops(cropsRes.data?.data || cropsRes.data || []);
        setLivestock(livestockRes.data?.data || livestockRes.data || []);
        setEquipment(equipmentRes.data?.data || equipmentRes.data || []);
        setPlanning(planningRes.data?.data || planningRes.data || []);
      } catch (err) {
        console.error('Error fetching agriculture data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': case 'available': case 'healthy': case 'growing': case 'excellent': case 'good': return '#10b981';
      case 'in use': case 'planning': case 'fair': return '#f59e0b';
      case 'maintenance': case 'poor': case 'sick': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <div className="agriculture-page">
      <div className="page-header">
        <div className="header-content">
          <h1>🌾 Agriculture Management</h1>
          <p>Crop tracking, livestock management, equipment monitoring, and seasonal planning</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">➕ New Crop</button>
          <button className="btn-secondary">📊 Season Report</button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' }}>🌾</div>
          <div className="metric-details">
            <div className="metric-value">360 ha</div>
            <div className="metric-label">Active Farmland</div>
            <div className="metric-change positive">4 crops in rotation</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' }}>🐄</div>
          <div className="metric-details">
            <div className="metric-value">13,281</div>
            <div className="metric-label">Livestock Count</div>
            <div className="metric-change positive">98% health rate</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }}>🚜</div>
          <div className="metric-details">
            <div className="metric-value">24</div>
            <div className="metric-label">Equipment Units</div>
            <div className="metric-change neutral">21 operational</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>💰</div>
          <div className="metric-details">
            <div className="metric-value">R 19.5M</div>
            <div className="metric-label">Expected Revenue</div>
            <div className="metric-change positive">This season forecast</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-container">
        <div className="tabs-nav">
          <button className={`tab ${activeTab === 'crops' ? 'active' : ''}`} onClick={() => setActiveTab('crops')}>
            🌾 Crops
          </button>
          <button className={`tab ${activeTab === 'livestock' ? 'active' : ''}`} onClick={() => setActiveTab('livestock')}>
            🐄 Livestock
          </button>
          <button className={`tab ${activeTab === 'equipment' ? 'active' : ''}`} onClick={() => setActiveTab('equipment')}>
            🚜 Equipment
          </button>
          <button className={`tab ${activeTab === 'planning' ? 'active' : ''}`} onClick={() => setActiveTab('planning')}>
            📅 Seasonal Planning
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'crops' && (
            <div className="data-section">
              <div className="section-header">
                <h2>Crop Management</h2>
                <div className="section-actions">
                  <input type="text" placeholder="Search crops..." className="search-input" />
                  <button className="btn-icon">🔍</button>
                </div>
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Crop ID</th>
                      <th>Crop Name</th>
                      <th>Field Location</th>
                      <th>Planted Date</th>
                      <th>Harvest Date</th>
                      <th>Area</th>
                      <th>Health</th>
                      <th>Yield Estimate</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crops.map(crop => (
                      <tr key={crop.id}>
                        <td><strong>{crop.id}</strong></td>
                        <td>{crop.name}</td>
                        <td>{crop.field}</td>
                        <td>{crop.planted}</td>
                        <td>{crop.harvestDate}</td>
                        <td><strong>{crop.area}</strong></td>
                        <td><span className="status-badge" style={{ background: getStatusColor(crop.health) }}>{crop.health}</span></td>
                        <td><strong>{crop.yieldEstimate}</strong></td>
                        <td><span className="status-badge" style={{ background: getStatusColor(crop.status) }}>{crop.status}</span></td>
                        <td>
                          <button className="btn-table">View</button>
                          <button className="btn-table">Update</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'livestock' && (
            <div className="data-section">
              <div className="section-header">
                <h2>Livestock Management</h2>
                <div className="section-actions">
                  <select className="filter-select">
                    <option>All Livestock</option>
                    <option>Cattle</option>
                    <option>Poultry</option>
                    <option>Sheep</option>
                  </select>
                  <button className="btn-icon">➕</button>
                </div>
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Livestock ID</th>
                      <th>Type</th>
                      <th>Count</th>
                      <th>Breed</th>
                      <th>Location</th>
                      <th>Health Status</th>
                      <th>Production</th>
                      <th>Avg Age</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {livestock.map(animal => (
                      <tr key={animal.id}>
                        <td><strong>{animal.id}</strong></td>
                        <td>{animal.type}</td>
                        <td><strong>{animal.count.toLocaleString()}</strong></td>
                        <td>{animal.breed}</td>
                        <td>{animal.location}</td>
                        <td><span className="status-badge" style={{ background: getStatusColor(animal.health) }}>{animal.health}</span></td>
                        <td>{animal.production}</td>
                        <td>{animal.avgAge}</td>
                        <td><span className="status-badge" style={{ background: getStatusColor(animal.status) }}>{animal.status}</span></td>
                        <td>
                          <button className="btn-table">View</button>
                          <button className="btn-table">Health Check</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'equipment' && (
            <div className="data-section">
              <div className="section-header">
                <h2>Equipment Fleet</h2>
                <div className="section-actions">
                  <select className="filter-select">
                    <option>All Equipment</option>
                    <option>Tractors</option>
                    <option>Harvesters</option>
                    <option>Irrigation</option>
                  </select>
                  <button className="btn-icon">🔧</button>
                </div>
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Equipment ID</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Location</th>
                      <th>Last Used</th>
                      <th>Hours Used</th>
                      <th>Next Service</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipment.map(item => (
                      <tr key={item.id}>
                        <td><strong>{item.id}</strong></td>
                        <td>{item.name}</td>
                        <td>{item.type}</td>
                        <td><span className="status-badge" style={{ background: getStatusColor(item.status) }}>{item.status}</span></td>
                        <td>{item.location}</td>
                        <td>{item.lastUsed}</td>
                        <td><strong>{item.hoursUsed}</strong></td>
                        <td>{item.nextService}</td>
                        <td>
                          <button className="btn-table">Schedule</button>
                          <button className="btn-table">Service</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'planning' && (
            <div className="data-section">
              <div className="section-header">
                <h2>Seasonal Planning</h2>
                <div className="section-actions">
                  <button className="btn-icon">➕</button>
                  <button className="btn-icon">📊</button>
                </div>
              </div>
              <div className="planning-grid">
                {planning.map(plan => (
                  <div key={plan.id} className="plan-card">
                    <div className="plan-header">
                      <h3>{plan.season}</h3>
                      <span className="status-badge" style={{ background: getStatusColor(plan.status) }}>{plan.status}</span>
                    </div>
                    <div className="plan-content">
                      <div className="plan-item">
                        <span className="plan-label">Crop Selection</span>
                        <strong>{plan.crop}</strong>
                      </div>
                      <div className="plan-item">
                        <span className="plan-label">Planned Area</span>
                        <strong>{plan.plannedArea}</strong>
                      </div>
                      <div className="plan-item">
                        <span className="plan-label">Estimated Cost</span>
                        <strong>{plan.estimatedCost}</strong>
                      </div>
                      <div className="plan-item">
                        <span className="plan-label">Expected Revenue</span>
                        <strong className="revenue-highlight">{plan.expectedRevenue}</strong>
                      </div>
                      <div className="plan-item">
                        <span className="plan-label">Start Date</span>
                        <strong>{plan.startDate}</strong>
                      </div>
                    </div>
                    <div className="plan-actions">
                      <button className="btn-table">View Details</button>
                      <button className="btn-table">Edit Plan</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Agriculture;
