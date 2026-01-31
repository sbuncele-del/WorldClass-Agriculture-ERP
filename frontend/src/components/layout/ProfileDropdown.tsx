import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfileDropdown.css';

interface ProfileDropdownProps {
  onClose: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onClose }) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('auth-token');
      navigate('/login');
      onClose();
    }
  };

  return (
    <div className="profile-dropdown">
      <div className="profile-header">
        <div className="profile-avatar-large">SM</div>
        <div className="profile-info">
          <div className="profile-name-large">Sibusiso Mavuso</div>
          <div className="profile-role">Operations Manager</div>
        </div>
      </div>

      <div className="dropdown-divider"></div>

      <div className="profile-menu">
        <button className="profile-menu-item" onClick={() => handleNavigate('/profile')}>
          <span className="menu-icon">👤</span>
          <span className="menu-label">My Profile</span>
        </button>
        <button className="profile-menu-item" onClick={() => handleNavigate('/my-workspace')}>
          <span className="menu-icon">📊</span>
          <span className="menu-label">My Dashboard</span>
        </button>
        <button className="profile-menu-item" onClick={() => handleNavigate('/profile')}>
          <span className="menu-icon">⚙️</span>
          <span className="menu-label">Preferences</span>
        </button>
        <button className="profile-menu-item" onClick={() => alert('Help center')}>
          <span className="menu-icon">📚</span>
          <span className="menu-label">Help Center</span>
        </button>
        <button className="profile-menu-item" onClick={() => alert("What's new")}>
          <span className="menu-icon">❓</span>
          <span className="menu-label">What's New</span>
        </button>
        <button className="profile-menu-item" onClick={() => alert('Contact support')}>
          <span className="menu-icon">📞</span>
          <span className="menu-label">Support</span>
        </button>
      </div>

      <div className="dropdown-divider"></div>

      <button className="profile-menu-item logout" onClick={handleLogout}>
        <span className="menu-icon">🚪</span>
        <span className="menu-label">Logout</span>
      </button>
    </div>
  );
};

export default ProfileDropdown;
