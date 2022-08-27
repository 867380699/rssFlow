import * as http from 'http';
import proxy from 'http2-proxy';
import { Connect, Plugin, ProxyOptions } from 'vite';

export type ProxyTable = Record<string, ProxyOptions>;

const generateMiddlewareProxyTable = (
  proxyTable: ProxyTable
): Connect.HandleFunction => {
  const proxyTableResolved: {
    proxyPath: string;
    rewrite: ProxyOptions['rewrite'];
    proxyOptions: {
      hostname: string;
      port: number;
    };
  }[] = [];
  for (const key in proxyTable) {
    const proxyPath = key;
    const { target, rewrite } = proxyTable[proxyPath];

    const viteProxyUrLTarget =
      (typeof target === 'string' &&
        target.split('//').pop()?.replace('/', '').split(':')) ||
      [];

    const proxyOptions = {
      hostname: viteProxyUrLTarget[0],
      port: Number(viteProxyUrLTarget[1]) || 80,
    };

    proxyTableResolved.push({
      proxyOptions,
      rewrite,
      proxyPath,
    });
  }

  return (
    req: Connect.IncomingMessage,
    res: http.ServerResponse,
    next: Connect.NextFunction
  ) => {
    for (const proxyOpts of proxyTableResolved) {
      const { rewrite, proxyOptions, proxyPath } = proxyOpts;
      const originalUrl = req.originalUrl || '';
      const proxyOptsResolved = {
        ...proxyOptions,
        path: rewrite ? rewrite(originalUrl) : originalUrl,
      };

      if (new RegExp(proxyPath).test(originalUrl)) {
        console.log('proxy url', originalUrl);
        return proxy.web(req, res, proxyOptsResolved);
      }
    }
    next();
  };
};

export default (proxyTable: ProxyTable): Plugin => {
  return {
    name: 'vite-plugin-proxy',

    configureServer({ middlewares }) {
      middlewares.use(generateMiddlewareProxyTable(proxyTable));
    },
  };
};
