/**
 * Login Screen
 * Main authentication screen with email/password and biometric login
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { login, biometricLogin, clearError } from '../store/slices/authSlice';
import { colors, spacing, typography, borderRadius } from '../config/theme';

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const { isLoading, error, biometricEnabled } = useAppSelector((state) => state.auth);
  const { darkMode } = useAppSelector((state) => state.settings);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const theme = darkMode ? colors.dark : colors.light;

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  useEffect(() => {
    if (error) {
      // Clear error after 5 seconds
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const checkBiometricAvailability = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(hasHardware && isEnrolled);
  };

  const handleLogin = () => {
    if (!email || !password) {
      return;
    }
    dispatch(login({ email, password }));
  };

  const handleBiometricLogin = () => {
    dispatch(biometricLogin());
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        {/* Logo/Title */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Driver App</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Logistics ERP System
          </Text>
        </View>

        {/* Error message */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: theme.error + '20' }]}>
            <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          </View>
        )}

        {/* Login form */}
        <View style={styles.form}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="Email"
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!isLoading}
          />

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="Password"
            placeholderTextColor={theme.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[
              styles.loginButton,
              { backgroundColor: theme.primary },
              isLoading && styles.disabledButton,
            ]}
            onPress={handleLogin}
            disabled={isLoading || !email || !password}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Biometric login */}
          {biometricAvailable && biometricEnabled && (
            <>
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                <Text style={[styles.dividerText, { color: theme.textSecondary }]}>OR</Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              </View>

              <TouchableOpacity
                style={[
                  styles.biometricButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={handleBiometricLogin}
                disabled={isLoading}
              >
                <Text style={[styles.biometricButtonText, { color: theme.primary }]}>
                  🔐 Use Biometric Login
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            WorldClass ERP © 2024
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.regular,
  },
  errorContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.lg,
    marginBottom: spacing.md,
  },
  loginButton: {
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  disabledButton: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: typography.sizes.sm,
  },
  biometricButton: {
    height: 56,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  footerText: {
    fontSize: typography.sizes.sm,
  },
});
