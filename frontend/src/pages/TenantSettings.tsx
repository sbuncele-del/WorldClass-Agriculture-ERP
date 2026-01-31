import React, { useState, useEffect } from 'react';
import './TenantSettings.css';
import { apiGet, apiPatch, apiPost, apiDelete } from '../services/api.service';

interface TenantSettings {
  id: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  taxNumber: string;
  registrationNumber: string;
  industry: string;
  timezone: string;
  currency: string;
  fiscalYearEnd: string;
  logoUrl: string | null;
}

interface ModuleConfig {
  sales: boolean;
  purchase: boolean;
  inventory: boolean;
  financial: boolean;
  hr: boolean;
  manufacturing: boolean;
  warehouse: boolean;
  assets: boolean;
  practice: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'invited' | 'suspended';
  lastActive: string | null;
}

interface InviteForm {
  email: string;
  role: string;
}

const TenantSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'company' | 'modules' | 'team' | 'integrations'>('company');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Company settings state
  const [settings, setSettings] = useState<TenantSettings>({
    id: '',
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'South Africa',
    taxNumber: '',
    registrationNumber: '',
    industry: '',
    timezone: 'Africa/Johannesburg',
    currency: 'ZAR',
    fiscalYearEnd: '12-31',
    logoUrl: null,
  });

  // Module configuration state
  const [modules, setModules] = useState<ModuleConfig>({
    sales: true,
    purchase: true,
    inventory: true,
    financial: true,
    hr: false,
    manufacturing: false,
    warehouse: false,
    assets: false,
    practice: false,
  });

  // Team members state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteForm, setInviteForm] = useState<InviteForm>({
    email: '',
    role: 'user',
  });

  useEffect(() => {
    fetchTenantSettings();
    fetchModuleConfig();
    fetchTeamMembers();
  }, []);

  const fetchTenantSettings = async () => {
    try {
      const data = await apiGet<TenantSettings>('/api/v1/tenant/settings');
      setSettings(data);
    } catch (err: any) {
      console.error('Failed to load tenant settings', err);
      setMessage({ type: 'error', text: err?.message || 'Failed to load tenant settings' });
    }
  };

  const fetchModuleConfig = async () => {
    try {
      const data = await apiGet<ModuleConfig>('/api/v1/tenant/modules');
      setModules(data);
    } catch (err: any) {
      console.error('Failed to load module configuration', err);
      setMessage({ type: 'error', text: err?.message || 'Failed to load module configuration' });
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const data = await apiGet<TeamMember[]>('/api/v1/tenant/team');
      setTeamMembers(data);
    } catch (err: any) {
      console.error('Failed to load team members', err);
      setMessage({ type: 'error', text: err?.message || 'Failed to load team members' });
    }
  };

  const handleSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await apiPatch('/api/v1/tenant/settings', settings);
      setMessage({ type: 'success', text: 'Company settings updated successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to update settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleModuleToggle = async (moduleName: keyof ModuleConfig) => {
    const newModules = { ...modules, [moduleName]: !modules[moduleName] };
    setModules(newModules);

    try {
      await apiPatch('/api/v1/tenant/modules', newModules);
      setMessage({ type: 'success', text: 'Module configuration updated' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to update modules' });
      setModules(modules); // Revert on error
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await apiPost('/api/v1/tenant/team/invite', inviteForm);
      setMessage({ type: 'success', text: 'Invitation sent successfully' });
      setInviteForm({ email: '', role: 'user' });
      fetchTeamMembers();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to send invitation' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;

    try {
      await apiDelete(`/api/v1/tenant/team/${userId}`);
      setMessage({ type: 'success', text: 'User removed successfully' });
      fetchTeamMembers();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to remove user' });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="tenant-settings-container">
      <div className="tenant-settings-header">
        <h1>Company Settings</h1>
        <p>Manage your organization's configuration and team</p>
      </div>

      {message && (
        <div className={`tenant-settings-alert tenant-settings-alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="tenant-settings-layout">
        <nav className="tenant-settings-sidebar">
          <button
            className={`tenant-settings-tab ${activeTab === 'company' ? 'active' : ''}`}
            onClick={() => setActiveTab('company')}
          >
            🏢 Company Info
          </button>
          <button
            className={`tenant-settings-tab ${activeTab === 'modules' ? 'active' : ''}`}
            onClick={() => setActiveTab('modules')}
          >
            🧩 Modules
          </button>
          <button
            className={`tenant-settings-tab ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            👥 Team Members
          </button>
          <button
            className={`tenant-settings-tab ${activeTab === 'integrations' ? 'active' : ''}`}
            onClick={() => setActiveTab('integrations')}
          >
            🔗 Integrations
          </button>
        </nav>

        <div className="tenant-settings-content">
          {/* Company Info Tab */}
          {activeTab === 'company' && (
            <div className="tenant-settings-section">
              <h2>Company Information</h2>
              <form onSubmit={handleSettingsUpdate}>
                {/* Logo Upload */}
                <div className="tenant-logo-section">
                  <div className="tenant-logo-preview">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Company Logo" />
                    ) : (
                      <div className="tenant-logo-placeholder">
                        {settings.companyName.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div className="tenant-logo-actions">
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="logo-upload" className="btn-secondary">
                      Upload Logo
                    </label>
                    {settings.logoUrl && (
                      <button
                        type="button"
                        className="btn-text"
                        onClick={() => setSettings({ ...settings, logoUrl: null })}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Basic Information */}
                <div className="form-grid">
                  <div className="form-group">
                    <label>Company Name *</label>
                    <input
                      type="text"
                      value={settings.companyName}
                      onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Company Email *</label>
                    <input
                      type="email"
                      value={settings.companyEmail}
                      onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={settings.companyPhone}
                      onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Industry</label>
                    <select
                      value={settings.industry}
                      onChange={(e) => setSettings({ ...settings, industry: e.target.value })}
                    >
                      <option value="">Select Industry</option>
                      <option value="retail">Retail</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="services">Services</option>
                      <option value="technology">Technology</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="construction">Construction</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Address */}
                <h3>Address</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Street Address</label>
                    <input
                      type="text"
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={settings.city}
                      onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Province</label>
                    <select
                      value={settings.province}
                      onChange={(e) => setSettings({ ...settings, province: e.target.value })}
                    >
                      <option value="">Select Province</option>
                      <option value="Gauteng">Gauteng</option>
                      <option value="Western Cape">Western Cape</option>
                      <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                      <option value="Eastern Cape">Eastern Cape</option>
                      <option value="Limpopo">Limpopo</option>
                      <option value="Mpumalanga">Mpumalanga</option>
                      <option value="North West">North West</option>
                      <option value="Free State">Free State</option>
                      <option value="Northern Cape">Northern Cape</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Postal Code</label>
                    <input
                      type="text"
                      value={settings.postalCode}
                      onChange={(e) => setSettings({ ...settings, postalCode: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      value={settings.country}
                      onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                    />
                  </div>
                </div>

                {/* Registration Details */}
                <h3>Registration Details</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Tax Number (VAT)</label>
                    <input
                      type="text"
                      value={settings.taxNumber}
                      onChange={(e) => setSettings({ ...settings, taxNumber: e.target.value })}
                      placeholder="e.g. 4123456789"
                    />
                  </div>

                  <div className="form-group">
                    <label>Registration Number</label>
                    <input
                      type="text"
                      value={settings.registrationNumber}
                      onChange={(e) => setSettings({ ...settings, registrationNumber: e.target.value })}
                      placeholder="e.g. 2021/123456/07"
                    />
                  </div>
                </div>

                {/* Regional Settings */}
                <h3>Regional Settings</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Timezone</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    >
                      <option value="Africa/Johannesburg">South Africa (CAT)</option>
                      <option value="Europe/London">London (GMT)</option>
                      <option value="America/New_York">New York (EST)</option>
                      <option value="Asia/Dubai">Dubai (GST)</option>
                      <option value="Australia/Sydney">Sydney (AEDT)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Currency</label>
                    <select
                      value={settings.currency}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    >
                      <option value="ZAR">ZAR - South African Rand</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Fiscal Year End</label>
                    <select
                      value={settings.fiscalYearEnd}
                      onChange={(e) => setSettings({ ...settings, fiscalYearEnd: e.target.value })}
                    >
                      <option value="12-31">December 31</option>
                      <option value="02-28">February 28</option>
                      <option value="03-31">March 31</option>
                      <option value="06-30">June 30</option>
                      <option value="09-30">September 30</option>
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modules Tab */}
          {activeTab === 'modules' && (
            <div className="tenant-settings-section">
              <h2>Module Configuration</h2>
              <p className="section-description">
                Enable or disable modules based on your business needs. Disabled modules won't appear in the navigation.
              </p>

              <div className="modules-grid">
                <div className="module-card">
                  <div className="module-header">
                    <span className="module-icon">💰</span>
                    <h3>Sales & CRM</h3>
                  </div>
                  <p>Manage customers, quotes, invoices, and sales orders</p>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={modules.sales}
                      onChange={() => handleModuleToggle('sales')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="module-card">
                  <div className="module-header">
                    <span className="module-icon">🛒</span>
                    <h3>Purchase</h3>
                  </div>
                  <p>Supplier management, purchase orders, and bills</p>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={modules.purchase}
                      onChange={() => handleModuleToggle('purchase')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="module-card">
                  <div className="module-header">
                    <span className="module-icon">📦</span>
                    <h3>Inventory</h3>
                  </div>
                  <p>Product management, stock tracking, and warehouses</p>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={modules.inventory}
                      onChange={() => handleModuleToggle('inventory')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="module-card">
                  <div className="module-header">
                    <span className="module-icon">💼</span>
                    <h3>Financial</h3>
                  </div>
                  <p>Chart of accounts, journal entries, and reports</p>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={modules.financial}
                      onChange={() => handleModuleToggle('financial')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="module-card">
                  <div className="module-header">
                    <span className="module-icon">👨‍💼</span>
                    <h3>HR & Payroll</h3>
                  </div>
                  <p>Employee management, payroll, attendance, and leave</p>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={modules.hr}
                      onChange={() => handleModuleToggle('hr')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="module-card">
                  <div className="module-header">
                    <span className="module-icon">🏭</span>
                    <h3>Manufacturing</h3>
                  </div>
                  <p>BOMs, work orders, and production planning</p>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={modules.manufacturing}
                      onChange={() => handleModuleToggle('manufacturing')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="module-card">
                  <div className="module-header">
                    <span className="module-icon">🏢</span>
                    <h3>Warehouse</h3>
                  </div>
                  <p>Multi-location inventory and stock transfers</p>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={modules.warehouse}
                      onChange={() => handleModuleToggle('warehouse')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="module-card">
                  <div className="module-header">
                    <span className="module-icon">🏦</span>
                    <h3>Asset Management</h3>
                  </div>
                  <p>Track fixed assets, depreciation, and maintenance</p>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={modules.assets}
                      onChange={() => handleModuleToggle('assets')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="module-card">
                  <div className="module-header">
                    <span className="module-icon">⚖️</span>
                    <h3>Practice Management</h3>
                  </div>
                  <p>For legal, accounting, and consulting firms</p>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={modules.practice}
                      onChange={() => handleModuleToggle('practice')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Team Members Tab */}
          {activeTab === 'team' && (
            <div className="tenant-settings-section">
              <h2>Team Members</h2>
              
              {/* Invite Form */}
              <div className="invite-section">
                <h3>Invite New Member</h3>
                <form onSubmit={handleInviteUser} className="invite-form">
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    >
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Invitation'}
                  </button>
                </form>
              </div>

              {/* Team List */}
              <div className="team-list">
                <h3>Current Members ({teamMembers.length})</h3>
                <div className="team-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Last Active</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map((member) => (
                        <tr key={member.id}>
                          <td>{member.name}</td>
                          <td>{member.email}</td>
                          <td>
                            <span className={`role-badge role-${member.role}`}>
                              {member.role}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge status-${member.status}`}>
                              {member.status}
                            </span>
                          </td>
                          <td>
                            {member.lastActive
                              ? new Date(member.lastActive).toLocaleDateString()
                              : 'Never'}
                          </td>
                          <td>
                            <button
                              className="btn-text-danger"
                              onClick={() => handleRemoveUser(member.id)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="tenant-settings-section">
              <h2>Integrations</h2>
              <p className="section-description">
                Connect your ERP with external services and platforms
              </p>

              <div className="integrations-grid">
                <div className="integration-card">
                  <div className="integration-header">
                    <span className="integration-icon">💳</span>
                    <div>
                      <h3>Payment Gateways</h3>
                      <span className="integration-status connected">Connected</span>
                    </div>
                  </div>
                  <p>Ozow and Stripe payment processing</p>
                  <button className="btn-secondary">Configure</button>
                </div>

                <div className="integration-card">
                  <div className="integration-header">
                    <span className="integration-icon">📧</span>
                    <div>
                      <h3>Email Service</h3>
                      <span className="integration-status connected">Connected</span>
                    </div>
                  </div>
                  <p>SMTP email delivery service</p>
                  <button className="btn-secondary">Configure</button>
                </div>

                <div className="integration-card">
                  <div className="integration-header">
                    <span className="integration-icon">☁️</span>
                    <div>
                      <h3>Cloud Storage</h3>
                      <span className="integration-status disconnected">Not Connected</span>
                    </div>
                  </div>
                  <p>AWS S3 for file storage</p>
                  <button className="btn-secondary">Connect</button>
                </div>

                <div className="integration-card">
                  <div className="integration-header">
                    <span className="integration-icon">📊</span>
                    <div>
                      <h3>Analytics</h3>
                      <span className="integration-status disconnected">Not Connected</span>
                    </div>
                  </div>
                  <p>Google Analytics integration</p>
                  <button className="btn-secondary">Connect</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantSettings;
