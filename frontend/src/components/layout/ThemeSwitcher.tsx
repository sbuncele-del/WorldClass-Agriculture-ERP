import React, { useState, useEffect } from 'react';
import './ThemeSwitcher.css';

interface Theme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  preview: string;
}

const themes: Theme[] = [
  {
    id: 'default',
    name: 'Default Purple',
    primary: '#667eea',
    secondary: '#764ba2',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    primary: '#0ea5e9',
    secondary: '#0284c7',
    preview: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)'
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    primary: '#10b981',
    secondary: '#059669',
    preview: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    primary: '#fb923c',
    secondary: '#f97316',
    preview: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)'
  },
  {
    id: 'corporate',
    name: 'Corporate Navy',
    primary: '#1e3a8a',
    secondary: '#1e40af',
    preview: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)'
  },
  {
    id: 'gold',
    name: 'Royal Gold',
    primary: '#f59e0b',
    secondary: '#d97706',
    preview: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  },
  {
    id: 'rose',
    name: 'Rose Pink',
    primary: '#f43f5e',
    secondary: '#e11d48',
    preview: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)'
  }
];

interface ThemeSwitcherProps {
  onClose: () => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ onClose }) => {
  const [selectedTheme, setSelectedTheme] = useState('default');

  useEffect(() => {
    const savedTheme = localStorage.getItem('aetheros-theme') || 'default';
    setSelectedTheme(savedTheme);
  }, []);

  const applyTheme = (theme: Theme) => {
    // Calculate lighter and darker shades for comprehensive theming
    const lighterBg = theme.id === 'dark' ? '#1a1f2e' : '#f8fafc';
    const cardBg = theme.id === 'dark' ? '#2d3748' : '#ffffff';
    
    // Apply comprehensive CSS variables to root
    document.documentElement.style.setProperty('--primary-color', theme.primary);
    document.documentElement.style.setProperty('--secondary-color', theme.secondary);
    document.documentElement.style.setProperty('--gradient', theme.preview);
    
    // Theme the entire app
    document.documentElement.style.setProperty('--theme-gradient', theme.preview);
    document.documentElement.style.setProperty('--theme-bg', lighterBg);
    document.documentElement.style.setProperty('--theme-card-bg', cardBg);
    document.documentElement.style.setProperty('--theme-primary', theme.primary);
    document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
    
    // Sidebar theming
    document.documentElement.style.setProperty('--sidebar-active-bg', theme.preview);
    document.documentElement.style.setProperty('--sidebar-active-color', '#ffffff');
    
    // Button theming
    document.documentElement.style.setProperty('--button-primary', theme.primary);
    document.documentElement.style.setProperty('--button-primary-hover', theme.secondary);
    document.documentElement.style.setProperty('--button-gradient', theme.preview);
    
    // Dashboard header theming
    document.documentElement.style.setProperty('--dashboard-header-bg', theme.preview);
    
    // Chart/component theming
    document.documentElement.style.setProperty('--chart-primary', theme.primary);
    document.documentElement.style.setProperty('--chart-gradient', theme.preview);
    
    // Save to localStorage
    localStorage.setItem('aetheros-theme', theme.id);
    localStorage.setItem('aetheros-theme-colors', JSON.stringify({
      primary: theme.primary,
      secondary: theme.secondary,
      gradient: theme.preview,
      bg: lighterBg,
      cardBg: cardBg
    }));
    
    setSelectedTheme(theme.id);
    
    // Force immediate visual update by adding a class to body
    document.body.setAttribute('data-theme', theme.id);
    document.body.style.setProperty('--current-theme', theme.preview);
  };

  const handleThemeSelect = (theme: Theme) => {
    applyTheme(theme);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div className="theme-switcher-dropdown">
      <div className="dropdown-header">
        <h3>Choose Your Theme</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      
      <div className="theme-list">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className={`theme-option ${selectedTheme === theme.id ? 'selected' : ''}`}
            onClick={() => handleThemeSelect(theme)}
          >
            <div className="theme-radio">
              {selectedTheme === theme.id ? '●' : '○'}
            </div>
            <div className="theme-info">
              <div className="theme-name">{theme.name}</div>
              <div className="theme-colors">
                {theme.primary} → {theme.secondary}
              </div>
            </div>
            <div 
              className="theme-preview"
              style={{ background: theme.preview }}
            ></div>
          </div>
        ))}
      </div>

      <div className="dropdown-footer">
        <button className="apply-btn" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
};

export default ThemeSwitcher;
