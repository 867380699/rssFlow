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

const isImageRequest = (request: Request) => {
  if (request.destination === 'image') {
    return true;
  }
  const url = new URL(request.url);
  if (/\.(jpg|jpeg|png|webp|avif|gif)$/.test(url.pathname)) {
    return true;
  }
};

const isSameOrigin = (request: Request) => {
  const url = new URL(request.url);
  return url.hostname === location.hostname;
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
    );
  },
  new CacheFirst({
    cacheName: 'thumbnail',
    plugins: [
      {
        requestWillFetch: async ({ request }) => {
          const url = request.url.split('#')[0];
          return new Request(url);
        },
      },
      {
        requestWillFetch: async ({ request, state }) => {
          if (state) {
            state['originUrl'] = request.url;
          }
          return request;
        },
        cachedResponseWillBeUsed: async (params) => {
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
              const originUrl = params.state?.originUrl;
              if (originUrl) {
                const imagesCache = await caches.open('images');
                const isCached = await imagesCache.match(originUrl);
                if (!isCached) {
                  const imageResp = resp.clone();
                  imagesCache.put(originUrl, imageResp);
                }
              }
              const thumbBlob = await scaleImage(blob);
              const thumbResp = new Response(thumbBlob, {
                status: nativeResp.status,
                headers: nativeResp.headers,
              });
              const cache = await caches.open(params.cacheName);
              await cache.put(params.request, thumbResp);
              const cacheResp = await cache.match(params.request.url);
              return cacheResp;
            }
          }

          return params.cachedResponse;
        },
        fetchDidSucceed: async ({ response, state }) => {
          // web only
          const originUrl = state?.originUrl;
          if (originUrl) {
            const imageResp = response.clone();
            const imagesCache = await caches.open('images');
            imagesCache.put(originUrl, imageResp);
          }
          const blob = await response.blob();
          const newBlob = await scaleImage(blob);
          return new Response(newBlob, {
            status: response.status,
            headers: response.headers,
          });
        },
      },
      requestForwardPlugin, // web only
      new ExpirationPlugin({
        maxEntries: 5000,
        purgeOnQuotaError: true,
      }),
    ],
  })
);

registerRoute(thumbnailRoute);
registerRoute(imageRoute);
