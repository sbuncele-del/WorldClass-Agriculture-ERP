import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import './Construction.css';

const Construction: React.FC = () => {
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [subcontractors, setSubcontractors] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, equipmentRes, subcontractorsRes, materialsRes] = await Promise.all([
          apiClient.get('/api/construction/projects'),
          apiClient.get('/api/construction/equipment'),
          apiClient.get('/api/construction/subcontractors'),
          apiClient.get('/api/construction/materials')
        ]);
        setProjects(projectsRes.data?.data || projectsRes.data || []);
        setEquipment(equipmentRes.data?.data || equipmentRes.data || []);
        setSubcontractors(subcontractorsRes.data?.data || subcontractorsRes.data || []);
        setMaterials(materialsRes.data?.data || materialsRes.data || []);
      } catch (err) {
        console.error('Error fetching construction data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': case 'in progress': case 'in stock': return '#10b981';
      case 'planning': case 'maintenance': case 'low stock': return '#f59e0b';
      case 'on hold': case 'out of stock': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <div className="construction-page">
      <div className="page-header">
        <div className="header-content">
          <h1>🏗️ Construction Management</h1>
          <p>Project tracking, equipment management, subcontractor coordination, and materials inventory</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">➕ New Project</button>
          <button className="btn-secondary">📊 View Reports</button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>🏗️</div>
          <div className="metric-details">
            <div className="metric-value">12</div>
            <div className="metric-label">Active Projects</div>
            <div className="metric-change positive">3 ahead of schedule</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>💰</div>
          <div className="metric-details">
            <div className="metric-value">R 162M</div>
            <div className="metric-label">Total Project Value</div>
            <div className="metric-change neutral">R 93M spent (57%)</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>🚜</div>
          <div className="metric-details">
            <div className="metric-value">45</div>
            <div className="metric-label">Equipment Units</div>
            <div className="metric-change positive">82% utilization</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>👷</div>
          <div className="metric-details">
            <div className="metric-value">28</div>
            <div className="metric-label">Active Subcontractors</div>
            <div className="metric-change neutral">4.7 avg rating</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-container">
        <div className="tabs-nav">
          <button className={`tab ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>
            🏗️ Projects
          </button>
          <button className={`tab ${activeTab === 'equipment' ? 'active' : ''}`} onClick={() => setActiveTab('equipment')}>
            🚜 Equipment
          </button>
          <button className={`tab ${activeTab === 'subcontractors' ? 'active' : ''}`} onClick={() => setActiveTab('subcontractors')}>
            👷 Subcontractors
          </button>
          <button className={`tab ${activeTab === 'materials' ? 'active' : ''}`} onClick={() => setActiveTab('materials')}>
            📦 Materials
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'projects' && (
            <div className="data-section">
              <div className="section-header">
                <h2>Project Portfolio</h2>
                <div className="section-actions">
                  <input type="text" placeholder="Search projects..." className="search-input" />
                  <button className="btn-icon">🔍</button>
                  <button className="btn-icon">📊</button>
                </div>
              </div>
              <div className="projects-grid">
                {projects.map(project => (
                  <div key={project.id} className="project-card">
                    <div className="project-header">
                      <div>
                        <h3>{project.name}</h3>
                        <p className="project-client">Client: {project.client}</p>
                      </div>
                      <span className="status-badge" style={{ background: getStatusColor(project.status) }}>{project.status}</span>
                    </div>
                    <div className="project-progress">
                      <div className="progress-header">
                        <span>Completion</span>
                        <strong>{project.completion}%</strong>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${project.completion}%` }}></div>
                      </div>
                    </div>
                    <div className="project-stats">
                      <div className="stat-item">
                        <span className="stat-label">Budget</span>
                        <span className="stat-value">{project.budget}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Spent</span>
                        <span className="stat-value">{project.spent}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Deadline</span>
                        <span className="stat-value">{project.deadline}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Manager</span>
                        <span className="stat-value">{project.manager}</span>
                      </div>
                    </div>
                    <div className="project-actions">
                      <button className="btn-table">View Details</button>
                      <button className="btn-table">Update Progress</button>
                    </div>
                  </div>
                ))}
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
                    <option>Heavy Machinery</option>
                    <option>Transport</option>
                    <option>Tools</option>
                  </select>
                  <button className="btn-icon">➕</button>
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
                      <th>Utilization</th>
                      <th>Last Service</th>
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
                        <td><strong>{item.utilization}</strong></td>
                        <td>{item.lastService}</td>
                        <td>{item.nextService}</td>
                        <td>
                          <button className="btn-table">Schedule</button>
                          <button className="btn-table">Transfer</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'subcontractors' && (
            <div className="data-section">
              <div className="section-header">
                <h2>Subcontractor Management</h2>
                <div className="section-actions">
                  <input type="text" placeholder="Search subcontractors..." className="search-input" />
                  <button className="btn-icon">➕</button>
                </div>
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Subcontractor ID</th>
                      <th>Company Name</th>
                      <th>Trade</th>
                      <th>Active Projects</th>
                      <th>Rating</th>
                      <th>Total Contract Value</th>
                      <th>Outstanding</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subcontractors.map(sub => (
                      <tr key={sub.id}>
                        <td><strong>{sub.id}</strong></td>
                        <td>{sub.name}</td>
                        <td>{sub.trade}</td>
                        <td>{sub.projects}</td>
                        <td><strong>⭐ {sub.rating}</strong></td>
                        <td><strong>{sub.totalValue}</strong></td>
                        <td>{sub.outstanding}</td>
                        <td><span className="status-badge" style={{ background: getStatusColor(sub.status) }}>{sub.status}</span></td>
                        <td>
                          <button className="btn-table">View</button>
                          <button className="btn-table">Pay</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="data-section">
              <div className="section-header">
                <h2>Materials Inventory</h2>
                <div className="section-actions">
                  <select className="filter-select">
                    <option>All Materials</option>
                    <option>Raw Material</option>
                    <option>Structural</option>
                    <option>Finishing</option>
                  </select>
                  <button className="btn-icon">📥</button>
                </div>
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Material ID</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Allocated</th>
                      <th>Unit</th>
                      <th>Supplier</th>
                      <th>Last Order</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map(mat => (
                      <tr key={mat.id}>
                        <td><strong>{mat.id}</strong></td>
                        <td>{mat.name}</td>
                        <td>{mat.category}</td>
                        <td><strong>{mat.stock}</strong></td>
                        <td>{mat.allocated}</td>
                        <td>{mat.unit}</td>
                        <td>{mat.supplier}</td>
                        <td>{mat.lastOrder}</td>
                        <td><span className="status-badge" style={{ background: getStatusColor(mat.status) }}>{mat.status}</span></td>
                        <td>
                          <button className="btn-table">Order</button>
                          <button className="btn-table">Allocate</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Construction;
