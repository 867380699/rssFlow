import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ll.rssflow',
  appName: 'RssFlow',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'http',
    hostname: 'localhost',
    // url: 'https://rss-flow.vercel.app',
    cleartext: true,
  },
  includePlugins: ['@capacitor/app', '@capacitor-community/http'],
};

export default config;
