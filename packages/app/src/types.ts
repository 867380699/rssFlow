export type Feed = {
  id?: number;
  /** feed subscription source url */
  source: string;
  title: string;
  description?: string;
  link?: string;
  imageUrl?: string;
  items?: Array<FeedItem>;
  lastUpdateTime?: number;
  type: 'feed' | 'group';
  parentId: number;
  prevId: number; // undefined values are not indexable in IndexedDB
  nextId: number; // undefined values are not indexable in IndexedDB
  config?: {
    customStyle?: string;
    replaceLink?: {
      from?: string;
      to?: string;
    };
  };
};

export type FeedItem = {
  id?: number;
  feedId?: number;
  title: string;
  shortDescription?: string;
  description?: string;
  meta?: ItemMeta;
  image?: string;
  video?: {
    src: string;
    poster?: string;
  };
  audio?: string;
  readTime?: number;
  pubDate?: number;
  link: string;
} & ItemStatus;

export type ItemMeta = {
  contentLength?: number;
  imageCount?: number;
  videoCount?: number;
  audioCount?: number;
  frameCount?: number;
};

export type ItemStatus = {
  isRead?: 0 | 1;
  isFavorite?: 0 | 1;
};

export type Font = {
  id?: number;
  name: string;
  buffer: ArrayBuffer;
};
