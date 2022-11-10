import vueI18n from '@intlify/vite-plugin-vue-i18n';
import basicSsl from '@vitejs/plugin-basic-ssl';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import analyze from 'rollup-plugin-analyzer';
import AutoImport from 'unplugin-auto-import/vite';
import { VueUseComponentsResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import proxyTable from 'vite-plugin-proxy';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  build: {
    minify: false,
    rollupOptions: {
      plugins: [
        analyze({
          summaryOnly: true,
          limit: 20,
        }),
      ],
    },
  },
  plugins: [
    // basicSsl(),
    proxyTable({
      '^/rss/.*': {
        target: 'http://localhost:2999',
      },
      '^/img/.*': {
        changeOrigin: true,
        target: 'http://localhost:2999',
      },
    }),
    vue(),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'vue-i18n',
        {
          '@vueuse/core': ['useVModel'],
        },
        {
          '@/utils/lodash': ['default', '_'],
        },
      ],
      eslintrc: {
        enabled: true,
      },
    }),
    Components({
      resolvers: [
        VueUseComponentsResolver(),
        (componentName) => {
          // where `componentName` is always CapitalCase
          if (componentName.startsWith('Ion')) {
            return { name: componentName, from: '@ionic/vue' };
          }
        },
      ],
    }),
    vueI18n({
      include: path.resolve(__dirname, './src/locales/**'),
    }),
    VitePWA({
      mode: 'development',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      },
      includeAssets: [
        'favicon.svg',
        'assets/favicon.ico',
        'robots.txt',
        'apple-touch-icon.png',
      ],
      manifest: {
        name: 'RSS Flow',
        short_name: 'RSS Flow',
        description: 'RSS Flow',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'favicon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // https: true,
  },
});
