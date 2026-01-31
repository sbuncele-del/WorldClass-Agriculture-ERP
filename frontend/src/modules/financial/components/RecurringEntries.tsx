import React, { useState, useEffect } from 'react';
import './RecurringEntries.css';

interface RecurringEntryLine {
  account_code: string;
  account_name?: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  cost_center?: string;
  project_code?: string;
  department?: string;
}

interface FrequencyConfig {
  day_of_week?: number;
  day_of_month?: number;
  month?: number;
}

interface RecurringEntry {
  id?: number;
  template_name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  frequency_config?: FrequencyConfig;
  start_date: string;
  end_date?: string;
  next_occurrence?: string;
  last_generated_date?: string;
  is_active?: boolean;
  auto_post: boolean;
  total_debit?: number;
  total_credit?: number;
  line_count?: number;
  generation_count?: number;
  lines: RecurringEntryLine[];
}

const RecurringEntries: React.FC = () => {
  const [entries, setEntries] = useState<RecurringEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RecurringEntry | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Form state
  const [formData, setFormData] = useState<RecurringEntry>({
    template_name: '',
    description: '',
    frequency: 'monthly',
    frequency_config: {},
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    auto_post: false,
    lines: [
      { account_code: '', description: '', debit_amount: 0, credit_amount: 0 }
    ]
  });

  useEffect(() => {
    fetchEntries();
  }, [filterStatus]);

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/financial/recurring-entries?status=${filterStatus}`);
      const result = await response.json();

      if (result.success) {
        setEntries(result.data);
      } else {
        setError(result.message || 'Failed to load recurring entries');
      }
    } catch (err) {
      setError('Error loading recurring entries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingEntry(null);
    setFormData({
      template_name: '',
      description: '',
      frequency: 'monthly',
      frequency_config: { day_of_month: 1 },
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      auto_post: false,
      lines: [
        { account_code: '', description: '', debit_amount: 0, credit_amount: 0 }
      ]
    });
    setShowDialog(true);
  };

  const handleEdit = async (id: number) => {
    try {
      const response = await fetch(`/api/financial/recurring-entries/${id}`);
      const result = await response.json();

      if (result.success) {
        setEditingEntry(result.data);
        setFormData(result.data);
        setShowDialog(true);
      }
    } catch (err) {
      console.error('Error loading entry:', err);
    }
  };

  const handleSave = async () => {
    try {
      const url = editingEntry
        ? `/api/financial/recurring-entries/${editingEntry.id}`
        : '/api/financial/recurring-entries';

      const method = editingEntry ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setShowDialog(false);
        fetchEntries();
      } else {
        alert(result.message || 'Failed to save recurring entry');
      }
    } catch (err) {
      console.error('Error saving entry:', err);
      alert('Error saving recurring entry');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this recurring entry?')) return;

    try {
      const response = await fetch(`/api/financial/recurring-entries/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        fetchEntries();
      } else {
        alert(result.message || 'Failed to delete entry');
      }
    } catch (err) {
      console.error('Error deleting entry:', err);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const response = await fetch(`/api/financial/recurring-entries/${id}/toggle`, {
        method: 'PATCH'
      });

      const result = await response.json();

      if (result.success) {
        fetchEntries();
      }
    } catch (err) {
      console.error('Error toggling entry:', err);
    }
  };

  const handleGenerate = async (id: number) => {
    if (!confirm('Generate journal entry from this template?')) return;

    try {
      const response = await fetch(`/api/financial/recurring-entries/${id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journal_date: new Date().toISOString().split('T')[0] })
      });

      const result = await response.json();

      if (result.success) {
        alert('Journal entry generated successfully!');
        fetchEntries();
      } else {
        alert(result.message || 'Failed to generate entry');
      }
    } catch (err) {
      console.error('Error generating entry:', err);
    }
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { account_code: '', description: '', debit_amount: 0, credit_amount: 0 }]
    });
  };

  const removeLine = (index: number) => {
    const newLines = formData.lines.filter((_, i) => i !== index);
    setFormData({ ...formData, lines: newLines });
  };

  const updateLine = (index: number, field: keyof RecurringEntryLine, value: any) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setFormData({ ...formData, lines: newLines });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatFrequency = (frequency: string, config?: FrequencyConfig) => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly':
        return config?.day_of_month ? `Monthly (Day ${config.day_of_month})` : 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'annual': return 'Annual';
      default: return frequency;
    }
  };

  const totalDebit = formData.lines.reduce((sum, line) => sum + (Number(line.debit_amount) || 0), 0);
  const totalCredit = formData.lines.reduce((sum, line) => sum + (Number(line.credit_amount) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  if (loading) {
    return (
      <div className="recurring-entries">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading recurring entries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recurring-entries">
      {/* Header */}
      <div className="re-header">
        <div>
          <h1>Recurring Entries</h1>
          <p className="re-subtitle">Automate repetitive journal entries</p>
        </div>
        <button onClick={handleCreate} className="btn-create">
          ➕ Create Recurring Entry
        </button>
      </div>

      {/* Filters */}
      <div className="re-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error-banner">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Entries List */}
      <div className="re-list">
        {entries.length === 0 ? (
          <div className="empty-state">
            <h3>No Recurring Entries</h3>
            <p>Create your first recurring entry to automate repetitive journal entries.</p>
            <button onClick={handleCreate} className="btn-create">
              ➕ Create Recurring Entry
            </button>
          </div>
        ) : (
          <div className="entries-grid">
            {entries.map((entry) => (
              <div key={entry.id} className={`entry-card ${!entry.is_active ? 'inactive' : ''}`}>
                <div className="card-header">
                  <div>
                    <h3>{entry.template_name}</h3>
                    <p className="card-description">{entry.description}</p>
                  </div>
                  <div className={`status-badge ${entry.is_active ? 'active' : 'paused'}`}>
                    {entry.is_active ? '✓ Active' : '⏸ Paused'}
                  </div>
                </div>

                <div className="card-details">
                  <div className="detail-row">
                    <span className="label">Frequency:</span>
                    <span className="value">{formatFrequency(entry.frequency, entry.frequency_config)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Next Occurrence:</span>
                    <span className="value">{entry.next_occurrence || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Last Generated:</span>
                    <span className="value">{entry.last_generated_date || 'Never'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Amount:</span>
                    <span className="value">{formatCurrency(entry.total_debit || 0)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Lines:</span>
                    <span className="value">{entry.line_count || 0}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Generated:</span>
                    <span className="value">{entry.generation_count || 0} times</span>
                  </div>
                </div>

                <div className="card-actions">
                  <button onClick={() => handleGenerate(entry.id!)} className="btn-action btn-generate">
                    🔄 Generate Now
                  </button>
                  <button onClick={() => handleEdit(entry.id!)} className="btn-action btn-edit">
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleToggleActive(entry.id!)} className="btn-action btn-toggle">
                    {entry.is_active ? '⏸ Pause' : '▶️ Resume'}
                  </button>
                  <button onClick={() => handleDelete(entry.id!)} className="btn-action btn-delete">
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      {showDialog && (
        <div className="dialog-overlay" onClick={() => setShowDialog(false)}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>{editingEntry ? 'Edit' : 'Create'} Recurring Entry</h2>
              <button onClick={() => setShowDialog(false)} className="btn-close">×</button>
            </div>

            <div className="dialog-body">
              {/* Basic Info */}
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Template Name *</label>
                    <input
                      type="text"
                      value={formData.template_name}
                      onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                      placeholder="e.g., Monthly Rent"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>
                </div>
              </div>

              {/* Frequency */}
              <div className="form-section">
                <h3>Frequency</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Frequency *</label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>
                  {formData.frequency === 'monthly' && (
                    <div className="form-group">
                      <label>Day of Month</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.frequency_config?.day_of_month || 1}
                        onChange={(e) => setFormData({
                          ...formData,
                          frequency_config: { ...formData.frequency_config, day_of_month: parseInt(e.target.value) }
                        })}
                      />
                    </div>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date (Optional)</label>
                    <input
                      type="date"
                      value={formData.end_date || ''}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.auto_post}
                        onChange={(e) => setFormData({ ...formData, auto_post: e.target.checked })}
                      />
                      Auto-post generated entries
                    </label>
                  </div>
                </div>
              </div>

              {/* Lines */}
              <div className="form-section">
                <div className="section-header">
                  <h3>Journal Entry Lines</h3>
                  <button onClick={addLine} className="btn-add-line">+ Add Line</button>
                </div>

                <div className="lines-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Account Code</th>
                        <th>Description</th>
                        <th>Debit</th>
                        <th>Credit</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.lines.map((line, index) => (
                        <tr key={index}>
                          <td>
                            <input
                              type="text"
                              value={line.account_code}
                              onChange={(e) => updateLine(index, 'account_code', e.target.value)}
                              placeholder="e.g., 6100"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={line.description}
                              onChange={(e) => updateLine(index, 'description', e.target.value)}
                              placeholder="Description"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              value={line.debit_amount}
                              onChange={(e) => updateLine(index, 'debit_amount', parseFloat(e.target.value) || 0)}
                              onFocus={() => updateLine(index, 'credit_amount', 0)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              value={line.credit_amount}
                              onChange={(e) => updateLine(index, 'credit_amount', parseFloat(e.target.value) || 0)}
                              onFocus={() => updateLine(index, 'debit_amount', 0)}
                            />
                          </td>
                          <td>
                            {formData.lines.length > 1 && (
                              <button onClick={() => removeLine(index)} className="btn-remove-line">×</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2}><strong>Totals:</strong></td>
                        <td><strong>{formatCurrency(totalDebit)}</strong></td>
                        <td><strong>{formatCurrency(totalCredit)}</strong></td>
                        <td>
                          {isBalanced ? (
                            <span className="balance-check success">✓</span>
                          ) : (
                            <span className="balance-check error">✗</span>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {!isBalanced && (
                  <div className="balance-warning">
                    ⚠️ Entry is not balanced. Debits must equal credits.
                  </div>
                )}
              </div>
            </div>

            <div className="dialog-footer">
              <button onClick={() => setShowDialog(false)} className="btn-cancel">
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn-save"
                disabled={!isBalanced || !formData.template_name || formData.lines.length === 0}
              >
                {editingEntry ? 'Update' : 'Create'} Recurring Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringEntries;
