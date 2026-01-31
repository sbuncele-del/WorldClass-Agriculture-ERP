import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../../../services/api.service';
import './ReportViewer.css';

interface Column {
  field_name: string;
  display_name: string;
  data_type: string;
  width: number;
  alignment: string;
  aggregate_function: string | null;
}

interface Filter {
  field_name: string;
  operator: string;
  is_required: boolean;
  default_value: string;
}

interface ReportData {
  template: {
    id: number;
    name: string;
    code: string;
  };
  columns: Column[];
  data: any[];
  row_count: number;
  execution_time_ms: number;
}

const ReportViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [template, setTemplate] = useState<any>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [parameters, setParameters] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  useEffect(() => {
    if (id) {
      fetchTemplate();
    }
  }, [id]);

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/financial/custom-reports/templates/${id}`);
      const data = await response.json();
      setTemplate(data);

      // Set default parameter values
      const defaultParams: any = {};
      data.filters.forEach((filter: Filter) => {
        if (filter.default_value) {
          defaultParams[filter.field_name] = filter.default_value;
        }
      });
      setParameters(defaultParams);
    } catch (error) {
      console.error('Error fetching template:', error);
    }
  };

  const executeReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/financial/custom-reports/templates/${id}/execute`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ params: parameters })
        }
      );

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error executing report:', error);
      alert('Failed to execute report');
    } finally {
      setLoading(false);
    }
  };

  const updateParameter = (fieldName: string, value: any) => {
    setParameters({ ...parameters, [fieldName]: value });
  };

  const exportToPDF = () => {
    alert('PDF export coming soon!');
  };

  const exportToExcel = () => {
    alert('Excel export coming soon!');
  };

  const exportToCSV = () => {
    if (!reportData) return;

    // Create CSV content
    const headers = reportData.columns.map(col => col.display_name).join(',');
    const rows = reportData.data.map(row => {
      return reportData.columns.map(col => {
        const value = row[col.field_name];
        return `"${value || ''}"`;
      }).join(',');
    });

    const csv = [headers, ...rows].join('\n');

    // Download file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.template.code}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatValue = (value: any, column: Column) => {
    if (value === null || value === undefined) return '-';

    switch (column.data_type) {
      case 'currency':
        return new Intl.NumberFormat('en-ZA', {
          style: 'currency',
          currency: 'ZAR'
        }).format(value);
      case 'number':
        return new Intl.NumberFormat('en-ZA').format(value);
      case 'percentage':
        return `${(value * 100).toFixed(2)}%`;
      case 'date':
        return new Date(value).toLocaleDateString();
      default:
        return value;
    }
  };

  if (!template) {
    return (
      <div className="report-viewer">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading report template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-viewer">
      <div className="viewer-header">
        <div className="header-content">
          <h2>📊 {template.name}</h2>
          <p className="subtitle">{template.description || template.code}</p>
        </div>
        {reportData && (
          <div className="export-buttons">
            <button className="btn-export" onClick={exportToPDF} title="Export to PDF">
              📄 PDF
            </button>
            <button className="btn-export" onClick={exportToExcel} title="Export to Excel">
              📗 Excel
            </button>
            <button className="btn-export" onClick={exportToCSV} title="Export to CSV">
              📋 CSV
            </button>
          </div>
        )}
      </div>

      {/* Parameters Section */}
      {template.filters && template.filters.length > 0 && (
        <div className="parameters-section">
          <h3>Report Parameters</h3>
          <div className="parameters-grid">
            {template.filters.map((filter: Filter) => (
              <div key={filter.field_name} className="parameter-group">
                <label>
                  {filter.field_name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  {filter.is_required && <span className="required">*</span>}
                </label>
                {filter.operator === 'between' ? (
                  <div className="date-range">
                    <input
                      type="date"
                      value={parameters[filter.field_name]?.[0] || ''}
                      onChange={(e) => {
                        const current = parameters[filter.field_name] || ['', ''];
                        updateParameter(filter.field_name, [e.target.value, current[1]]);
                      }}
                    />
                    <span>to</span>
                    <input
                      type="date"
                      value={parameters[filter.field_name]?.[1] || ''}
                      onChange={(e) => {
                        const current = parameters[filter.field_name] || ['', ''];
                        updateParameter(filter.field_name, [current[0], e.target.value]);
                      }}
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={parameters[filter.field_name] || ''}
                    onChange={(e) => updateParameter(filter.field_name, e.target.value)}
                    placeholder={filter.default_value || 'Enter value...'}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="parameters-actions">
            <button className="btn-primary" onClick={executeReport} disabled={loading}>
              {loading ? '⏳ Running...' : '▶️ Run Report'}
            </button>
          </div>
        </div>
      )}

      {/* No parameters - auto run button */}
      {(!template.filters || template.filters.length === 0) && !reportData && (
        <div className="no-parameters">
          <p>This report has no parameters</p>
          <button className="btn-primary" onClick={executeReport} disabled={loading}>
            {loading ? '⏳ Running...' : '▶️ Run Report'}
          </button>
        </div>
      )}

      {/* Results Section */}
      {reportData && (
        <div className="results-section">
          <div className="results-header">
            <div className="results-info">
              <span className="info-item">
                <strong>{reportData.row_count}</strong> rows
              </span>
              <span className="info-item">
                <strong>{reportData.execution_time_ms}ms</strong> execution time
              </span>
              <span className="info-item">
                <strong>{reportData.columns.length}</strong> columns
              </span>
            </div>
            <div className="view-toggle">
              <button
                className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                📋 Table
              </button>
              <button
                className={`toggle-btn ${viewMode === 'chart' ? 'active' : ''}`}
                onClick={() => setViewMode('chart')}
              >
                📊 Chart
              </button>
            </div>
          </div>

          {viewMode === 'table' ? (
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    {reportData.columns.map((column) => (
                      <th
                        key={column.field_name}
                        style={{
                          width: `${column.width}px`,
                          textAlign: column.alignment as any
                        }}
                      >
                        {column.display_name}
                        {column.aggregate_function && (
                          <span className="aggregate-badge">{column.aggregate_function}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.data.length === 0 ? (
                    <tr>
                      <td colSpan={reportData.columns.length} className="no-data">
                        No data found
                      </td>
                    </tr>
                  ) : (
                    reportData.data.map((row, index) => (
                      <tr key={index}>
                        {reportData.columns.map((column) => (
                          <td
                            key={column.field_name}
                            style={{ textAlign: column.alignment as any }}
                            className={column.data_type === 'currency' ? 'currency-cell' : ''}
                          >
                            {formatValue(row[column.field_name], column)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="chart-container">
              <div className="chart-placeholder">
                <div className="placeholder-icon">📊</div>
                <h3>Chart View</h3>
                <p>Chart visualization coming soon!</p>
                <p className="placeholder-hint">
                  Charts will automatically detect numeric columns and create appropriate visualizations
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State (before first run) */}
      {!reportData && !loading && template.filters && template.filters.length > 0 && (
        <div className="empty-results">
          <div className="empty-icon">📊</div>
          <h3>Ready to Run</h3>
          <p>Set your parameters above and click "Run Report" to see results</p>
        </div>
      )}
    </div>
  );
};

export default ReportViewer;
