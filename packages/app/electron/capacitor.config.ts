import { CapacitorConfig } from '@capacitor/cli';
import dotenv from 'dotenv-flow';

dotenv.config();

const config: CapacitorConfig = {
  appId: 'com.ll.rssflow',
  appName: 'RssFlow',
  webDir: 'dist',
  ios: {
    // make serviceworker avaliable
    limitsNavigationsToAppBoundDomains: true,
  },
  server: {
    androidScheme: 'http',
    hostname: 'localhost',
    cleartext: true,
    // url: process.env.VITE_PWA_HOST, // ios workaround, must setting `WKAppBoundDomains` in Info.plist
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchAutoHide: false,
    },
  },
};

export default config;
