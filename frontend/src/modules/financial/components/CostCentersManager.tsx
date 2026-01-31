import React, { useState, useEffect } from 'react';
import './CostCentersManager.css';

interface CostCenter {
  id: string;
  code: string;
  name: string;
  description: string | null;
  parent_cost_center_id: string | null;
  level: number;
  is_active: boolean;
  budget_amount: number | null;
  manager_id: string | null;
  manager_name: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

interface CostCenterFormData {
  code: string;
  name: string;
  description: string;
  parent_cost_center_id: string;
  budget_amount: string;
  manager_name: string;
  start_date: string;
  end_date: string;
}

const CostCentersManager: React.FC = () => {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CostCenterFormData>({
    code: '',
    name: '',
    description: '',
    parent_cost_center_id: '',
    budget_amount: '',
    manager_name: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });

  const fetchCostCenters = async () => {
    try {
      setLoading(true);
      const url = `/api/financial/dimensions/cost-centers${showInactive ? '?include_inactive=true' : ''}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setCostCenters(result.data);
      }
    } catch (error) {
      console.error('Error fetching cost centers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostCenters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]);

  const handleCreate = () => {
    setEditingCostCenter(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      parent_cost_center_id: '',
      budget_amount: '',
      manager_name: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
    });
    setShowModal(true);
  };

  const handleEdit = (costCenter: CostCenter) => {
    setEditingCostCenter(costCenter);
    setFormData({
      code: costCenter.code,
      name: costCenter.name,
      description: costCenter.description || '',
      parent_cost_center_id: costCenter.parent_cost_center_id || '',
      budget_amount: costCenter.budget_amount?.toString() || '',
      manager_name: costCenter.manager_name || '',
      start_date: costCenter.start_date ? costCenter.start_date.split('T')[0] : '',
      end_date: costCenter.end_date ? costCenter.end_date.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        code: formData.code,
        name: formData.name,
        description: formData.description || null,
        parent_cost_center_id: formData.parent_cost_center_id || null,
        budget_amount: formData.budget_amount ? parseFloat(formData.budget_amount) : null,
        manager_name: formData.manager_name || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        user_id: 'system', // TODO: Replace with actual user ID from auth
      };

      const url = editingCostCenter
        ? `/api/financial/dimensions/cost-centers/${editingCostCenter.code}`
        : '/api/financial/dimensions/cost-centers';
      
      const method = editingCostCenter ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setShowModal(false);
        fetchCostCenters();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving cost center:', error);
      alert('Failed to save cost center');
    }
  };

  const handleToggleActive = async (costCenter: CostCenter) => {
    if (costCenter.is_active) {
      // Deactivate
      if (!confirm(`Are you sure you want to deactivate ${costCenter.name}?`)) {
        return;
      }
      
      try {
        const response = await fetch(`/api/financial/dimensions/cost-centers/${costCenter.code}`, {
          method: 'DELETE',
        });
        
        const result = await response.json();
        if (result.success) {
          fetchCostCenters();
        }
      } catch (error) {
        console.error('Error deactivating cost center:', error);
      }
    } else {
      // Reactivate
      try {
        const response = await fetch(`/api/financial/dimensions/cost-centers/${costCenter.code}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: true, user_id: 'system' }),
        });
        
        const result = await response.json();
        if (result.success) {
          fetchCostCenters();
        }
      } catch (error) {
        console.error('Error reactivating cost center:', error);
      }
    }
  };

  const filteredCostCenters = costCenters.filter((cc) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      cc.code.toLowerCase().includes(search) ||
      cc.name.toLowerCase().includes(search) ||
      cc.description?.toLowerCase().includes(search)
    );
  });

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const buildHierarchy = (items: CostCenter[]): CostCenter[] => {
    return items.filter(item => item.level === 1);
  };

  const getChildren = (parentId: string): CostCenter[] => {
    return costCenters.filter(cc => cc.parent_cost_center_id === parentId);
  };

  const renderCostCenterRow = (costCenter: CostCenter, depth: number = 0) => {
    const children = getChildren(costCenter.id);
    const hasChildren = children.length > 0;

    return (
      <React.Fragment key={costCenter.id}>
        <div className={`cost-center-row ${!costCenter.is_active ? 'inactive' : ''}`}>
          <div className="cc-code" style={{ paddingLeft: `${depth * 30}px` }}>
            {hasChildren && <span className="hierarchy-icon">▸ </span>}
            {costCenter.code}
          </div>
          <div className="cc-name">{costCenter.name}</div>
          <div className="cc-budget">{formatCurrency(costCenter.budget_amount)}</div>
          <div className="cc-manager">{costCenter.manager_name || '-'}</div>
          <div className="cc-status">
            <span className={`status-badge ${costCenter.is_active ? 'active' : 'inactive'}`}>
              {costCenter.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="cc-actions">
            <button className="btn-icon" onClick={() => handleEdit(costCenter)} title="Edit">
              ✏️
            </button>
            <button
              className="btn-icon"
              onClick={() => handleToggleActive(costCenter)}
              title={costCenter.is_active ? 'Deactivate' : 'Activate'}
            >
              {costCenter.is_active ? '🚫' : '✅'}
            </button>
          </div>
        </div>
        {hasChildren && children.map(child => renderCostCenterRow(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="cost-centers-manager">
      <div className="manager-header">
        <div className="header-left">
          <h2>💰 Cost Centers</h2>
          <p className="subtitle">Manage budget allocation and cost tracking</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={handleCreate}>
            + New Cost Center
          </button>
        </div>
      </div>

      <div className="manager-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search cost centers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-controls">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Show Inactive
          </label>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading cost centers...</div>
      ) : (
        <div className="cost-centers-table">
          <div className="table-header">
            <div className="cc-code">Code</div>
            <div className="cc-name">Name</div>
            <div className="cc-budget">Budget</div>
            <div className="cc-manager">Manager</div>
            <div className="cc-status">Status</div>
            <div className="cc-actions">Actions</div>
          </div>
          <div className="table-body">
            {filteredCostCenters.length === 0 ? (
              <div className="empty-state">
                No cost centers found. Create your first cost center to get started.
              </div>
            ) : (
              buildHierarchy(filteredCostCenters).map(cc => renderCostCenterRow(cc))
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCostCenter ? 'Edit Cost Center' : 'New Cost Center'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    disabled={!!editingCostCenter}
                    placeholder="CC-XXX"
                  />
                </div>
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Cost center name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Parent Cost Center</label>
                  <select
                    value={formData.parent_cost_center_id}
                    onChange={(e) => setFormData({ ...formData, parent_cost_center_id: e.target.value })}
                  >
                    <option value="">None (Top Level)</option>
                    {costCenters
                      .filter(cc => cc.is_active && cc.id !== editingCostCenter?.id)
                      .map(cc => (
                        <option key={cc.id} value={cc.id}>
                          {cc.code} - {cc.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Budget Amount (ZAR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.budget_amount}
                    onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Manager Name</label>
                <input
                  type="text"
                  value={formData.manager_name}
                  onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                  placeholder="Manager's full name"
                />
              </div>

              <div className="form-row">
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
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingCostCenter ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostCentersManager;
