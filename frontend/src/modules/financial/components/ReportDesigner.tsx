import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../services/api.service';
import './ReportDesigner.css';

interface Column {
  field_name: string;
  display_name: string;
  data_type: string;
  width: number;
  alignment: string;
  is_visible: boolean;
  sort_order: number | null;
  sort_direction: string | null;
  aggregate_function: string | null;
}

interface Filter {
  field_name: string;
  operator: string;
  value_type: string;
  default_value: string;
  is_required: boolean;
  is_visible: boolean;
  filter_order: number;
}

interface Group {
  field_name: string;
  group_order: number;
  show_subtotals: boolean;
}

interface ReportTemplate {
  id?: number;
  code: string;
  name: string;
  description: string;
  category: string;
  data_source: string;
  is_shared: boolean;
  columns: Column[];
  filters: Filter[];
  groups: Group[];
}

const ReportDesigner: React.FC = () => {
  const [template, setTemplate] = useState<ReportTemplate>({
    code: '',
    name: '',
    description: '',
    category: 'Custom',
    data_source: 'journal_entry_lines',
    is_shared: false,
    columns: [],
    filters: [],
    groups: []
  });

  const [availableFields, setAvailableFields] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'columns' | 'filters' | 'groups'>('columns');

  useEffect(() => {
    fetchCategories();
    updateAvailableFields(template.data_source);
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/financial/custom-reports/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const updateAvailableFields = (dataSource: string) => {
    // Define available fields based on data source
    const fieldMappings: any = {
      journal_entry_lines: [
        { field_name: 'entry_date', display_name: 'Date', data_type: 'date' },
        { field_name: 'reference', display_name: 'Reference', data_type: 'string' },
        { field_name: 'account_code', display_name: 'Account Code', data_type: 'string' },
        { field_name: 'account_name', display_name: 'Account Name', data_type: 'string' },
        { field_name: 'description', display_name: 'Description', data_type: 'string' },
        { field_name: 'debit', display_name: 'Debit', data_type: 'currency' },
        { field_name: 'credit', display_name: 'Credit', data_type: 'currency' },
        { field_name: 'amount', display_name: 'Amount', data_type: 'currency' },
        { field_name: 'department', display_name: 'Department', data_type: 'string' },
        { field_name: 'cost_center', display_name: 'Cost Center', data_type: 'string' },
        { field_name: 'project', display_name: 'Project', data_type: 'string' }
      ],
      account_balances: [
        { field_name: 'account_code', display_name: 'Account Code', data_type: 'string' },
        { field_name: 'account_name', display_name: 'Account Name', data_type: 'string' },
        { field_name: 'debit_total', display_name: 'Debit Total', data_type: 'currency' },
        { field_name: 'credit_total', display_name: 'Credit Total', data_type: 'currency' },
        { field_name: 'balance', display_name: 'Balance', data_type: 'currency' },
        { field_name: 'period', display_name: 'Period', data_type: 'string' }
      ],
      budget_lines: [
        { field_name: 'account_code', display_name: 'Account Code', data_type: 'string' },
        { field_name: 'account_name', display_name: 'Account Name', data_type: 'string' },
        { field_name: 'budgeted', display_name: 'Budget Amount', data_type: 'currency' },
        { field_name: 'actual', display_name: 'Actual Amount', data_type: 'currency' },
        { field_name: 'variance', display_name: 'Variance', data_type: 'currency' },
        { field_name: 'variance_pct', display_name: 'Variance %', data_type: 'percentage' },
        { field_name: 'department', display_name: 'Department', data_type: 'string' }
      ]
    };

    setAvailableFields(fieldMappings[dataSource] || []);
  };

  const handleDataSourceChange = (dataSource: string) => {
    setTemplate({ ...template, data_source: dataSource, columns: [], filters: [], groups: [] });
    updateAvailableFields(dataSource);
  };

  const addColumn = (field: any) => {
    const newColumn: Column = {
      field_name: field.field_name,
      display_name: field.display_name,
      data_type: field.data_type,
      width: 150,
      alignment: field.data_type === 'currency' || field.data_type === 'number' ? 'right' : 'left',
      is_visible: true,
      sort_order: null,
      sort_direction: null,
      aggregate_function: null
    };

    setTemplate({
      ...template,
      columns: [...template.columns, newColumn]
    });
  };

  const removeColumn = (index: number) => {
    const newColumns = template.columns.filter((_, i) => i !== index);
    setTemplate({ ...template, columns: newColumns });
  };

  const updateColumn = (index: number, field: string, value: any) => {
    const newColumns = [...template.columns];
    (newColumns[index] as any)[field] = value;
    setTemplate({ ...template, columns: newColumns });
  };

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const newColumns = [...template.columns];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newColumns.length) {
      [newColumns[index], newColumns[targetIndex]] = [newColumns[targetIndex], newColumns[index]];
      setTemplate({ ...template, columns: newColumns });
    }
  };

  const addFilter = () => {
    const newFilter: Filter = {
      field_name: availableFields[0]?.field_name || '',
      operator: 'equals',
      value_type: 'parameter',
      default_value: '',
      is_required: false,
      is_visible: true,
      filter_order: template.filters.length + 1
    };

    setTemplate({
      ...template,
      filters: [...template.filters, newFilter]
    });
  };

  const removeFilter = (index: number) => {
    const newFilters = template.filters.filter((_, i) => i !== index);
    setTemplate({ ...template, filters: newFilters });
  };

  const updateFilter = (index: number, field: string, value: any) => {
    const newFilters = [...template.filters];
    (newFilters[index] as any)[field] = value;
    setTemplate({ ...template, filters: newFilters });
  };

  const addGroup = () => {
    const newGroup: Group = {
      field_name: availableFields[0]?.field_name || '',
      group_order: template.groups.length + 1,
      show_subtotals: false
    };

    setTemplate({
      ...template,
      groups: [...template.groups, newGroup]
    });
  };

  const removeGroup = (index: number) => {
    const newGroups = template.groups.filter((_, i) => i !== index);
    setTemplate({ ...template, groups: newGroups });
  };

  const updateGroup = (index: number, field: string, value: any) => {
    const newGroups = [...template.groups];
    (newGroups[index] as any)[field] = value;
    setTemplate({ ...template, groups: newGroups });
  };

  const saveTemplate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/financial/custom-reports/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });

      if (response.ok) {
        alert('Report template created successfully!');
        // Reset form
        setTemplate({
          code: '',
          name: '',
          description: '',
          category: 'Custom',
          data_source: 'journal_entry_lines',
          is_shared: false,
          columns: [],
          filters: [],
          groups: []
        });
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  return (
    <div className="report-designer">
      <div className="designer-header">
        <h2>📊 Report Designer</h2>
        <p className="subtitle">Create custom reports with flexible columns, filters, and grouping</p>
      </div>

      {/* Template Info Section */}
      <div className="designer-section">
        <h3>Report Information</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Report Code *</label>
            <input
              type="text"
              value={template.code}
              onChange={(e) => setTemplate({ ...template, code: e.target.value.toUpperCase() })}
              placeholder="e.g., SALES_SUMMARY"
            />
          </div>

          <div className="form-group">
            <label>Report Name *</label>
            <input
              type="text"
              value={template.name}
              onChange={(e) => setTemplate({ ...template, name: e.target.value })}
              placeholder="e.g., Monthly Sales Summary"
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              value={template.category}
              onChange={(e) => setTemplate({ ...template, category: e.target.value })}
            >
              <option value="Custom">Custom</option>
              <option value="Accounting">Accounting</option>
              <option value="Budgeting">Budgeting</option>
              <option value="Analysis">Analysis</option>
              <option value="Compliance">Compliance</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Data Source *</label>
            <select
              value={template.data_source}
              onChange={(e) => handleDataSourceChange(e.target.value)}
            >
              <option value="journal_entry_lines">Journal Entries</option>
              <option value="account_balances">Account Balances</option>
              <option value="budget_lines">Budget Data</option>
            </select>
          </div>

          <div className="form-group full-width">
            <label>Description</label>
            <textarea
              value={template.description}
              onChange={(e) => setTemplate({ ...template, description: e.target.value })}
              placeholder="Describe what this report shows..."
              rows={2}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={template.is_shared}
                onChange={(e) => setTemplate({ ...template, is_shared: e.target.checked })}
              />
              Share with team
            </label>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="designer-tabs">
        <button
          className={`tab ${activeTab === 'columns' ? 'active' : ''}`}
          onClick={() => setActiveTab('columns')}
        >
          📋 Columns ({template.columns.length})
        </button>
        <button
          className={`tab ${activeTab === 'filters' ? 'active' : ''}`}
          onClick={() => setActiveTab('filters')}
        >
          🔍 Filters ({template.filters.length})
        </button>
        <button
          className={`tab ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          📊 Grouping ({template.groups.length})
        </button>
      </div>

      {/* Columns Tab */}
      {activeTab === 'columns' && (
        <div className="designer-section">
          <div className="section-header">
            <h3>Report Columns</h3>
            <p>Drag and drop fields to add them to your report</p>
          </div>

          <div className="columns-layout">
            {/* Available Fields */}
            <div className="available-fields">
              <h4>Available Fields</h4>
              <div className="field-list">
                {availableFields.map((field) => (
                  <div
                    key={field.field_name}
                    className="field-item"
                    onClick={() => addColumn(field)}
                  >
                    <span className="field-icon">
                      {field.data_type === 'currency' ? '💰' : 
                       field.data_type === 'date' ? '📅' : 
                       field.data_type === 'number' ? '#️⃣' : '📝'}
                    </span>
                    <span className="field-name">{field.display_name}</span>
                    <span className="add-icon">+</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Columns */}
            <div className="selected-columns">
              <h4>Selected Columns ({template.columns.length})</h4>
              {template.columns.length === 0 ? (
                <div className="empty-state">
                  <p>👈 Click fields from the left to add columns</p>
                </div>
              ) : (
                <div className="column-list">
                  {template.columns.map((column, index) => (
                    <div key={index} className="column-config">
                      <div className="column-header">
                        <div className="column-move-buttons">
                          <button
                            onClick={() => moveColumn(index, 'up')}
                            disabled={index === 0}
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveColumn(index, 'down')}
                            disabled={index === template.columns.length - 1}
                            title="Move down"
                          >
                            ↓
                          </button>
                        </div>
                        <span className="column-title">{column.display_name}</span>
                        <button
                          className="remove-btn"
                          onClick={() => removeColumn(index)}
                        >
                          ✕
                        </button>
                      </div>

                      <div className="column-options">
                        <div className="option-group">
                          <label>Display Name</label>
                          <input
                            type="text"
                            value={column.display_name}
                            onChange={(e) => updateColumn(index, 'display_name', e.target.value)}
                          />
                        </div>

                        <div className="option-group">
                          <label>Width (px)</label>
                          <input
                            type="number"
                            value={column.width}
                            onChange={(e) => updateColumn(index, 'width', parseInt(e.target.value))}
                            min="50"
                            max="500"
                          />
                        </div>

                        <div className="option-group">
                          <label>Alignment</label>
                          <select
                            value={column.alignment}
                            onChange={(e) => updateColumn(index, 'alignment', e.target.value)}
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>

                        <div className="option-group">
                          <label>Aggregate</label>
                          <select
                            value={column.aggregate_function || ''}
                            onChange={(e) => updateColumn(index, 'aggregate_function', e.target.value || null)}
                          >
                            <option value="">None</option>
                            <option value="SUM">Sum</option>
                            <option value="AVG">Average</option>
                            <option value="COUNT">Count</option>
                            <option value="MIN">Minimum</option>
                            <option value="MAX">Maximum</option>
                          </select>
                        </div>

                        <div className="option-group">
                          <label>Sort</label>
                          <select
                            value={column.sort_direction || ''}
                            onChange={(e) => updateColumn(index, 'sort_direction', e.target.value || null)}
                          >
                            <option value="">No Sort</option>
                            <option value="ASC">Ascending</option>
                            <option value="DESC">Descending</option>
                          </select>
                        </div>

                        <div className="option-group checkbox-group">
                          <label>
                            <input
                              type="checkbox"
                              checked={column.is_visible}
                              onChange={(e) => updateColumn(index, 'is_visible', e.target.checked)}
                            />
                            Visible
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters Tab */}
      {activeTab === 'filters' && (
        <div className="designer-section">
          <div className="section-header">
            <h3>Report Filters</h3>
            <button className="btn-add" onClick={addFilter}>+ Add Filter</button>
          </div>

          {template.filters.length === 0 ? (
            <div className="empty-state">
              <p>No filters defined. Click "Add Filter" to create one.</p>
            </div>
          ) : (
            <div className="filter-list">
              {template.filters.map((filter, index) => (
                <div key={index} className="filter-item">
                  <div className="filter-header">
                    <span className="filter-number">Filter {index + 1}</span>
                    <button className="remove-btn" onClick={() => removeFilter(index)}>✕</button>
                  </div>

                  <div className="filter-options">
                    <div className="option-group">
                      <label>Field</label>
                      <select
                        value={filter.field_name}
                        onChange={(e) => updateFilter(index, 'field_name', e.target.value)}
                      >
                        {availableFields.map((field) => (
                          <option key={field.field_name} value={field.field_name}>
                            {field.display_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="option-group">
                      <label>Operator</label>
                      <select
                        value={filter.operator}
                        onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                      >
                        <option value="equals">Equals</option>
                        <option value="not_equals">Not Equals</option>
                        <option value="greater_than">Greater Than</option>
                        <option value="less_than">Less Than</option>
                        <option value="between">Between</option>
                        <option value="in">In List</option>
                        <option value="like">Contains</option>
                      </select>
                    </div>

                    <div className="option-group">
                      <label>Default Value</label>
                      <input
                        type="text"
                        value={filter.default_value}
                        onChange={(e) => updateFilter(index, 'default_value', e.target.value)}
                        placeholder="Optional default value"
                      />
                    </div>

                    <div className="option-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={filter.is_required}
                          onChange={(e) => updateFilter(index, 'is_required', e.target.checked)}
                        />
                        Required
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <div className="designer-section">
          <div className="section-header">
            <h3>Report Grouping</h3>
            <button className="btn-add" onClick={addGroup}>+ Add Group</button>
          </div>

          {template.groups.length === 0 ? (
            <div className="empty-state">
              <p>No grouping defined. Click "Add Group" to group data.</p>
            </div>
          ) : (
            <div className="group-list">
              {template.groups.map((group, index) => (
                <div key={index} className="group-item">
                  <div className="group-header">
                    <span className="group-number">Group Level {index + 1}</span>
                    <button className="remove-btn" onClick={() => removeGroup(index)}>✕</button>
                  </div>

                  <div className="group-options">
                    <div className="option-group">
                      <label>Group By</label>
                      <select
                        value={group.field_name}
                        onChange={(e) => updateGroup(index, 'field_name', e.target.value)}
                      >
                        {availableFields.map((field) => (
                          <option key={field.field_name} value={field.field_name}>
                            {field.display_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="option-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={group.show_subtotals}
                          onChange={(e) => updateGroup(index, 'show_subtotals', e.target.checked)}
                        />
                        Show Subtotals
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="designer-actions">
        <button className="btn-secondary" onClick={() => window.history.back()}>
          Cancel
        </button>
        <button
          className="btn-primary"
          onClick={saveTemplate}
          disabled={!template.code || !template.name || template.columns.length === 0}
        >
          💾 Save Report Template
        </button>
      </div>
    </div>
  );
};

export default ReportDesigner;
