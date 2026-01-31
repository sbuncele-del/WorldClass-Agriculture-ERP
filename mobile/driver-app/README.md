# WorldClass ERP Driver Mobile App

Production-ready React Native mobile application for logistics drivers, built with Expo.

## 🚀 Features

### Core Features
- ✅ **JWT Authentication** - Secure login with backend integration
- ✅ **Biometric Authentication** - Touch ID / Face ID support
- ✅ **Real-time Trip Management** - WebSocket-based live updates
- ✅ **Proof of Delivery** - Photo and signature capture
- ✅ **GPS Tracking** - Background location tracking every 30 seconds
- ✅ **Offline Mode** - SQLite database with auto-sync
- ✅ **Dark Mode** - Optimized for night driving

### Technical Stack
- **Framework**: React Native with Expo
- **State Management**: Redux Toolkit
- **Database**: SQLite (expo-sqlite)
- **Real-time**: Socket.IO WebSocket
- **Navigation**: React Navigation v6
- **Location**: Expo Location with background support
- **Camera**: Expo Camera
- **Storage**: AsyncStorage + SQLite

## 📋 Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (macOS) or Android Emulator
- Expo Go app on physical device (for testing)

## 🛠️ Installation

1. **Navigate to the project directory**
```bash
cd mobile/driver-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env`:
```env
EXPO_PUBLIC_API_URL=http://localhost:3000  # or your backend URL
EXPO_PUBLIC_WS_URL=ws://localhost:3000
EXPO_PUBLIC_ENV=development
```

4. **Start the development server**
```bash
npm start
```

## 📱 Running the App

### Development

**iOS Simulator** (macOS only):
```bash
npm run ios
```

**Android Emulator**:
```bash
npm run android
```

**Expo Go** (Physical Device):
1. Install Expo Go app from App Store / Play Store
2. Scan QR code from terminal
3. App will load on your device

### Production Build

**iOS**:
```bash
eas build --platform ios --profile production
```

**Android**:
```bash
eas build --platform android --profile production
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📂 Project Structure

```
mobile/driver-app/
├── src/
│   ├── components/          # Reusable UI components
│   ├── config/              # App configuration
│   │   ├── api.config.ts    # API endpoints
│   │   └── theme.ts         # Theme colors and styles
│   ├── hooks/               # Custom React hooks
│   │   └── useRedux.ts      # Typed Redux hooks
│   ├── navigation/          # Navigation configuration
│   │   └── AppNavigator.tsx # Main navigation
│   ├── screens/             # App screens
│   │   ├── LoginScreen.tsx
│   │   ├── TripsListScreen.tsx
│   │   ├── TripDetailsScreen.tsx
│   │   ├── ProofOfDeliveryScreen.tsx
│   │   └── SignatureCaptureScreen.tsx
│   ├── services/            # Business logic services
│   │   ├── api.service.ts          # HTTP API client
│   │   ├── websocket.service.ts    # WebSocket client
│   │   ├── database.service.ts     # SQLite database
│   │   ├── location.service.ts     # GPS tracking
│   │   └── offlineSync.service.ts  # Offline sync
│   ├── store/               # Redux state management
│   │   ├── index.ts         # Store configuration
│   │   └── slices/
│   │       ├── authSlice.ts
│   │       ├── tripsSlice.ts
│   │       └── settingsSlice.ts
│   └── types/               # TypeScript type definitions
│       └── index.ts
├── assets/                  # Images, fonts, etc.
├── .env.example            # Environment variables template
├── app.json                # Expo configuration
├── App.tsx                 # App entry point
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript configuration
├── DEPLOYMENT.md           # Deployment guide
├── TESTING.md              # Testing plan
└── README.md               # This file
```

## 🔧 Configuration

### API Endpoints
Edit `src/config/api.config.ts` to configure backend endpoints:
```typescript
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
export const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000';
```

### App Settings
- **GPS Update Interval**: 30 seconds (configurable in `api.config.ts`)
- **Offline Sync Interval**: 60 seconds
- **Session Timeout**: 1 hour
- **Max Photo Size**: 5MB

### Theme
Customize colors in `src/config/theme.ts`:
```typescript
export const colors = {
  light: { /* light theme colors */ },
  dark: { /* dark theme colors */ }
};
```

## 🔐 Authentication

### Login Flow
1. User enters email and password
2. App sends credentials to `/api/v1/auth/login`
3. Backend returns JWT access token and refresh token
4. Tokens stored in AsyncStorage
5. WebSocket connection established

### Biometric Authentication
1. Enable after first successful login
2. Biometric data stored securely in device keychain
3. No credentials sent over network

### Token Refresh
- Automatic token refresh on 401 responses
- Refresh token used to obtain new access token
- Seamless user experience

## 📡 Offline Mode

### How It Works
1. **SQLite Database**: Local storage for trips and updates
2. **Offline Queue**: Failed API calls stored in queue
3. **Network Detection**: Monitors connection status
4. **Auto-Sync**: Syncs queued items when back online

### Data Synced Offline
- Trip status updates
- GPS location updates
- Proof of delivery submissions

## 🛰️ GPS Tracking

### Background Tracking
- Updates every 30 seconds
- Runs even when app is in background
- Battery-optimized with configurable intervals

### Location Data Captured
- Latitude / Longitude
- Speed
- Heading
- Accuracy
- Timestamp

## 📸 Proof of Delivery

### Features
- Multiple photo capture
- Signature canvas
- Recipient name and notes
- GPS location and timestamp
- Offline support

### Photo Capture
- Camera or photo library
- Compressed to < 5MB
- Base64 encoding for API upload

### Signature
- Touch-based drawing canvas
- Clear and retake options
- Saved as PNG image

## 🔔 Push Notifications

To enable push notifications:

1. **Setup Firebase** (for Android)
2. **Configure APNs** (for iOS)
3. **Update app.json** with Firebase config
4. **Implement notification handlers**

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup.

## 🧪 Testing

Run the test suite:
```bash
npm test
```

See [TESTING.md](./TESTING.md) for comprehensive testing guide.

## 📊 Analytics & Monitoring

### Crash Reporting
Integrate Sentry for crash reporting:
```bash
npm install @sentry/react-native
```

### Analytics Options
- Firebase Analytics
- Mixpanel
- Amplitude
- Segment

## 🔒 Security

### Best Practices Implemented
- ✅ JWT token authentication
- ✅ Secure token storage (AsyncStorage)
- ✅ HTTPS/WSS only in production
- ✅ Biometric authentication
- ✅ Encrypted local storage
- ✅ No sensitive data in logs
- ✅ Certificate pinning (optional)

### GDPR/CCPA Compliance
- Location data only when tracking active
- User can disable location tracking
- Data stored locally can be cleared
- Privacy policy provided

## 🚦 API Integration

### Backend Endpoints Used
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get user info
- `GET /api/v1/logistics/trips` - Get trips
- `GET /api/v1/logistics/trips/:id` - Get trip details
- `PUT /api/v1/logistics/trips/:id` - Update trip status
- `POST /api/v1/logistics/gps/cartrack` - Send GPS update
- `POST /api/v1/logistics/trips/pod` - Submit POD

### WebSocket Events
- `trip:update` - Trip status changed
- `new.load.assigned` - New trip assigned
- `alert:created` - Alert notification
- `driver.status.update` - Driver status change

## 📱 App Permissions

### iOS
- Camera - Photo capture
- Photo Library - Image selection
- Location (Always) - Background tracking
- Microphone - Voice notes (optional)

### Android
- Camera
- Location (Background)
- Storage
- Internet
- Record Audio (optional)

## 🐛 Troubleshooting

### Common Issues

**Build Errors**:
```bash
rm -rf node_modules
npm install
npm start --reset-cache
```

**Location Not Working**:
- Check permissions granted
- Verify location services enabled
- Test on physical device (not simulator)

**WebSocket Connection Failed**:
- Check backend URL in .env
- Ensure WebSocket endpoint is accessible
- Verify JWT token is valid

**Database Errors**:
- Clear app data
- Reinstall app
- Check SQLite initialization

## 📞 Support

For issues and questions:
- GitHub Issues: [Repository URL]
- Email: support@worldclasserp.com
- Documentation: [Docs URL]

## 📄 License

Proprietary - WorldClass ERP © 2024

## 👥 Contributors

- Development Team - WorldClass ERP

## 🗺️ Roadmap

### Version 1.1 (Planned)
- [ ] QR code scanning for packages
- [ ] Voice-to-text notes
- [ ] Route optimization
- [ ] Fuel tracking integration
- [ ] Multi-language support

### Version 1.2 (Future)
- [ ] Offline maps
- [ ] In-app messaging
- [ ] Driver analytics dashboard
- [ ] Vehicle inspection checklist
- [ ] Electronic logging device (ELD) integration
