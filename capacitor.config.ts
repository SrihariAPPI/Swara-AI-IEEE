import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swara.ai',
  appName: 'Swara AI',
  webDir: 'dist',
  server: {
    // This allows Firebase and Web APIs to treat the app as a secure context
    androidScheme: 'https',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'AAB',
    }
  }
};

export default config;
