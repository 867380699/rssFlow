import Dexie, { Table } from 'dexie';

import { getNextRank, getRankBetween, getSeed } from '@/utils/rank';

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
    this.version(2)
      .stores({
        feeds: '++id, title, &link, parentId',
        feedItems: '++id, feedId, title, link, [feedId+isRead]',
      })
      .upgrade(async (tx) => {
        const feedCount = await tx.table('feeds').count();
        let rank = getNextRank(getSeed(feedCount));
        return tx
          .table<Feed, number>('feeds')
          .toCollection()
          .modify((feed) => {
            feed.type = 'feed';
            feed.rank = rank;
            feed.parentId = 0;
            rank = getNextRank(rank);
          });
      });
    this.version(3).stores({
      feeds: '++id, title, &link, parentId, rank, type',
    });
  }
}

export const feedDB = new FeedDB();

export const getNextFeedRank = async () => {
  const lastFeed = await feedDB.feeds.orderBy('rank').last();
  return getNextRank(lastFeed?.rank);
};

export const storeFeed = async (feed: Feed, source: string) => {
  const rank = await getNextFeedRank();
  const { title, description, link, imageUrl, items } = feed;
  const feedId = (await feedDB.feeds.add({
    source,
    title,
    description,
    link,
    imageUrl,
    lastUpdateTime: new Date().getTime(),
    parentId: 0,
    type: 'feed',
    rank,
  })) as number;
  if (items && items.length) {
    await storeFeedItems(items, feedId);
  }
};

export const moveFeed = async ({
  feedId,
  parentId,
  newIndex,
}: {
  feedId: number;
  parentId: number;
  newIndex: number;
}) => {
  const feeds = await feedDB.feeds.where({ parentId }).sortBy('rank');
  const prevFeed = feeds[newIndex - 1];
  const nextFeed = feeds[newIndex];
  feedDB.feeds.update(feedId, {
    parentId,
    rank: getRankBetween(prevFeed?.rank, nextFeed?.rank),
  });
};

export const storeGroup = async (groupName: string) => {
  const rank = await getNextFeedRank();
  await feedDB.feeds.add({
    parentId: 0,
    source: '',
    title: groupName,
    link: groupName,
    imageUrl: '',
    lastUpdateTime: new Date().getTime(),
    type: 'group',
    rank,
  });
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
      deduplicateItems.map(
        ({ title, description, shortDescription, link, image, pubDate }) => ({
          feedId,
          title,
          image,
          description,
          shortDescription,
          link,
          pubDate,
          isRead: 0,
          isFavorite: 0,
        })
      )
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
  await feedDB.feedItems.where('feedId').equals(id).delete();
};

export const updateFeed = async (id: number, changes: Partial<Feed>) => {
  await feedDB.feeds.update(id, changes);
};

export const loadFeedItem = async (id: number | string) => {
  const feedItem = await feedDB.feedItems.get(Number(id));
  return feedItem;
};

export const loadFeedItems = async (feedId: number | string) => {
  let feedItem;
  if (feedId) {
    feedItem = await feedDB.feedItems.where({ feedId }).toArray();
  } else {
    feedItem = await feedDB.feedItems.toArray();
  }
  return ref(feedItem);
};

export const updateFeedItem = async (
  id: number,
  changes: Partial<FeedItem>
) => {
  await feedDB.feedItems.update(id, changes);
};

export const deleteFeedItem = async (id: number) => {
  await feedDB.feedItems.delete(id);
};
