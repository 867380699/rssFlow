import Dexie, { liveQuery, Table } from 'dexie';
import { Feed, FeedItem } from '../types';

const DB_NAME = 'feedDB';
const DB_VERSION = 1;

export class FeedDB extends Dexie {
  feeds!: Table<Feed>;
  feedItems!: Table<FeedItem>;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores({
      feeds: '++id, title, &link',
      feedItems: '++id, feedId, title, link'
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