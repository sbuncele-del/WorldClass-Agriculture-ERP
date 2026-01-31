/**
 * Logistics WebSocket Hook
 * React hook for subscribing to real-time logistics updates
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface VehiclePosition {
  vehicleId: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: Date;
  ignition: boolean;
  odometer?: number;
  fuelLevel?: number;
  driver?: string;
  tripId?: string;
}

interface TripUpdate {
  tripId: string;
  status: string;
  currentLocation?: { lat: number; lng: number };
  eta?: string;
  completedStops?: number;
  totalStops?: number;
  timestamp: Date;
}

interface Alert {
  alertId: string;
  type: 'SPEEDING' | 'GEOFENCE' | 'IDLE' | 'LOW_FUEL' | 'MAINTENANCE' | 'DELAY';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  vehicleId?: string;
  tripId?: string;
  driverId?: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

interface LogisticsWebSocketOptions {
  autoConnect?: boolean;
  reconnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

interface LogisticsWebSocketHook {
  connected: boolean;
  connecting: boolean;
  error: Error | null;
  vehiclePositions: Map<string, VehiclePosition>;
  tripUpdates: Map<string, TripUpdate>;
  alerts: Alert[];
  joinTrip: (tripId: string) => void;
  leaveTrip: (tripId: string) => void;
  joinVehicle: (vehicleId: string) => void;
  leaveVehicle: (vehicleId: string) => void;
  joinDriver: (driverId: string) => void;
  leaveDriver: (driverId: string) => void;
  clearAlerts: () => void;
  connect: () => void;
  disconnect: () => void;
}

export const useLogisticsWebSocket = (
  options: LogisticsWebSocketOptions = {}
): LogisticsWebSocketHook => {
  const {
    autoConnect = true,
    reconnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000
  } = options;

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [vehiclePositions, setVehiclePositions] = useState<Map<string, VehiclePosition>>(new Map());
  const [tripUpdates, setTripUpdates] = useState<Map<string, TripUpdate>>(new Map());
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const reconnectCountRef = useRef(0);

  const getAuthToken = useCallback((): string | null => {
    // Get token from localStorage or your auth context
    return localStorage.getItem('token');
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setError(new Error('No authentication token found'));
      return;
    }

    setConnecting(true);
    setError(null);

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5000';
    
    socketRef.current = io(wsUrl, {
      path: '/logistics-ws',
      auth: {
        token: token
      },
      reconnection: reconnect,
      reconnectionAttempts: reconnectAttempts,
      reconnectionDelay: reconnectDelay,
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('Logistics WebSocket connected');
      setConnected(true);
      setConnecting(false);
      setError(null);
      reconnectCountRef.current = 0;
    });

    socket.on('disconnect', (reason) => {
      console.log('Logistics WebSocket disconnected:', reason);
      setConnected(false);
      setConnecting(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Logistics WebSocket connection error:', err);
      setError(err);
      setConnecting(false);
      reconnectCountRef.current++;

      if (reconnectCountRef.current >= reconnectAttempts) {
        console.error('Max reconnection attempts reached');
        socket.close();
      }
    });

    // Vehicle position updates
    socket.on('vehicle:position', (position: VehiclePosition) => {
      setVehiclePositions(prev => {
        const updated = new Map(prev);
        updated.set(position.vehicleId, position);
        return updated;
      });
    });

    // Trip updates
    socket.on('trip:update', (update: TripUpdate) => {
      setTripUpdates(prev => {
        const updated = new Map(prev);
        updated.set(update.tripId, update);
        return updated;
      });
    });

    // Alert events
    socket.on('alert:created', (alert: Alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 50)); // Keep last 50 alerts
    });

    // Driver status updates
    socket.on('driver:status', (data: any) => {
      console.log('Driver status update:', data);
    });

    // Load assignment updates
    socket.on('load:assigned', (data: any) => {
      console.log('Load assignment update:', data);
    });

    // System notifications
    socket.on('system:notification', (notification: any) => {
      console.log('System notification:', notification);
    });

    // Ping/pong for connection health
    socket.on('pong', (data: any) => {
      console.log('WebSocket pong received:', data);
    });

  }, [getAuthToken, reconnect, reconnectAttempts, reconnectDelay]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setConnected(false);
    }
  }, []);

  const joinTrip = useCallback((tripId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join:trip', tripId);
    }
  }, []);

  const leaveTrip = useCallback((tripId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave:trip', tripId);
    }
  }, []);

  const joinVehicle = useCallback((vehicleId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join:vehicle', vehicleId);
    }
  }, []);

  const leaveVehicle = useCallback((vehicleId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave:vehicle', vehicleId);
    }
  }, []);

  const joinDriver = useCallback((driverId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join:driver', driverId);
    }
  }, []);

  const leaveDriver = useCallback((driverId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave:driver', driverId);
    }
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Ping interval to keep connection alive
  useEffect(() => {
    if (!connected || !socketRef.current) return;

    const pingInterval = setInterval(() => {
      socketRef.current?.emit('ping');
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [connected]);

  return {
    connected,
    connecting,
    error,
    vehiclePositions,
    tripUpdates,
    alerts,
    joinTrip,
    leaveTrip,
    joinVehicle,
    leaveVehicle,
    joinDriver,
    leaveDriver,
    clearAlerts,
    connect,
    disconnect
  };
};

export default useLogisticsWebSocket;
