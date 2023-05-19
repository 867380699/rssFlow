import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute, Route } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import type {WorkboxPlugin} from 'workbox-core';
import pica from 'pica';


declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
clientsClaim();

self.addEventListener('install', (event) => {
  console.log('Service worker installed', event);
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activated', event);
});


const scaleImage = (blob: Blob, size=200) => {
  return new Promise<Blob>((resolve)=>{
    createImageBitmap(blob).then(function(bitmap) {
      const {width, height} = bitmap;
      const scaleRatio = size / Math.min(width, height)
      const canvas = new OffscreenCanvas(width * scaleRatio, height * scaleRatio) as any;
      const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        canvas.convertToBlob({type: blob.type}).then((resizedBlob: Blob) => {
          resolve(resizedBlob);
        });
      }
    });
  })
}

const canvasPlugin:WorkboxPlugin = {
  cacheWillUpdate: async (params) => {
    const blob = await params.response.blob();
    const resizedBlob = await scaleImage(blob);
    return new Response(resizedBlob, {
      status: params.response.status,
      headers: params.response.headers,
    });
  }
};

const imageRoute = new Route(
  ({ request }) => {
    const url = new URL(request.url);
    return (
      request.destination === 'image' && /thumbnail/.test(url.search)
    );
  }, 
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      canvasPlugin
    ],
  })
);

registerRoute(imageRoute);

const picaInstance = pica({
  createCanvas: (w,h)=>new OffscreenCanvas(w,h) as any
});

const picaImage = async (blob: Blob, size=120) => {
  const bitmap = await createImageBitmap(blob);
  const {width, height} = bitmap;
  const scaleRatio = size / Math.min(width, height)
  const canvas = new OffscreenCanvas(width * scaleRatio, height * scaleRatio) as any;
  await picaInstance.resize(bitmap, canvas, {quality: 3});
  return await new Promise<Blob>((resolve) =>{
    canvas.convertToBlob({type: 'image/jpeg', quality: 0.9}).then(function(resizedBlob: Blob) {
      resolve(resizedBlob);
    });
  })
};

const picaPlugin: WorkboxPlugin = {
  cacheWillUpdate: async (params) => {
    const blob = await params.response.blob();
    const resizedBlob = await picaImage(blob);
    return new Response(resizedBlob, {
      status: params.response.status,
      headers: params.response.headers,
    });
  }
};


const picaRoute = new Route(
  ({ request }) => {
    const url = new URL(request.url);
    return (
      request.destination === 'image' && /pica/.test(url.search)
    );
  }, 
  new CacheFirst({
    cacheName: 'pica',
    plugins: [
      picaPlugin
    ],
  })
);

registerRoute(picaRoute);