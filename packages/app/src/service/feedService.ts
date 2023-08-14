import DOMPurify from 'dompurify';
import { VNode } from 'vue';

import { useGallery } from '@/composables/gallery';
import { useMinHeight } from '@/composables/image';
import { time } from '@/utils/log';

import AudioPlayer from '../components/AudioPlayer.vue';
import EnhancedFrame from '../components/EnhancedFrame.vue';
import LazyFeedContent from '../components/LazyFeedContent.vue';
import LazyImage from '../components/LazyImage.vue';
import VideoPlayer from '../components/VideoPlayer.vue';
import { Feed, FeedItem, ItemMeta } from '../types';
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
    let description =
      node.getElementsByTagNameNS(
        'http://purl.org/rss/1.0/modules/content/',
        'encoded'
      )[0]?.textContent ||
      node.querySelector('description')?.textContent ||
      '';

    const enclosure = node.querySelector('enclosure');
    if (enclosure) {
      description = parseEncolsure(enclosure) + description;
    }
    const contentDocument = parser.parseFromString(description, 'text/html');
    const pubDate = node.querySelector('pubDate')?.textContent;

    const { image, video, audio, meta } = parseFeedItemMedia(description);

    items.push({
      title: node.querySelector('title')?.textContent || '',
      image,
      video,
      audio,
      meta,
      shortDescription: (contentDocument.body.textContent || '').trim(),
      description,
      link:
        node.querySelector('link')?.textContent?.replace(/^https?/, 'https') ||
        '',
      pubDate: (pubDate ? new Date(pubDate) : new Date()).getTime(),
      readTime: 0,
    });
  });
  return items;
};

const parseAtomFeedItems = (nodeTree: Document): Array<FeedItem> => {
  const itemNodes = nodeTree.querySelectorAll('feed > entry');
  const items: Array<FeedItem> = [];
  itemNodes.forEach((node) => {
    let description = node.querySelector('content')?.textContent || '';
    const enclosure = node.querySelector('link[rel="enclosure"]');
    if (enclosure) {
      description = parseEncolsure(enclosure) + description;
    }
    const contentDocument = parser.parseFromString(description, 'text/html');
    const pubDate = node.querySelector('updated')?.textContent;

    const { image, video, audio, meta } = parseFeedItemMedia(description);

    items.push({
      title: node.querySelector('title')?.textContent || '',
      image,
      video,
      audio,
      meta,
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

const parseFeedItemMedia = (description: string) => {
  const contentDocument = parser.parseFromString(description, 'text/html');
  const bodyEl = contentDocument.querySelector('body');
  const imageEls = contentDocument.querySelectorAll('img');
  const videoEls = contentDocument.querySelectorAll('video');
  const audioEls = contentDocument.querySelectorAll('audio');
  const frameEls = contentDocument.querySelectorAll('iframe');

  const image = imageEls[0]?.src;
  const audio = audioEls[0]?.querySelector<HTMLSourceElement>('source')?.src;
  const src = videoEls[0]?.src;
  const poster = videoEls[0]?.poster;

  const meta: ItemMeta = {
    contentLength: bodyEl?.textContent?.trim()?.length,
    imageCount: imageEls.length,
    videoCount: videoEls.length,
    audioCount: audioEls.length,
    frameCount: frameEls.length,
  };

  const video = src
    ? {
        src,
        poster,
      }
    : undefined;

  return {
    image,
    video,
    audio,
    meta,
  };
};

export const parseEncolsure = (enclosure: Element) => {
  const mimeType = enclosure.getAttribute('type') || '';
  // rss -> url, atom -> href
  const url =
    enclosure.getAttribute('url') || enclosure.getAttribute('href') || '';

  if (isAudio(url, mimeType)) {
    return `<audio controls> <source src="${url}"></audio>`;
  } else if (isVideo(url, mimeType)) {
    return `<video controls> <source src="${url}"></video>`;
  }
  return '';
};

const isAudio = (url = '', mimeType = '') => {
  if (/audio/i.test(mimeType)) {
    return true;
  }
  if (/(mp3|wav|ogg|aac|m4a|flac|alac)$/.test(url)) {
    return true;
  }
  return false;
};

const isVideo = (url = '', mimeType = '') => {
  if (/video/i.test(mimeType)) {
    return true;
  }
  if (/(mp4|mov|avi|flv|wmv|mkv|webm)$/.test(url)) {
    return true;
  }
  return false;
};

export const parseFeedContent = time((feedItem: FeedItem) => {
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
  const result = DOMPurify.sanitize(feedItem.description || '', {
    ADD_TAGS: ['iframe'],
  });
  const domObj = parser.parseFromString(result, 'text/html');
  const buildScope = { imageIndex: 0, feedItem };
  const vNode = buildVNode(domObj.body, buildScope);
  console.log(buildScope);

  return () => vNode;
}, 'parseFeedContent');

const buildVNode = (
  e: HTMLElement,
  scope: { [key: string]: any; imageIndex: number }
) => {
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
    if (scope.imageIndex < 2) {
      component = LazyImage;
      props['loading'] = 'eager';
      props['minHeight'] = `${minHeight.value}px`;
      const index = scope.imageIndex;
      props['onClick'] = (ev: Event) => {
        const { openGalleryModal } = useGallery();
        openGalleryModal(scope.imgs, index, ev.target as HTMLImageElement);
      };
    } else {
      component = 'div';
      props.class = 'img-placeholder bg-slate-400 rounded-sm mb-2';
      props.style = { 'min-height': `${minHeight.value}px` };
    }
    if (!scope.imgs) {
      scope.imgs = [];
    }
    scope.imgs.push((e as HTMLImageElement).src);

    scope.imageIndex += 1;
  } else if (e.tagName === 'VIDEO') {
    component = VideoPlayer;
    props.src = e.getAttribute('src');
    props.poster = e.getAttribute('poster');
  } else if (e.tagName === 'AUDIO') {
    component = AudioPlayer;
    props.src = e.querySelector('source')?.src;
    props.title = scope.feedItem?.title;
    props.artwork = scope.feedItem?.image;
  } else if (e.tagName === 'IFRAME') {
    component = EnhancedFrame;
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
  for (let i = 0; i < feeds.length; i++) {
    const feed = feeds[i];
    const now = Date.now();
    const syncInterval = 1000 * 60 * 60 * 2;
    if (!feed.lastUpdateTime || now - feed.lastUpdateTime > syncInterval) {
      console.log('sync feed:', feed.source);
      try {
        const feedText = await getFeeds(feed.source);
        const newItems = parseFeed(feedText, feed.source).items;
        if (newItems) {
          await storeFeedItems(newItems, Number(feed.id));
          feedDB.feeds.update(Number(feed.id), { lastUpdateTime: now });
        }
      } catch (e) {
        console.log(e);
      }
    }
  }
};
