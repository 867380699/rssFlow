import { Capacitor } from '@capacitor/core';
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute, Route } from 'workbox-routing';
import {
  CacheFirst,
  NetworkOnly,
  Strategy,
  StrategyHandler,
} from 'workbox-strategies';

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

const SW_VERSION = '1.0.2';

const platform = Capacitor.getPlatform();

Logger.log(SW_VERSION, platform);

self.addEventListener('message', (event) => {
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage(SW_VERSION);
  }
});

const imageRoute = new Route(
  ({ request }) => {
    const url = new URL(request.url);
    return (
      (url.hostname !== 'localhost' || /^\/(rss|img)/.test(url.pathname)) &&
      request.destination === 'image'
    );
  },
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 1,
      }),
      {
        cachedResponseWillBeUsed: async (params) => {
          return params.cachedResponse;
        },
        requestWillFetch: async ({ request }) => {
          const url = new URL(request.url);
          const proxyRequest = new Request(
            `${import.meta.env.VITE_PROXY_HOST || '/img/'}${encodeURIComponent(
              url.hostname === 'localhost'
                ? url.pathname.replace('/img/', '')
                : url.toString()
            )}`,
            { mode: 'cors' }
          );

          // Logger.log('requestWillFetch', request);
          return proxyRequest;
        },
      },
    ],
  })
);

registerRoute(imageRoute);
