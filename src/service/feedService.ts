import DOMPurify from 'dompurify';

import { Feed, FeedItem } from '../types';
import { getFeeds } from './apiService';
import { feedDB, storeFeedItems } from './dbService';

const parser = new DOMParser();

const parseFeedItems = (nodeTree: Document): Array<FeedItem> => {
  const itemNodes = nodeTree.querySelectorAll('rss > channel > item');
  const items: Array<FeedItem> = [];
  itemNodes.forEach((node) =>
    items.push({
      title: node.querySelector('title')?.textContent || '',
      description: node.querySelector('description')?.textContent || '',
      link:
        node.querySelector('link')?.textContent?.replace(/^https?/, 'https') ||
        '',
    })
  );
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
  console.log(nodeTree);
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
  const contentDocument = parser.parseFromString(
    DOMPurify.sanitize(content),
    'text/html'
  );
  return DOMPurify.sanitize(content);
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
