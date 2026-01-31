/**
 * WebSocket Service
 * Real-time communication with the logistics gateway
 */

import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WS_BASE_URL, WS_CONFIG } from '../config/api.config';
import { TripUpdate, Alert, Location } from '../types';

type EventCallback = (data: any) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  async connect() {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token available');
    }

    this.socket = io(WS_BASE_URL, {
      path: WS_CONFIG.PATH,
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: WS_CONFIG.RECONNECTION_ATTEMPTS,
      reconnectionDelay: WS_CONFIG.RECONNECTION_DELAY,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.emit('connected', { socketId: this.socket?.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.emit('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      this.emit('error', { error, attempts: this.reconnectAttempts });
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', { error });
    });

    // Trip events
    this.socket.on('trip:update', (data: TripUpdate) => {
      this.emit('trip:update', data);
    });

    this.socket.on('trip.status.change', (data: TripUpdate) => {
      this.emit('trip:update', data);
    });

    this.socket.on('new.load.assigned', (data: any) => {
      this.emit('trip:assigned', data);
    });

    // Alert events
    this.socket.on('alert:created', (data: Alert) => {
      this.emit('alert:created', data);
    });

    // Driver status events
    this.socket.on('driver.status.update', (data: any) => {
      this.emit('driver:status', data);
    });

    // Pong response for connection health check
    this.socket.on('pong', (data: any) => {
      this.emit('pong', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join specific rooms
  joinTrip(tripId: string) {
    this.socket?.emit('join:trip', tripId);
  }

  leaveTrip(tripId: string) {
    this.socket?.emit('leave:trip', tripId);
  }

  joinDriver(driverId: string) {
    this.socket?.emit('join:driver', driverId);
  }

  leaveDriver(driverId: string) {
    this.socket?.emit('leave:driver', driverId);
  }

  // Send ping for connection health
  ping() {
    this.socket?.emit('ping');
  }

  // Event listener management
  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: EventCallback) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get socket ID
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

export default new WebSocketService();
