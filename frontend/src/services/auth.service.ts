/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import apiClient from './api';

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  country: string;
  plan?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };
    tenant: {
      id: string;
      slug: string;
      name: string;
      status: string;
      trialEndsAt: string | null;
    };
  };
}

export interface PasswordResetRequestData {
  email: string;
}

export interface PasswordResetData {
  token: string;
  newPassword: string;
  confirmPassword?: string;
}

class AuthService {
  /**
   * Sign up a new user and tenant
   */
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/signup', data);
    
    // Store tokens
    if (response.data.data?.tokens?.accessToken) {
      localStorage.setItem('token', response.data.data.tokens.accessToken);
      localStorage.setItem('authToken', response.data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      localStorage.setItem('tenant', JSON.stringify(response.data.data.tenant));
      
      // Store IDs for API service
      if (response.data.data.tenant?.id) {
        localStorage.setItem('tenantId', response.data.data.tenant.id);
        localStorage.setItem('workspaceId', response.data.data.tenant.id); // Using tenant ID as workspace ID
      }
    }
    
    return response.data;
  }

  /**
   * Login existing user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', data);
    
    // Store tokens
    if (response.data.data?.tokens?.accessToken) {
      localStorage.setItem('token', response.data.data.tokens.accessToken);
      localStorage.setItem('authToken', response.data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      localStorage.setItem('tenant', JSON.stringify(response.data.data.tenant));
      
      // Store IDs for API service
      if (response.data.data.tenant?.id) {
        localStorage.setItem('tenantId', response.data.data.tenant.id);
        localStorage.setItem('workspaceId', response.data.data.tenant.id); // Using tenant ID as workspace ID
      }
    }
    
    return response.data;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      localStorage.removeItem('workspaceId');
      localStorage.removeItem('tenantId');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<{ token: string }> {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<{ token: string }>('/api/auth/refresh', {
      refreshToken,
    });

    // Update token
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('authToken', response.data.token);
    }

    return response.data;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(data: PasswordResetRequestData): Promise<{ message: string }> {
    const response = await apiClient.post<{ message?: string; success?: boolean }>(
      '/api/v2/auth/password/reset-request',
      data
    );
    return response.data;
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: PasswordResetData): Promise<{ message: string }> {
    const response = await apiClient.post<{ message?: string; success?: boolean }>(
      '/api/v2/auth/password/reset',
      {
        token: data.token,
        password: data.newPassword,
        confirmPassword: data.confirmPassword ?? data.newPassword,
      }
    );
    return response.data as { message: string };
  }

  /**
   * Get current user from localStorage
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Get current tenant from localStorage
   */
  getCurrentTenant() {
    const tenantStr = localStorage.getItem('tenant');
    return tenantStr ? JSON.parse(tenantStr) : null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!(localStorage.getItem('token') || localStorage.getItem('authToken'));
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return localStorage.getItem('token') || localStorage.getItem('authToken');
  }
}

export default new AuthService();
