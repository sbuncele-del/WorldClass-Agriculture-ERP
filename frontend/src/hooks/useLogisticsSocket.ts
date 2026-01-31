import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../services/api.service';

interface TripStatusChange {
  tripId: string;
  status: string;
  completedAt?: string;
  eta?: string;
  completedStops?: number;
  totalStops?: number;
}

interface VehicleLocationUpdate {
  vehicleId: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  tripId?: string;
  driver?: string;
  timestamp?: string | Date;
}

interface DriverStatusUpdate {
  driverId: string;
  status: string;
  timestamp?: string | Date;
}

interface LoadAssigned {
  loadId: string;
  tripId: string;
  status: string;
  timestamp?: string | Date;
}

interface UseLogisticsSocketOptions {
  token: string;
  enabled?: boolean;
  onVehicleLocation?: (payload: VehicleLocationUpdate) => void;
  onTripStatus?: (payload: TripStatusChange) => void;
  onDriverStatus?: (payload: DriverStatusUpdate) => void;
  onLoadAssigned?: (payload: LoadAssigned) => void;
  /** fallback poll function; return cleanup function */
  fallbackPoll?: () => () => void;
}

export function useLogisticsSocket(opts: UseLogisticsSocketOptions) {
  const { token, enabled = true, onVehicleLocation, onTripStatus, onDriverStatus, onLoadAssigned, fallbackPoll } = opts;
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [error, setError] = useState<string | null>(null);

  const socket = useMemo(() => {
    if (!enabled) return null;
    return io(API_BASE_URL, {
      path: '/logistics-ws',
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }, [token, enabled]);

  useEffect(() => {
    if (!socket) return;
    socketRef.current = socket;

    const cleanupFallback = fallbackPoll ? fallbackPoll() : undefined;

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      setError(err.message);
      // fallback to polling if provided
      if (fallbackPoll && !connected) {
        console.warn('Socket failed, using fallback polling');
      }
    });

    if (onVehicleLocation) {
      socket.on('vehicle.location.update', onVehicleLocation);
      socket.on('vehicle:position', onVehicleLocation); // backward compatibility
    }

    if (onTripStatus) {
      socket.on('trip.status.change', onTripStatus);
      socket.on('trip:update', onTripStatus);
    }

    if (onDriverStatus) {
      socket.on('driver.status.update', onDriverStatus);
      socket.on('driver:status', onDriverStatus);
    }

    if (onLoadAssigned) {
      socket.on('new.load.assigned', onLoadAssigned);
      socket.on('load:assigned', onLoadAssigned);
    }

    return () => {
      socket.disconnect();
      if (cleanupFallback) cleanupFallback();
    };
  }, [socket, onVehicleLocation, onTripStatus, onDriverStatus, onLoadAssigned, fallbackPoll, connected]);

  return { socket: socketRef.current, connected, error };
}

export default useLogisticsSocket;
