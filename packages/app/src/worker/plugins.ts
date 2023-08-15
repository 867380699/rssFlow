import { WorkboxPlugin } from 'workbox-core';

export class RequestForwardPlugin implements WorkboxPlugin {
  requestWillFetch: WorkboxPlugin['requestWillFetch'] = async ({ request }) => {
    // web request proxy
    const url = new URL(request.url);
    const headers = new Headers(request.headers);
    const prefix = import.meta.env.VITE_PROXY_HOST || '/img/';
    const proxyRequest = new Request(
      `${prefix}${encodeURIComponent(url.toString())}`,
      { mode: 'cors', headers }
    );
    return proxyRequest;
  };
}

export interface RequestPoolingPluginOptions {
  concurrentSize: number;
  poolSize: number;
}

export type ManualPromise = {
  promise: Promise<void>;
  resolver: () => void;
  rejector: () => void;
};

export class RequestPoolingPlugin implements WorkboxPlugin {
  // TODO: implement
  private poolSize = 50;
  private concurrentSize = 5;

  private current = new Set<string>();
  private pool: ManualPromise[] = [];

  constructor(options: RequestPoolingPluginOptions) {
    this.poolSize = options.poolSize;
    this.concurrentSize = options.concurrentSize;
  }

  cachedResponseWillBeUsed: WorkboxPlugin['cachedResponseWillBeUsed'] = async ({
    request,
    cachedResponse,
  }) => {
    if (cachedResponse) {
      return cachedResponse;
    } else {
      // cache not hit
      console.log(
        'RequestPoolingPlugin:cachedResponseWillBeUsed:current',
        this.current.size
      );
      if (this.current.size < this.concurrentSize) {
        this.current.add(request.url);
        return cachedResponse;
      } else {
        console.log(
          'RequestPoolingPlugin:cachedResponseWillBeUsed:pool',
          this.pool.length
        );
        const manualPromise = this.createManualPromise();
        this.pool.push(manualPromise);
        await manualPromise.promise;
        this.current.add(request.url);
        return cachedResponse;
      }
    }
  };

  handlerDidError: WorkboxPlugin['handlerDidError'] = async ({ request }) => {
    console.log('RequestPoolingPlugin:handlerDidError');
    if (this.current.has(request.url)) {
      this.current.delete(request.url);
      if (this.pool.length) {
        this.pool.shift()?.resolver();
      }
    }
    return undefined;
  };

  handlerWillRespond: WorkboxPlugin['handlerWillRespond'] = async ({
    request,
    response,
  }) => {
    console.log('RequestPoolingPlugin:handlerWillRespond');
    if (this.current.has(request.url)) {
      this.current.delete(request.url);
      if (this.pool.length) {
        this.pool.shift()?.resolver();
      }
    }
    return response;
  };

  private createManualPromise() {
    let resolver;
    let rejector;
    const promise = new Promise<void>((resolve, reject) => {
      resolver = () => {
        resolve();
      };
      rejector = () => {
        reject();
      };
    });
    return {
      promise,
      resolver: resolver as unknown as () => void,
      rejector: rejector as unknown as () => void,
    };
  }
}
