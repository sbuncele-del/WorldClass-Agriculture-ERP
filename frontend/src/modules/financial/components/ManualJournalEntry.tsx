import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../services/api.service';
import '../styles/ManualJournalEntry.css';

interface JournalLine {
  id: string;
  account_code: string;
  account_name: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  cost_center_id?: string;
  department_id?: string;
  project_id?: string;
  product_id?: string;
  location_id?: string;
}

interface Account {
  id: string;
  code: string;
  name: string;
  account_type: string;
  normal_balance: string;
}

interface Dimension {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

const ManualJournalEntry: React.FC = () => {
  const [journalDate, setJournalDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [lines, setLines] = useState<JournalLine[]>([
    { id: '1', account_code: '', account_name: '', description: '', debit_amount: 0, credit_amount: 0 },
    { id: '2', account_code: '', account_name: '', description: '', debit_amount: 0, credit_amount: 0 },
  ]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [costCenters, setCostCenters] = useState<Dimension[]>([]);
  const [departments, setDepartments] = useState<Dimension[]>([]);
  const [projects, setProjects] = useState<Dimension[]>([]);
  const [products, setProducts] = useState<Dimension[]>([]);
  const [locations, setLocations] = useState<Dimension[]>([]);
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<string>('DRAFT');

  // Load chart of accounts and dimensions
  useEffect(() => {
    fetchAccounts();
    fetchDimensions();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/financial/chart-of-accounts`);
      const data = await response.json();
      if (data.success) {
        setAccounts(data.data.filter((acc: Account) => !acc.account_type?.includes('header')));
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const fetchDimensions = async () => {
    try {
      const [ccRes, deptRes, projRes, prodRes, locRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/financial/dimensions/cost-centers`),
        fetch(`${API_BASE_URL}/api/financial/dimensions/departments`),
        fetch(`${API_BASE_URL}/api/financial/dimensions/projects`),
        fetch(`${API_BASE_URL}/api/financial/dimensions/products`),
        fetch(`${API_BASE_URL}/api/financial/dimensions/locations`),
      ]);

      const [ccData, deptData, projData, prodData, locData] = await Promise.all([
        ccRes.json(),
        deptRes.json(),
        projRes.json(),
        prodRes.json(),
        locRes.json(),
      ]);

      if (ccData.success) setCostCenters(ccData.data.filter((d: Dimension) => d.is_active));
      if (deptData.success) setDepartments(deptData.data.filter((d: Dimension) => d.is_active));
      if (projData.success) setProjects(projData.data.filter((d: Dimension) => d.is_active));
      if (prodData.success) setProducts(prodData.data.filter((d: Dimension) => d.is_active));
      if (locData.success) setLocations(locData.data.filter((d: Dimension) => d.is_active));
    } catch (err) {
      console.error('Failed to load dimensions:', err);
    }
  };

  const addLine = () => {
    const newLine: JournalLine = {
      id: String(lines.length + 1),
      account_code: '',
      account_name: '',
      description: '',
      debit_amount: 0,
      credit_amount: 0,
    };
    setLines([...lines, newLine]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 2) {
      setError('Journal entry must have at least 2 lines');
      return;
    }
    setLines(lines.filter(line => line.id !== id));
  };

    const updateLine = (id: string, field: keyof JournalLine, value: string | number | undefined) => {
    setLines(lines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const toggleLineExpanded = (lineId: string) => {
    const newExpanded = new Set(expandedLines);
    if (newExpanded.has(lineId)) {
      newExpanded.delete(lineId);
    } else {
      newExpanded.add(lineId);
    }
    setExpandedLines(newExpanded);
  };

  const calculateTotals = () => {
    const totalDebits = lines.reduce((sum, line) => sum + (parseFloat(String(line.debit_amount)) || 0), 0);
    const totalCredits = lines.reduce((sum, line) => sum + (parseFloat(String(line.credit_amount)) || 0), 0);
    const difference = totalDebits - totalCredits;
    
    return { totalDebits, totalCredits, difference, isBalanced: Math.abs(difference) < 0.01 };
  };

  const validateEntry = (): string | null => {
    if (!description.trim()) {
      return 'Description is required';
    }
    
    if (lines.length < 2) {
      return 'At least 2 lines required';
    }
    
    for (const line of lines) {
      if (!line.account_code) {
        return 'All lines must have an account selected';
      }
      if (line.debit_amount === 0 && line.credit_amount === 0) {
        return 'Each line must have either a debit or credit amount';
      }
    }
    
    const { isBalanced } = calculateTotals();
    if (!isBalanced) {
      return 'Debits must equal credits';
    }
    
    return null;
  };

  const handleSubmit = async (status: 'DRAFT' | 'POST') => {
    setError(null);
    setSuccess(null);
    
    const validationError = validateEntry();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    
    try {
      // Create journal entry
      const createPayload = {
        journal_date: journalDate,
        description,
        notes,
        source_type: 'MANUAL',
        lines: lines.map(line => ({
          account_code: line.account_code,
          debit_amount: parseFloat(String(line.debit_amount)) || undefined,
          credit_amount: parseFloat(String(line.credit_amount)) || undefined,
          description: line.description,
          cost_center_id: line.cost_center_id || undefined,
          department_id: line.department_id || undefined,
          project_id: line.project_id || undefined,
          product_id: line.product_id || undefined,
          location_id: line.location_id || undefined,
        })),
      };
      
      const createResponse = await fetch(`${API_BASE_URL}/api/financial/journal-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createPayload),
      });
      
      const createData = await createResponse.json();
      
      if (!createData.success) {
        throw new Error(createData.error || 'Failed to create journal entry');
      }
      
      const journalEntryId = createData.data.id;
      setSavedEntryId(journalEntryId);
      
      // If POST status, post the entry immediately
      if (status === 'POST') {
        const postResponse = await fetch(`${API_BASE_URL}/api/financial/journal-entries/${journalEntryId}/post`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: 'current-user' }),
        });
        
        const postData = await postResponse.json();
        
        if (!postData.success) {
          throw new Error(postData.error || 'Failed to post journal entry');
        }
        
        setSuccess(`Journal entry posted successfully! (${journalEntryId})`);
        setApprovalStatus('POSTED');
      } else {
        setSuccess(`Journal entry saved as draft! (${journalEntryId})`);
        setApprovalStatus('DRAFT');
      }
      
      // Reset form
      setTimeout(() => {
        setDescription('');
        setNotes('');
        setLines([
          { id: '1', account_code: '', account_name: '', description: '', debit_amount: 0, credit_amount: 0 },
          { id: '2', account_code: '', account_name: '', description: '', debit_amount: 0, credit_amount: 0 },
        ]);
        setSuccess(null);
        setSavedEntryId(null);
        setApprovalStatus('DRAFT');
      }, 3000);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!savedEntryId) {
      setError('Please save the entry first before submitting for approval');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/financial/approvals/submit/${savedEntryId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'current-user' }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit for approval');
      }

      setSuccess(`Entry submitted for approval! Workflow: ${data.data.workflow_name}`);
      setApprovalStatus('PENDING_APPROVAL');

      // Reset form after delay
      setTimeout(() => {
        setDescription('');
        setNotes('');
        setLines([
          { id: '1', account_code: '', account_name: '', description: '', debit_amount: 0, credit_amount: 0 },
          { id: '2', account_code: '', account_name: '', description: '', debit_amount: 0, credit_amount: 0 },
        ]);
        setSuccess(null);
        setSavedEntryId(null);
        setApprovalStatus('DRAFT');
      }, 3000);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const { totalDebits, totalCredits, difference, isBalanced } = calculateTotals();

  return (
    <div className="manual-journal-entry">
      <div className="journal-header">
        <h2>📝 Manual Journal Entry</h2>
        <p className="subtitle">Record manual adjustments, corrections, and other transactions</p>
        
        {/* Approval Status Badge */}
        {approvalStatus !== 'DRAFT' && (
          <div className={`approval-status-badge status-${approvalStatus.toLowerCase()}`}>
            {approvalStatus === 'PENDING_APPROVAL' && '⏳ Pending Approval'}
            {approvalStatus === 'APPROVED' && '✅ Approved'}
            {approvalStatus === 'REJECTED' && '❌ Rejected'}
            {approvalStatus === 'POSTED' && '📊 Posted'}
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          ✅ {success}
        </div>
      )}

      <div className="journal-form">
        {/* Header Section */}
        <div className="form-section">
          <h3>Journal Entry Details</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Date *</label>
              <input
                type="date"
                value={journalDate}
                onChange={(e) => setJournalDate(e.target.value)}
                required
              />
            </div>
            
            <div className="form-field full-width">
              <label>Description *</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Office rent payment for January 2025"
                required
              />
            </div>
            
            <div className="form-field full-width">
              <label>Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details, reference numbers, etc."
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Lines Section */}
        <div className="form-section">
          <div className="section-header">
            <h3>Journal Lines</h3>
            <button className="btn-add-line" onClick={addLine} type="button">
              + Add Line
            </button>
          </div>

          <div className="journal-lines-table">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>Account Code</th>
                  <th style={{ width: '200px' }}>Account Name</th>
                  <th>Description</th>
                  <th style={{ width: '130px' }}>Debit (R)</th>
                  <th style={{ width: '130px' }}>Credit (R)</th>
                  <th style={{ width: '100px' }}>Dimensions</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <React.Fragment key={line.id}>
                    <tr>
                      <td>
                        <select
                          value={line.account_code}
                          onChange={(e) => updateLine(line.id, 'account_code', e.target.value)}
                          required
                        >
                          <option value="">Select...</option>
                          {accounts.map((acc) => (
                            <option key={acc.code} value={acc.code}>
                              {acc.code}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span className="account-name">{line.account_name}</span>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={line.description}
                          onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                          placeholder="Line description..."
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.debit_amount || ''}
                          onChange={(e) => updateLine(line.id, 'debit_amount', e.target.value)}
                          placeholder="0.00"
                          className="amount-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.credit_amount || ''}
                          onChange={(e) => updateLine(line.id, 'credit_amount', e.target.value)}
                          placeholder="0.00"
                          className="amount-input"
                        />
                      </td>
                      <td>
                        <button
                          className="btn-dimensions"
                          onClick={() => toggleLineExpanded(line.id)}
                          type="button"
                          title="Add dimensions"
                        >
                          {expandedLines.has(line.id) ? '▼' : '▶'}
                        </button>
                      </td>
                      <td>
                        <button
                          className="btn-remove-line"
                          onClick={() => removeLine(line.id)}
                          type="button"
                          disabled={lines.length <= 2}
                          title="Remove line"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                    {expandedLines.has(line.id) && (
                      <tr className="dimensions-row">
                        <td colSpan={7}>
                          <div className="dimensions-panel">
                            <div className="dimension-field">
                              <label>Cost Center:</label>
                              <select
                                value={line.cost_center_id || ''}
                                onChange={(e) => updateLine(line.id, 'cost_center_id', e.target.value)}
                              >
                                <option value="">None</option>
                                {costCenters.map((cc) => (
                                  <option key={cc.id} value={cc.id}>
                                    {cc.code} - {cc.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="dimension-field">
                              <label>Department:</label>
                              <select
                                value={line.department_id || ''}
                                onChange={(e) => updateLine(line.id, 'department_id', e.target.value)}
                              >
                                <option value="">None</option>
                                {departments.map((dept) => (
                                  <option key={dept.id} value={dept.id}>
                                    {dept.code} - {dept.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="dimension-field">
                              <label>Project:</label>
                              <select
                                value={line.project_id || ''}
                                onChange={(e) => updateLine(line.id, 'project_id', e.target.value)}
                              >
                                <option value="">None</option>
                                {projects.map((proj) => (
                                  <option key={proj.id} value={proj.id}>
                                    {proj.code} - {proj.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="dimension-field">
                              <label>Product:</label>
                              <select
                                value={line.product_id || ''}
                                onChange={(e) => updateLine(line.id, 'product_id', e.target.value)}
                              >
                                <option value="">None</option>
                                {products.map((prod) => (
                                  <option key={prod.id} value={prod.id}>
                                    {prod.code} - {prod.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="dimension-field">
                              <label>Location:</label>
                              <select
                                value={line.location_id || ''}
                                onChange={(e) => updateLine(line.id, 'location_id', e.target.value)}
                              >
                                <option value="">None</option>
                                {locations.map((loc) => (
                                  <option key={loc.id} value={loc.id}>
                                    {loc.code} - {loc.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr className="totals-row">
                  <td colSpan={3} className="totals-label">Totals:</td>
                  <td className="total-debit">R {totalDebits.toFixed(2)}</td>
                  <td className="total-credit">R {totalCredits.toFixed(2)}</td>
                  <td colSpan={2}></td>
                </tr>
                <tr className="difference-row">
                  <td colSpan={3} className="totals-label">
                    {isBalanced ? (
                      <span className="balanced">✅ Balanced</span>
                    ) : (
                      <span className="unbalanced">⚠️ Out of Balance by:</span>
                    )}
                  </td>
                  <td colSpan={2} className={isBalanced ? 'balanced-amount' : 'unbalanced-amount'}>
                    R {Math.abs(difference).toFixed(2)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button
            className="btn btn-secondary"
            onClick={() => handleSubmit('DRAFT')}
            disabled={loading || approvalStatus === 'PENDING_APPROVAL' || approvalStatus === 'APPROVED'}
            type="button"
          >
            {loading ? 'Saving...' : 'Save as Draft'}
          </button>
          
          {savedEntryId && approvalStatus === 'DRAFT' && (
            <button
              className="btn btn-warning"
              onClick={handleSubmitForApproval}
              disabled={loading}
              type="button"
            >
              {loading ? 'Submitting...' : '📋 Submit for Approval'}
            </button>
          )}
          
          <button
            className="btn btn-primary"
            onClick={() => handleSubmit('POST')}
            disabled={loading || !isBalanced || approvalStatus === 'PENDING_APPROVAL'}
            type="button"
          >
            {loading ? 'Posting...' : 'Post to Ledger'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualJournalEntry;
