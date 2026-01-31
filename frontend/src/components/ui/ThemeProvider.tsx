/**
 * Theme Provider with Dark Mode Support
 * Persists theme preference and provides toggle functionality
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ConfigProvider, theme as antdTheme, Switch, Button, Tooltip } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom tokens for light theme
const lightTokens = {
  colorPrimary: '#1890ff',
  colorBgContainer: '#ffffff',
  colorBgLayout: '#f5f5f5',
  colorText: '#262626',
  colorTextSecondary: '#8c8c8c',
  borderRadius: 6,
};

// Custom tokens for dark theme
const darkTokens = {
  colorPrimary: '#177ddc',
  colorBgContainer: '#1f1f1f',
  colorBgLayout: '#141414',
  colorText: '#ffffff',
  colorTextSecondary: '#a6a6a6',
  borderRadius: 6,
};

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

export function ThemeProvider({ children, defaultMode = 'light' }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    // Check localStorage first
    const stored = localStorage.getItem('theme-mode');
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored as ThemeMode;
    }
    return defaultMode;
  });

  // Determine if dark mode should be active
  const isDark = React.useMemo(() => {
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return mode === 'dark';
  }, [mode]);

  // Listen for system theme changes
  useEffect(() => {
    if (mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setModeState('system'); // Trigger re-render

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [mode]);

  // Update localStorage and body class
  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
    document.body.classList.toggle('dark-mode', isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [mode, isDark]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const toggle = () => {
    setModeState((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'light';
      // If system, toggle to opposite of current
      return isDark ? 'light' : 'dark';
    });
  };

  const contextValue: ThemeContextType = {
    mode,
    isDark,
    setMode,
    toggle,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider
        theme={{
          algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: isDark ? darkTokens : lightTokens,
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme Toggle Button Component
interface ThemeToggleProps {
  showLabel?: boolean;
  size?: 'small' | 'middle' | 'large';
}

export function ThemeToggle({ showLabel = false, size = 'middle' }: ThemeToggleProps) {
  const { isDark, toggle } = useTheme();

  return (
    <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
      <Button
        type="text"
        icon={isDark ? <SunOutlined /> : <MoonOutlined />}
        onClick={toggle}
        size={size}
        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
      >
        {showLabel && (isDark ? 'Light Mode' : 'Dark Mode')}
      </Button>
    </Tooltip>
  );
}

// Theme Switch Component (for settings)
export function ThemeSwitch() {
  const { isDark, toggle } = useTheme();

  return (
    <Switch
      checked={isDark}
      onChange={toggle}
      checkedChildren={<MoonOutlined />}
      unCheckedChildren={<SunOutlined />}
    />
  );
}

// Theme Mode Selector (for full control)
interface ThemeModeSelectorProps {
  buttonStyle?: 'outline' | 'solid';
}

export function ThemeModeSelector({ buttonStyle = 'solid' }: ThemeModeSelectorProps) {
  const { mode, setMode } = useTheme();

  const options = [
    { value: 'light', label: 'Light', icon: <SunOutlined /> },
    { value: 'dark', label: 'Dark', icon: <MoonOutlined /> },
    { value: 'system', label: 'System', icon: '💻' },
  ];

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map((option) => (
        <Button
          key={option.value}
          type={mode === option.value ? 'primary' : 'default'}
          icon={option.icon}
          onClick={() => setMode(option.value as ThemeMode)}
          style={buttonStyle === 'outline' ? { borderStyle: 'dashed' } : {}}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export default ThemeProvider;
