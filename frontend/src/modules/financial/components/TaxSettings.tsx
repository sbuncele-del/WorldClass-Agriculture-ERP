import React, { useState, useEffect } from 'react';
import './TaxSettings.css';

interface TaxConfiguration {
  id?: string;
  vat_enabled: boolean;
  vat_rate: number;
  vat_registration_number: string;
  vat_period: string;
  vat_zero_rated_enabled: boolean;
  vat_exempt_enabled: boolean;
  paye_enabled: boolean;
  paye_registration_number: string;
  paye_company_registration: string;
  sdl_rate: number;
  uif_rate: number;
  income_tax_enabled: boolean;
  corporate_tax_rate: number;
  income_tax_number: string;
  tax_year_end_month: number;
  provisional_tax_enabled: boolean;
  withholding_tax_enabled: boolean;
  withholding_tax_rate: number;
}

interface TaxAccount {
  tax_type: string;
  account_code: string | null;
  account_name?: string;
  is_active: boolean;
}

interface EfilingConfig {
  environment: string;
  auto_submit_enabled: boolean;
  auto_sync_enabled: boolean;
  sync_frequency: string;
  connection_status: string;
  last_sync_at?: string;
  notification_email: string;
  notification_enabled: boolean;
}

interface SetupStatus {
  is_complete: boolean;
  completion_percentage: number;
  missing_items: string[];
  warnings: string[];
}

const TaxSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<TaxConfiguration>({
    vat_enabled: true,
    vat_rate: 15.00,
    vat_registration_number: '',
    vat_period: 'MONTHLY',
    vat_zero_rated_enabled: true,
    vat_exempt_enabled: true,
    paye_enabled: true,
    paye_registration_number: '',
    paye_company_registration: '',
    sdl_rate: 1.00,
    uif_rate: 1.00,
    income_tax_enabled: true,
    corporate_tax_rate: 27.00,
    income_tax_number: '',
    tax_year_end_month: 2,
    provisional_tax_enabled: true,
    withholding_tax_enabled: false,
    withholding_tax_rate: 15.00
  });
  const [accounts, setAccounts] = useState<Record<string, TaxAccount[]>>({});
  const [efiling, setEfiling] = useState<EfilingConfig | null>(null);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [availableAccounts, setAvailableAccounts] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch tax configuration
      const configRes = await fetch('/api/financial/tax-settings/configuration');
      const configData = await configRes.json();
      
      if (configData.success) {
        setConfig(configData.data.configuration);
        setAccounts(configData.data.accounts);
        setEfiling(configData.data.efiling);
        setSetupStatus(configData.data.setup_complete);
      }

      // Fetch available accounts for dropdowns
      const accountsRes = await fetch('/api/financial/chart-of-accounts');
      const accountsData = await accountsRes.json();
      if (accountsData.success) {
        setAvailableAccounts(accountsData.data);
      }

      // Fetch validation status
      const validationRes = await fetch('/api/financial/tax-settings/validate');
      const validationData = await validationRes.json();
      if (validationData.success) {
        setSetupStatus(validationData.data);
      }
    } catch (error) {
      console.error('Error fetching tax settings:', error);
      showMessage('error', 'Failed to load tax settings');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field: keyof TaxConfiguration, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveConfiguration = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/financial/tax-settings/configuration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'Tax settings saved successfully');
        fetchData(); // Refresh to get updated validation status
      } else {
        showMessage('error', data.error || 'Failed to save tax settings');
      }
    } catch (error) {
      console.error('Error saving tax settings:', error);
      showMessage('error', 'Failed to save tax settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAccountMapping = async (taxType: string, accountCode: string) => {
    try {
      const response = await fetch(`/api/financial/tax-settings/accounts/${taxType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_code: accountCode, is_active: true })
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'Account mapping updated');
        fetchData();
      } else {
        showMessage('error', data.error || 'Failed to update account mapping');
      }
    } catch (error) {
      console.error('Error updating account mapping:', error);
      showMessage('error', 'Failed to update account mapping');
    }
  };

  const handleTestConnection = async () => {
    try {
      const response = await fetch('/api/financial/tax-settings/efiling/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'SARS eFiling connection successful');
        fetchData();
      } else {
        showMessage('error', data.error || 'Connection test failed');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      showMessage('error', 'Failed to test connection');
    }
  };

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const getAccountName = (taxType: string): string => {
    const accountList = Object.values(accounts).flat();
    const account = accountList.find(a => a.tax_type === taxType);
    return account?.account_code || '';
  };

  if (loading) {
    return (
      <div className="tax-settings">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading tax settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tax-settings">
      {/* Header */}
      <div className="ts-header">
        <div>
          <h1>Tax Settings</h1>
          <p className="ts-subtitle">SARS-compliant tax configuration for South Africa</p>
        </div>
        <button onClick={handleSaveConfiguration} disabled={saving} className="btn-save">
          {saving ? '💾 Saving...' : '💾 Save Settings'}
        </button>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`message-banner message-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Setup Progress */}
      {setupStatus && (
        <div className="setup-progress-card">
          <div className="progress-header">
            <h3>Setup Progress</h3>
            <span className="progress-percentage">{setupStatus.completion_percentage}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${setupStatus.completion_percentage}%` }}
            ></div>
          </div>
          
          {setupStatus.missing_items.length > 0 && (
            <div className="missing-items">
              <h4>⚠️ Missing Items:</h4>
              <ul>
                {setupStatus.missing_items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          
          {setupStatus.warnings.length > 0 && (
            <div className="warnings">
              <h4>ℹ️ Warnings:</h4>
              <ul>
                {setupStatus.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="ts-content">
        {/* VAT Configuration */}
        <div className="config-card">
          <div className="card-header">
            <h2>🧾 VAT Configuration</h2>
            <label className="toggle">
              <input
                type="checkbox"
                checked={config.vat_enabled}
                onChange={(e) => handleConfigChange('vat_enabled', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {config.vat_enabled && (
            <div className="card-content">
              <div className="form-row">
                <div className="form-group">
                  <label>VAT Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.vat_rate}
                    onChange={(e) => handleConfigChange('vat_rate', parseFloat(e.target.value))}
                  />
                  <span className="help-text">Standard rate: 15% (South Africa)</span>
                </div>

                <div className="form-group">
                  <label>VAT Registration Number</label>
                  <input
                    type="text"
                    value={config.vat_registration_number}
                    onChange={(e) => handleConfigChange('vat_registration_number', e.target.value)}
                    placeholder="4123456789"
                  />
                </div>

                <div className="form-group">
                  <label>VAT Period</label>
                  <select
                    value={config.vat_period}
                    onChange={(e) => handleConfigChange('vat_period', e.target.value)}
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="BI_MONTHLY">Bi-Monthly</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={config.vat_zero_rated_enabled}
                      onChange={(e) => handleConfigChange('vat_zero_rated_enabled', e.target.checked)}
                    />
                    Enable Zero-Rated Transactions
                  </label>
                </div>

                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={config.vat_exempt_enabled}
                      onChange={(e) => handleConfigChange('vat_exempt_enabled', e.target.checked)}
                    />
                    Enable Exempt Transactions
                  </label>
                </div>
              </div>

              <div className="account-mappings">
                <h3>Account Mappings</h3>
                <div className="mapping-row">
                  <label>VAT Input (Purchases)</label>
                  <select
                    value={getAccountName('VAT_INPUT')}
                    onChange={(e) => handleAccountMapping('VAT_INPUT', e.target.value)}
                  >
                    <option value="">Select Account</option>
                    {availableAccounts.filter(a => a.account_type === 'ASSET').map(acc => (
                      <option key={acc.account_code} value={acc.account_code}>
                        {acc.account_code} - {acc.account_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mapping-row">
                  <label>VAT Output (Sales)</label>
                  <select
                    value={getAccountName('VAT_OUTPUT')}
                    onChange={(e) => handleAccountMapping('VAT_OUTPUT', e.target.value)}
                  >
                    <option value="">Select Account</option>
                    {availableAccounts.filter(a => a.account_type === 'LIABILITY').map(acc => (
                      <option key={acc.account_code} value={acc.account_code}>
                        {acc.account_code} - {acc.account_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mapping-row">
                  <label>VAT Control Account</label>
                  <select
                    value={getAccountName('VAT_CONTROL')}
                    onChange={(e) => handleAccountMapping('VAT_CONTROL', e.target.value)}
                  >
                    <option value="">Select Account</option>
                    {availableAccounts.filter(a => a.account_type === 'LIABILITY').map(acc => (
                      <option key={acc.account_code} value={acc.account_code}>
                        {acc.account_code} - {acc.account_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PAYE Configuration */}
        <div className="config-card">
          <div className="card-header">
            <h2>👥 PAYE Configuration</h2>
            <label className="toggle">
              <input
                type="checkbox"
                checked={config.paye_enabled}
                onChange={(e) => handleConfigChange('paye_enabled', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {config.paye_enabled && (
            <div className="card-content">
              <div className="form-row">
                <div className="form-group">
                  <label>PAYE Registration Number</label>
                  <input
                    type="text"
                    value={config.paye_registration_number}
                    onChange={(e) => handleConfigChange('paye_registration_number', e.target.value)}
                    placeholder="7123456789"
                  />
                </div>

                <div className="form-group">
                  <label>Company Registration Number</label>
                  <input
                    type="text"
                    value={config.paye_company_registration}
                    onChange={(e) => handleConfigChange('paye_company_registration', e.target.value)}
                    placeholder="2021/123456/07"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>SDL Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.sdl_rate}
                    onChange={(e) => handleConfigChange('sdl_rate', parseFloat(e.target.value))}
                  />
                  <span className="help-text">Skills Development Levy: 1%</span>
                </div>

                <div className="form-group">
                  <label>UIF Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.uif_rate}
                    onChange={(e) => handleConfigChange('uif_rate', parseFloat(e.target.value))}
                  />
                  <span className="help-text">Unemployment Insurance Fund: 1%</span>
                </div>
              </div>

              <div className="account-mappings">
                <h3>Account Mappings</h3>
                <div className="mapping-row">
                  <label>PAYE Payable</label>
                  <select
                    value={getAccountName('PAYE_PAYABLE')}
                    onChange={(e) => handleAccountMapping('PAYE_PAYABLE', e.target.value)}
                  >
                    <option value="">Select Account</option>
                    {availableAccounts.filter(a => a.account_type === 'LIABILITY').map(acc => (
                      <option key={acc.account_code} value={acc.account_code}>
                        {acc.account_code} - {acc.account_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mapping-row">
                  <label>SDL Payable</label>
                  <select
                    value={getAccountName('SDL_PAYABLE')}
                    onChange={(e) => handleAccountMapping('SDL_PAYABLE', e.target.value)}
                  >
                    <option value="">Select Account</option>
                    {availableAccounts.filter(a => a.account_type === 'LIABILITY').map(acc => (
                      <option key={acc.account_code} value={acc.account_code}>
                        {acc.account_code} - {acc.account_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mapping-row">
                  <label>UIF Payable</label>
                  <select
                    value={getAccountName('UIF_PAYABLE')}
                    onChange={(e) => handleAccountMapping('UIF_PAYABLE', e.target.value)}
                  >
                    <option value="">Select Account</option>
                    {availableAccounts.filter(a => a.account_type === 'LIABILITY').map(acc => (
                      <option key={acc.account_code} value={acc.account_code}>
                        {acc.account_code} - {acc.account_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Income Tax Configuration */}
        <div className="config-card">
          <div className="card-header">
            <h2>🏛️ Income Tax Configuration</h2>
            <label className="toggle">
              <input
                type="checkbox"
                checked={config.income_tax_enabled}
                onChange={(e) => handleConfigChange('income_tax_enabled', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {config.income_tax_enabled && (
            <div className="card-content">
              <div className="form-row">
                <div className="form-group">
                  <label>Corporate Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.corporate_tax_rate}
                    onChange={(e) => handleConfigChange('corporate_tax_rate', parseFloat(e.target.value))}
                  />
                  <span className="help-text">Standard corporate rate: 27%</span>
                </div>

                <div className="form-group">
                  <label>Income Tax Number</label>
                  <input
                    type="text"
                    value={config.income_tax_number}
                    onChange={(e) => handleConfigChange('income_tax_number', e.target.value)}
                    placeholder="9123456789"
                  />
                </div>

                <div className="form-group">
                  <label>Tax Year End Month</label>
                  <select
                    value={config.tax_year_end_month}
                    onChange={(e) => handleConfigChange('tax_year_end_month', parseInt(e.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2000, i).toLocaleString('en', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                  <span className="help-text">Most common: February</span>
                </div>
              </div>

              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={config.provisional_tax_enabled}
                    onChange={(e) => handleConfigChange('provisional_tax_enabled', e.target.checked)}
                  />
                  Enable Provisional Tax Payments
                </label>
              </div>

              <div className="account-mappings">
                <h3>Account Mappings</h3>
                <div className="mapping-row">
                  <label>Income Tax Payable</label>
                  <select
                    value={getAccountName('INCOME_TAX_PAYABLE')}
                    onChange={(e) => handleAccountMapping('INCOME_TAX_PAYABLE', e.target.value)}
                  >
                    <option value="">Select Account</option>
                    {availableAccounts.filter(a => a.account_type === 'LIABILITY').map(acc => (
                      <option key={acc.account_code} value={acc.account_code}>
                        {acc.account_code} - {acc.account_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mapping-row">
                  <label>Provisional Tax</label>
                  <select
                    value={getAccountName('PROVISIONAL_TAX')}
                    onChange={(e) => handleAccountMapping('PROVISIONAL_TAX', e.target.value)}
                  >
                    <option value="">Select Account</option>
                    {availableAccounts.filter(a => a.account_type === 'ASSET').map(acc => (
                      <option key={acc.account_code} value={acc.account_code}>
                        {acc.account_code} - {acc.account_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mapping-row">
                  <label>Deferred Tax</label>
                  <select
                    value={getAccountName('DEFERRED_TAX')}
                    onChange={(e) => handleAccountMapping('DEFERRED_TAX', e.target.value)}
                  >
                    <option value="">Select Account</option>
                    {availableAccounts.map(acc => (
                      <option key={acc.account_code} value={acc.account_code}>
                        {acc.account_code} - {acc.account_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SARS eFiling Configuration (Phase 2) */}
        <div className="config-card">
          <div className="card-header">
            <h2>🔗 SARS eFiling Integration</h2>
            {efiling && (
              <span className={`status-badge status-${efiling.connection_status.toLowerCase()}`}>
                {efiling.connection_status}
              </span>
            )}
          </div>

          <div className="card-content">
            <div className="info-box">
              <p>
                <strong>Phase 2 Feature:</strong> SARS eFiling integration enables automatic submission
                of VAT returns, PAYE returns, and other tax documents directly to SARS.
              </p>
              <p>Configure your connection settings below to enable this feature.</p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Environment</label>
                <select value={efiling?.environment || 'TEST'} disabled>
                  <option value="TEST">Test Environment</option>
                  <option value="PRODUCTION">Production</option>
                </select>
                <span className="help-text">Currently in development - Test mode only</span>
              </div>
            </div>

            <div className="efiling-actions">
              <button onClick={handleTestConnection} className="btn-test" disabled>
                🔌 Test Connection
              </button>
              <span className="help-text">Available in Phase 2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxSettings;
