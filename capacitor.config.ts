import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meresimi.chungwah',
  appName: 'Chung Wah',
  webDir: 'dist',
  android: {
    buildOptions: {
      keystorePath: 'release-key.jks',
      keystoreAlias: 'key0',
    },
  },
  server: {
    cleartext: true,
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0A0F2C',
      showSpinner: false,
    },
    // Native Google Sign-In. serverClientId must be the "Web application"
    // type OAuth 2.0 Client ID from Google Cloud Console (the one Firebase
    // auto-creates when you enable Google as a Sign-in provider) — NOT an
    // Android-type client ID. It's the same value for both the dev and user
    // build variants (it's tied to the Firebase project, not the Android
    // package name). Set as the VITE_GOOGLE_WEB_CLIENT_ID GitHub secret;
    // CI exports it as a real env var before `npx cap sync` runs, since this
    // file is read directly by the Capacitor CLI (not by Vite), so
    // import.meta.env doesn't work here — plain process.env does.
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: process.env.VITE_GOOGLE_WEB_CLIENT_ID || '',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
