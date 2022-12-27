/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';
/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';
import './theme/index.less';
import './theme/ionic.css';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
/* Theme variables */
import './theme/variables.css';
import 'swiper/css';

import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { IonicVue } from '@ionic/vue';
import { createPinia } from 'pinia';
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import VueVirtualScroller from 'vue-virtual-scroller';

import App from './App.vue';
import messageEn from './locales/en.json';
import messageCn from './locales/zh.json';
import router from './router';
import Logger from './utils/log';

setTimeout(() => {
  SplashScreen.hide();
}, 300);

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
  .use(createPinia())
  .use(VueVirtualScroller);

router.isReady().then(() => {
  app.mount('#app');
});

Logger.log('Platform', Capacitor.getPlatform());

const initChannel = (
  sw: ServiceWorker,
  data: any,
  onmessage: (ev: MessageEvent) => any
) => {
  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      messageChannel.port1.onmessage = onmessage;
      resolve(event.data);
    };
    sw.postMessage(data, [messageChannel.port2]);
  });
};

useRegisterSW({
  immediate: true,
  async onRegistered(r) {
    if (r && r.active) {
      await initChannel(
        r.active,
        {
          type: 'INIT',
          platform: Capacitor.getPlatform(),
        },
        (event) => {
          if (event.data.type === 'HTTP') {
            const url = event.data.url;
            if (url) {
              CapacitorHttp.get({ url, responseType: 'arraybuffer' })
                .then((data) => {
                  console.log(data);
                  if (data.status === 200) {
                    event.ports[0].postMessage(data);
                  } else {
                    event.ports[0].postMessage({});
                  }
                })
                .catch((e) => {
                  console.log(e);
                  event.ports[0].postMessage({});
                });
            }
          }
        }
      );
    }

    Logger.log(`SW Registered: [active]:${r?.active}, [waiting]:${r?.waiting}`);
  },
});
