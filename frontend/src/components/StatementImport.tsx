/**
 * Statement Import Component
 * 
 * CSV upload and import workflow for bank statements
 * Supports South African bank formats with intelligent column mapping
 */

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api.service';
import './StatementImport.css';

const API_BASE = `${API_BASE_URL}/api/cash-management`;

interface Bank {
  id: number;
  name: string;
  code: string;
  swift_code: string;
}

interface BankAccount {
  id: number;
  bank_code: string;
  account_number: string;
  account_name: string;
  bank_name?: string;
  current_balance: number;
  currency: string;
}

interface CSVPreset {
  bankCode: string;
  bankName: string;
  dateColumn: string;
  descriptionColumn: string;
  debitColumn: string;
  creditColumn: string;
  balanceColumn: string;
  referenceColumn: string | null;
  dateFormat: string;
  skipRows: number;
  delimiter: string;
}

interface ParsePreviewResponse {
  success: boolean;
  data: {
    headers: string[];
    rows: string[][];
    totalRows: number;
    preset?: CSVPreset;
  };
  message?: string;
}

interface ImportResponse {
  success: boolean;
  data?: {
    statementId: number;
    linesImported: number;
  };
  message: string;
}

interface Props {
  onImportComplete?: (statementId: number) => void;
  onCancel?: () => void;
}

const StatementImport: React.FC<Props> = ({ onImportComplete, onCancel }) => {
  // State
  const [step, setStep] = useState<'upload' | 'preview' | 'mapping' | 'import'>('upload');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [csvPreset, setCSVPreset] = useState<CSVPreset | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  
  // Import settings
  const [statementDate, setStatementDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [openingBalance, setOpeningBalance] = useState<string>('');
  const [closingBalance, setClosingBalance] = useState<string>('');
  
  // Column mapping (for custom banks)
  const [columnMapping, setColumnMapping] = useState({
    dateColumn: '',
    descriptionColumn: '',
    debitColumn: '',
    creditColumn: '',
    balanceColumn: '',
    referenceColumn: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load banks and accounts
  useEffect(() => {
    fetchBanks();
    fetchAccounts();
  }, []);

  // Load CSV preset when bank is selected
  useEffect(() => {
    if (selectedBank) {
      fetchCSVPreset(selectedBank);
    }
  }, [selectedBank]);

  const fetchBanks = async () => {
    try {
      const response = await fetch(`${API_BASE}/banks`);
      const result = await response.json();
      if (result.success) {
        setBanks(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch banks:', err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${API_BASE}/bank-accounts`);
      const result = await response.json();
      if (result.success) {
        setAccounts(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  };

  const fetchCSVPreset = async (bankCode: string) => {
    try {
      const response = await fetch(`${API_BASE}/banks/${bankCode}/csv-preset`);
      const result = await response.json();
      if (result.success && result.data) {
        setCSVPreset(result.data);
        setColumnMapping({
          dateColumn: result.data.dateColumn,
          descriptionColumn: result.data.descriptionColumn,
          debitColumn: result.data.debitColumn,
          creditColumn: result.data.creditColumn,
          balanceColumn: result.data.balanceColumn,
          referenceColumn: result.data.referenceColumn || ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch CSV preset:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleParsePreview = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (selectedBank) {
        formData.append('bankCode', selectedBank);
      }

      const response = await fetch(`${API_BASE}/statements/parse-csv`, {
        method: 'POST',
        body: formData
      });

      const result: ParsePreviewResponse = await response.json();

      if (result.success) {
        setHeaders(result.data.headers);
        setPreviewRows(result.data.rows);
        setTotalRows(result.data.totalRows);
        
        if (result.data.preset) {
          setCSVPreset(result.data.preset);
        }
        
        setStep('preview');
      } else {
        setError(result.message || 'Failed to parse CSV file');
      }
    } catch (err) {
      setError('Error parsing file: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file || !selectedAccount) {
      setError('Please select a bank account');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bankAccountId', selectedAccount.toString());
      formData.append('statementDate', statementDate);
      formData.append('openingBalance', openingBalance);
      formData.append('closingBalance', closingBalance);
      
      // Add column mapping
      formData.append('dateColumn', columnMapping.dateColumn);
      formData.append('descriptionColumn', columnMapping.descriptionColumn);
      formData.append('debitColumn', columnMapping.debitColumn);
      formData.append('creditColumn', columnMapping.creditColumn);
      formData.append('balanceColumn', columnMapping.balanceColumn);
      if (columnMapping.referenceColumn) {
        formData.append('referenceColumn', columnMapping.referenceColumn);
      }

      const response = await fetch(`${API_BASE}/statements/import`, {
        method: 'POST',
        body: formData
      });

      const result: ImportResponse = await response.json();

      if (result.success && result.data) {
        if (onImportComplete) {
          onImportComplete(result.data.statementId);
        }
      } else {
        setError(result.message || 'Import failed');
      }
    } catch (err) {
      setError('Error importing statement: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const selectedAccountData = accounts.find(a => a.id === selectedAccount);

  return (
    <div className="statement-import">
      <div className="import-header">
        <h2>Import Bank Statement</h2>
        <p>Upload CSV file from your bank and import transactions</p>
      </div>

      {/* Progress Steps */}
      <div className="import-steps">
        <div className={`step ${step === 'upload' ? 'active' : ''} ${step !== 'upload' ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Upload File</div>
        </div>
        <div className="step-divider"></div>
        <div className={`step ${step === 'preview' ? 'active' : ''} ${step === 'import' ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Preview & Map</div>
        </div>
        <div className="step-divider"></div>
        <div className={`step ${step === 'import' ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Import</div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="import-step">
          <div className="form-section">
            <h3>1. Select Bank Account</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Bank</label>
                <select 
                  value={selectedBank} 
                  onChange={(e) => setSelectedBank(e.target.value)}
                  required
                >
                  <option value="">-- Select Bank --</option>
                  {banks.map(bank => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Bank Account</label>
                <select 
                  value={selectedAccount || ''} 
                  onChange={(e) => setSelectedAccount(Number(e.target.value))}
                  required
                >
                  <option value="">-- Select Account --</option>
                  {accounts
                    .filter(acc => !selectedBank || acc.bank_code === selectedBank)
                    .map(account => (
                      <option key={account.id} value={account.id}>
                        {account.account_name} ({account.account_number})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {selectedAccountData && (
              <div className="account-info">
                <div className="info-row">
                  <span className="label">Current Balance:</span>
                  <span className="value">
                    {selectedAccountData.currency} {selectedAccountData.current_balance.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="form-section">
            <h3>2. Upload CSV File</h3>
            <div className="file-upload">
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange}
                id="csv-file"
              />
              <label htmlFor="csv-file" className="file-upload-label">
                {file ? (
                  <>
                    <span>📄</span>
                    <span>{file.name}</span>
                    <span className="file-size">({(file.size / 1024).toFixed(2)} KB)</span>
                  </>
                ) : (
                  <>
                    <span>📤</span>
                    <span>Click to select CSV file or drag and drop</span>
                  </>
                )}
              </label>
            </div>

            {csvPreset && (
              <div className="preset-info">
                <h4>✓ CSV Format Detected</h4>
                <div className="preset-details">
                  <div className="detail">
                    <span className="label">Bank:</span>
                    <span className="value">{csvPreset.bankName}</span>
                  </div>
                  <div className="detail">
                    <span className="label">Date Format:</span>
                    <span className="value">{csvPreset.dateFormat}</span>
                  </div>
                  <div className="detail">
                    <span className="label">Delimiter:</span>
                    <span className="value">{csvPreset.delimiter === ',' ? 'Comma' : 'Other'}</span>
                  </div>
                  <div className="detail">
                    <span className="label">Skip Rows:</span>
                    <span className="value">{csvPreset.skipRows}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            {onCancel && (
              <button type="button" className="btn-secondary" onClick={onCancel}>
                Cancel
              </button>
            )}
            <button 
              type="button" 
              className="btn-primary" 
              onClick={handleParsePreview}
              disabled={!file || !selectedAccount || loading}
            >
              {loading ? 'Parsing...' : 'Next: Preview →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preview & Column Mapping */}
      {step === 'preview' && (
        <div className="import-step">
          <div className="preview-section">
            <h3>CSV Preview ({totalRows} rows total)</h3>
            <div className="preview-table-container">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>#</th>
                    {headers.map((header, idx) => (
                      <th key={idx}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.slice(0, 10).map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      <td>{rowIdx + 1}</td>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalRows > 10 && (
              <p className="preview-note">Showing first 10 rows of {totalRows} total rows</p>
            )}
          </div>

          <div className="mapping-section">
            <h3>Column Mapping</h3>
            <div className="mapping-grid">
              <div className="mapping-item">
                <label>Date Column</label>
                <select 
                  value={columnMapping.dateColumn}
                  onChange={(e) => setColumnMapping({...columnMapping, dateColumn: e.target.value})}
                >
                  <option value="">-- Select --</option>
                  {headers.map((h, idx) => (
                    <option key={idx} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div className="mapping-item">
                <label>Description Column</label>
                <select 
                  value={columnMapping.descriptionColumn}
                  onChange={(e) => setColumnMapping({...columnMapping, descriptionColumn: e.target.value})}
                >
                  <option value="">-- Select --</option>
                  {headers.map((h, idx) => (
                    <option key={idx} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div className="mapping-item">
                <label>Debit Column</label>
                <select 
                  value={columnMapping.debitColumn}
                  onChange={(e) => setColumnMapping({...columnMapping, debitColumn: e.target.value})}
                >
                  <option value="">-- Select --</option>
                  {headers.map((h, idx) => (
                    <option key={idx} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div className="mapping-item">
                <label>Credit Column</label>
                <select 
                  value={columnMapping.creditColumn}
                  onChange={(e) => setColumnMapping({...columnMapping, creditColumn: e.target.value})}
                >
                  <option value="">-- Select --</option>
                  {headers.map((h, idx) => (
                    <option key={idx} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div className="mapping-item">
                <label>Balance Column (Optional)</label>
                <select 
                  value={columnMapping.balanceColumn}
                  onChange={(e) => setColumnMapping({...columnMapping, balanceColumn: e.target.value})}
                >
                  <option value="">-- Select --</option>
                  {headers.map((h, idx) => (
                    <option key={idx} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div className="mapping-item">
                <label>Reference Column (Optional)</label>
                <select 
                  value={columnMapping.referenceColumn}
                  onChange={(e) => setColumnMapping({...columnMapping, referenceColumn: e.target.value})}
                >
                  <option value="">-- Select --</option>
                  {headers.map((h, idx) => (
                    <option key={idx} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setStep('upload')}>
              ← Back
            </button>
            <button 
              type="button" 
              className="btn-primary" 
              onClick={() => setStep('import')}
              disabled={!columnMapping.dateColumn || !columnMapping.descriptionColumn}
            >
              Next: Import →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Import Settings */}
      {step === 'import' && (
        <div className="import-step">
          <div className="form-section">
            <h3>Import Settings</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Statement Date</label>
                <input 
                  type="date" 
                  value={statementDate}
                  onChange={(e) => setStatementDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Opening Balance</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group">
                <label>Closing Balance</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          <div className="import-summary">
            <h3>Import Summary</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">Bank Account:</span>
                <span className="value">{selectedAccountData?.account_name}</span>
              </div>
              <div className="summary-item">
                <span className="label">Account Number:</span>
                <span className="value">{selectedAccountData?.account_number}</span>
              </div>
              <div className="summary-item">
                <span className="label">File:</span>
                <span className="value">{file?.name}</span>
              </div>
              <div className="summary-item">
                <span className="label">Total Rows:</span>
                <span className="value">{totalRows}</span>
              </div>
              <div className="summary-item">
                <span className="label">Statement Date:</span>
                <span className="value">{statementDate}</span>
              </div>
              <div className="summary-item">
                <span className="label">Opening Balance:</span>
                <span className="value">R {openingBalance || '0.00'}</span>
              </div>
              <div className="summary-item">
                <span className="label">Closing Balance:</span>
                <span className="value">R {closingBalance || '0.00'}</span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setStep('preview')}>
              ← Back
            </button>
            <button 
              type="button" 
              className="btn-primary btn-import" 
              onClick={handleImport}
              disabled={!openingBalance || !closingBalance || loading}
            >
              {loading ? 'Importing...' : '✓ Import Statement'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatementImport;
