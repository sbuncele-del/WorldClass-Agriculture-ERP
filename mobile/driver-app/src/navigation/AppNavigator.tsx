/**
 * App Navigator
 * Main navigation structure with authentication flow
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';

import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { loadStoredAuth } from '../store/slices/authSlice';
import { loadStoredSettings } from '../store/slices/settingsSlice';
import { loadSettings } from '../store/slices/settingsSlice';

// Screens
import LoginScreen from '../screens/LoginScreen';
import TripsListScreen from '../screens/TripsListScreen';
import TripDetailsScreen from '../screens/TripDetailsScreen';
import ProofOfDeliveryScreen from '../screens/ProofOfDeliveryScreen';
import SignatureCaptureScreen from '../screens/SignatureCaptureScreen';

import { colors } from '../config/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Trips Stack Navigator
function TripsStack() {
  const { darkMode } = useAppSelector((state) => state.settings);
  const theme = darkMode ? colors.dark : colors.light;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.surface,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="TripsList"
        component={TripsListScreen}
        options={{ title: 'My Trips' }}
      />
      <Stack.Screen
        name="TripDetails"
        component={TripDetailsScreen}
        options={{ title: 'Trip Details' }}
      />
      <Stack.Screen
        name="ProofOfDelivery"
        component={ProofOfDeliveryScreen}
        options={{ title: 'Proof of Delivery' }}
      />
      <Stack.Screen
        name="SignatureCapture"
        component={SignatureCaptureScreen}
        options={{ title: 'Capture Signature', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator (for authenticated users)
function MainTabs() {
  const { darkMode } = useAppSelector((state) => state.settings);
  const theme = darkMode ? colors.dark : colors.light;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Trips"
        component={TripsStack}
        options={{
          tabBarLabel: 'Trips',
          tabBarIcon: ({ color }) => <TabIcon icon="📋" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Simple tab icon component - using Text component for React Native
function TabIcon({ icon }: { icon: string }) {
  return (
    <Text style={{ fontSize: 24 }}>
      {icon}
    </Text>
  );
}

// Auth Stack Navigator
function AuthStack() {
  const { darkMode } = useAppSelector((state) => state.settings);
  const theme = darkMode ? colors.dark : colors.light;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

// Root Navigator
export default function AppNavigator() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const { darkMode } = useAppSelector((state) => state.settings);

  const [isInitializing, setIsInitializing] = useState(true);

  const theme = darkMode ? colors.dark : colors.light;

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Load stored settings
      const storedSettings = await loadStoredSettings();
      dispatch(loadSettings(storedSettings));

      // Try to load stored authentication
      await dispatch(loadStoredAuth()).unwrap();
    } catch (error) {
      // No stored auth or invalid, user needs to login
      console.log('No valid stored authentication');
    } finally {
      setIsInitializing(false);
    }
  };

  if (isInitializing || isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
