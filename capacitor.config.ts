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
    cleartext: true,
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
