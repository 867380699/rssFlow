import { Http } from '@capacitor-community/http';
import { Capacitor } from '@capacitor/core';

const platform = Capacitor.getPlatform();

export const getFeeds = async (url: string) => {
  const match = /^(.*?:\/\/)?(.*)$/.exec(url);
  if (match) {
    const [, protocol, rest] = match;
    if (platform === 'web') {
      const resp = await fetch('/rss/' + rest);
      if (resp.status !== 200) {
        throw new Error(resp.statusText);
      }
      const feedText = await resp.text();
      return feedText;
    } else {
      const resp = await Http.get({ url: protocol || 'http://' + rest });
      return resp.data;
    }
  } else {
    throw new Error('Invalid URL');
  }
};
