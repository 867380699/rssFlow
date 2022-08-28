import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ll.rssflow',
  appName: 'RssFlow',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    hostname: 'rss-flow.vercel.app/',
  },
  includePlugins: ['@capacitor/app', '@capacitor-community/http'],
};

export default config;
