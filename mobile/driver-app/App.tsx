/**
 * WorldClass ERP - Driver Mobile App
 * Main Application Entry Point
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import databaseService from './src/services/database.service';
import offlineSyncService from './src/services/offlineSync.service';

export default function App() {
  useEffect(() => {
    initializeServices();
  }, []);

  const initializeServices = async () => {
    try {
      // Initialize SQLite database
      await databaseService.initialize();
      console.log('Database initialized');

      // Initialize offline sync service
      await offlineSyncService.initialize();
      console.log('Offline sync service initialized');
    } catch (error) {
      console.error('Failed to initialize services:', error);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
