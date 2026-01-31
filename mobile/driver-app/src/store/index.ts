/**
 * Redux Store Configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import tripsReducer from './slices/tripsSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    trips: tripsReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['trips/updateTrip'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.timestamp', 'payload.location.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['trips.items', 'trips.currentTrip'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
