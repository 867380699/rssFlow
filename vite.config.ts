import vueI18n from '@intlify/vite-plugin-vue-i18n';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'vue-i18n'],
      eslintrc: {
        enabled: true,
      },
    }),
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
    vueI18n({
      include: path.resolve(__dirname, './src/locales/**'),
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
