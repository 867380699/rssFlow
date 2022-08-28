import { Capacitor } from '@capacitor/core';
import { Http } from '@capacitor-community/http';
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute, Route } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';

import Logger from './utils/log';

declare let self: ServiceWorkerGlobalScope;

// self.__WB_MANIFEST is default injection point
precacheAndRoute(self.__WB_MANIFEST);

// clean old assets
cleanupOutdatedCaches();

// to allow work offline
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

self.skipWaiting();
clientsClaim();

self.addEventListener('install', (event) => {
  console.log('Service worker installed', event);
});
self.addEventListener('activate', (event) => {
  console.log('Service worker activated', event);
});
self.addEventListener('fetch', (event) => {
  if (event.request.destination === 'image') {
    console.log('img', event.request.url);
  }
});

const SW_VERSION = '1.0.1';

const platform = Capacitor.getPlatform();

Logger.log(SW_VERSION, platform);

self.addEventListener('message', (event) => {
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage(SW_VERSION);
  }
});

const imageRoute = new Route(
  ({ request }) => {
    return request.destination === 'image';
  },
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 1,
      }),
      {
        cachedResponseWillBeUsed: async (params) => {
          Logger.log('cachedResponseWillBeUsed', params);

          if (params.cachedResponse || platform === 'web') {
            return params.cachedResponse;
          } else {
            const result = await Http.get({ url: params.request.url });
            console.log(platform, result);
          }
        },
        requestWillFetch: async ({ request }) => {
          const proxyRequest = new Request(
            `${import.meta.env.VITE_PROXY_HOST || '/img/'}${encodeURIComponent(
              request.url
            )}`,
            { mode: 'cors' }
          );

          Logger.log('requestWillFetch', request);
          return proxyRequest;
        },
      },
    ],
  })
);

registerRoute(imageRoute);
