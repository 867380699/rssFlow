import DOMPurify from 'dompurify';
import { cloneVNode, createVNode, render } from 'vue';

import LazyImage from '../components/LazyImage.vue';
import { Feed, FeedItem } from '../types';
import { getFeeds } from './apiService';
import { feedDB, storeFeedItems } from './dbService';

const parser = new DOMParser();

const parseFeedItems = (nodeTree: Document): Array<FeedItem> => {
  const itemNodes = nodeTree.querySelectorAll('rss > channel > item');
  const items: Array<FeedItem> = [];
  itemNodes.forEach((node) => {
    const description = DOMPurify.sanitize(
      node.querySelector('description')?.textContent || ''
    );

    const contentDocument = parser.parseFromString(description, 'text/html');
    const image = contentDocument.querySelector('img')?.src;
    items.push({
      title: node.querySelector('title')?.textContent || '',
      image,
      shortDescription: (contentDocument.body.textContent || '').trim(),
      description,
      link:
        node.querySelector('link')?.textContent?.replace(/^https?/, 'https') ||
        '',
    });
  });
  return items;
};

export const parseFeed = (feed: string, source: string): Feed => {
  const nodeTree = parser.parseFromString(feed, 'text/xml');
  const title =
    nodeTree.querySelector('rss > channel > title')?.textContent || '';
  const description =
    nodeTree.querySelector('rss > channel > description')?.textContent || '';
  const link =
    nodeTree.querySelector('rss > channel > link')?.textContent || '';
  const imageUrl =
    nodeTree
      .querySelector('rss > channel > image > url')
      ?.textContent?.replace(/^https?/, 'https') || '';
  const items = parseFeedItems(nodeTree);
  return {
    source,
    title,
    description,
    link,
    imageUrl,
    items,
  };
};

export const parseFeedContent = (content: string) => {
  const vNode = createVNode(LazyImage, { src: '' });
  let imageCount = 0;
  DOMPurify.removeAllHooks();
  DOMPurify.addHook('afterSanitizeElements', (node) => {
    if (node.nodeName === 'P') {
      node.classList.add('mb-4');
    }
    if (
      node.nodeName === 'IMG' &&
      !node.classList.contains('flow-lazy-image')
    ) {
      node.setAttribute('loading', 'lazy');
      const div = document.createElement('div');
      const picNode = cloneVNode(vNode, {
        src: (node as HTMLImageElement).src,
        loading: imageCount++ < 2 ? 'eager' : 'lazy',
      });
      render(picNode, div);
      node.replaceWith(div.children[0]);
    }
  });
  const result = DOMPurify.sanitize(content, { RETURN_DOM_FRAGMENT: true });
  return result;
};

let syncTimeout: ReturnType<typeof setTimeout>;

export const initSync = () => {
  syncAllFeeds();
  syncTimeout = setInterval(syncAllFeeds, 1000 * 60 * 10);
};

export const destroySync = () => {
  clearTimeout(syncTimeout);
};

export const syncAllFeeds = async () => {
  const feeds = await feedDB.feeds.toArray();
  feeds.forEach(async (feed) => {
    const now = new Date().getTime();
    const syncInterval = 1000 * 60 * 60 * 2;
    if (!feed.lastUpdateTime || now - feed.lastUpdateTime > syncInterval) {
      console.log('sync feed:', feed.source);
      const feedText = await getFeeds(feed.source);
      const newItems = parseFeed(feedText, feed.source).items;
      if (newItems) {
        await storeFeedItems(newItems, Number(feed.id));
        feedDB.feeds.update(Number(feed.id), { lastUpdateTime: now });
      }
    }
  });
};
