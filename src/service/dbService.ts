import Dexie, { Table } from 'dexie';

import { Feed, FeedItem } from '../types';

const DB_NAME = 'feedDB';

export class FeedDB extends Dexie {
  feeds!: Table<Feed>;
  feedItems!: Table<FeedItem>;

  constructor() {
    super(DB_NAME);
    this.version(1).stores({
      feeds: '++id, title, &link',
      feedItems: '++id, feedId, title, link, isRead, isFavorite',
    });
  }
}

export const feedDB = new FeedDB();

export const storeFeed = async (feed: Feed) => {
  const { title, description, link, imageUrl, items } = feed;
  const feedId = (await feedDB.feeds.add({
    title,
    description,
    link,
    imageUrl,
  })) as number;
  if (items && items.length) {
    await feedDB.feedItems.bulkAdd(
      items.map(({ title, description, link }) => ({
        feedId,
        title,
        description,
        link,
        isRead: 0,
        isFavorite: 0,
      }))
    );
  }
};

export const loadFeed = async (id: number) => {
  const feed = await feedDB.feeds.get(Number(id));
  return feed;
};

export const deleteFeed = async (id: number) => {
  await feedDB.feeds.delete(id);
};

export const updateFeed = async (id: number, changes: Partial<Feed>) => {
  await feedDB.feeds.update(id, changes);
};

export const loadFeedItem = async (id: number | string) => {
  const feedItem = await feedDB.feedItems.get(Number(id));
  return feedItem;
};

export const updateFeedItem = async (
  id: number,
  changes: Partial<FeedItem>
) => {
  await feedDB.feedItems.update(id, changes);
};
