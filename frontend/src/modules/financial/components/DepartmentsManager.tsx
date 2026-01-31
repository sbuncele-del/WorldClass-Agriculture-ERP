import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../services/api.service';
import './DepartmentsManager.css';

interface Department {
  id: string;
  code: string;
  name: string;
  description: string | null;
  parent_department_id: string | null;
  level: number;
  is_active: boolean;
  head_of_department: string | null;
  location: string | null;
  employee_count: number | null;
  created_at: string;
  updated_at: string;
}

interface DepartmentFormData {
  code: string;
  name: string;
  description: string;
  parent_department_id: string;
  head_of_department: string;
  location: string;
  employee_count: string;
}

const DepartmentsManager: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<DepartmentFormData>({
    code: '',
    name: '',
    description: '',
    parent_department_id: '',
    head_of_department: '',
    location: '',
    employee_count: '',
  });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const url = `${API_BASE_URL}/api/financial/dimensions/departments${showInactive ? '?include_inactive=true' : ''}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setDepartments(result.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]);

  const handleCreate = () => {
    setEditingDepartment(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      parent_department_id: '',
      head_of_department: '',
      location: '',
      employee_count: '',
    });
    setShowModal(true);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      code: department.code,
      name: department.name,
      description: department.description || '',
      parent_department_id: department.parent_department_id || '',
      head_of_department: department.head_of_department || '',
      location: department.location || '',
      employee_count: department.employee_count?.toString() || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      code: formData.code,
      name: formData.name,
      description: formData.description || null,
      parent_department_id: formData.parent_department_id || null,
      head_of_department: formData.head_of_department || null,
      location: formData.location || null,
      employee_count: formData.employee_count ? parseInt(formData.employee_count) : null,
    };

    try {
      const url = editingDepartment
        ? `${API_BASE_URL}/api/financial/dimensions/departments/${editingDepartment.id}`
        : `${API_BASE_URL}/api/financial/dimensions/departments`;
      
      const response = await fetch(url, {
        method: editingDepartment ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (result.success) {
        setShowModal(false);
        fetchDepartments();
      } else {
        alert('Error: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error saving department: ' + error);
    }
  };

  const handleToggleActive = async (department: Department) => {
    try {
      const url = `${API_BASE_URL}/api/financial/dimensions/departments/${department.id}/${
        department.is_active ? 'deactivate' : 'activate'
      }`;
      
      const response = await fetch(url, { method: 'PUT' });
      const result = await response.json();
      
      if (result.success) {
        fetchDepartments();
      }
    } catch (error) {
      alert('Error toggling department status: ' + error);
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const buildHierarchy = (items: Department[], parentId: string | null = null, level = 0): React.ReactElement[] => {
    return items
      .filter(item => item.parent_department_id === parentId)
      .map(item => (
        <React.Fragment key={item.id}>
          <tr className={!item.is_active ? 'inactive-row' : ''}>
            <td style={{ paddingLeft: `${level * 20 + 10}px` }}>
              {level > 0 && <span className="hierarchy-indicator">└─ </span>}
              {item.code}
            </td>
            <td>{item.name}</td>
            <td>{item.description || '-'}</td>
            <td>{item.head_of_department || '-'}</td>
            <td>{item.location || '-'}</td>
            <td>{item.employee_count || '-'}</td>
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
    return <div className="loading">Loading departments...</div>;
  }

  return (
    <div className="departments-manager">
      <div className="manager-header">
        <div className="header-left">
          <h2>🏢 Departments</h2>
          <p className="subtitle">Organizational structure and departmental management</p>
        </div>
        <button className="btn-create" onClick={handleCreate}>
          ➕ New Department
        </button>
      </div>

      <div className="filters">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search departments..."
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
          <span>Show inactive departments</span>
        </label>
      </div>

      <div className="table-container">
        <table className="departments-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Department Name</th>
              <th>Description</th>
              <th>Head of Department</th>
              <th>Location</th>
              <th>Employees</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDepartments.length === 0 ? (
              <tr>
                <td colSpan={8} className="no-data">
                  {searchTerm ? 'No departments match your search' : 'No departments found'}
                </td>
              </tr>
            ) : (
              buildHierarchy(filteredDepartments)
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingDepartment ? 'Edit Department' : 'Create New Department'}</h3>
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
                    placeholder="e.g., DEPT-001"
                  />
                </div>

                <div className="form-group">
                  <label>Department Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Finance"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Department description..."
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Parent Department</label>
                  <select
                    value={formData.parent_department_id}
                    onChange={(e) => setFormData({ ...formData, parent_department_id: e.target.value })}
                  >
                    <option value="">None (Top Level)</option>
                    {departments
                      .filter(d => d.is_active && d.id !== editingDepartment?.id)
                      .map(d => (
                        <option key={d.id} value={d.id}>
                          {d.code} - {d.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Head of Department</label>
                  <input
                    type="text"
                    value={formData.head_of_department}
                    onChange={(e) => setFormData({ ...formData, head_of_department: e.target.value })}
                    placeholder="e.g., John Smith"
                  />
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Johannesburg HQ"
                  />
                </div>

                <div className="form-group">
                  <label>Employee Count</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.employee_count}
                    onChange={(e) => setFormData({ ...formData, employee_count: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  {editingDepartment ? 'Update' : 'Create'} Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsManager;
