/**
 * Trip Details Screen
 * Detailed view of a single trip with status update controls
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchTripById, updateTripStatus } from '../store/slices/tripsSlice';
import locationService from '../services/location.service';
import { Trip } from '../types';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';

export default function TripDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  
  const { tripId } = route.params as { tripId: string };
  const { currentTrip, isLoading } = useAppSelector((state) => state.trips);
  const { darkMode } = useAppSelector((state) => state.settings);

  const [updating, setUpdating] = useState(false);

  const theme = darkMode ? colors.dark : colors.light;

  useEffect(() => {
    if (tripId) {
      dispatch(fetchTripById(tripId));
    }
  }, [tripId]);

  const handleUpdateStatus = async (newStatus: Trip['status']) => {
    if (!currentTrip) return;

    Alert.alert(
      'Update Trip Status',
      `Change status to "${newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpdating(true);
            try {
              // Get current location
              const location = await locationService.getCurrentLocation();
              const locationData = location
                ? {
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                  }
                : undefined;

              await dispatch(
                updateTripStatus({
                  tripId: currentTrip.trip_id,
                  status: newStatus,
                  location: locationData,
                })
              ).unwrap();

              Alert.alert('Success', 'Trip status updated successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to update trip status. Will retry when online.');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleStartTrip = () => {
    locationService.setCurrentTrip(currentTrip?.trip_id || null);
    locationService.startTracking();
    handleUpdateStatus('In Transit');
  };

  const handleCompleteTrip = () => {
    (navigation as any).navigate('ProofOfDelivery', { tripId: currentTrip?.trip_id });
  };

  const getStatusActions = () => {
    if (!currentTrip) return [];

    switch (currentTrip.status) {
      case 'Planned':
        return [
          { label: 'Start Trip', action: handleStartTrip, color: theme.success },
        ];
      case 'In Transit':
        return [
          { label: 'Mark as Delayed', action: () => handleUpdateStatus('Delayed'), color: theme.warning },
          { label: 'Complete Delivery', action: handleCompleteTrip, color: theme.success },
        ];
      case 'Delayed':
        return [
          { label: 'Resume Trip', action: () => handleUpdateStatus('In Transit'), color: theme.success },
          { label: 'Complete Delivery', action: handleCompleteTrip, color: theme.success },
        ];
      case 'Delivered':
        return [];
      default:
        return [];
    }
  };

  if (isLoading && !currentTrip) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading trip details...
        </Text>
      </View>
    );
  }

  if (!currentTrip) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.error }]}>Trip not found</Text>
      </View>
    );
  }

  const statusActions = getStatusActions();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface }, shadows.md]}>
          <Text style={[styles.tripId, { color: theme.text }]}>{currentTrip.trip_id}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(currentTrip.status, theme) + '30' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(currentTrip.status, theme) },
              ]}
            >
              {currentTrip.status}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={[styles.section, { backgroundColor: theme.surface }, shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Customer</Text>
          <Text style={[styles.customerName, { color: theme.text }]}>
            {currentTrip.customer}
          </Text>
        </View>

        {/* Route Info */}
        <View style={[styles.section, { backgroundColor: theme.surface }, shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Route</Text>
          <View style={styles.routeContainer}>
            <View style={styles.locationItem}>
              <Text style={[styles.locationLabel, { color: theme.success }]}>📍 Origin</Text>
              <Text style={[styles.locationValue, { color: theme.text }]}>
                {currentTrip.origin}
              </Text>
            </View>
            <View style={styles.routeLine}>
              <View style={[styles.dottedLine, { borderColor: theme.border }]} />
            </View>
            <View style={styles.locationItem}>
              <Text style={[styles.locationLabel, { color: theme.error }]}>📍 Destination</Text>
              <Text style={[styles.locationValue, { color: theme.text }]}>
                {currentTrip.destination}
              </Text>
            </View>
          </View>
        </View>

        {/* Vehicle & Driver Info */}
        <View style={[styles.section, { backgroundColor: theme.surface }, shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Vehicle & Driver</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Vehicle Reg:</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {currentTrip.vehicle_reg}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Driver:</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{currentTrip.driver}</Text>
          </View>
        </View>

        {/* Timeline Info */}
        <View style={[styles.section, { backgroundColor: theme.surface }, shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Timeline</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Created:</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {new Date(currentTrip.created_at).toLocaleString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>ETA:</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {new Date(currentTrip.eta).toLocaleString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Last Updated:</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {new Date(currentTrip.updated_at).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* POD Status */}
        {currentTrip.pod_status !== 'Pending' && (
          <View style={[styles.section, { backgroundColor: theme.surface }, shadows.sm]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Proof of Delivery</Text>
            <Text style={[styles.podStatus, { color: theme.success }]}>
              Status: {currentTrip.pod_status}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {statusActions.length > 0 && (
        <View style={[styles.actionsContainer, { backgroundColor: theme.surface }, shadows.lg]}>
          {statusActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionButton, { backgroundColor: action.color }]}
              onPress={action.action}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.actionButtonText}>{action.label}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const getStatusColor = (status: Trip['status'], theme: any) => {
  switch (status) {
    case 'Planned':
      return theme.info;
    case 'In Transit':
      return theme.warning;
    case 'Delivered':
      return theme.success;
    case 'Delayed':
      return theme.error;
    case 'Cancelled':
      return theme.textSecondary;
    default:
      return theme.textSecondary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    textAlign: 'center',
    padding: spacing.xl,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripId: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  statusText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  section: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
  customerName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
  },
  routeContainer: {
    gap: spacing.md,
  },
  locationItem: {
    gap: spacing.xs,
  },
  locationLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  locationValue: {
    fontSize: typography.sizes.lg,
    paddingLeft: spacing.lg,
  },
  routeLine: {
    paddingLeft: spacing.md,
    height: 30,
  },
  dottedLine: {
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    height: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  infoValue: {
    fontSize: typography.sizes.md,
    flex: 1,
    textAlign: 'right',
  },
  podStatus: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  actionsContainer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
});
