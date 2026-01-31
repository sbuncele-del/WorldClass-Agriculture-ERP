/**
 * User Context - Multi-User Authentication & Authorization
 * Manages user authentication, permissions, and role-based access
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { API_BASE_URL } from '../services/api.service';
import type {
  User,
  Permission,
  UserContextState,
  ModuleType,
} from '../types/multi-tenant.types';

// Mock user for development
const MOCK_USER: User = {
  id: 'user-001',
  username: 'john.doe',
  email: 'john.doe@siyabusa.co.za',
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe',
  avatar: undefined,
  status: 'ACTIVE',
  lastLogin: '2025-11-09T07:30:00Z',
  passwordLastChanged: '2025-10-01T00:00:00Z',
  mfaEnabled: false,
  role: {
    id: 'role-001',
    name: 'system_admin',
    displayName: 'System Administrator',
    level: 'SYSTEM_ADMIN',
    description: 'Full system access across all clients and modules',
  },
  permissions: [
    { id: 'perm-001', module: 'DASHBOARD', action: 'READ', scope: 'ALL_CLIENTS' },
    { id: 'perm-002', module: 'FINANCIAL', action: 'CREATE', scope: 'ALL_CLIENTS' },
    { id: 'perm-003', module: 'FINANCIAL', action: 'READ', scope: 'ALL_CLIENTS' },
    { id: 'perm-004', module: 'FINANCIAL', action: 'UPDATE', scope: 'ALL_CLIENTS' },
    { id: 'perm-005', module: 'FINANCIAL', action: 'DELETE', scope: 'ALL_CLIENTS' },
    { id: 'perm-006', module: 'CASH_MANAGEMENT', action: 'CREATE', scope: 'ALL_CLIENTS' },
    { id: 'perm-007', module: 'CASH_MANAGEMENT', action: 'READ', scope: 'ALL_CLIENTS' },
    { id: 'perm-008', module: 'CASH_MANAGEMENT', action: 'UPDATE', scope: 'ALL_CLIENTS' },
    { id: 'perm-009', module: 'SALES_CRM', action: 'CREATE', scope: 'ALL_CLIENTS' },
    { id: 'perm-010', module: 'SALES_CRM', action: 'READ', scope: 'ALL_CLIENTS' },
    { id: 'perm-011', module: 'SALES_CRM', action: 'APPROVE', scope: 'ALL_CLIENTS' },
    { id: 'perm-012', module: 'INVENTORY', action: 'READ', scope: 'ALL_CLIENTS' },
    { id: 'perm-013', module: 'INVENTORY', action: 'UPDATE', scope: 'ALL_CLIENTS' },
    { id: 'perm-014', module: 'HR_PAYROLL', action: 'READ', scope: 'ALL_CLIENTS' },
    { id: 'perm-015', module: 'REPORTS', action: 'EXPORT', scope: 'ALL_CLIENTS' },
    { id: 'perm-016', module: 'ANALYTICS', action: 'READ', scope: 'ALL_CLIENTS' },
  ],
  clientAccess: [
    {
      clientId: 'client-001',
      clientName: 'Global Enterprises Inc.',
      role: {
        id: 'role-001',
        name: 'system_admin',
        displayName: 'System Administrator',
        level: 'SYSTEM_ADMIN',
        description: 'Full access',
      },
      permissions: [],
      grantedAt: '2023-01-15T08:00:00Z',
      grantedBy: 'system',
    },
  ],
  defaultClientId: 'client-001',
  phone: '+27 11 123 4567',
  department: 'Information Technology',
  title: 'System Administrator',
  createdAt: '2023-01-15T08:00:00Z',
  updatedAt: '2025-11-09T08:00:00Z',
};

const UserContext = createContext<UserContextState | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize user session
  useEffect(() => {
    const initializeUser = async () => {
      setIsLoading(true);
      
      try {
        // Accept either key for compatibility
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        
        if (!token) {
          // NO MOCK DATA - User must authenticate
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Validate token with backend
                const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          // API returns { success: true, data: { first_name, last_name, ... } }
          const userData = result.data || result;
          
          // Map API field names to frontend User type
          const mappedUser: User = {
            id: userData.id,
            username: userData.username || userData.email,
            email: userData.email,
            firstName: userData.first_name || userData.firstName,
            lastName: userData.last_name || userData.lastName,
            fullName: userData.first_name && userData.last_name 
              ? `${userData.first_name} ${userData.last_name}` 
              : userData.fullName || userData.email,
            avatar: userData.avatar,
            status: userData.status || 'ACTIVE',
            lastLogin: userData.last_login || userData.lastLogin,
            passwordLastChanged: userData.password_last_changed || userData.passwordLastChanged,
            mfaEnabled: userData.mfa_enabled || userData.mfaEnabled || false,
            role: {
              id: userData.role_id || 'role-001',
              name: userData.role || 'admin',
              displayName: userData.role === 'admin' ? 'Administrator' : userData.role || 'User',
              level: userData.role === 'admin' ? 'SYSTEM_ADMIN' : 'STAFF',
              description: '',
            },
            tenantId: userData.tenant_id || userData.tenantId,
            tenantName: userData.tenant_name || userData.tenantName,
            companyName: userData.tenant_name || userData.tenantName || userData.companyName,
            permissions: userData.permissions || [],
          };
          
          // Store tenant info for other components
          if (userData.tenant_name || userData.tenant_id) {
            localStorage.setItem('tenant', JSON.stringify({
              id: userData.tenant_id,
              name: userData.tenant_name,
              slug: userData.tenant_slug,
              subscriptionPlan: userData.subscription_plan,
            }));
          }
          
          setCurrentUser(mappedUser);
          setIsAuthenticated(true);
        } else {
          // Token invalid - clear it and require re-login
          localStorage.removeItem('authToken');
          setIsAuthenticated(false);
          throw new Error('Authentication token is invalid');
        }
      } catch (err) {
        console.error('CRITICAL ERROR initializing user:', err);
        setError(`Authentication failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('token', data.token);
        setCurrentUser(data.user);
        setIsAuthenticated(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Login failed');
        // NO MOCK DATA - Authentication must succeed
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('CRITICAL ERROR during login:', err);
      setError(`Login failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      // NO MOCK DATA - Must authenticate with real backend
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      localStorage.removeItem('currentClientId');
      setCurrentUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>): Promise<void> => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);

    try {
            const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_BASE_URL}/api/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setCurrentUser(updatedUser);
      } else {
        // Update locally for development
        setCurrentUser({ ...currentUser, ...updates });
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
      // Update locally anyway
      setCurrentUser({ ...currentUser, ...updates });
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (module: ModuleType, action: Permission['action']): boolean => {
    if (!currentUser) return false;

    // System admins have all permissions
    if (currentUser.role.level === 'SYSTEM_ADMIN') return true;

    // Check specific permissions
    return currentUser.permissions.some(
      perm => perm.module === module && perm.action === action
    );
  };

  const value: UserContextState = {
    currentUser,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    updateUser,
    hasPermission,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextState => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
