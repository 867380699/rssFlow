import { HttpResponse } from '@capacitor-community/http';
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute, Route } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';

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

const SW_VERSION = '1.0.2';

let main: MessagePort;
let platform = 'web';

self.addEventListener('message', (event) => {
  if (event.data.type === 'INIT') {
    main = event.ports[0];
    platform = event.data.platform;
    event.ports[0].postMessage(SW_VERSION);
  }
});

const nativeRequest = (url: string): Promise<HttpResponse> => {
  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data);
    };
    main.postMessage({ type: 'HTTP', url }, [messageChannel.port2]);
  });
};

const b64toBlob = (b64Data: string, contentType = '', sliceSize = 512) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};

const cacheName = 'images';

const imageRoute = new Route(
  ({ request }) => {
    const url = new URL(request.url);
    return (
      (url.hostname !== 'localhost' || /^\/(rss|img)/.test(url.pathname)) &&
      request.destination === 'image'
    );
  },
  new CacheFirst({
    cacheName,
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 1,
      }),
      {
        cachedResponseWillBeUsed: async (params) => {
          if (!params.cachedResponse && main && platform !== 'web') {
            const nativeResp = await nativeRequest(params.request.url);
            const blob = b64toBlob(
              nativeResp.data,
              nativeResp.headers['Content-Type']
            );

            const resp = new Response(blob, {
              status: nativeResp.status,
              headers: nativeResp.headers,
            });
            const cache = await caches.open(cacheName);
            await cache.put(params.request, resp);
            const cacheResp = await cache.match(params.request.url);
            return cacheResp;
          }
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
          return proxyRequest;
        },
      },
    ],
  })
);

registerRoute(imageRoute);
