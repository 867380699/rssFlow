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
  rank?: string;
};

export type FeedItem = {
  id?: number;
  feedId?: number;
  title: string;
  shortDescription?: string;
  description?: string;
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

export type ItemStatus = {
  isRead?: 0 | 1;
  isFavorite?: 0 | 1;
};
