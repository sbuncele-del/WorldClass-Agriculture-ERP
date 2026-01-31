import React from 'react';
import { Search, Bell, HelpCircle, User } from 'lucide-react';
import ClientSelector from '../multi-tenant/ClientSelector';
import CurrencySelector from '../multi-tenant/CurrencySelector';
import { useUser } from '../../contexts/UserContext';
import './Header.css';

export const Header: React.FC = () => {
  const { currentUser } = useUser();
  
  return (
    <header className="enterprise-header">
      <div className="header-left">
        <div className="logo-section">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">SiyaBusa</span>
        </div>
        
        <ClientSelector />
        
        <div className="global-search">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search across all modules..."
          />
        </div>
      </div>
      
      <div className="header-actions">
        <CurrencySelector />
        
        <button className="header-btn" title="Help">
          <HelpCircle size={20} />
        </button>
        <button className="header-btn" title="Notifications">
          <Bell size={20} />
        </button>
        <button className="header-btn user-profile-btn" title="User Profile">
          {currentUser ? (
            <>
              <div className="user-avatar-small">
                {currentUser.firstName[0]}{currentUser.lastName[0]}
              </div>
              <span className="user-name-text">{currentUser.fullName}</span>
            </>
          ) : (
            <User size={20} />
          )}
        </button>
      </div>
    </header>
  );
};
