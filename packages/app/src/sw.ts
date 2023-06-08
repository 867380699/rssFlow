import { HttpResponse } from '@capacitor/core';
import { clientsClaim, WorkboxPlugin } from 'workbox-core';
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

const nativeRequestPlugin: WorkboxPlugin = {
  cachedResponseWillBeUsed: async (params) => {
    // native request
    if (!params.cachedResponse && main && platform !== 'web') {
      const nativeResp = await nativeRequest(params.request.url);
      if (nativeResp.data) {
        const blob = b64toBlob(
          nativeResp.data,
          nativeResp.headers['Content-Type']
        );

        const resp = new Response(blob, {
          status: nativeResp.status,
          headers: nativeResp.headers,
        });
        const cache = await caches.open(params.cacheName);
        await cache.put(params.request, resp);
        const cacheResp = await cache.match(params.request.url);
        return cacheResp;
      }
    }
    return params.cachedResponse;
  },
};

const requestForwardPlugin: WorkboxPlugin = {
  requestWillFetch: async ({ request }) => {
    // web request proxy
    const url = new URL(request.url);
    const headers = new Headers(request.headers);
    const prefix = import.meta.env.VITE_PROXY_HOST || '/img/';
    const proxyRequest = new Request(
      `${prefix}${encodeURIComponent(url.toString())}`,
      { mode: 'cors', headers }
    );
    return proxyRequest;
  },
};

// localhost: dev or native
// else: web prod
const imageRoute = new Route(
  ({ request }) => {
    const url = new URL(request.url);
    const sameOrigin = url.hostname === location.hostname;
    const isImage = request.destination === 'image';
    return !sameOrigin && isImage;
  },
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      nativeRequestPlugin, // native only
      requestForwardPlugin, // web only
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 1, // one day
        maxEntries: 5000,
        purgeOnQuotaError: true,
      }),
    ],
  })
);

registerRoute(imageRoute);
