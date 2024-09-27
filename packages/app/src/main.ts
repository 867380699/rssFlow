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
import { StatusBar } from '@capacitor/status-bar';
import { SafeArea } from '@capacitor-community/safe-area';
import { IonicVue } from '@ionic/vue';
import { createPinia } from 'pinia';
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { createApp } from 'vue';
import VueVirtualScroller from 'vue-virtual-scroller';

import { i18n } from '@/i18n';

import App from './App.vue';
import router from './router';
import Logger from './utils/log';

try {
  StatusBar.setOverlaysWebView({ overlay: true }).then(() => {
    console.log('setOverlaysWebView');
    document.documentElement.classList.add('immersive');
  });
} catch (e) {
  console.log(e);
}

SafeArea.enable({
  config: {
    customColorsForSystemBars: true,
    statusBarColor: '#00000000',
    navigationBarColor: '#00000000',
  },
});

const observer = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    if (entry.entryType === 'paint') {
      console.info(entry.name, entry.startTime);
    } else if (entry.entryType === 'longtask') {
      console.warn(entry.entryType, 'duration:', entry.duration);
    } else {
      console.log('PerformanceObserver:', entry);
    }
  });
});

observer.observe({
  entryTypes: ['paint', 'longtask'],
});

setTimeout(() => {
  SplashScreen.hide();
}, 300);

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
              const platform = Capacitor.getPlatform();
              if (platform === 'electron') {
                electronAPI
                  .fetchImage(url)
                  .then((data) => {
                    event.ports[0].postMessage(data);
                  })
                  .catch((e) => {
                    console.log(e);
                    event.ports[0].postMessage({});
                  });
              } else {
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
        }
      );
    }

    Logger.log(`SW Registered: [active]:${r?.active}, [waiting]:${r?.waiting}`);
  },
});
