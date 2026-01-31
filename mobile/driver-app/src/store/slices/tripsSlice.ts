/**
 * Trips Slice
 * Redux state management for trips
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '../../services/api.service';
import databaseService from '../../services/database.service';
import { Trip } from '../../types';

interface TripsState {
  items: Trip[];
  currentTrip: Trip | null;
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
}

const initialState: TripsState = {
  items: [],
  currentTrip: null,
  isLoading: false,
  error: null,
  lastSync: null,
};

// Async thunks
export const fetchTrips = createAsyncThunk(
  'trips/fetchTrips',
  async (filters: { status?: string; driver?: string } | undefined, { rejectWithValue }) => {
    try {
      // Try to fetch from server
      const response = await apiService.getTrips(filters);
      
      // Save to local database
      for (const trip of response.trips) {
        await databaseService.saveTrip(trip);
      }

      return response.trips;
    } catch (error: any) {
      // If server fails, load from local database
      try {
        const localTrips = await databaseService.getTrips(filters);
        return localTrips;
      } catch (dbError) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch trips');
      }
    }
  }
);

export const fetchTripById = createAsyncThunk(
  'trips/fetchTripById',
  async (tripId: string, { rejectWithValue }) => {
    try {
      const trip = await apiService.getTripById(tripId);
      await databaseService.saveTrip(trip);
      return trip;
    } catch (error: any) {
      // Try local database
      try {
        const localTrip = await databaseService.getTripById(tripId);
        if (localTrip) return localTrip;
        throw new Error('Trip not found');
      } catch (dbError) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch trip');
      }
    }
  }
);

export const updateTripStatus = createAsyncThunk(
  'trips/updateTripStatus',
  async (
    {
      tripId,
      status,
      location,
    }: {
      tripId: string;
      status: string;
      location?: { lat: number; lng: number };
    },
    { rejectWithValue }
  ) => {
    try {
      const trip = await apiService.updateTripStatus(tripId, status, location);
      await databaseService.saveTrip(trip);
      return trip;
    } catch (error: any) {
      // Queue for offline sync
      await databaseService.addToOfflineQueue({
        type: 'trip_update',
        data: { tripId, status, location },
        timestamp: new Date(),
        retryCount: 0,
        status: 'pending',
      });

      return rejectWithValue(error.response?.data?.message || 'Failed to update trip status');
    }
  }
);

const tripsSlice = createSlice({
  name: 'trips',
  initialState,
  reducers: {
    setCurrentTrip: (state, action: PayloadAction<Trip | null>) => {
      state.currentTrip = action.payload;
    },
    updateTrip: (state, action: PayloadAction<Trip>) => {
      const index = state.items.findIndex((trip) => trip.trip_id === action.payload.trip_id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      if (state.currentTrip?.trip_id === action.payload.trip_id) {
        state.currentTrip = action.payload;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch trips
    builder.addCase(fetchTrips.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchTrips.fulfilled, (state, action) => {
      state.isLoading = false;
      state.items = action.payload;
      state.lastSync = new Date();
    });
    builder.addCase(fetchTrips.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch trip by ID
    builder.addCase(fetchTripById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchTripById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentTrip = action.payload;
      
      // Update in items list if exists
      const index = state.items.findIndex((trip) => trip.trip_id === action.payload.trip_id);
      if (index !== -1) {
        state.items[index] = action.payload;
      } else {
        state.items.push(action.payload);
      }
    });
    builder.addCase(fetchTripById.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update trip status
    builder.addCase(updateTripStatus.pending, (state) => {
      state.error = null;
    });
    builder.addCase(updateTripStatus.fulfilled, (state, action) => {
      const index = state.items.findIndex((trip) => trip.trip_id === action.payload.trip_id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      if (state.currentTrip?.trip_id === action.payload.trip_id) {
        state.currentTrip = action.payload;
      }
    });
    builder.addCase(updateTripStatus.rejected, (state, action) => {
      state.error = action.payload as string;
    });
  },
});

export const { setCurrentTrip, updateTrip, clearError } = tripsSlice.actions;
export default tripsSlice.reducer;
