/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';
/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';
import './theme/index.css';
/* Theme variables */
import './theme/variables.css';

import { IonicVue } from '@ionic/vue';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';

import App from './App.vue';
import messageEn from './locales/en.json';
import messageCn from './locales/zh.json';
import router from './router';

const i18n = createI18n({
  locale: 'zh',
  fallbackLocale: 'en',
  globalInjection: true,
  messages: { en: messageEn, zh: messageCn },
});

const app = createApp(App)
  .use(IonicVue)
  .use(router)
  .use(i18n)
  .use(createPinia());

router.isReady().then(() => {
  app.mount('#app');
});
