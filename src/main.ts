import { IonicVue } from '@ionic/vue';
/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';
/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './theme/index.css';
/* Theme variables */
import './theme/variables.css';

const app = createApp(App).use(IonicVue).use(router).use(createPinia());

router.isReady().then(() => {
  app.mount('#app');
});
