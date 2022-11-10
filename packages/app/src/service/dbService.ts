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
    this.version(12)
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
    this.version(15).stores({
      feeds: '++id, title, &link, parentId, rank, type',
    });
    this.version(16).stores({
      feedItems:
        '++id, feedId, title, link, [feedId+isRead], [feedId+isRead+isFavorite]',
    });
    this.version(18).stores({
      feedItems: '++id, feedId, [feedId+isRead], [feedId+isRead+isFavorite]',
    });
  }
}

export const feedDB = new FeedDB();

(window as any).feedDB = feedDB;
(window as any).Dexie = Dexie;

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
  await feedDB.transaction('rw', feedDB.feeds, feedDB.feedItems, async () => {
    const feed = await feedDB.feeds.get(id);
    if (feed?.type === 'group') {
      await feedDB.feeds.where({ parentId: id }).modify({ parentId: 0 });
    } else {
      await feedDB.feedItems.where('feedId').equals(id).delete();
    }
    await feedDB.feeds.delete(id);
  });
};

export const updateFeed = async (id: number, changes: Partial<Feed>) => {
  await feedDB.feeds.update(id, changes);
};

export const loadFeedItem = async (id: number | string) => {
  const feedItem = await feedDB.feedItems.get(Number(id));
  return feedItem;
};

export const loadFeedItems = async (feedId: number | string) => {
  let feedItems;
  if (feedId) {
    feedItems = await feedDB.feedItems.where({ feedId }).toArray();
  } else {
    feedItems = await feedDB.feedItems.toArray();
  }
  return feedItems;
};

export const loadRecentFeedItems = async (feedId: number | string) => {
  const now = new Date().getTime();
  let query;
  if (feedId) {
    query = feedDB.feedItems.where({ feedId });
  } else {
    query = feedDB.feedItems;
  }
  const feedItems = await query
    .filter(
      (item) => item.isRead === 1 && (item.readTime || 0) + 1000 * 60 * 2 > now
    )
    .reverse()
    .toArray();
  return feedItems
    .sort((a, b) => (b.readTime || 0) - (a.readTime || 0))
    .slice(0, 5);
};

export const loadFeedItemsByIndex = async ({
  feedIds,
  isReadRange,
  isFavoriteRange,
}: {
  feedIds: (number | string)[];
  isReadRange: number[];
  isFavoriteRange: number[];
}) => {
  const feedIdRange = feedIds.length
    ? feedIds
    : await feedDB.feeds.toCollection().keys();

  const ranges = feedIdRange.flatMap((id) =>
    isReadRange.flatMap((isRead) =>
      isFavoriteRange.map((isFavorite) => [id, isRead, isFavorite])
    )
  );
  return feedDB.feedItems
    .where('[feedId+isRead+isFavorite]')
    .anyOf(ranges)
    .toArray();
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
