/**
 * Signature Capture Screen
 * Canvas for capturing customer signature
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../hooks/useRedux';
import { colors, spacing, typography, borderRadius } from '../config/theme';

// For MVP, we'll use a placeholder. In production, use react-native-signature-canvas
export default function SignatureCaptureScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { onSave } = route.params as { onSave: (signature: string) => void };
  
  const { darkMode } = useAppSelector((state) => state.settings);
  const theme = darkMode ? colors.dark : colors.light;

  const [hasSignature, setHasSignature] = useState(false);

  const handleClear = () => {
    setHasSignature(false);
  };

  const handleSave = () => {
    if (!hasSignature) {
      Alert.alert('Required', 'Please provide a signature');
      return;
    }

    // TODO: Production implementation should use react-native-signature-canvas
    // Install: npm install react-native-signature-canvas
    // This will provide real signature capture with:
    // - Touch/stylus drawing
    // - Export to base64 PNG
    // - Configurable pen colors and thickness
    // - Clear/redo functionality
    // Example: https://github.com/YannicEl/react-native-signature-canvas
    
    // For MVP demo, using a mock signature
    const mockSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    onSave(mockSignature);
    navigation.goBack();
  };

  // Simulate drawing for MVP
  const handleTouch = () => {
    setHasSignature(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Capture Signature</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Ask recipient to sign below
        </Text>
      </View>

      {/* Signature Canvas Area */}
      <TouchableOpacity
        style={[styles.canvas, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={handleTouch}
        activeOpacity={0.9}
      >
        {!hasSignature ? (
          <Text style={[styles.placeholder, { color: theme.textSecondary }]}>
            Tap here to simulate signature
          </Text>
        ) : (
          <Text style={[styles.signatureText, { color: theme.text }]}>
            ___John Doe___
          </Text>
        )}
      </TouchableOpacity>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.clearButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={handleClear}
        >
          <Text style={[styles.buttonText, { color: theme.text }]}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.saveButton,
            { backgroundColor: theme.primary },
            !hasSignature && styles.disabledButton,
          ]}
          onPress={handleSave}
          disabled={!hasSignature}
        >
          <Text style={[styles.buttonText, { color: '#ffffff' }]}>Save Signature</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.note}>
        <Text style={[styles.noteText, { color: theme.textSecondary }]}>
          📝 Note: This is a simplified signature capture for MVP demo.
          Production version will use react-native-signature-canvas for real signature capture.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.md,
  },
  canvas: {
    flex: 1,
    borderWidth: 2,
    borderRadius: borderRadius.lg,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  placeholder: {
    fontSize: typography.sizes.lg,
    textAlign: 'center',
  },
  signatureText: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    fontStyle: 'italic',
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    borderWidth: 2,
  },
  saveButton: {},
  buttonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  disabledButton: {
    opacity: 0.5,
  },
  note: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  noteText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
