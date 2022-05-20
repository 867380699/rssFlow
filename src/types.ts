export type Feed = {
  id?: number;
  title: string;
  description?: string;
  link: string;
  imageUrl?: string;
  items?: Array<FeedItem>;
};

export type FeedItem = {
  id?: number;
  feedId?: number;
  title: string;
  description?: string;
  link: string;
} & ItemStatus;

export type ItemStatus = {
  isRead?: 0 | 1;
  isFavorite?: 0 | 1;
};
