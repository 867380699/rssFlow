import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [
        (componentName) => {
          // where `componentName` is always CapitalCase
          if (componentName.startsWith('Ion')) {
            return { name: componentName, from: '@ionic/vue' };
          }
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '^/rss': {
        target: 'http://localhost',
      },
    },
  },
});
