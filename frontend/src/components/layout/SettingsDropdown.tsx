import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SettingsDropdown.css';

interface SettingsDropdownProps {
  onClose: () => void;
}

const SettingsDropdown: React.FC<SettingsDropdownProps> = ({ onClose }) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="settings-dropdown">
      <div className="dropdown-section">
        <div className="section-title">User Preferences</div>
        <button className="settings-item" onClick={() => handleNavigate('/profile')}>
          <span className="item-icon">📱</span>
          <span className="item-label">My Profile</span>
        </button>
        <button className="settings-item" onClick={() => alert('Notification settings')}>
          <span className="item-icon">🔔</span>
          <span className="item-label">Notification Settings</span>
        </button>
        <button className="settings-item" onClick={() => alert('Theme settings')}>
          <span className="item-icon">🎨</span>
          <span className="item-label">Theme & Appearance</span>
        </button>
        <button className="settings-item" onClick={() => alert('Language settings')}>
          <span className="item-icon">🌍</span>
          <span className="item-label">Language & Region</span>
        </button>
        <button className="settings-item" onClick={() => alert('Security settings')}>
          <span className="item-icon">🔐</span>
          <span className="item-label">Security & Privacy</span>
        </button>
        <button className="settings-item" onClick={() => alert('Import/Export')}>
          <span className="item-icon">📥</span>
          <span className="item-label">Import/Export Data</span>
        </button>
      </div>

      <div className="dropdown-divider"></div>

      <div className="dropdown-section">
        <div className="section-title">System Administration</div>
        <button className="settings-item" onClick={() => handleNavigate('/tenant-settings')}>
          <span className="item-icon">🏢</span>
          <span className="item-label">Company Settings</span>
        </button>
        <button className="settings-item" onClick={() => handleNavigate('/user-management')}>
          <span className="item-icon">👥</span>
          <span className="item-label">User Management</span>
        </button>
        <button className="settings-item" onClick={() => handleNavigate('/billing')}>
          <span className="item-icon">💵</span>
          <span className="item-label">Billing & Subscription</span>
        </button>
        <button className="settings-item" onClick={() => handleNavigate('/system-settings')}>
          <span className="item-icon">🔧</span>
          <span className="item-label">System Configuration</span>
        </button>
        <button className="settings-item" onClick={() => handleNavigate('/audit-logs')}>
          <span className="item-icon">📊</span>
          <span className="item-label">Audit Logs</span>
        </button>
      </div>
    </div>
  );
};

export default SettingsDropdown;
