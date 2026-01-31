/**
 * Offline Sync Service
 * Handles syncing queued data when network is available
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import databaseService from './database.service';
import apiService from './api.service';
import { APP_CONFIG } from '../config/api.config';

class OfflineSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private isOnline = false;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  async initialize() {
    // Listen to network state changes
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable === true;

      console.log('Network state changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });

      // Notify listeners
      this.listeners.forEach((listener) => listener(this.isOnline));

      // Start sync when coming online
      if (!wasOnline && this.isOnline) {
        console.log('Network connection restored, starting sync...');
        this.syncNow();
      }
    });

    // Get initial network state
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected && state.isInternetReachable === true;

    // Start periodic sync
    this.startPeriodicSync();
  }

  private startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncNow();
      }
    }, APP_CONFIG.OFFLINE_SYNC_INTERVAL);
  }

  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncNow(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    if (!this.isOnline) {
      console.log('Device is offline, skipping sync');
      return;
    }

    this.isSyncing = true;

    try {
      console.log('Starting offline sync...');

      // Sync GPS updates
      await this.syncGPSUpdates();

      // Sync offline queue items
      await this.syncOfflineQueue();

      // Sync POD cache
      await this.syncPODCache();

      console.log('Offline sync completed successfully');
    } catch (error) {
      console.error('Error during offline sync:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncGPSUpdates() {
    try {
      const updates = await databaseService.getUnsyncedGPSUpdates();

      if (updates.length === 0) {
        console.log('No GPS updates to sync');
        return;
      }

      console.log(`Syncing ${updates.length} GPS updates...`);

      const syncedIds: number[] = [];

      for (const update of updates) {
        try {
          await apiService.sendGPSUpdate({
            vehicleId: update.vehicleId,
            lat: update.lat,
            lng: update.lng,
            speed: update.speed,
            heading: update.heading,
            timestamp: update.timestamp,
            tripId: update.tripId,
          });

          syncedIds.push(update.id);
        } catch (error) {
          console.error('Failed to sync GPS update:', error);
          // Continue with next update
        }
      }

      if (syncedIds.length > 0) {
        await databaseService.markGPSUpdatesSynced(syncedIds);
        console.log(`Synced ${syncedIds.length} GPS updates`);
      }
    } catch (error) {
      console.error('Error syncing GPS updates:', error);
    }
  }

  private async syncOfflineQueue() {
    try {
      const queueItems = await databaseService.getOfflineQueue();

      if (queueItems.length === 0) {
        console.log('No offline queue items to sync');
        return;
      }

      console.log(`Syncing ${queueItems.length} offline queue items...`);

      for (const item of queueItems) {
        try {
          // Update status to syncing
          await databaseService.updateOfflineQueueItem(item.id, { status: 'syncing' });

          // Process based on type
          switch (item.type) {
            case 'trip_update':
              await apiService.updateTripStatus(
                item.data.tripId,
                item.data.status,
                item.data.location
              );
              break;

            case 'gps_update':
              await apiService.sendGPSUpdate(item.data);
              break;

            case 'pod_upload':
              await apiService.submitProofOfDelivery(item.data);
              break;

            default:
              console.warn('Unknown queue item type:', item.type);
          }

          // Delete successfully synced item
          await databaseService.deleteOfflineQueueItem(item.id);
          console.log(`Synced queue item: ${item.id}`);
        } catch (error) {
          console.error('Failed to sync queue item:', error);
          
          // Update retry count and status
          const retryCount = item.retryCount + 1;
          const status = retryCount >= 3 ? 'failed' : 'pending';

          await databaseService.updateOfflineQueueItem(item.id, {
            retryCount,
            status,
          });
        }
      }
    } catch (error) {
      console.error('Error syncing offline queue:', error);
    }
  }

  private async syncPODCache() {
    try {
      const pods = await databaseService.getUnsyncedPODs();

      if (pods.length === 0) {
        console.log('No PODs to sync');
        return;
      }

      console.log(`Syncing ${pods.length} PODs...`);

      for (const pod of pods) {
        try {
          await apiService.submitProofOfDelivery({
            tripId: pod.tripId,
            photos: pod.photos,
            signature: pod.signature,
            location: pod.location,
            timestamp: pod.timestamp,
            notes: pod.notes,
            recipientName: pod.recipientName,
          });

          await databaseService.markPODSynced(pod.id);
          console.log(`Synced POD for trip: ${pod.tripId}`);
        } catch (error) {
          console.error('Failed to sync POD:', error);
          // Continue with next POD
        }
      }
    } catch (error) {
      console.error('Error syncing POD cache:', error);
    }
  }

  // Add listener for network state changes
  addNetworkListener(callback: (isOnline: boolean) => void) {
    this.listeners.add(callback);
  }

  removeNetworkListener(callback: (isOnline: boolean) => void) {
    this.listeners.delete(callback);
  }

  // Get current network status
  getNetworkStatus(): boolean {
    return this.isOnline;
  }

  // Check if sync is in progress
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}

export default new OfflineSyncService();
