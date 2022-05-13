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
      feedItems: '++id, feedId, title, link'
    })
    this.version(2).stores({
      feedItems: '++id, feedId, title, link, isRead, isFavorite'
    }).upgrade(tx => {
      return tx.table("feedItems").toCollection().modify(item => {
        item.isRead = false;
        item.isFavorite = false;
      });
    })
  }
}

export const feedDB = new FeedDB();

export const storeFeed = async (feed: Feed) => {
  const { title, description, link, imageUrl, items } = feed;
  const feedId = await feedDB.feeds.add({
    title, description, link, imageUrl
  }) as number;
  if (items && items.length) {
    await feedDB.feedItems.bulkAdd(items.map(({ title, description, link }) => ({ feedId, title, description, link })));
  }
}

export const loadFeedItem = async (id: number | string) => {
  const feedItem = await feedDB.feedItems.get(Number(id))
  return feedItem;
}