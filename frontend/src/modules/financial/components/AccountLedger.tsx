import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/AccountLedger.css';

interface LedgerEntry {
  journal_date: string;
  posting_date: string;
  journal_number: string;
  journal_description: string;
  line_description?: string;
  debit: number;
  credit: number;
  balance: number;
  cost_center?: string;
  department?: string;
  project?: string;
}

interface AccountLedgerData {
  account_code: string;
  account_name: string;
  account_type: string;
  normal_balance: string;
  entries: LedgerEntry[];
  summary: {
    total_debits: number;
    total_credits: number;
    current_balance: number;
    entry_count: number;
  };
}

interface Dimension {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

const AccountLedger: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [data, setData] = useState<AccountLedgerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Date filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fiscalYear, setFiscalYear] = useState(searchParams.get('fiscal_year') || '');
  const [fiscalPeriod, setFiscalPeriod] = useState(searchParams.get('fiscal_period') || '');

  // Dimension filters
  const [costCenters, setCostCenters] = useState<Dimension[]>([]);
  const [departments, setDepartments] = useState<Dimension[]>([]);
  const [projects, setProjects] = useState<Dimension[]>([]);
  const [products, setProducts] = useState<Dimension[]>([]);
  const [locations, setLocations] = useState<Dimension[]>([]);
  
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  
  const [showDimensionFilters, setShowDimensionFilters] = useState(false);

  useEffect(() => {
    if (code) {
      fetchAccountLedger();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, fromDate, toDate, fiscalYear, fiscalPeriod]);

  useEffect(() => {
    fetchDimensions();
  }, []);

  const fetchDimensions = async () => {
    try {
      const [ccRes, deptRes, projRes, prodRes, locRes] = await Promise.all([
        fetch('/api/financial/dimensions/cost-centers'),
        fetch('/api/financial/dimensions/departments'),
        fetch('/api/financial/dimensions/projects'),
        fetch('/api/financial/dimensions/products'),
        fetch('/api/financial/dimensions/locations'),
      ]);

      const [ccData, deptData, projData, prodData, locData] = await Promise.all([
        ccRes.json(),
        deptRes.json(),
        projRes.json(),
        prodRes.json(),
        locRes.json(),
      ]);

      setCostCenters((ccData.data || []).filter((d: Dimension) => d.is_active));
      setDepartments((deptData.data || []).filter((d: Dimension) => d.is_active));
      setProjects((projData.data || []).filter((d: Dimension) => d.is_active));
      setProducts((prodData.data || []).filter((d: Dimension) => d.is_active));
      setLocations((locData.data || []).filter((d: Dimension) => d.is_active));
    } catch (err) {
      console.error('Error fetching dimensions:', err);
    }
  };

  const fetchAccountLedger = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      if (fiscalYear) params.append('fiscal_year', fiscalYear);
      if (fiscalPeriod) params.append('fiscal_period', fiscalPeriod);
      
      // Add dimension filters if selected
      if (selectedCostCenter) params.append('cost_center_id', selectedCostCenter);
      if (selectedDepartment) params.append('department_id', selectedDepartment);
      if (selectedProject) params.append('project_id', selectedProject);
      if (selectedProduct) params.append('product_id', selectedProduct);
      if (selectedLocation) params.append('location_id', selectedLocation);
      
      const response = await fetch(
        `/api/financial/reports/account-ledger/${code}?${params.toString()}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch account ledger');
      }
      
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleExportExcel = () => {
    alert('Excel export coming soon!');
  };

  const handleExportPDF = () => {
    alert('PDF export coming soon!');
  };

  const handleApplyDimensionFilters = () => {
    fetchAccountLedger();
  };

  const handleClearAllFilters = () => {
    setFromDate('');
    setToDate('');
    setFiscalYear('');
    setFiscalPeriod('');
    setSelectedCostCenter('');
    setSelectedDepartment('');
    setSelectedProject('');
    setSelectedProduct('');
    setSelectedLocation('');
  };

  const hasActiveDimensionFilters = selectedCostCenter || selectedDepartment || 
    selectedProject || selectedProduct || selectedLocation;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="account-ledger-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading account ledger...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="account-ledger-container">
        <div className="error-message">
          <h3>⚠️ Error Loading Account Ledger</h3>
          <p>{error || 'Account not found'}</p>
          <button onClick={handleBack} className="btn-back">
            ← Back to Trial Balance
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="account-ledger-container">
      {/* Header */}
      <div className="ledger-header">
        <div className="header-top">
          <button onClick={handleBack} className="btn-back">
            ← Back
          </button>
          <div className="header-actions">
            <button onClick={handleExportExcel} className="btn-export">
              📗 Excel
            </button>
            <button onClick={handleExportPDF} className="btn-export">
              📕 PDF
            </button>
          </div>
        </div>
        
        <div className="account-info">
          <div className="account-details">
            <h1>📒 Account Ledger</h1>
            <div className="account-meta">
              <span className="account-code">
                <code>{data.account_code}</code>
              </span>
              <span className="separator">•</span>
              <span className="account-name">{data.account_name}</span>
              <span className="separator">•</span>
              <span className="account-type-badge">
                {data.account_type}
              </span>
            </div>
          </div>
          
          <div className="account-balance-card">
            <div className="balance-label">Current Balance</div>
            <div className={`balance-amount ${data.summary.current_balance < 0 ? 'negative' : 'positive'}`}>
              {formatCurrency(Math.abs(data.summary.current_balance))}
              <span className="balance-type">
                {data.normal_balance === 'DEBIT' ? ' DR' : ' CR'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="ledger-filters">
        <div className="filter-group">
          <label>
            <span>From Date:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="date-input"
            />
          </label>
          
          <label>
            <span>To Date:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="date-input"
            />
          </label>
        </div>
        
        <div className="filter-group">
          <label>
            <span>Fiscal Year:</span>
            <input
              type="number"
              placeholder="e.g., 2025"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              className="year-input"
            />
          </label>
          
          <label>
            <span>Period:</span>
            <select
              value={fiscalPeriod}
              onChange={(e) => setFiscalPeriod(e.target.value)}
              className="period-select"
            >
              <option value="">All Periods</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(period => (
                <option key={period} value={period}>
                  Period {period}
                </option>
              ))}
            </select>
          </label>
          
          <button 
            onClick={handleClearAllFilters}
            className="btn-clear-filters"
          >
            🔄 Clear All Filters
          </button>
        </div>
        
        {/* Dimension Filters Toggle */}
        <div className="dimension-filters-header">
          <button
            className="btn-toggle-dimensions"
            onClick={() => setShowDimensionFilters(!showDimensionFilters)}
          >
            📐 Dimension Filters {showDimensionFilters ? '▼' : '▶'}
            {hasActiveDimensionFilters && <span className="filter-badge">Active</span>}
          </button>
        </div>

        {/* Dimension Filters Panel */}
        {showDimensionFilters && (
          <div className="dimension-filters-panel">
            <div className="dimension-filter-grid">
              <div className="dimension-filter">
                <label>Cost Center:</label>
                <select
                  value={selectedCostCenter}
                  onChange={(e) => setSelectedCostCenter(e.target.value)}
                  className="dimension-select"
                >
                  <option value="">All Cost Centers</option>
                  {costCenters.map((cc) => (
                    <option key={cc.id} value={cc.id}>
                      {cc.code} - {cc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dimension-filter">
                <label>Department:</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="dimension-select"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.code} - {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dimension-filter">
                <label>Project:</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="dimension-select"
                >
                  <option value="">All Projects</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.code} - {proj.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dimension-filter">
                <label>Product:</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="dimension-select"
                >
                  <option value="">All Products</option>
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.code} - {prod.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dimension-filter">
                <label>Location:</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="dimension-select"
                >
                  <option value="">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.code} - {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="dimension-filter-actions">
              <button className="btn-apply-filters" onClick={handleApplyDimensionFilters}>
                Apply Dimension Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <div className="card-label">Total Debits</div>
            <div className="card-value">{formatCurrency(data.summary.total_debits)}</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">📉</div>
          <div className="card-content">
            <div className="card-label">Total Credits</div>
            <div className="card-value">{formatCurrency(data.summary.total_credits)}</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <div className="card-label">Net Movement</div>
            <div className="card-value">
              {formatCurrency(Math.abs(data.summary.total_debits - data.summary.total_credits))}
            </div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">📋</div>
          <div className="card-content">
            <div className="card-label">Transactions</div>
            <div className="card-value">{data.summary.entry_count}</div>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="ledger-table-container">
        {data.entries.length === 0 ? (
          <div className="empty-state">
            <p>📭 No transactions found for this account in the selected period.</p>
            <p>Try adjusting your date filters or selecting a different period.</p>
          </div>
        ) : (
          <table className="ledger-table">
            <thead>
              <tr>
                <th className="col-date">Date</th>
                <th className="col-journal">Journal #</th>
                <th className="col-description">Description</th>
                <th className="col-dimensions">Dimensions</th>
                <th className="col-debit">Debit</th>
                <th className="col-credit">Credit</th>
                <th className="col-balance">Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry, index) => (
                <tr key={index} className="ledger-row">
                  <td className="col-date">
                    <div className="date-display">
                      <div className="journal-date">{formatDate(entry.journal_date)}</div>
                      {entry.posting_date !== entry.journal_date && (
                        <div className="posting-date">Posted: {formatDate(entry.posting_date)}</div>
                      )}
                    </div>
                  </td>
                  <td className="col-journal">
                    <code>{entry.journal_number}</code>
                  </td>
                  <td className="col-description">
                    <div className="description-display">
                      <div className="journal-desc">{entry.journal_description}</div>
                      {entry.line_description && (
                        <div className="line-desc">{entry.line_description}</div>
                      )}
                    </div>
                  </td>
                  <td className="col-dimensions">
                    {(entry.cost_center || entry.department || entry.project) ? (
                      <div className="dimensions">
                        {entry.cost_center && (
                          <span className="dimension-tag">CC: {entry.cost_center}</span>
                        )}
                        {entry.department && (
                          <span className="dimension-tag">Dept: {entry.department}</span>
                        )}
                        {entry.project && (
                          <span className="dimension-tag">Proj: {entry.project}</span>
                        )}
                      </div>
                    ) : (
                      <span className="no-dimensions">-</span>
                    )}
                  </td>
                  <td className="col-debit">
                    {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                  </td>
                  <td className="col-credit">
                    {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                  </td>
                  <td className={`col-balance ${entry.balance < 0 ? 'negative' : 'positive'}`}>
                    {formatCurrency(Math.abs(entry.balance))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td colSpan={4} className="total-label">
                  <strong>📊 TOTALS:</strong>
                </td>
                <td className="col-debit">
                  <strong>{formatCurrency(data.summary.total_debits)}</strong>
                </td>
                <td className="col-credit">
                  <strong>{formatCurrency(data.summary.total_credits)}</strong>
                </td>
                <td className={`col-balance ${data.summary.current_balance < 0 ? 'negative' : 'positive'}`}>
                  <strong>
                    {formatCurrency(Math.abs(data.summary.current_balance))}
                    {data.normal_balance === 'DEBIT' ? ' DR' : ' CR'}
                  </strong>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="ledger-footer">
        <p>
          💡 <strong>Tip:</strong> Use the date filters to narrow down your search.
          Click "Back" to return to the Trial Balance.
        </p>
      </div>
    </div>
  );
};

export default AccountLedger;
