
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meresimi.chungwah',
  appName: 'Chung Wah',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    buildOptions: {
      keystorePath: 'release-key.jks',
      keystoreAlias: 'key0',
    },
  },
  server: {
    // Use https scheme so Firebase Auth cookies/storage are treated as
    // secure-origin — required for IndexedDB persistence to work correctly
    // in the Capacitor Android WebView.
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0A0F2C',
      showSpinner: false,
    },
  },
};

export default config;
