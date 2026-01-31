import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../services/api.service';
import './BudgetManagement.css';

interface BudgetScenario {
  id: number;
  name: string;
  description: string;
  scenario_type: string;
  fiscal_year: number;
  start_date: string;
  end_date: string;
  status: string;
  is_active: boolean;
}

interface BudgetLine {
  id?: number;
  account_code: string;
  account_name: string;
  line_description?: string;
  month_1: number;
  month_2: number;
  month_3: number;
  month_4: number;
  month_5: number;
  month_6: number;
  month_7: number;
  month_8: number;
  month_9: number;
  month_10: number;
  month_11: number;
  month_12: number;
  annual_total?: number;
  allocation_method: string;
}

interface Budget {
  id?: number;
  scenario_id?: number;
  budget_code: string;
  budget_name: string;
  description?: string;
  budget_type: string;
  fiscal_year: number;
  period_start: string;
  period_end: string;
  department?: string;
  total_budget_amount?: number;
  status: string;
  lines: BudgetLine[];
}

interface Account {
  code: string;
  name: string;
  account_type: string;
}

const BudgetManagement: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [scenarios, setScenarios] = useState<BudgetScenario[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Budget>({
    budget_code: '',
    budget_name: '',
    description: '',
    budget_type: 'ANNUAL',
    fiscal_year: new Date().getFullYear(),
    period_start: `${new Date().getFullYear()}-01-01`,
    period_end: `${new Date().getFullYear()}-12-31`,
    department: '',
    status: 'DRAFT',
    lines: []
  });

  // Filters
  const [filters, setFilters] = useState({
    fiscal_year: new Date().getFullYear(),
    status: '',
    department: ''
  });

  useEffect(() => {
    fetchBudgets();
    fetchScenarios();
    fetchAccounts();
  }, [filters]);

  const fetchBudgets = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.fiscal_year) queryParams.append('fiscal_year', filters.fiscal_year.toString());
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.department) queryParams.append('department', filters.department);

      const response = await fetch(`${API_BASE_URL}/api/financial/forecasting/budgets?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setBudgets(data.budgets || []);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
      showMessage('error', 'Failed to load budgets');
    }
  };

  const fetchScenarios = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/financial/forecasting/scenarios`);
      const data = await response.json();
      
      if (data.success) {
        setScenarios(data.scenarios || []);
      }
    } catch (error) {
      console.error('Error fetching scenarios:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/financial/accounts`);
      const data = await response.json();
      
      if (data.success) {
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchBudgetDetails = async (budgetId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/financial/forecasting/budgets/${budgetId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedBudget(data.budget);
        setFormData(data.budget);
        setShowEditModal(true);
      }
    } catch (error) {
      console.error('Error fetching budget details:', error);
      showMessage('error', 'Failed to load budget details');
    }
  };

  const handleCreateBudget = () => {
    setFormData({
      budget_code: `BUD-${new Date().getFullYear()}-${String(budgets.length + 1).padStart(3, '0')}`,
      budget_name: '',
      description: '',
      budget_type: 'ANNUAL',
      fiscal_year: new Date().getFullYear(),
      period_start: `${new Date().getFullYear()}-01-01`,
      period_end: `${new Date().getFullYear()}-12-31`,
      department: '',
      status: 'DRAFT',
      lines: []
    });
    setShowCreateModal(true);
  };

  const handleSaveBudget = async () => {
    setLoading(true);
    
    try {
      // Validation
      if (!formData.budget_name || formData.lines.length === 0) {
        showMessage('error', 'Please provide budget name and at least one line item');
        setLoading(false);
        return;
      }

      const endpoint = selectedBudget
        ? `${API_BASE_URL}/api/financial/forecasting/budgets/${selectedBudget.id}`
        : `${API_BASE_URL}/api/financial/forecasting/budgets`;

      const method = selectedBudget ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          created_by: 'current_user' // TODO: Get from auth context
        })
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', selectedBudget ? 'Budget updated successfully' : 'Budget created successfully');
        setShowCreateModal(false);
        setShowEditModal(false);
        setSelectedBudget(null);
        fetchBudgets();
      } else {
        showMessage('error', data.message || 'Failed to save budget');
      }
    } catch (error: any) {
      console.error('Error saving budget:', error);
      showMessage('error', 'Failed to save budget');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async (budgetId: number) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/financial/forecasting/budgets/${budgetId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', 'Budget deleted successfully');
        fetchBudgets();
      } else {
        showMessage('error', data.message || 'Failed to delete budget');
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
      showMessage('error', 'Failed to delete budget');
    }
  };

  const addBudgetLine = () => {
    setFormData({
      ...formData,
      lines: [
        ...formData.lines,
        {
          account_code: '',
          account_name: '',
          line_description: '',
          month_1: 0,
          month_2: 0,
          month_3: 0,
          month_4: 0,
          month_5: 0,
          month_6: 0,
          month_7: 0,
          month_8: 0,
          month_9: 0,
          month_10: 0,
          month_11: 0,
          month_12: 0,
          allocation_method: 'MANUAL'
        }
      ]
    });
  };

  const removeBudgetLine = (index: number) => {
    setFormData({
      ...formData,
      lines: formData.lines.filter((_, i) => i !== index)
    });
  };

  const updateBudgetLine = (index: number, field: string, value: any) => {
    const updatedLines = [...formData.lines];
    updatedLines[index] = { ...updatedLines[index], [field]: value };
    
    setFormData({
      ...formData,
      lines: updatedLines
    });
  };

  const handleAccountSelect = (index: number, accountCode: string) => {
    const account = accounts.find(a => a.code === accountCode);
    if (account) {
      updateBudgetLine(index, 'account_code', accountCode);
      updateBudgetLine(index, 'account_name', account.name);
    }
  };

  const allocateEvenly = (index: number, totalAmount: number) => {
    const monthlyAmount = totalAmount / 12;
    const updatedLines = [...formData.lines];
    updatedLines[index] = {
      ...updatedLines[index],
      month_1: monthlyAmount,
      month_2: monthlyAmount,
      month_3: monthlyAmount,
      month_4: monthlyAmount,
      month_5: monthlyAmount,
      month_6: monthlyAmount,
      month_7: monthlyAmount,
      month_8: monthlyAmount,
      month_9: monthlyAmount,
      month_10: monthlyAmount,
      month_11: monthlyAmount,
      month_12: monthlyAmount,
      allocation_method: 'EQUAL'
    };
    
    setFormData({
      ...formData,
      lines: updatedLines
    });
  };

  const calculateLineTotal = (line: BudgetLine): number => {
    return (
      line.month_1 + line.month_2 + line.month_3 + line.month_4 +
      line.month_5 + line.month_6 + line.month_7 + line.month_8 +
      line.month_9 + line.month_10 + line.month_11 + line.month_12
    );
  };

  const calculateBudgetTotal = (): number => {
    return formData.lines.reduce((sum, line) => sum + calculateLineTotal(line), 0);
  };

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const getStatusBadgeClass = (status: string) => {
    const classes: any = {
      'DRAFT': 'status-draft',
      'SUBMITTED': 'status-submitted',
      'APPROVED': 'status-approved',
      'ACTIVE': 'status-active',
      'CLOSED': 'status-closed',
      'REVISED': 'status-revised'
    };
    return classes[status] || 'status-draft';
  };

  return (
    <div className="budget-management">
      <div className="budget-header">
        <div>
          <h2>Budget Management</h2>
          <p className="subtitle">Create, manage, and monitor organizational budgets</p>
        </div>
        <button className="btn-create" onClick={handleCreateBudget}>
          <span className="icon">+</span> Create Budget
        </button>
      </div>

      {message && (
        <div className={`message-banner message-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="filters-panel">
        <div className="filter-group">
          <label>Fiscal Year:</label>
          <select
            value={filters.fiscal_year}
            onChange={(e) => setFilters({ ...filters, fiscal_year: parseInt(e.target.value) })}
          >
            {[...Array(5)].map((_, i) => {
              const year = new Date().getFullYear() - 2 + i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Department:</label>
          <input
            type="text"
            placeholder="Filter by department"
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          />
        </div>
      </div>

      {/* Budgets List */}
      <div className="budgets-grid">
        {budgets.length === 0 ? (
          <div className="empty-state">
            <p>No budgets found. Create your first budget to get started.</p>
          </div>
        ) : (
          budgets.map((budget) => (
            <div key={budget.id} className="budget-card">
              <div className="budget-card-header">
                <div>
                  <h3>{budget.budget_name}</h3>
                  <p className="budget-code">{budget.budget_code}</p>
                </div>
                <span className={`status-badge ${getStatusBadgeClass(budget.status)}`}>
                  {budget.status}
                </span>
              </div>

              <div className="budget-card-body">
                <div className="budget-info-row">
                  <span className="label">Fiscal Year:</span>
                  <span className="value">{budget.fiscal_year}</span>
                </div>

                {budget.department && (
                  <div className="budget-info-row">
                    <span className="label">Department:</span>
                    <span className="value">{budget.department}</span>
                  </div>
                )}

                {budget.scenario_name && (
                  <div className="budget-info-row">
                    <span className="label">Scenario:</span>
                    <span className="value">{budget.scenario_name}</span>
                  </div>
                )}

                <div className="budget-info-row">
                  <span className="label">Total Budget:</span>
                  <span className="value amount">
                    R {(budget.total_budgeted || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="budget-info-row">
                  <span className="label">Line Items:</span>
                  <span className="value">{budget.line_count || 0}</span>
                </div>
              </div>

              <div className="budget-card-actions">
                <button
                  className="btn-secondary-sm"
                  onClick={() => fetchBudgetDetails(budget.id)}
                >
                  View/Edit
                </button>
                {(budget.status === 'DRAFT' || budget.status === 'REVISED') && (
                  <button
                    className="btn-danger-sm"
                    onClick={() => handleDeleteBudget(budget.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Budget Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>
          <div className="modal-content budget-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedBudget ? 'Edit Budget' : 'Create New Budget'}</h3>
              <button
                className="modal-close"
                onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Budget Header Information */}
              <div className="form-section">
                <h4>Budget Information</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Budget Code *</label>
                    <input
                      type="text"
                      value={formData.budget_code}
                      onChange={(e) => setFormData({ ...formData, budget_code: e.target.value })}
                      disabled={!!selectedBudget}
                    />
                  </div>

                  <div className="form-group">
                    <label>Budget Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., IT Department 2025 Budget"
                      value={formData.budget_name}
                      onChange={(e) => setFormData({ ...formData, budget_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Budget Type</label>
                    <select
                      value={formData.budget_type}
                      onChange={(e) => setFormData({ ...formData, budget_type: e.target.value })}
                    >
                      <option value="ANNUAL">Annual</option>
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="PROJECT">Project-Based</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Fiscal Year</label>
                    <input
                      type="number"
                      value={formData.fiscal_year}
                      onChange={(e) => setFormData({ ...formData, fiscal_year: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      placeholder="e.g., IT, Sales, HR"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Period Start</label>
                    <input
                      type="date"
                      value={formData.period_start}
                      onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Period End</label>
                    <input
                      type="date"
                      value={formData.period_end}
                      onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    placeholder="Budget description..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              {/* Budget Lines */}
              <div className="form-section">
                <div className="section-header">
                  <h4>Budget Line Items</h4>
                  <button className="btn-add-line" onClick={addBudgetLine}>
                    + Add Line
                  </button>
                </div>

                <div className="budget-lines-container">
                  {formData.lines.length === 0 ? (
                    <div className="empty-lines">
                      <p>No line items yet. Click "Add Line" to start building your budget.</p>
                    </div>
                  ) : (
                    formData.lines.map((line, index) => (
                      <div key={index} className="budget-line-item">
                        <div className="line-header">
                          <span className="line-number">Line {index + 1}</span>
                          <button
                            className="btn-remove-line"
                            onClick={() => removeBudgetLine(index)}
                          >
                            Remove
                          </button>
                        </div>

                        <div className="line-details">
                          <div className="form-row">
                            <div className="form-group">
                              <label>Account</label>
                              <select
                                value={line.account_code}
                                onChange={(e) => handleAccountSelect(index, e.target.value)}
                              >
                                <option value="">Select Account</option>
                                {accounts.map(account => (
                                  <option key={account.code} value={account.code}>
                                    {account.code} - {account.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="form-group">
                              <label>Description</label>
                              <input
                                type="text"
                                placeholder="Line description"
                                value={line.line_description}
                                onChange={(e) => updateBudgetLine(index, 'line_description', e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="allocation-helper">
                            <label>Quick Allocation:</label>
                            <input
                              type="number"
                              placeholder="Total amount"
                              onBlur={(e) => {
                                const amount = parseFloat(e.target.value) || 0;
                                if (amount > 0) {
                                  allocateEvenly(index, amount);
                                  e.target.value = '';
                                }
                              }}
                            />
                            <span className="helper-text">Enter amount to distribute evenly across 12 months</span>
                          </div>

                          <div className="monthly-amounts">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                              <div key={month} className="month-input">
                                <label>Month {month}</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={line[`month_${month}` as keyof BudgetLine] as number}
                                  onChange={(e) => updateBudgetLine(index, `month_${month}`, parseFloat(e.target.value) || 0)}
                                />
                              </div>
                            ))}
                          </div>

                          <div className="line-total">
                            <strong>Line Total:</strong>
                            <span className="total-amount">
                              R {calculateLineTotal(line).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {formData.lines.length > 0 && (
                  <div className="budget-grand-total">
                    <strong>Total Budget Amount:</strong>
                    <span className="grand-total-amount">
                      R {calculateBudgetTotal().toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveBudget}
                disabled={loading}
              >
                {loading ? 'Saving...' : (selectedBudget ? 'Update Budget' : 'Create Budget')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetManagement;
