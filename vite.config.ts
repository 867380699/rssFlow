import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Components({ 
      resolvers: [
        (componentName) => {
          // where `componentName` is always CapitalCase
          if (componentName.startsWith('Ion')) {
            return { name: componentName, from: '@ionic/vue' }
          }
        },
      ],
     }),
  ]
})
