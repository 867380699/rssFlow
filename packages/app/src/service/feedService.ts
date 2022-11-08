import DOMPurify from 'dompurify';
import { VNode } from 'vue';

import { useGallery } from '@/composables/gallery';
import { useMinHeight } from '@/composables/image';
import { time } from '@/utils/log';

import LazyFeedContent from '../components/LazyFeedContent.vue';
import LazyImage from '../components/LazyImage.vue';
import { Feed, FeedItem } from '../types';
import { getFeeds } from './apiService';
import { feedDB, storeFeedItems } from './dbService';

const parser = new DOMParser();

export const parseFeed = (feed: string, source: string): Feed => {
  const nodeTree = parser.parseFromString(feed, 'text/xml');
  if (nodeTree.querySelector('feed')) {
    return parseAtomFeed(nodeTree, source);
  } else {
    return parseRSSFeed(nodeTree, source);
  }
};

const parseRSSFeed = (nodeTree: Document, source: string): Feed => {
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
  const items = parseRSSFeedItems(nodeTree);
  return {
    type: 'feed',
    parentId: 0,
    source,
    title,
    description,
    link,
    imageUrl,
    items,
  };
};

const parseAtomFeed = (nodeTree: Document, source: string): Feed => {
  const title = nodeTree.querySelector('feed > title')?.textContent || '';
  const description =
    nodeTree.querySelector('feed > subtitle')?.textContent || '';
  const link =
    nodeTree.querySelector('feed > link')?.getAttribute('href') || '';
  const imageUrl =
    nodeTree
      .querySelector('feed > image > url')
      ?.textContent?.replace(/^https?/, 'https') || '';
  const items = parseAtomFeedItems(nodeTree);
  return {
    type: 'feed',
    parentId: 0,
    source,
    title,
    description,
    link,
    imageUrl,
    items,
  };
};

const parseRSSFeedItems = (nodeTree: Document): Array<FeedItem> => {
  const itemNodes = nodeTree.querySelectorAll('rss > channel > item');
  const items: Array<FeedItem> = [];
  itemNodes.forEach((node) => {
    const description = node.querySelector('description')?.textContent || '';

    const contentDocument = parser.parseFromString(description, 'text/html');
    const image = contentDocument.querySelector('img')?.src;
    const pubDate = node.querySelector('pubDate')?.textContent;

    items.push({
      title: node.querySelector('title')?.textContent || '',
      image,
      shortDescription: (contentDocument.body.textContent || '').trim(),
      description,
      link:
        node.querySelector('link')?.textContent?.replace(/^https?/, 'https') ||
        '',
      pubDate: (pubDate ? new Date(pubDate) : new Date()).getTime(),
    });
  });
  return items;
};

const parseAtomFeedItems = (nodeTree: Document): Array<FeedItem> => {
  const itemNodes = nodeTree.querySelectorAll('feed > entry');
  const items: Array<FeedItem> = [];
  itemNodes.forEach((node) => {
    const description = node.querySelector('content')?.textContent || '';

    const contentDocument = parser.parseFromString(description, 'text/html');
    const image = contentDocument.querySelector('img')?.src;
    const pubDate = node.querySelector('updated')?.textContent;

    items.push({
      title: node.querySelector('title')?.textContent || '',
      image,
      shortDescription: (contentDocument.body.textContent || '').trim(),
      description,
      link:
        node
          .querySelector('link')
          ?.getAttribute('href')
          ?.replace(/^https?/, 'https') || '',
      pubDate: (pubDate ? new Date(pubDate) : new Date()).getTime(),
    });
  });
  return items;
};

export const parseFeedContent = time((content: string) => {
  DOMPurify.removeAllHooks();
  DOMPurify.addHook('afterSanitizeElements', (node) => {
    if (node.nodeName === 'BR') {
      node.remove();
    }
    if (node.nodeName === 'P' && !node.textContent && !node.childNodes.length) {
      node.remove();
    }
    if (
      node.nodeType === Node.TEXT_NODE &&
      /^ +$/.test(node.textContent || '')
    ) {
      node.remove();
    }
  });
  const result = DOMPurify.sanitize(content, { ADD_TAGS: ['iframe'] });
  const domObj = parser.parseFromString(result, 'text/html');
  const buildScope = { imageCount: 0 };
  const vNode = buildVNode(domObj.body, buildScope);
  console.log(buildScope);

  return () => vNode;
}, 'parseFeedContent');

const buildVNode = (e: HTMLElement, scope: any) => {
  const attrNames = e.getAttributeNames();
  const props: any = {};
  for (const attrName of attrNames) {
    if (['class'].indexOf(attrName) === -1) {
      props[attrName] = e.getAttribute(attrName);
    }
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

  let component: any = e.tagName.toLocaleLowerCase();

  if (e.tagName === 'BODY') {
    component = LazyFeedContent;
    props.imgs = scope.imgs || [];
    props.offset = 2;
  } else if (e.tagName === 'IMG') {
    const { minHeight } = useMinHeight();
    if (scope.imageCount < 2) {
      component = LazyImage;
      props['loading'] = 'eager';
      props['minHeight'] = `${minHeight.value}px`;
      const index = scope.imageCount;
      props['onClick'] = (ev: Event) => {
        const { openGalleryModal } = useGallery();
        openGalleryModal(scope.imgs, index, ev.target as HTMLImageElement);
      };
    } else {
      component = 'div';
      props.class = 'img-placeholder bg-slate-400 rounded-sm mb-2';
      props.style = `min-height: ${minHeight.value}px`;
    }
    if (!scope.imgs) {
      scope.imgs = [];
    }
    scope.imgs.push((e as HTMLImageElement).src);

    scope.imageCount += 1;
  } else if (e.tagName === 'TABLE') {
    return h(
      'div',
      {
        style: 'overflow: scroll; max-width: 100%;',
        class: 'ignoreTouchClass',
      },
      [h(component, props, children.length ? children : undefined)]
    );
  }
  return h(
    component,
    props,
    children.length ? { default: () => children } : undefined
  );
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
  const feeds = await feedDB.feeds.where('type').equals('feed').toArray();
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
