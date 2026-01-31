/**
 * Proof of Delivery Screen
 * Capture photos, signature, and notes for delivery proof
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { updateTripStatus } from '../store/slices/tripsSlice';
import locationService from '../services/location.service';
import apiService from '../services/api.service';
import databaseService from '../services/database.service';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';

export default function ProofOfDeliveryScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const { tripId } = route.params as { tripId: string };
  const { darkMode } = useAppSelector((state) => state.settings);

  const [photos, setPhotos] = useState<string[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  const theme = darkMode ? colors.dark : colors.light;

  const handleTakePhoto = async () => {
    if (!permission) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos');
        return;
      }
    }

    if (!permission.granted) {
      await requestPermission();
      return;
    }

    setShowCamera(true);
  };

  const capturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
        });
        setPhotos([...photos, photo.uri]);
        setShowCamera(false);
      } catch (error) {
        console.error('Error taking photo:', error);
        Alert.alert('Error', 'Failed to capture photo');
      }
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      const newPhotos = result.assets.map((asset) => asset.uri);
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleCaptureSignature = () => {
    (navigation as any).navigate('SignatureCapture', {
      onSave: (signatureData: string) => {
        setSignature(signatureData);
      },
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (photos.length === 0) {
      Alert.alert('Required', 'Please take at least one photo');
      return;
    }

    if (!signature) {
      Alert.alert('Required', 'Please capture recipient signature');
      return;
    }

    if (!recipientName.trim()) {
      Alert.alert('Required', 'Please enter recipient name');
      return;
    }

    Alert.alert(
      'Submit POD',
      'Submit proof of delivery and mark trip as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              // Get current location
              const location = await locationService.getCurrentLocation();
              if (!location) {
                throw new Error('Unable to get current location');
              }

              const podData = {
                tripId,
                photos,
                signature,
                location: {
                  lat: location.coords.latitude,
                  lng: location.coords.longitude,
                },
                timestamp: new Date(),
                notes: notes.trim() || undefined,
                recipientName: recipientName.trim(),
              };

              // Try to submit to server
              try {
                await apiService.submitProofOfDelivery(podData);
                
                // Update trip status
                await dispatch(
                  updateTripStatus({
                    tripId,
                    status: 'Delivered',
                    location: podData.location,
                  })
                ).unwrap();

                Alert.alert('Success', 'Proof of delivery submitted successfully', [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Stop location tracking
                      locationService.stopTracking();
                      navigation.goBack();
                    },
                  },
                ]);
              } catch (error) {
                // Save to local cache for offline sync
                await databaseService.savePODCache(podData);
                
                Alert.alert(
                  'Saved Offline',
                  'POD saved locally and will be submitted when online',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        locationService.stopTracking();
                        navigation.goBack();
                      },
                    },
                  ]
                );
              }
            } catch (error) {
              console.error('Error submitting POD:', error);
              Alert.alert('Error', 'Failed to submit proof of delivery');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView 
          ref={cameraRef} 
          style={styles.camera}
          facing="back"
        >
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={[styles.cameraButton, { backgroundColor: theme.surface }]}
              onPress={() => setShowCamera(false)}
            >
              <Text style={[styles.cameraButtonText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.captureButton, { backgroundColor: theme.primary }]}
              onPress={capturePhoto}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <View style={{ width: 80 }} />
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Photos Section */}
        <View style={[styles.section, { backgroundColor: theme.surface }, shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Photos {photos.length > 0 && `(${photos.length})`}
          </Text>
          
          <View style={styles.photosGrid}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity
                  style={[styles.removeButton, { backgroundColor: theme.error }]}
                  onPress={() => handleRemovePhoto(index)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.photoButtons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleTakePhoto}
            >
              <Text style={styles.buttonText}>📷 Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.secondary }]}
              onPress={handlePickImage}
            >
              <Text style={styles.buttonText}>🖼️ Choose from Library</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Signature Section */}
        <View style={[styles.section, { backgroundColor: theme.surface }, shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Signature</Text>
          
          {signature ? (
            <View style={styles.signatureContainer}>
              <Image
                source={{ uri: signature }}
                style={styles.signatureImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={handleCaptureSignature}
              >
                <Text style={styles.buttonText}>✏️ Retake Signature</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleCaptureSignature}
            >
              <Text style={styles.buttonText}>✏️ Capture Signature</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recipient Info */}
        <View style={[styles.section, { backgroundColor: theme.surface }, shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recipient Information</Text>
          
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="Recipient Name *"
            placeholderTextColor={theme.textSecondary}
            value={recipientName}
            onChangeText={setRecipientName}
          />
        </View>

        {/* Notes Section */}
        <View style={[styles.section, { backgroundColor: theme.surface }, shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Notes (Optional)</Text>
          
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="Add any delivery notes..."
            placeholderTextColor={theme.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={[styles.submitContainer, { backgroundColor: theme.surface }, shadows.lg]}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: theme.success },
            (isSubmitting || photos.length === 0 || !signature || !recipientName.trim()) &&
              styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={
            isSubmitting || photos.length === 0 || !signature || !recipientName.trim()
          }
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>✓ Submit POD & Complete Trip</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  section: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  photoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  photoButtons: {
    gap: spacing.sm,
  },
  button: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  signatureContainer: {
    gap: spacing.md,
  },
  signatureImage: {
    width: '100%',
    height: 150,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.lg,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    minHeight: 100,
  },
  submitContainer: {
    padding: spacing.lg,
  },
  submitButton: {
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  disabledButton: {
    opacity: 0.5,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingBottom: spacing.xxl,
  },
  cameraButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  cameraButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
});
