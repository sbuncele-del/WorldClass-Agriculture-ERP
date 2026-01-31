# WorldClass ERP Driver Mobile App - Deployment Guide

## Overview
This guide provides comprehensive instructions for deploying the WorldClass ERP Driver mobile application to iOS App Store and Google Play Store.

## Prerequisites

### General Requirements
- Node.js 18+ and npm installed
- Expo CLI installed (`npm install -g expo-cli`)
- EAS CLI installed (`npm install -g eas-cli`)
- EAS account (sign up at https://expo.dev)

### iOS Requirements
- macOS computer (for local iOS builds)
- Apple Developer account ($99/year)
- Xcode 14+ installed (for local builds)

### Android Requirements
- Android Studio installed (optional, for local builds)
- Google Play Console account ($25 one-time fee)

## Initial Setup

### 1. Install Dependencies
```bash
cd mobile/driver-app
npm install
```

### 2. Configure Environment Variables
Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Update the values:
```env
EXPO_PUBLIC_API_URL=https://your-production-api.com
EXPO_PUBLIC_WS_URL=wss://your-production-api.com
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn (optional)
EXPO_PUBLIC_ENV=production
```

### 3. Configure EAS
Initialize EAS in your project:

```bash
eas init
```

This will create an `eas.json` configuration file.

### 4. Update eas.json
Edit `eas.json` to configure build profiles:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## iOS Deployment

### 1. Create App Store Connect App
1. Log in to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Fill in app information:
   - Platform: iOS
   - Name: WorldClass ERP Driver
   - Primary Language: English
   - Bundle ID: com.worldclasserp.driver
   - SKU: worldclass-erp-driver

### 2. Configure App Information
- Upload app icon (1024x1024px)
- Upload screenshots (required sizes for all devices)
- Write app description
- Add keywords
- Set privacy policy URL
- Configure age rating

### 3. Build for iOS
```bash
eas build --platform ios --profile production
```

This will:
- Create a production build
- Handle code signing automatically
- Upload the build to EAS servers

### 4. Submit to App Store
```bash
eas submit --platform ios --latest
```

Or manually download the IPA and upload via Transporter app.

### 5. App Store Review
- Fill out App Store information
- Submit for review
- Review typically takes 1-3 days

## Android Deployment

### 1. Create Google Play Console App
1. Log in to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in app information:
   - App name: WorldClass ERP Driver
   - Default language: English
   - App or game: App
   - Free or paid: Free

### 2. Configure Store Listing
- Upload app icon (512x512px)
- Upload feature graphic (1024x500px)
- Upload screenshots (at least 2, recommended 8)
- Write short and full description
- Add category and tags
- Set content rating
- Set privacy policy URL

### 3. Build for Android
```bash
eas build --platform android --profile production
```

This will create an AAB (Android App Bundle) file.

### 4. Submit to Google Play
```bash
eas submit --platform android --latest
```

Or manually upload via Google Play Console.

### 5. Release Tracks
Choose your release track:
- **Internal Testing**: Small group of testers
- **Closed Testing**: Larger group of testers
- **Open Testing**: Public beta
- **Production**: Full release

## Over-the-Air (OTA) Updates with CodePush

### Setup CodePush (Alternative: Expo Updates)
For Expo projects, use Expo Updates (built-in):

```bash
eas update --branch production --message "Fix: Updated trip status sync"
```

### Configure Update Channels
Update `app.json`:

```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/[your-project-id]"
    },
    "runtimeVersion": {
      "policy": "sdkVersion"
    }
  }
}
```

### Publish Updates
```bash
# For production
eas update --branch production --message "Feature: Added voice notes"

# For staging
eas update --branch staging --message "Testing new feature"
```

## CI/CD with GitHub Actions

Create `.github/workflows/mobile-deploy.yml`:

```yaml
name: Deploy Mobile App

on:
  push:
    branches: [main]
    paths:
      - 'mobile/driver-app/**'

jobs:
  build-ios:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm install
        working-directory: mobile/driver-app
      - run: eas build --platform ios --non-interactive --no-wait
        working-directory: mobile/driver-app

  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm install
        working-directory: mobile/driver-app
      - run: eas build --platform android --non-interactive --no-wait
        working-directory: mobile/driver-app
```

## Environment Configuration

### Development
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3000
EXPO_PUBLIC_ENV=development
```

### Staging
```env
EXPO_PUBLIC_API_URL=https://staging-api.worldclasserp.com
EXPO_PUBLIC_WS_URL=wss://staging-api.worldclasserp.com
EXPO_PUBLIC_ENV=staging
```

### Production
```env
EXPO_PUBLIC_API_URL=https://api.worldclasserp.com
EXPO_PUBLIC_WS_URL=wss://api.worldclasserp.com
EXPO_PUBLIC_ENV=production
```

## Testing Before Release

### 1. Internal Testing
```bash
# Build for internal distribution
eas build --platform all --profile preview

# Share with testers
eas build:list
```

### 2. Beta Testing
- iOS: TestFlight (automatic with App Store Connect)
- Android: Internal/Closed testing tracks in Google Play Console

### 3. Production Testing Checklist
- [ ] Login with valid credentials works
- [ ] Biometric authentication works
- [ ] Trip list loads correctly
- [ ] Trip details display properly
- [ ] Status updates work (online and offline)
- [ ] Camera captures photos
- [ ] Signature capture works
- [ ] POD submission succeeds
- [ ] Background GPS tracking works
- [ ] Offline mode queues updates
- [ ] Auto-sync works when back online
- [ ] Push notifications work
- [ ] Dark mode works correctly

## Monitoring & Analytics

### Setup Sentry for Crash Reporting
```bash
npm install @sentry/react-native
```

Update `App.tsx`:
```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.EXPO_PUBLIC_ENV,
});
```

### Analytics Integration
Options:
- Mixpanel
- Amplitude
- Firebase Analytics
- Segment

## Troubleshooting

### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
eas build --platform [ios|android] --clear-cache
```

### Signing Issues (iOS)
- Ensure Apple Developer account is active
- Check Bundle ID matches Apple Developer portal
- Verify provisioning profiles are valid

### Android Build Issues
- Ensure package name matches Google Play Console
- Check keystore is valid
- Verify Google Play Console access

## Maintenance

### Regular Updates
- Update dependencies monthly: `npm update`
- Update Expo SDK: `expo upgrade`
- Monitor security advisories: `npm audit`

### App Store Guidelines Compliance
- iOS: Review [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- Android: Review [Google Play Developer Policies](https://play.google.com/about/developer-content-policy/)

## Support Resources

- Expo Documentation: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction/
- React Native: https://reactnative.dev
- GitHub Issues: [Project Repository]

## Version History

- v1.0.0 - Initial release
  - Authentication with JWT and biometric
  - Trip management
  - Proof of delivery with photo and signature
  - Offline mode with SQLite
  - Background GPS tracking
  - Real-time updates via WebSocket
