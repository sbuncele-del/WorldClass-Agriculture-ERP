/**
 * API Service
 * Handles all HTTP requests to the backend
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';

class ApiService {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            await this.logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = (async () => {
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(
          `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        await AsyncStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          await AsyncStorage.setItem('refreshToken', newRefreshToken);
        }

        return accessToken;
      } finally {
        this.refreshTokenPromise = null;
      }
    })();

    return this.refreshTokenPromise;
  }

  private async logout() {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    // Emit event or navigate to login
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.client.post(API_ENDPOINTS.AUTH.LOGIN, {
      email,
      password,
    });
    return response.data;
  }

  async getMe() {
    const response = await this.client.get(API_ENDPOINTS.AUTH.ME);
    return response.data;
  }

  async logoutUser() {
    try {
      await this.client.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      await this.logout();
    }
  }

  // Trip methods
  async getTrips(filters?: {
    status?: string;
    driver?: string;
    from_date?: string;
    to_date?: string;
  }) {
    const response = await this.client.get(API_ENDPOINTS.LOGISTICS.TRIPS, {
      params: filters,
    });
    return response.data;
  }

  async getTripById(id: string) {
    const response = await this.client.get(API_ENDPOINTS.LOGISTICS.TRIP_BY_ID(id));
    return response.data;
  }

  async updateTripStatus(id: string, status: string, location?: { lat: number; lng: number }) {
    const response = await this.client.put(API_ENDPOINTS.LOGISTICS.UPDATE_TRIP_STATUS(id), {
      status,
      ...(location && { current_location: location }),
      updated_at: new Date().toISOString(),
    });
    return response.data;
  }

  // GPS location update
  async sendGPSUpdate(data: {
    vehicleId: string;
    lat: number;
    lng: number;
    speed: number;
    heading: number;
    timestamp: Date;
    tripId?: string;
  }) {
    const response = await this.client.post(API_ENDPOINTS.LOGISTICS.GPS_LOCATION, data);
    return response.data;
  }

  // Upload photo
  async uploadPhoto(uri: string, tripId: string) {
    const formData = new FormData();
    formData.append('photo', {
      uri,
      type: 'image/jpeg',
      name: `trip_${tripId}_${Date.now()}.jpg`,
    } as any);
    formData.append('tripId', tripId);

    const response = await this.client.post(API_ENDPOINTS.UPLOAD.PHOTO, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Upload signature
  async uploadSignature(signatureData: string, tripId: string) {
    const response = await this.client.post(API_ENDPOINTS.UPLOAD.SIGNATURE, {
      signature: signatureData,
      tripId,
    });
    return response.data;
  }

  // Submit proof of delivery
  async submitProofOfDelivery(podData: {
    tripId: string;
    photos: string[];
    signature: string;
    location: { lat: number; lng: number };
    timestamp: Date;
    notes?: string;
    recipientName?: string;
  }) {
    const response = await this.client.post(`${API_ENDPOINTS.LOGISTICS.TRIPS}/pod`, podData);
    return response.data;
  }
}

export default new ApiService();
