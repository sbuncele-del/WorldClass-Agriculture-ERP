/**
 * Logistics WebSocket Gateway
 * Real-time updates for vehicle positions, trip status, and alerts
 * 
 * Socket.io rooms:
 * - 'fleet' - All fleet updates
 * - 'trip:{tripId}' - Specific trip updates
 * - 'vehicle:{vehicleId}' - Specific vehicle updates
 * - 'driver:{driverId}' - Specific driver updates
 */

import { Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

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

export class LogisticsGateway {
  private io: SocketServer;
  private connectedClients: Map<string, any> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      },
      path: '/logistics-ws'
    });

    void this.configureRedisAdapter();
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private async configureRedisAdapter() {
    try {
      // Dynamically import redis adapter to avoid crashes when redis is not available
      const { createAdapter } = await import('@socket.io/redis-adapter');
      const { buildPubSubClients } = await import('../services/redis.service');
      const { pubClient, subClient } = buildPubSubClients();
      this.io.adapter(createAdapter(pubClient as any, subClient as any));
      console.log('🔁 Socket.IO Redis adapter enabled');
    } catch (error) {
      console.warn('⚠️  Socket.IO Redis adapter not enabled (Redis not available)');
    }
  }

  /**
   * Authentication middleware for WebSocket connections
   */
  private setupMiddleware() {
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token.replace('Bearer ', ''), jwtSecret);
        
        socket.data.user = decoded;
        socket.data.userId = (decoded as any).id;
        socket.data.tenantId = (decoded as any).tenant_id;
        
        next();
      } catch (error) {
        console.error('WebSocket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup event handlers for socket connections
   */
  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id} (User: ${socket.data.userId})`);
      
      this.connectedClients.set(socket.id, {
        userId: socket.data.userId,
        tenantId: socket.data.tenantId,
        connectedAt: new Date()
      });

      // Join default fleet room
      socket.join('fleet');

      // Handle client requests to join specific rooms
      socket.on('join:trip', (tripId: string) => {
        socket.join(`trip:${tripId}`);
        console.log(`Client ${socket.id} joined trip room: ${tripId}`);
      });

      socket.on('leave:trip', (tripId: string) => {
        socket.leave(`trip:${tripId}`);
        console.log(`Client ${socket.id} left trip room: ${tripId}`);
      });

      socket.on('join:vehicle', (vehicleId: string) => {
        socket.join(`vehicle:${vehicleId}`);
        console.log(`Client ${socket.id} joined vehicle room: ${vehicleId}`);
      });

      socket.on('leave:vehicle', (vehicleId: string) => {
        socket.leave(`vehicle:${vehicleId}`);
        console.log(`Client ${socket.id} left vehicle room: ${vehicleId}`);
      });

      socket.on('join:driver', (driverId: string) => {
        socket.join(`driver:${driverId}`);
        console.log(`Client ${socket.id} joined driver room: ${driverId}`);
      });

      socket.on('leave:driver', (driverId: string) => {
        socket.leave(`driver:${driverId}`);
        console.log(`Client ${socket.id} left driver room: ${driverId}`);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`Client disconnected: ${socket.id} (Reason: ${reason})`);
        this.connectedClients.delete(socket.id);
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date() });
      });
    });
  }

  /**
   * Broadcast vehicle position update
   */
  public broadcastVehiclePosition(position: VehiclePosition) {
    // Broadcast to fleet room
    this.io.to('fleet').emit('vehicle:position', position);
    this.io.to('fleet').emit('vehicle.location.update', position);

    // Broadcast to specific vehicle room
    this.io.to(`vehicle:${position.vehicleId}`).emit('vehicle:position', position);
    this.io.to(`vehicle:${position.vehicleId}`).emit('vehicle.location.update', position);

    // If vehicle is on a trip, broadcast to trip room
    if (position.tripId) {
      this.io.to(`trip:${position.tripId}`).emit('vehicle:position', position);
      this.io.to(`trip:${position.tripId}`).emit('vehicle.location.update', position);
    }

    // If vehicle has a driver, broadcast to driver room
    if (position.driver) {
      this.io.to(`driver:${position.driver}`).emit('vehicle:position', position);
      this.io.to(`driver:${position.driver}`).emit('vehicle.location.update', position);
    }
  }

  /**
   * Broadcast trip status update
   */
  public broadcastTripUpdate(update: TripUpdate) {
    // Broadcast to fleet room
    this.io.to('fleet').emit('trip:update', update);
    this.io.to('fleet').emit('trip.status.change', update);

    // Broadcast to specific trip room
    this.io.to(`trip:${update.tripId}`).emit('trip:update', update);
    this.io.to(`trip:${update.tripId}`).emit('trip.status.change', update);
  }

  /**
   * Broadcast alert to relevant subscribers
   */
  public broadcastAlert(alert: Alert) {
    // Broadcast to fleet room
    this.io.to('fleet').emit('alert:created', alert);

    // Broadcast to specific rooms based on alert context
    if (alert.vehicleId) {
      this.io.to(`vehicle:${alert.vehicleId}`).emit('alert:created', alert);
    }

    if (alert.tripId) {
      this.io.to(`trip:${alert.tripId}`).emit('alert:created', alert);
    }

    if (alert.driverId) {
      this.io.to(`driver:${alert.driverId}`).emit('alert:created', alert);
    }
  }

  /**
   * Broadcast driver status change (check-in/out)
   */
  public broadcastDriverStatus(driverId: string, status: string, location?: { lat: number; lng: number }) {
    this.io.to('fleet').emit('driver:status', {
      driverId,
      status,
      location,
      timestamp: new Date()
    });

    this.io.to('fleet').emit('driver.status.update', {
      driverId,
      status,
      location,
      timestamp: new Date()
    });

    this.io.to(`driver:${driverId}`).emit('driver:status', {
      driverId,
      status,
      location,
      timestamp: new Date()
    });

    this.io.to(`driver:${driverId}`).emit('driver.status.update', {
      driverId,
      status,
      location,
      timestamp: new Date()
    });
  }

  /**
   * Broadcast load assignment update
   */
  public broadcastLoadAssignment(loadId: string, tripId: string, status: string) {
    this.io.to('fleet').emit('load:assigned', {
      loadId,
      tripId,
      status,
      timestamp: new Date()
    });

    this.io.to('fleet').emit('new.load.assigned', {
      loadId,
      tripId,
      status,
      timestamp: new Date()
    });

    this.io.to(`trip:${tripId}`).emit('load:assigned', {
      loadId,
      tripId,
      status,
      timestamp: new Date()
    });

    this.io.to(`trip:${tripId}`).emit('new.load.assigned', {
      loadId,
      tripId,
      status,
      timestamp: new Date()
    });
  }

  /**
   * Broadcast batch vehicle positions (for GPS provider webhooks)
   */
  public broadcastBatchPositions(positions: VehiclePosition[]) {
    positions.forEach(position => {
      this.broadcastVehiclePosition(position);
    });
  }

  /**
   * Get count of connected clients
   */
  public getConnectedClientCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get clients in a specific room
   */
  public async getClientsInRoom(room: string): Promise<number> {
    const sockets = await this.io.in(room).fetchSockets();
    return sockets.length;
  }

  /**
   * Send message to specific user
   */
  public sendToUser(userId: string, event: string, data: any) {
    this.io.sockets.sockets.forEach((socket) => {
      if (socket.data.userId === userId) {
        socket.emit(event, data);
      }
    });
  }

  /**
   * Broadcast system notification to all clients
   */
  public broadcastSystemNotification(message: string, type: 'info' | 'warning' | 'error' = 'info') {
    this.io.emit('system:notification', {
      message,
      type,
      timestamp: new Date()
    });
  }

  /**
   * Close all connections and shutdown
   */
  public shutdown() {
    console.log('Shutting down WebSocket gateway...');
    this.io.close();
  }
}

// Singleton instance
let gatewayInstance: LogisticsGateway | null = null;

export const initializeLogisticsGateway = (server: HTTPServer): LogisticsGateway => {
  if (!gatewayInstance) {
    gatewayInstance = new LogisticsGateway(server);
    console.log('Logistics WebSocket Gateway initialized');
  }
  return gatewayInstance;
};

export const getLogisticsGateway = (): LogisticsGateway => {
  if (!gatewayInstance) {
    throw new Error('Logistics Gateway not initialized. Call initializeLogisticsGateway first.');
  }
  return gatewayInstance;
};
