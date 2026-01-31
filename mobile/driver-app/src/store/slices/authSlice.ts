/**
 * Auth Slice
 * Redux state management for authentication
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import apiService from '../../services/api.service';
import websocketService from '../../services/websocket.service';
import { AuthState, User } from '../../types';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  biometricEnabled: false,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await apiService.login(email, password);
      
      // Store tokens
      await AsyncStorage.setItem('accessToken', response.accessToken);
      await AsyncStorage.setItem('refreshToken', response.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));

      // Connect to WebSocket
      await websocketService.connect();

      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const biometricLogin = createAsyncThunk(
  'auth/biometricLogin',
  async (_, { rejectWithValue }) => {
    try {
      // Check if biometric authentication is available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        throw new Error('Biometric authentication not available');
      }

      // Authenticate with biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to login',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (!result.success) {
        throw new Error('Biometric authentication failed');
      }

      // Retrieve stored credentials
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const userStr = await AsyncStorage.getItem('user');

      if (!accessToken || !refreshToken || !userStr) {
        throw new Error('No stored credentials found');
      }

      const user = JSON.parse(userStr);

      // Verify token is still valid
      const userInfo = await apiService.getMe();

      // Connect to WebSocket
      await websocketService.connect();

      return {
        user: userInfo,
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Biometric login failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await apiService.logoutUser();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear storage and disconnect
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    websocketService.disconnect();
  }
});

export const loadStoredAuth = createAsyncThunk('auth/loadStored', async (_, { rejectWithValue }) => {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    const userStr = await AsyncStorage.getItem('user');
    const biometricEnabled = await AsyncStorage.getItem('biometricEnabled');

    if (!accessToken || !refreshToken || !userStr) {
      return rejectWithValue('No stored authentication');
    }

    const user = JSON.parse(userStr);

    // Verify token is still valid
    try {
      const userInfo = await apiService.getMe();
      
      // Connect to WebSocket
      await websocketService.connect();

      return {
        user: userInfo,
        accessToken,
        refreshToken,
        biometricEnabled: biometricEnabled === 'true',
      };
    } catch (error) {
      // Token expired or invalid
      throw new Error('Stored token invalid');
    }
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to load stored auth');
  }
});

export const enableBiometric = createAsyncThunk('auth/enableBiometric', async (_, { rejectWithValue }) => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      throw new Error('Biometric authentication not available');
    }

    await AsyncStorage.setItem('biometricEnabled', 'true');
    return true;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const disableBiometric = createAsyncThunk('auth/disableBiometric', async () => {
  await AsyncStorage.setItem('biometricEnabled', 'false');
  return false;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.error = null;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Biometric login
    builder.addCase(biometricLogin.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(biometricLogin.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.error = null;
    });
    builder.addCase(biometricLogin.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      return initialState;
    });

    // Load stored auth
    builder.addCase(loadStoredAuth.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(loadStoredAuth.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.biometricEnabled = action.payload.biometricEnabled;
    });
    builder.addCase(loadStoredAuth.rejected, (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
    });

    // Enable biometric
    builder.addCase(enableBiometric.fulfilled, (state) => {
      state.biometricEnabled = true;
    });

    // Disable biometric
    builder.addCase(disableBiometric.fulfilled, (state) => {
      state.biometricEnabled = false;
    });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
