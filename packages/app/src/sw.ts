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

import { RequestForwardPlugin, RequestPoolingPlugin } from './worker/plugins';
import { b64toBlob, isImageRequest, isSameOrigin } from './worker/utils';

declare let self: ServiceWorkerGlobalScope;

if (/^https?:/.test(location.protocol)) {
  // self.__WB_MANIFEST is default injection point
  precacheAndRoute(self.__WB_MANIFEST);
  // to allow work offline
  registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));
}

// clean old assets
cleanupOutdatedCaches();

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

// localhost: dev or native
// else: web prod
const imageRoute = new Route(
  ({ request }) => {
    return !isSameOrigin(request) && isImageRequest(request);
  },
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new RequestPoolingPlugin({
        concurrentSize: 5,
        poolSize: 100,
      }),
      nativeRequestPlugin, // native only
      new RequestForwardPlugin(), // web only
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 1, // one day
        maxEntries: 3000,
        purgeOnQuotaError: true,
      }),
    ],
  })
);

const scaleImage = (blob: Blob, size = 200) => {
  return new Promise<Blob>((resolve) => {
    createImageBitmap(blob).then((bitmap) => {
      const { width, height } = bitmap;
      const scaleRatio = size / Math.min(width, height);
      const canvas = new OffscreenCanvas(
        width * scaleRatio,
        height * scaleRatio
      );
      const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        canvas.convertToBlob({ type: blob.type }).then((resizedBlob: Blob) => {
          resolve(resizedBlob);
        });
      }
    });
  });
};

const thumbnailRoute = new Route(
  ({ request }) => {
    const url = new URL(request.url);
    return (
      !isSameOrigin(request) &&
      isImageRequest(request) &&
      /#thumbnail/.test(url.hash)
    ); // `?thumbnail=1` used to aviod cache
  },
  new CacheFirst({
    cacheName: 'thumbnail',
    plugins: [
      new RequestPoolingPlugin({
        concurrentSize: 10,
        poolSize: 100,
      }),
      {
        cachedResponseWillBeUsed: async ({
          cachedResponse,
          request,
          event,
          cacheName,
        }) => {
          if (cachedResponse) return cachedResponse;
          const imageUrl = request.url.replace(/\?thumbnail=1#thumbnail$/, '');
          const imageRequest = new Request(imageUrl);
          const resp = await imageRoute.handler.handle({
            url: new URL(imageUrl),
            request: imageRequest,
            event,
          });
          const blob = await resp.blob();
          const thumbBlob = await scaleImage(blob);
          const thumbResp = new Response(thumbBlob, {
            status: resp.status,
            headers: resp.headers,
          });
          const cache = await caches.open(cacheName);
          await cache.put(request, thumbResp);
          const cacheResp = await cache.match(request.url);
          return cacheResp;
        },
      },
      new ExpirationPlugin({
        maxEntries: 5000,
        purgeOnQuotaError: true,
      }),
    ],
  })
);

registerRoute(thumbnailRoute);
registerRoute(imageRoute);
