/**
 * Settings Slice
 * Redux state management for app settings
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings } from '../../types';

const initialState: AppSettings = {
  darkMode: false,
  gpsUpdateInterval: 30000, // 30 seconds
  offlineSyncEnabled: true,
  biometricAuthEnabled: false,
  voiceInputEnabled: false,
  language: 'en',
};

// Async thunks for persistent settings
export const setDarkModeAsync = createAsyncThunk(
  'settings/setDarkMode',
  async (value: boolean) => {
    await AsyncStorage.setItem('darkMode', value.toString());
    return value;
  }
);

export const setGPSUpdateIntervalAsync = createAsyncThunk(
  'settings/setGPSUpdateInterval',
  async (value: number) => {
    await AsyncStorage.setItem('gpsUpdateInterval', value.toString());
    return value;
  }
);

export const setOfflineSyncEnabledAsync = createAsyncThunk(
  'settings/setOfflineSyncEnabled',
  async (value: boolean) => {
    await AsyncStorage.setItem('offlineSyncEnabled', value.toString());
    return value;
  }
);

export const setBiometricAuthEnabledAsync = createAsyncThunk(
  'settings/setBiometricAuthEnabled',
  async (value: boolean) => {
    await AsyncStorage.setItem('biometricAuthEnabled', value.toString());
    return value;
  }
);

export const setVoiceInputEnabledAsync = createAsyncThunk(
  'settings/setVoiceInputEnabled',
  async (value: boolean) => {
    await AsyncStorage.setItem('voiceInputEnabled', value.toString());
    return value;
  }
);

export const setLanguageAsync = createAsyncThunk(
  'settings/setLanguage',
  async (value: string) => {
    await AsyncStorage.setItem('language', value);
    return value;
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Synchronous action for loading settings from storage
    loadSettings: (state, action: PayloadAction<Partial<AppSettings>>) => {
      return { ...state, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setDarkModeAsync.fulfilled, (state, action) => {
      state.darkMode = action.payload;
    });
    builder.addCase(setGPSUpdateIntervalAsync.fulfilled, (state, action) => {
      state.gpsUpdateInterval = action.payload;
    });
    builder.addCase(setOfflineSyncEnabledAsync.fulfilled, (state, action) => {
      state.offlineSyncEnabled = action.payload;
    });
    builder.addCase(setBiometricAuthEnabledAsync.fulfilled, (state, action) => {
      state.biometricAuthEnabled = action.payload;
    });
    builder.addCase(setVoiceInputEnabledAsync.fulfilled, (state, action) => {
      state.voiceInputEnabled = action.payload;
    });
    builder.addCase(setLanguageAsync.fulfilled, (state, action) => {
      state.language = action.payload;
    });
  },
});

export const { loadSettings } = settingsSlice.actions;

export default settingsSlice.reducer;

// Helper to load settings from storage
export const loadStoredSettings = async () => {
  const settings: Partial<AppSettings> = {};

  const darkMode = await AsyncStorage.getItem('darkMode');
  if (darkMode) settings.darkMode = darkMode === 'true';

  const gpsUpdateInterval = await AsyncStorage.getItem('gpsUpdateInterval');
  if (gpsUpdateInterval) settings.gpsUpdateInterval = parseInt(gpsUpdateInterval, 10);

  const offlineSyncEnabled = await AsyncStorage.getItem('offlineSyncEnabled');
  if (offlineSyncEnabled) settings.offlineSyncEnabled = offlineSyncEnabled === 'true';

  const biometricAuthEnabled = await AsyncStorage.getItem('biometricAuthEnabled');
  if (biometricAuthEnabled) settings.biometricAuthEnabled = biometricAuthEnabled === 'true';

  const voiceInputEnabled = await AsyncStorage.getItem('voiceInputEnabled');
  if (voiceInputEnabled) settings.voiceInputEnabled = voiceInputEnabled === 'true';

  const language = await AsyncStorage.getItem('language');
  if (language) settings.language = language;

  return settings;
};
