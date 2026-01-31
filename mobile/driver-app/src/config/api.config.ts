/**
 * API Configuration
 * Configuration for backend API endpoints
 */

// Default to local development, should be overridden in production
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
export const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000';

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REFRESH: '/api/v1/auth/refresh',
    LOGOUT: '/api/v1/auth/logout',
    ME: '/api/v1/auth/me',
  },
  
  // Logistics endpoints
  LOGISTICS: {
    TRIPS: '/api/v1/logistics/trips',
    TRIP_BY_ID: (id: string) => `/api/v1/logistics/trips/${id}`,
    UPDATE_TRIP_STATUS: (id: string) => `/api/v1/logistics/trips/${id}`,
    GPS_LOCATION: '/api/v1/logistics/gps/cartrack',
  },
  
  // File upload
  UPLOAD: {
    PHOTO: '/api/v1/uploads/photo',
    SIGNATURE: '/api/v1/uploads/signature',
  },
};

// WebSocket configuration
export const WS_CONFIG = {
  PATH: '/logistics-ws',
  RECONNECTION_ATTEMPTS: 5,
  RECONNECTION_DELAY: 2000,
};

// App configuration
export const APP_CONFIG = {
  GPS_UPDATE_INTERVAL: 30000, // 30 seconds
  OFFLINE_SYNC_INTERVAL: 60000, // 1 minute
  SESSION_TIMEOUT: 3600000, // 1 hour
  MAX_PHOTO_SIZE: 5 * 1024 * 1024, // 5MB
};
