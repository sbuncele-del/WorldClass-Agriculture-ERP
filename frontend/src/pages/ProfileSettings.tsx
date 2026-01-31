import React, { useState, useEffect } from 'react';
import './ProfileSettings.css';

interface UserProfile {
  id: number;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  timezone: string;
  language: string;
}

interface EmailPreferences {
  marketingEmails: boolean;
  productUpdates: boolean;
  securityAlerts: boolean;
  paymentNotifications: boolean;
  subscriptionNotifications: boolean;
  inventoryAlerts: boolean;
  teamNotifications: boolean;
  systemNotifications: boolean;
  digestFrequency: 'instant' | 'daily' | 'weekly' | 'never';
}

interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfileSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'notifications'>('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    id: 0,
    email: '',
    name: '',
    phone: '',
    avatar: '',
    role: '',
    emailVerified: false,
    twoFactorEnabled: false,
    timezone: 'Africa/Johannesburg',
    language: 'en',
  });

  // Password change state
  const [passwordChange, setPasswordChange] = useState<PasswordChange>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Email preferences state
  const [emailPreferences, setEmailPreferences] = useState<EmailPreferences>({
    marketingEmails: true,
    productUpdates: true,
    securityAlerts: true,
    paymentNotifications: true,
    subscriptionNotifications: true,
    inventoryAlerts: true,
    teamNotifications: true,
    systemNotifications: true,
    digestFrequency: 'daily',
  });

  useEffect(() => {
    fetchProfile();
    fetchEmailPreferences();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/profile', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailPreferences = async () => {
    try {
      const response = await fetch('/api/email-preferences', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmailPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error fetching email preferences:', error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          timezone: profile.timezone,
          language: profile.language,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (passwordChange.newPassword !== passwordChange.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordChange.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          currentPassword: passwordChange.currentPassword,
          newPassword: passwordChange.newPassword,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordChange({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPreferencesUpdate = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/email-preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(emailPreferences),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Email preferences updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update preferences' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Implement avatar upload to S3 or file service
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const renderProfileTab = () => (
    <div className="settings-section">
      <h2>Profile Information</h2>
      <form onSubmit={handleProfileUpdate}>
        <div className="avatar-section">
          <div className="avatar-preview">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Profile" />
            ) : (
              <div className="avatar-placeholder">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="avatar-actions">
            <label className="btn-secondary" htmlFor="avatar-upload">
              Change Photo
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
            <button type="button" className="btn-text" onClick={() => setProfile({ ...profile, avatar: '' })}>
              Remove
            </button>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              id="name"
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="input-disabled"
            />
            <small>Email cannot be changed. Contact support if needed.</small>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              value={profile.phone || ''}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+27 XX XXX XXXX"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <input
              id="role"
              type="text"
              value={profile.role}
              disabled
              className="input-disabled"
            />
          </div>

          <div className="form-group">
            <label htmlFor="timezone">Timezone</label>
            <select
              id="timezone"
              value={profile.timezone}
              onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
            >
              <option value="Africa/Johannesburg">South Africa (GMT+2)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="America/New_York">New York (GMT-5)</option>
              <option value="Asia/Dubai">Dubai (GMT+4)</option>
              <option value="Australia/Sydney">Sydney (GMT+10)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="language">Language</label>
            <select
              id="language"
              value={profile.language}
              onChange={(e) => setProfile({ ...profile, language: e.target.value })}
            >
              <option value="en">English</option>
              <option value="af">Afrikaans</option>
              <option value="zu">Zulu</option>
              <option value="xh">Xhosa</option>
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
  );

  const renderSecurityTab = () => (
    <div className="settings-section">
      <h2>Security Settings</h2>

      {/* Email Verification Status */}
      <div className="security-item">
        <div className="security-item-info">
          <h3>Email Verification</h3>
          <p>Verify your email address to enhance account security</p>
        </div>
        <div className="security-item-action">
          {profile.emailVerified ? (
            <span className="badge-success">✓ Verified</span>
          ) : (
            <button className="btn-secondary">Verify Email</button>
          )}
        </div>
      </div>

      {/* Password Change */}
      <div className="security-item">
        <div className="security-item-info">
          <h3>Change Password</h3>
          <p>Update your password regularly to keep your account secure</p>
        </div>
      </div>

      <form onSubmit={handlePasswordChange} className="password-form">
        <div className="form-group">
          <label htmlFor="current-password">Current Password *</label>
          <input
            id="current-password"
            type="password"
            value={passwordChange.currentPassword}
            onChange={(e) => setPasswordChange({ ...passwordChange, currentPassword: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="new-password">New Password *</label>
          <input
            id="new-password"
            type="password"
            value={passwordChange.newPassword}
            onChange={(e) => setPasswordChange({ ...passwordChange, newPassword: e.target.value })}
            required
            minLength={8}
          />
          <small>Minimum 8 characters with uppercase, lowercase, number, and special character</small>
        </div>

        <div className="form-group">
          <label htmlFor="confirm-password">Confirm New Password *</label>
          <input
            id="confirm-password"
            type="password"
            value={passwordChange.confirmPassword}
            onChange={(e) => setPasswordChange({ ...passwordChange, confirmPassword: e.target.value })}
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>

      {/* Two-Factor Authentication */}
      <div className="security-item">
        <div className="security-item-info">
          <h3>Two-Factor Authentication</h3>
          <p>Add an extra layer of security to your account</p>
        </div>
        <div className="security-item-action">
          {profile.twoFactorEnabled ? (
            <>
              <span className="badge-success">Enabled</span>
              <button className="btn-secondary">Disable</button>
            </>
          ) : (
            <button className="btn-primary">Enable 2FA</button>
          )}
        </div>
      </div>

      {/* Active Sessions */}
      <div className="security-item">
        <div className="security-item-info">
          <h3>Active Sessions</h3>
          <p>Manage your active sessions across devices</p>
        </div>
        <div className="security-item-action">
          <button className="btn-secondary">View Sessions</button>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="settings-section">
      <h2>Email Notifications</h2>
      <p className="section-description">
        Choose what email notifications you want to receive. Security alerts cannot be disabled.
      </p>

      <div className="preferences-grid">
        <div className="preference-item">
          <div className="preference-info">
            <h3>Security Alerts</h3>
            <p>Login attempts, password changes, suspicious activity</p>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={emailPreferences.securityAlerts}
              disabled
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="preference-item">
          <div className="preference-info">
            <h3>Payment Notifications</h3>
            <p>Payment confirmations, receipts, and billing updates</p>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={emailPreferences.paymentNotifications}
              onChange={(e) => setEmailPreferences({ ...emailPreferences, paymentNotifications: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="preference-item">
          <div className="preference-info">
            <h3>Subscription Notifications</h3>
            <p>Subscription renewals, upgrades, and cancellations</p>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={emailPreferences.subscriptionNotifications}
              onChange={(e) => setEmailPreferences({ ...emailPreferences, subscriptionNotifications: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="preference-item">
          <div className="preference-info">
            <h3>Inventory Alerts</h3>
            <p>Low stock warnings and reorder notifications</p>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={emailPreferences.inventoryAlerts}
              onChange={(e) => setEmailPreferences({ ...emailPreferences, inventoryAlerts: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="preference-item">
          <div className="preference-info">
            <h3>Team Notifications</h3>
            <p>Team invitations, mentions, and collaborations</p>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={emailPreferences.teamNotifications}
              onChange={(e) => setEmailPreferences({ ...emailPreferences, teamNotifications: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="preference-item">
          <div className="preference-info">
            <h3>System Notifications</h3>
            <p>Account updates, maintenance, and system messages</p>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={emailPreferences.systemNotifications}
              onChange={(e) => setEmailPreferences({ ...emailPreferences, systemNotifications: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="preference-item">
          <div className="preference-info">
            <h3>Product Updates</h3>
            <p>New features, improvements, and release notes</p>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={emailPreferences.productUpdates}
              onChange={(e) => setEmailPreferences({ ...emailPreferences, productUpdates: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="preference-item">
          <div className="preference-info">
            <h3>Marketing Emails</h3>
            <p>Newsletters, promotions, and special offers</p>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={emailPreferences.marketingEmails}
              onChange={(e) => setEmailPreferences({ ...emailPreferences, marketingEmails: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="form-group digest-frequency">
        <label htmlFor="digest">Email Digest Frequency</label>
        <select
          id="digest"
          value={emailPreferences.digestFrequency}
          onChange={(e) => setEmailPreferences({ ...emailPreferences, digestFrequency: e.target.value as 'instant' | 'daily' | 'weekly' | 'never' })}
        >
          <option value="instant">Instant (as they happen)</option>
          <option value="daily">Daily Digest</option>
          <option value="weekly">Weekly Digest</option>
          <option value="never">Never (disable all)</option>
        </select>
        <small>Choose how often you want to receive non-urgent notifications</small>
      </div>

      <div className="form-actions">
        <button className="btn-primary" onClick={handleEmailPreferencesUpdate} disabled={loading}>
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="profile-settings-page">
      <div className="settings-header">
        <h1>Profile Settings</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-container">
        <nav className="settings-nav">
          <button
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="icon">👤</span>
            Profile
          </button>
          <button
            className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <span className="icon">🔒</span>
            Security
          </button>
          <button
            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <span className="icon">🔔</span>
            Notifications
          </button>
        </nav>

        <div className="settings-content">
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'security' && renderSecurityTab()}
          {activeTab === 'notifications' && renderNotificationsTab()}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
