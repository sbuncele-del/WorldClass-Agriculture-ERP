import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../services/api.service';
import './ProjectsManager.css';

interface Project {
  id: string;
  code: string;
  name: string;
  description: string | null;
  parent_project_id: string | null;
  level: number;
  is_active: boolean;
  project_manager: string | null;
  start_date: string | null;
  end_date: string | null;
  budget_amount: number | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectFormData {
  code: string;
  name: string;
  description: string;
  parent_project_id: string;
  project_manager: string;
  start_date: string;
  end_date: string;
  budget_amount: string;
  status: string;
}

const ProjectsManager: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<ProjectFormData>({
    code: '',
    name: '',
    description: '',
    parent_project_id: '',
    project_manager: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    budget_amount: '',
    status: 'PLANNING',
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const url = `${API_BASE_URL}/api/financial/dimensions/projects${showInactive ? '?include_inactive=true' : ''}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setProjects(result.data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]);

  const handleCreate = () => {
    setEditingProject(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      parent_project_id: '',
      project_manager: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      budget_amount: '',
      status: 'PLANNING',
    });
    setShowModal(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      code: project.code,
      name: project.name,
      description: project.description || '',
      parent_project_id: project.parent_project_id || '',
      project_manager: project.project_manager || '',
      start_date: project.start_date ? project.start_date.split('T')[0] : '',
      end_date: project.end_date ? project.end_date.split('T')[0] : '',
      budget_amount: project.budget_amount?.toString() || '',
      status: project.status || 'PLANNING',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      code: formData.code,
      name: formData.name,
      description: formData.description || null,
      parent_project_id: formData.parent_project_id || null,
      project_manager: formData.project_manager || null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      budget_amount: formData.budget_amount ? parseFloat(formData.budget_amount) : null,
      status: formData.status || null,
    };

    try {
      const url = editingProject
        ? `${API_BASE_URL}/api/financial/dimensions/projects/${editingProject.id}`
        : `${API_BASE_URL}/api/financial/dimensions/projects`;
      
      const response = await fetch(url, {
        method: editingProject ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (result.success) {
        setShowModal(false);
        fetchProjects();
      } else {
        alert('Error: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error saving project: ' + error);
    }
  };

  const handleToggleActive = async (project: Project) => {
    try {
      const url = `${API_BASE_URL}/api/financial/dimensions/projects/${project.id}/${
        project.is_active ? 'deactivate' : 'activate'
      }`;
      
      const response = await fetch(url, { method: 'PUT' });
      const result = await response.json();
      
      if (result.success) {
        fetchProjects();
      }
    } catch (error) {
      alert('Error toggling project status: ' + error);
    }
  };

  const filteredProjects = projects.filter(proj =>
    proj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proj.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (proj.description && proj.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      PLANNING: { color: '#2196f3', label: 'Planning' },
      ACTIVE: { color: '#4caf50', label: 'Active' },
      ON_HOLD: { color: '#ff9800', label: 'On Hold' },
      COMPLETED: { color: '#9e9e9e', label: 'Completed' },
      CANCELLED: { color: '#f44336', label: 'Cancelled' },
    };
    
    const info = statusMap[status || 'PLANNING'] || statusMap.PLANNING;
    return <span className="project-status-badge" style={{ backgroundColor: info.color }}>{info.label}</span>;
  };

  const buildHierarchy = (items: Project[], parentId: string | null = null, level = 0): React.ReactElement[] => {
    return items
      .filter(item => item.parent_project_id === parentId)
      .map(item => (
        <React.Fragment key={item.id}>
          <tr className={!item.is_active ? 'inactive-row' : ''}>
            <td style={{ paddingLeft: `${level * 20 + 10}px` }}>
              {level > 0 && <span className="hierarchy-indicator">└─ </span>}
              {item.code}
            </td>
            <td>{item.name}</td>
            <td>{item.description || '-'}</td>
            <td>{item.project_manager || '-'}</td>
            <td>{item.start_date ? new Date(item.start_date).toLocaleDateString() : '-'}</td>
            <td>{item.end_date ? new Date(item.end_date).toLocaleDateString() : '-'}</td>
            <td>R {item.budget_amount ? item.budget_amount.toLocaleString() : '-'}</td>
            <td>{getStatusBadge(item.status)}</td>
            <td>
              <span className={`status-badge ${item.is_active ? 'active' : 'inactive'}`}>
                {item.is_active ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td>
              <div className="action-buttons">
                <button className="btn-edit" onClick={() => handleEdit(item)}>
                  ✏️ Edit
                </button>
                <button
                  className={item.is_active ? 'btn-deactivate' : 'btn-activate'}
                  onClick={() => handleToggleActive(item)}
                >
                  {item.is_active ? '🔴 Deactivate' : '🟢 Activate'}
                </button>
              </div>
            </td>
          </tr>
          {buildHierarchy(items, item.id, level + 1)}
        </React.Fragment>
      ));
  };

  if (loading) {
    return <div className="loading">Loading projects...</div>;
  }

  return (
    <div className="projects-manager">
      <div className="manager-header">
        <div className="header-left">
          <h2>📁 Projects</h2>
          <p className="subtitle">Project tracking and budget management</p>
        </div>
        <button className="btn-create" onClick={handleCreate}>
          ➕ New Project
        </button>
      </div>

      <div className="filters">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          <span>Show inactive projects</span>
        </label>
      </div>

      <div className="table-container">
        <table className="projects-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Project Name</th>
              <th>Description</th>
              <th>Project Manager</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Budget</th>
              <th>Status</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={10} className="no-data">
                  {searchTerm ? 'No projects match your search' : 'No projects found'}
                </td>
              </tr>
            ) : (
              buildHierarchy(filteredProjects)
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProject ? 'Edit Project' : 'Create New Project'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., PROJ-001"
                  />
                </div>

                <div className="form-group">
                  <label>Project Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Digital Transformation"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Project description..."
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Parent Project</label>
                  <select
                    value={formData.parent_project_id}
                    onChange={(e) => setFormData({ ...formData, parent_project_id: e.target.value })}
                  >
                    <option value="">None (Top Level)</option>
                    {projects
                      .filter(p => p.is_active && p.id !== editingProject?.id)
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.code} - {p.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Project Manager</label>
                  <input
                    type="text"
                    value={formData.project_manager}
                    onChange={(e) => setFormData({ ...formData, project_manager: e.target.value })}
                    placeholder="e.g., Jane Doe"
                  />
                </div>

                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Budget Amount (R)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.budget_amount}
                    onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  {editingProject ? 'Update' : 'Create'} Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsManager;
