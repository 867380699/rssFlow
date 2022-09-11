import DOMPurify from 'dompurify';
import { cloneVNode, createVNode, render, VNode } from 'vue';

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
  const result = DOMPurify.sanitize(content);
  const domObj = parser.parseFromString(result, 'text/html');
  const buildScope = { imageCount: 0 };
  const vNode = buildVNode(domObj.body, buildScope);
  console.log(buildScope);

  return () => vNode;
};

const buildVNode = (e: HTMLElement, scope: any) => {
  const attrNames = e.getAttributeNames();
  const props: any = {};
  for (const attrName of attrNames) {
    props[attrName] = e.getAttribute(attrName);
  }
  let component: any = e.tagName.toLocaleLowerCase();
  if (e.tagName === 'BODY') {
    component = 'div';
  } else if (e.tagName === 'IMG') {
    component = LazyImage;
    props['loading'] = scope.imageCount < 2 ? 'eager' : 'lazy';
    props['minHeight'] = '180px';
    scope.imageCount += 1;
  } else {
  }
  const children: (VNode | string)[] = [];
  if (e.childNodes.length) {
    e.childNodes.forEach((node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        children.push(buildVNode(node as HTMLElement, scope));
      } else if (node.nodeType === Node.TEXT_NODE) {
        children.push(node.textContent || '');
      }
    });
  }

  return h(component, props, children.length ? children : undefined);
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
