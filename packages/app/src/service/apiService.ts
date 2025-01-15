import { Capacitor, CapacitorHttp } from '@capacitor/core';

const platform = Capacitor.getPlatform();

export const getFeeds = async (url: string) => {
  const match = /^(.*?:\/\/)?(.*)$/.exec(url);
  if (match) {
    const [, protocol = 'http://', rest] = match;
    const targetUrl = protocol + rest;
    if (platform === 'web') {
      const host = import.meta.env.VITE_PROXY_HOST || '/rss/?url=';
      const resp = await fetch(host + targetUrl);
      if (resp.status !== 200) {
        throw new Error(resp.statusText);
      }
      const feedText = await resp.text();
      return feedText;
    } else if (platform === 'electron') {
      const feedText = await electronAPI.fetchRSS(targetUrl);
      return feedText;
    } else {
      let resp = await CapacitorHttp.get({ url: targetUrl });
      if (resp.status === 301) {
        const redirectedUrl = resp.headers['Location'];
        console.log('[301] redirected to: ', redirectedUrl);
        resp = await CapacitorHttp.get({ url: redirectedUrl });
      }
      return resp.data;
    }
  } else {
    throw new Error('Invalid URL');
  }
};
