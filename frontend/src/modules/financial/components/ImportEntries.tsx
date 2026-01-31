import React, { useState } from 'react';
import './ImportEntries.css';

interface ColumnMapping {
  journal_date?: string;
  account_code?: string;
  description?: string;
  debit_amount?: string;
  credit_amount?: string;
  cost_center?: string;
  project_code?: string;
  department?: string;
  reference?: string;
}

interface ImportLine {
  line_number: number;
  journal_date?: string;
  account_code?: string;
  description?: string;
  debit_amount?: number;
  credit_amount?: number;
  cost_center?: string;
  project_code?: string;
  department?: string;
  reference?: string;
  errors: string[];
}

interface ValidationResult {
  valid: boolean;
  total_lines: number;
  valid_lines: number;
  invalid_lines: number;
  total_entries: number;
  errors: string[];
  lines: ImportLine[];
}

const ImportEntries: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [batchName, setBatchName] = useState<string>('');
  const [autoPost, setAutoPost] = useState<boolean>(false);

  // Step 1: File Upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);

      // Parse headers
      const lines = content.split('\n');
      if (lines.length > 0) {
        const headerLine = lines[0];
        const cols = headerLine.split(',').map(h => h.trim());
        setHeaders(cols);

        // Auto-detect common column names
        const autoMapping: ColumnMapping = {};
        cols.forEach(col => {
          const lower = col.toLowerCase();
          if (lower.includes('date')) autoMapping.journal_date = col;
          if (lower.includes('account') && lower.includes('code')) autoMapping.account_code = col;
          if (lower.includes('description') || lower === 'desc') autoMapping.description = col;
          if (lower.includes('debit')) autoMapping.debit_amount = col;
          if (lower.includes('credit')) autoMapping.credit_amount = col;
          if (lower.includes('cost') && lower.includes('center')) autoMapping.cost_center = col;
          if (lower.includes('project')) autoMapping.project_code = col;
          if (lower.includes('department') || lower === 'dept') autoMapping.department = col;
          if (lower.includes('reference') || lower === 'ref') autoMapping.reference = col;
        });
        setColumnMapping(autoMapping);
      }

      setStep(2);
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      const fakeEvent = { target: { files: [file] } } as any;
      handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Step 2: Column Mapping
  const handleValidate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/financial/import-entries/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_content: fileContent,
          column_mapping: columnMapping
        })
      });

      const result = await response.json();

      if (result.success) {
        setValidationResult(result.data);
        setStep(3);
      } else {
        setError(result.message || 'Validation failed');
      }
    } catch (err) {
      setError('Error validating file');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Review & Validate
  const handleImport = async () => {
    if (!validationResult) return;

    setImporting(true);
    setError(null);

    try {
      const response = await fetch('/api/financial/import-entries/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: validationResult.lines.filter(l => l.errors.length === 0),
          batch_name: batchName || `Import - ${fileName}`,
          auto_post: autoPost
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(`Successfully imported ${result.data.entries_imported} journal entries with ${result.data.lines_imported} lines`);
        setStep(4);
      } else {
        setError(result.message || 'Import failed');
      }
    } catch (err) {
      setError('Error importing entries');
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/financial/import-entries/template');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'journal_entries_template.csv';
      a.click();
    } catch (err) {
      console.error('Error downloading template:', err);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setFileContent('');
    setFileName('');
    setHeaders([]);
    setColumnMapping({});
    setValidationResult(null);
    setError(null);
    setSuccess(null);
    setBatchName('');
    setAutoPost(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="import-entries">
      {/* Header */}
      <div className="ie-header">
        <div>
          <h1>Import Journal Entries</h1>
          <p className="ie-subtitle">Bulk import from CSV or Excel files</p>
        </div>
        <button onClick={handleDownloadTemplate} className="btn-template">
          📥 Download Template
        </button>
      </div>

      {/* Progress Steps */}
      <div className="wizard-steps">
        <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Upload File</div>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Map Columns</div>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Validate & Review</div>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${step >= 4 ? 'active' : ''}`}>
          <div className="step-number">4</div>
          <div className="step-label">Complete</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Step Content */}
      <div className="wizard-content">
        {/* Step 1: File Upload */}
        {step === 1 && (
          <div className="step-content">
            <h2>Upload CSV File</h2>
            <p>Select a CSV file containing journal entries to import.</p>

            <div
              className="file-upload-area"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="upload-icon">📁</div>
              <h3>Drag & Drop CSV file here</h3>
              <p>or</p>
              <label htmlFor="file-input" className="btn-browse">
                Browse Files
              </label>
              <input
                id="file-input"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <p className="upload-hint">Supported format: CSV (.csv)</p>
            </div>

            {fileName && (
              <div className="file-selected">
                <span className="file-icon">📄</span>
                <span className="file-name">{fileName}</span>
                <span className="file-status">✓ Ready</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 2 && (
          <div className="step-content">
            <h2>Map Columns</h2>
            <p>Map the columns in your CSV file to the required fields.</p>

            <div className="mapping-grid">
              <div className="mapping-row">
                <label>Journal Date *</label>
                <select
                  value={columnMapping.journal_date || ''}
                  onChange={(e) => setColumnMapping({ ...columnMapping, journal_date: e.target.value })}
                >
                  <option value="">-- Select Column --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className="mapping-row">
                <label>Account Code *</label>
                <select
                  value={columnMapping.account_code || ''}
                  onChange={(e) => setColumnMapping({ ...columnMapping, account_code: e.target.value })}
                >
                  <option value="">-- Select Column --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className="mapping-row">
                <label>Description</label>
                <select
                  value={columnMapping.description || ''}
                  onChange={(e) => setColumnMapping({ ...columnMapping, description: e.target.value })}
                >
                  <option value="">-- Select Column --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className="mapping-row">
                <label>Debit Amount</label>
                <select
                  value={columnMapping.debit_amount || ''}
                  onChange={(e) => setColumnMapping({ ...columnMapping, debit_amount: e.target.value })}
                >
                  <option value="">-- Select Column --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className="mapping-row">
                <label>Credit Amount</label>
                <select
                  value={columnMapping.credit_amount || ''}
                  onChange={(e) => setColumnMapping({ ...columnMapping, credit_amount: e.target.value })}
                >
                  <option value="">-- Select Column --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className="mapping-row">
                <label>Cost Center (Optional)</label>
                <select
                  value={columnMapping.cost_center || ''}
                  onChange={(e) => setColumnMapping({ ...columnMapping, cost_center: e.target.value })}
                >
                  <option value="">-- Select Column --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className="mapping-row">
                <label>Reference (Optional)</label>
                <select
                  value={columnMapping.reference || ''}
                  onChange={(e) => setColumnMapping({ ...columnMapping, reference: e.target.value })}
                >
                  <option value="">-- Select Column --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <div className="wizard-actions">
              <button onClick={resetWizard} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleValidate}
                className="btn-primary"
                disabled={!columnMapping.journal_date || !columnMapping.account_code || loading}
              >
                {loading ? 'Validating...' : 'Next: Validate'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Validation & Review */}
        {step === 3 && validationResult && (
          <div className="step-content">
            <h2>Validation Results</h2>

            <div className="validation-summary">
              <div className="summary-card">
                <div className="card-label">Total Lines</div>
                <div className="card-value">{validationResult.total_lines}</div>
              </div>
              <div className="summary-card success">
                <div className="card-label">Valid Lines</div>
                <div className="card-value">{validationResult.valid_lines}</div>
              </div>
              <div className="summary-card error">
                <div className="card-label">Invalid Lines</div>
                <div className="card-value">{validationResult.invalid_lines}</div>
              </div>
              <div className="summary-card">
                <div className="card-label">Journal Entries</div>
                <div className="card-value">{validationResult.total_entries}</div>
              </div>
            </div>

            {validationResult.errors.length > 0 && (
              <div className="errors-section">
                <h3>❌ Validation Errors</h3>
                <div className="errors-list">
                  {validationResult.errors.slice(0, 10).map((err, i) => (
                    <div key={i} className="error-item">{err}</div>
                  ))}
                  {validationResult.errors.length > 10 && (
                    <div className="error-item">...and {validationResult.errors.length - 10} more errors</div>
                  )}
                </div>
              </div>
            )}

            <div className="preview-section">
              <h3>Preview ({validationResult.lines.length} lines)</h3>
              <div className="preview-table-container">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>Line</th>
                      <th>Date</th>
                      <th>Account</th>
                      <th>Description</th>
                      <th>Debit</th>
                      <th>Credit</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationResult.lines.slice(0, 20).map(line => (
                      <tr key={line.line_number} className={line.errors.length > 0 ? 'error-row' : ''}>
                        <td>{line.line_number}</td>
                        <td>{line.journal_date || '-'}</td>
                        <td>{line.account_code || '-'}</td>
                        <td>{line.description || '-'}</td>
                        <td>{line.debit_amount ? formatCurrency(line.debit_amount) : '-'}</td>
                        <td>{line.credit_amount ? formatCurrency(line.credit_amount) : '-'}</td>
                        <td>
                          {line.errors.length === 0 ? (
                            <span className="status-valid">✓ Valid</span>
                          ) : (
                            <span className="status-invalid" title={line.errors.join(', ')}>
                              ✗ {line.errors.length} error{line.errors.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="import-options">
              <div className="form-group">
                <label>Batch Name</label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder={`Import - ${fileName}`}
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={autoPost}
                    onChange={(e) => setAutoPost(e.target.checked)}
                  />
                  Auto-post entries after import
                </label>
              </div>
            </div>

            <div className="wizard-actions">
              <button onClick={() => setStep(2)} className="btn-secondary">
                Back
              </button>
              <button
                onClick={handleImport}
                className="btn-primary"
                disabled={!validationResult.valid || importing}
              >
                {importing ? 'Importing...' : `Import ${validationResult.valid_lines} Lines`}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="step-content success-content">
            <div className="success-icon">✅</div>
            <h2>Import Complete!</h2>
            <p className="success-message">{success}</p>

            <div className="wizard-actions">
              <button onClick={resetWizard} className="btn-primary">
                Import Another File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportEntries;
