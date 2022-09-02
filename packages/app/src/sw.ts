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
    console.log('abc', url.pathname);

    return (
      (url.host !== 'localhost' || /^\/(rss|img)/.test(url.pathname)) &&
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
          const platform = Capacitor.getPlatform();
          Logger.log('cachedResponseWillBeUsed', params, platform);

          if (params.cachedResponse || platform === 'web') {
            return params.cachedResponse;
          } else {
            const result = await Http.get({ url: params.request.url });
            console.log(platform, result);
          }
        },
        requestWillFetch: async ({ request }) => {
          const url = new URL(request.url);
          const proxyRequest = new Request(
            `${import.meta.env.VITE_PROXY_HOST || '/img/'}${encodeURIComponent(
              url.host === 'localhost'
                ? url.pathname.replace('/img/', '')
                : url.toString()
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

const getRequestInit = async (request: Request) => ({
  method: request.method,
  headers: request.headers,
  body: ['GET', 'HEAD'].includes(request.method)
    ? undefined
    : await request.blob(),
  referrer: request.referrer,
  referrerPolicy: request.referrerPolicy,
  mode: request.mode,
  credentials: request.credentials,
  cache: request.cache,
  redirect: request.redirect,
  integrity: request.integrity,
});

const addAcceptHeaderWhenNavigate = async (req: Request) => {
  const headers = new Headers(req.headers);
  headers.set(
    'accept',
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  );
  return new Request(req.url, { ...(await getRequestInit(req)), headers });
};

const HTMLStrategy = (): Strategy => {
  class NetworkReplaceHost extends NetworkOnly {
    async _handle(request: Request, handler: StrategyHandler) {
      return super._handle(await addAcceptHeaderWhenNavigate(request), handler);
    }
  }

  return new NetworkReplaceHost();
};

registerRoute(({ request }) => request.mode === 'navigate', HTMLStrategy());
