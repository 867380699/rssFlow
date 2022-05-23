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

export const storeFeed = async (feed: Feed, source: string) => {
  const { title, description, link, imageUrl, items } = feed;
  const feedId = (await feedDB.feeds.add({
    source,
    title,
    description,
    link,
    imageUrl,
    lastUpdateTime: new Date().getTime(),
  })) as number;
  if (items && items.length) {
    await storeFeedItems(items, feedId);
  }
};

export const storeFeedItems = async (feedItems: FeedItem[], feedId: number) => {
  if (feedItems.length) {
    const newItemsLinks = feedItems.map((item) => item.link);
    const duplicateItems = await feedDB.feedItems
      .where({ feedId })
      .filter((item) => {
        return newItemsLinks.findIndex((link) => item.link === link) !== -1;
      })
      .toArray();
    const duplicateLinks = duplicateItems.map((item) => item.link);
    const deduplicateItems = feedItems.filter(
      (item) => duplicateLinks.indexOf(item.link) === -1
    );
    await feedDB.feedItems.bulkAdd(
      deduplicateItems.map(({ title, description, link }) => ({
        feedId,
        title,
        description,
        link,
        isRead: 0,
        isFavorite: 0,
      }))
    );
    console.log(
      `[storeFeedItems]: ${deduplicateItems.length} stored, ${duplicateItems.length} duplicated.`
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
