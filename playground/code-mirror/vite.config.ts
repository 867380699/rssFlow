import { defineConfig, Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { analyzer } from 'vite-bundle-analyzer';

// https://vite.dev/config/
export default defineConfig({
  plugins: [analyzer() as Plugin<any>, vue(), ],
  server: {
    host: '0.0.0.0',
    port: 5175
  }
})
