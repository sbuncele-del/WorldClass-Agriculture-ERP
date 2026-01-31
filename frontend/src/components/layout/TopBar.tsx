import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TopBar.css';
import ThemeSwitcher from './ThemeSwitcher';
import NotificationDropdown from './NotificationDropdown';
import MessagesDropdown from './MessagesDropdown';
import SettingsDropdown from './SettingsDropdown';
import ProfileDropdown from './ProfileDropdown';
import { useUser } from '../../contexts/UserContext';

const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showThemes, setShowThemes] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { currentUser } = useUser();

  const userInitials = useMemo(() => {
    if (!currentUser) return '??';
    const first = currentUser.firstName?.[0] || '';
    const last = currentUser.lastName?.[0] || '';
    return `${first}${last}` || (currentUser.fullName?.slice(0, 2) ?? '??');
  }, [currentUser]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      // TODO: Implement global search
    }
  };

  const closeAllDropdowns = () => {
    setShowThemes(false);
    setShowNotifications(false);
    setShowMessages(false);
    setShowSettings(false);
    setShowProfile(false);
  };

  const toggleDropdown = (dropdown: string) => {
    closeAllDropdowns();
    switch (dropdown) {
      case 'themes':
        setShowThemes(true);
        break;
      case 'notifications':
        setShowNotifications(true);
        break;
      case 'messages':
        setShowMessages(true);
        break;
      case 'settings':
        setShowSettings(true);
        break;
      case 'profile':
        setShowProfile(true);
        break;
    }
  };

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo" onClick={() => navigate('/')}>
            <span className="logo-icon">⚡</span>
            <span className="logo-text">SiyaBusa</span>
          </div>

          <form className="topbar-search" onSubmit={handleSearch}>
            <svg className="search-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Search projects, clients, transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </form>
        </div>

        <div className="topbar-right">
          <button 
            className={`topbar-icon-btn ${showNotifications ? 'active' : ''}`}
            onClick={() => toggleDropdown('notifications')}
            title="Notifications"
          >
            <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span className="badge">3</span>
          </button>

          <button 
            className={`topbar-icon-btn ${showMessages ? 'active' : ''}`}
            onClick={() => toggleDropdown('messages')}
            title="Messages & Tasks"
          >
            <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span className="badge">5</span>
          </button>

          <button 
            className={`topbar-icon-btn ${showThemes ? 'active' : ''}`}
            onClick={() => toggleDropdown('themes')}
            title="Theme Switcher"
          >
            <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          </button>

          <button 
            className={`topbar-icon-btn ${showSettings ? 'active' : ''}`}
            onClick={() => toggleDropdown('settings')}
            title="Settings"
          >
            <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6m8.66-15.66l-4.24 4.24m-8.48 8.48l-4.24 4.24M23 12h-6m-6 0H1m15.66 8.66l-4.24-4.24m-8.48-8.48l-4.24-4.24"></path>
            </svg>
          </button>

          <button 
            className={`topbar-profile-btn ${showProfile ? 'active' : ''}`}
            onClick={() => toggleDropdown('profile')}
          >
            <div className="profile-avatar">{userInitials}</div>
            <span className="profile-name">{currentUser?.fullName || 'User'}</span>
            <span className="profile-arrow">▼</span>
          </button>
        </div>
      </header>

      {/* Dropdowns */}
      {showThemes && <ThemeSwitcher onClose={closeAllDropdowns} />}
      {showNotifications && <NotificationDropdown onClose={closeAllDropdowns} />}
      {showMessages && <MessagesDropdown onClose={closeAllDropdowns} />}
      {showSettings && <SettingsDropdown onClose={closeAllDropdowns} />}
      {showProfile && <ProfileDropdown onClose={closeAllDropdowns} />}

      {/* Overlay */}
      {(showThemes || showNotifications || showMessages || showSettings || showProfile) && (
        <div className="topbar-overlay" onClick={closeAllDropdowns}></div>
      )}
    </>
  );
};

export default TopBar;
