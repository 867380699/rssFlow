import DOMPurify from 'dompurify';

import { Feed, FeedItem } from '../types';

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

export const parseFeed = (feed: string): Feed => {
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
