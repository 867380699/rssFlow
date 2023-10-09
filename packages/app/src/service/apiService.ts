import { Capacitor, CapacitorHttp } from '@capacitor/core';

const platform = Capacitor.getPlatform();

export const getFeeds = async (url: string) => {
  const match = /^(.*?:\/\/)?(.*)$/.exec(url);
  if (match) {
    const [, protocol, rest] = match;
    if (platform === 'web') {
      const host = import.meta.env.VITE_PROXY_HOST || '/rss/?url=';
      const origin = (protocol || 'http://') + rest;
      const resp = await fetch(host + origin);
      if (resp.status !== 200) {
        throw new Error(resp.statusText);
      }
      const feedText = await resp.text();
      return feedText;
    } else if (platform === 'electron') {
      const feedText = await electronAPI.fetchRSS(url);
      return feedText;
    } else {
      const resp = await CapacitorHttp.get({
        url: (protocol || 'http://') + rest,
      });
      return resp.data;
    }
  } else {
    throw new Error('Invalid URL');
  }
};
