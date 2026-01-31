import React, { useState, useEffect } from 'react';
import '../styles/TrialBalance.css';

interface TrialBalanceAccount {
  code: string;
  name: string;
  account_type: string;
  normal_balance: string;
  total_debits: number;
  total_credits: number;
  balance: number;
}

interface TrialBalanceData {
  accounts: TrialBalanceAccount[];
  summary: {
    total_debits: number;
    total_credits: number;
    is_balanced: boolean;
  };
  period: {
    fiscal_year: number;
    fiscal_period: number;
  };
}

interface Dimension {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

const TrialBalance: React.FC = () => {
  const [data, setData] = useState<TrialBalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Period selection
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState(currentDate.getMonth() + 1);
  
  // Filters
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
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
    fetchTrialBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedPeriod]);

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

  const fetchTrialBalance = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        fiscal_year: selectedYear.toString(),
        fiscal_period: selectedPeriod.toString(),
      });

      // Add dimension filters if selected
      if (selectedCostCenter) params.append('cost_center_id', selectedCostCenter);
      if (selectedDepartment) params.append('department_id', selectedDepartment);
      if (selectedProject) params.append('project_id', selectedProject);
      if (selectedProduct) params.append('product_id', selectedProduct);
      if (selectedLocation) params.append('location_id', selectedLocation);

      const response = await fetch(
        `/api/financial/reports/trial-balance?${params.toString()}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch trial balance');
      }
      
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountClick = (accountCode: string) => {
    // Navigate to account ledger
    window.location.href = `/financial/account-ledger/${accountCode}?fiscal_year=${selectedYear}&fiscal_period=${selectedPeriod}`;
  };

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    alert('Excel export coming soon!');
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    alert('PDF export coming soon!');
  };

  const handleRefresh = () => {
    fetchTrialBalance();
  };

  const handleApplyDimensionFilters = () => {
    fetchTrialBalance();
  };

  const handleClearDimensionFilters = () => {
    setSelectedCostCenter('');
    setSelectedDepartment('');
    setSelectedProject('');
    setSelectedProduct('');
    setSelectedLocation('');
    // Fetch will be triggered by useEffect when filters change
  };

  const hasActiveDimensionFilters = selectedCostCenter || selectedDepartment || 
    selectedProject || selectedProduct || selectedLocation;

  // Filter accounts
  const filteredAccounts = data?.accounts.filter(account => {
    const matchesType = accountTypeFilter === 'ALL' || account.account_type === accountTypeFilter;
    const matchesSearch = account.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         account.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  }) || [];

  // Group by account type
  const groupedAccounts = filteredAccounts.reduce((acc, account) => {
    const type = account.account_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(account);
    return acc;
  }, {} as Record<string, TrialBalanceAccount[]>);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPeriod = (year: number, period: number): string => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[period - 1]} ${year}`;
  };

  const getAccountTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'ASSET': '💰 Assets',
      'LIABILITY': '📊 Liabilities',
      'EQUITY': '🏛️ Equity',
      'REVENUE': '💵 Revenue',
      'EXPENSE': '📤 Expenses',
    };
    return labels[type] || type;
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);
  const periodOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  if (loading) {
    return (
      <div className="trial-balance-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading trial balance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trial-balance-container">
        <div className="error-message">
          <h3>⚠️ Error Loading Trial Balance</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="btn-retry">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const accountTypes = ['ALL', 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

  return (
    <div className="trial-balance-container">
      {/* Header */}
      <div className="trial-balance-header">
        <div className="header-left">
          <h1>📊 Trial Balance</h1>
          <p className="period-display">
            Period: <strong>{formatPeriod(data.period.fiscal_year, data.period.fiscal_period)}</strong>
          </p>
        </div>
        
        <div className="header-actions">
          <button onClick={handleExportExcel} className="btn-export" title="Export to Excel">
            📗 Excel
          </button>
          <button onClick={handleExportPDF} className="btn-export" title="Export to PDF">
            📕 PDF
          </button>
          <button onClick={handleRefresh} className="btn-refresh" title="Refresh">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Period & Filter Controls */}
      <div className="controls-section">
        <div className="period-selector">
          <label>
            <span>Fiscal Year:</span>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="select-input"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
          
          <label>
            <span>Period:</span>
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              className="select-input"
            >
              {periodOptions.map(period => (
                <option key={period} value={period}>
                  {formatPeriod(selectedYear, period).split(' ')[0]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="filters">
          <div className="account-type-filter">
            {accountTypes.map(type => (
              <button
                key={type}
                className={`filter-btn ${accountTypeFilter === type ? 'active' : ''}`}
                onClick={() => setAccountTypeFilter(type)}
              >
                {type === 'ALL' ? '📋 All' : getAccountTypeLabel(type)}
              </button>
            ))}
          </div>
          
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
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
          {hasActiveDimensionFilters && (
            <button className="btn-clear-dimensions" onClick={handleClearDimensionFilters}>
              Clear All
            </button>
          )}
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
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Balance Status Banner */}
      <div className={`balance-status ${data.summary.is_balanced ? 'balanced' : 'unbalanced'}`}>
        <div className="status-icon">
          {data.summary.is_balanced ? '✅' : '❌'}
        </div>
        <div className="status-text">
          <h3>
            {data.summary.is_balanced ? 'Trial Balance is Balanced' : 'Trial Balance is OUT OF BALANCE'}
          </h3>
          <p>
            {data.summary.is_balanced 
              ? 'All debits and credits are equal. Books are in order.' 
              : '⚠️ WARNING: Debits and credits do not match. Review your entries.'}
          </p>
        </div>
        <div className="status-amounts">
          <div className="amount-item">
            <span className="label">Total Debits:</span>
            <span className="value">{formatCurrency(data.summary.total_debits)}</span>
          </div>
          <div className="amount-item">
            <span className="label">Total Credits:</span>
            <span className="value">{formatCurrency(data.summary.total_credits)}</span>
          </div>
          <div className="amount-item difference">
            <span className="label">Difference:</span>
            <span className="value">
              {formatCurrency(Math.abs(data.summary.total_debits - data.summary.total_credits))}
            </span>
          </div>
        </div>
      </div>

      {/* Trial Balance Table */}
      <div className="trial-balance-table-container">
        {Object.entries(groupedAccounts).length === 0 ? (
          <div className="empty-state">
            <p>No accounts found matching your filters.</p>
            <button onClick={() => { setAccountTypeFilter('ALL'); setSearchQuery(''); }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {Object.entries(groupedAccounts).map(([accountType, accounts]) => (
              <div key={accountType} className="account-type-group">
                <h3 className="account-type-header">
                  {getAccountTypeLabel(accountType)}
                  <span className="account-count">({accounts.length} accounts)</span>
                </h3>
                
                <table className="trial-balance-table">
                  <thead>
                    <tr>
                      <th className="col-code">Account Code</th>
                      <th className="col-name">Account Name</th>
                      <th className="col-debit">Debit</th>
                      <th className="col-credit">Credit</th>
                      <th className="col-balance">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr 
                        key={account.code}
                        onClick={() => handleAccountClick(account.code)}
                        className="account-row"
                      >
                        <td className="col-code">
                          <code>{account.code}</code>
                        </td>
                        <td className="col-name">
                          {account.name}
                        </td>
                        <td className="col-debit">
                          {account.total_debits > 0 ? formatCurrency(account.total_debits) : '-'}
                        </td>
                        <td className="col-credit">
                          {account.total_credits > 0 ? formatCurrency(account.total_credits) : '-'}
                        </td>
                        <td className={`col-balance ${account.balance < 0 ? 'negative' : 'positive'}`}>
                          {formatCurrency(Math.abs(account.balance))}
                          {account.normal_balance === 'DEBIT' ? ' DR' : ' CR'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="subtotal-row">
                      <td colSpan={2} className="subtotal-label">
                        <strong>{getAccountTypeLabel(accountType)} Subtotal:</strong>
                      </td>
                      <td className="col-debit">
                        <strong>
                          {formatCurrency(accounts.reduce((sum, a) => sum + a.total_debits, 0))}
                        </strong>
                      </td>
                      <td className="col-credit">
                        <strong>
                          {formatCurrency(accounts.reduce((sum, a) => sum + a.total_credits, 0))}
                        </strong>
                      </td>
                      <td className="col-balance">
                        <strong>
                          {formatCurrency(Math.abs(accounts.reduce((sum, a) => sum + a.balance, 0)))}
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))}

            {/* Grand Total */}
            <div className="grand-total-section">
              <table className="trial-balance-table">
                <tfoot>
                  <tr className="grand-total-row">
                    <td colSpan={2} className="grand-total-label">
                      <strong>📊 GRAND TOTAL:</strong>
                    </td>
                    <td className="col-debit">
                      <strong>{formatCurrency(data.summary.total_debits)}</strong>
                    </td>
                    <td className="col-credit">
                      <strong>{formatCurrency(data.summary.total_credits)}</strong>
                    </td>
                    <td className="col-balance">
                      <strong>
                        {data.summary.is_balanced ? '✅ BALANCED' : '❌ OUT OF BALANCE'}
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="trial-balance-footer">
        <p>
          💡 <strong>Tip:</strong> Click on any account to view its detailed ledger.
        </p>
        <p className="record-count">
          Showing {filteredAccounts.length} of {data.accounts.length} accounts
        </p>
      </div>
    </div>
  );
};

export default TrialBalance;
