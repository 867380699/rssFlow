export type Feed = {
  id?: number;
  source: string;
  title: string;
  description?: string;
  link: string;
  imageUrl?: string;
  items?: Array<FeedItem>;
  lastUpdateTime?: number;
};

export type FeedItem = {
  id?: number;
  feedId?: number;
  title: string;
  shortDescription?: string;
  description?: string;
  image?: string;
  readTime?: number;
  link: string;
} & ItemStatus;

export type ItemStatus = {
  isRead?: 0 | 1;
  isFavorite?: 0 | 1;
};
