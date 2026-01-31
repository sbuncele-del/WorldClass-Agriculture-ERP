/**
 * Trips List Screen
 * Display list of trips with filters and status
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchTrips, setCurrentTrip } from '../store/slices/tripsSlice';
import { Trip } from '../types';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';

export default function TripsListScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { items: trips, isLoading } = useAppSelector((state) => state.trips);
  const { user } = useAppSelector((state) => state.auth);
  const { darkMode } = useAppSelector((state) => state.settings);

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const theme = darkMode ? colors.dark : colors.light;

  useEffect(() => {
    loadTrips();
  }, [filter]);

  const loadTrips = async () => {
    const filters: any = {};
    
    if (user?.name) {
      filters.driver = user.name;
    }

    if (filter === 'active') {
      filters.status = 'In Transit';
    } else if (filter === 'completed') {
      filters.status = 'Delivered';
    }

    await dispatch(fetchTrips(filters));
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  }, [filter]);

  const handleTripPress = (trip: Trip) => {
    dispatch(setCurrentTrip(trip));
    (navigation as any).navigate('TripDetails', { tripId: trip.trip_id });
  };

  const getStatusColor = (status: Trip['status']) => {
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

  const renderTripItem = ({ item }: { item: Trip }) => (
    <TouchableOpacity
      style={[styles.tripCard, { backgroundColor: theme.surface }, shadows.md]}
      onPress={() => handleTripPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.tripHeader}>
        <View style={styles.tripIdContainer}>
          <Text style={[styles.tripId, { color: theme.text }]}>{item.trip_id}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + '20' },
            ]}
          >
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tripDetails}>
        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Customer:</Text>
          <Text style={[styles.value, { color: theme.text }]} numberOfLines={1}>
            {item.customer}
          </Text>
        </View>

        <View style={styles.locationContainer}>
          <View style={styles.locationRow}>
            <Text style={[styles.locationIcon, { color: theme.success }]}>📍</Text>
            <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1}>
              {item.origin}
            </Text>
          </View>
          <View style={styles.arrowContainer}>
            <Text style={[styles.arrow, { color: theme.textSecondary }]}>↓</Text>
          </View>
          <View style={styles.locationRow}>
            <Text style={[styles.locationIcon, { color: theme.error }]}>📍</Text>
            <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1}>
              {item.destination}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Vehicle:</Text>
          <Text style={[styles.value, { color: theme.text }]}>{item.vehicle_reg}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>ETA:</Text>
          <Text style={[styles.value, { color: theme.text }]}>
            {new Date(item.eta).toLocaleString()}
          </Text>
        </View>

        {item.pod_status !== 'Pending' && (
          <View
            style={[
              styles.podBadge,
              {
                backgroundColor:
                  item.pod_status === 'Captured' ? theme.success + '20' : theme.info + '20',
              },
            ]}
          >
            <Text
              style={[
                styles.podText,
                {
                  color: item.pod_status === 'Captured' ? theme.success : theme.info,
                },
              ]}
            >
              POD: {item.pod_status}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        {filter === 'all' ? 'No trips assigned' : `No ${filter} trips`}
      </Text>
      <TouchableOpacity
        style={[styles.refreshButton, { backgroundColor: theme.primary }]}
        onPress={onRefresh}
      >
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Filter tabs */}
      <View style={[styles.filterContainer, { backgroundColor: theme.surface }]}>
        {['all', 'active', 'completed'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterButton,
              filter === f && {
                backgroundColor: theme.primary,
                ...shadows.sm,
              },
            ]}
            onPress={() => setFilter(f as any)}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: filter === f ? '#ffffff' : theme.text,
                },
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Trips list */}
      {isLoading && trips.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading trips...
          </Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderTripItem}
          keyExtractor={(item) => item.trip_id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  filterText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  listContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  tripCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  tripHeader: {
    marginBottom: spacing.md,
  },
  tripIdContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripId: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  tripDetails: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  value: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.regular,
    flex: 1,
    textAlign: 'right',
  },
  locationContainer: {
    marginVertical: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  locationIcon: {
    fontSize: typography.sizes.lg,
  },
  locationText: {
    fontSize: typography.sizes.md,
    flex: 1,
  },
  arrowContainer: {
    paddingLeft: spacing.sm,
    paddingVertical: spacing.xs,
  },
  arrow: {
    fontSize: typography.sizes.lg,
  },
  podBadge: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  podText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  refreshButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
