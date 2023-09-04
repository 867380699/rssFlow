import Dexie, { IndexableType, liveQuery, Table } from 'dexie';

import { getNextRank, getRankBetween } from '@/utils/rank';

import { Feed, FeedItem } from '../types';

const DB_NAME = 'feedDB';

const feedIndexes = ['++id', 'title', 'parentId', 'rank', 'type'] as const;

const feedItemIndexes = [
  '++id',
  'feedId',
  '[feedId+isRead]',
  '[feedId+isRead+isFavorite+readTime]',
  '[feedId+isRead+isFavorite+readTime+id]',
  '[isRead+isFavorite+readTime]',
  '[pubDate+id]',
  '[feedId+pubDate+id]',
] as const;

type TypeFeedIndexKey = typeof feedIndexes[number];

type TypeFeedItemIndexKey = typeof feedItemIndexes[number];

type TypeFeedIndex = {
  [k in TypeFeedIndexKey]: k;
};

type TypeFeedItemIndex = {
  [k in TypeFeedItemIndexKey]: k;
};

export const FeedIndex: TypeFeedIndex = Object.fromEntries(
  new Map(feedIndexes.map((k) => [k, k]))
) as TypeFeedIndex;

export const FeedItemIndex: TypeFeedItemIndex = Object.fromEntries(
  new Map(feedItemIndexes.map((k) => [k, k]))
) as TypeFeedItemIndex;

export class FeedDB extends Dexie {
  feeds!: Table<Feed>;
  feedItems!: Table<FeedItem>;

  constructor() {
    super(DB_NAME);
    this.version(43).stores({
      feeds: feedIndexes.join(','),
      feedItems: feedItemIndexes.join(','),
    });
  }
}

export const feedDB = new FeedDB();

// TODO: remove debug
(window as any).feedDB = feedDB;
(window as any).Dexie = Dexie;

export const getNextFeedRank = async () => {
  const lastFeed = await feedDB.feeds.orderBy('rank').last();
  return getNextRank(lastFeed?.rank);
};

export const storeFeed = async (feed: Feed) => {
  feed = toRaw(feed);
  const rank = await getNextFeedRank();
  const { source, title, type, parentId, description, link, imageUrl, items } =
    feed;
  const feedId = (await feedDB.feeds.add({
    source,
    title,
    description,
    link,
    imageUrl,
    lastUpdateTime: Date.now(),
    parentId,
    type,
    rank,
  })) as number;
  if (items && items.length) {
    await storeFeedItems(items, feedId);
  }
  return feedId;
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
    lastUpdateTime: Date.now(),
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
        ({
          title,
          description,
          shortDescription,
          link,
          image,
          video,
          audio,
          meta,
          pubDate,
        }) => ({
          feedId,
          title,
          image,
          video,
          audio,
          meta,
          description,
          shortDescription,
          link,
          pubDate,
          isRead: 0,
          readTime: 0,
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
  const now = Date.now();
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

export type FeedItemQuery = {
  feedIds: (number | string)[];
  isReadRange: number[];
  isFavoriteRange: number[];
  readTimeRange?: IndexableType[];
};

export const allFeedIds$ = liveQuery(() => feedDB.feeds.toCollection().keys());

export const buildFeedItemPrimaryKeyObservable = (range: IndexableType[][]) => {
  return liveQuery(() => {
    const [lower, upper] = range;
    return feedDB.feedItems
      .where('[feedId+isRead+isFavorite+readTime]')
      .between(lower, upper, true, true)
      .primaryKeys();
  }) as unknown as number[];
};

export const buildAllFeedItemPrimaryKeyObservable = (
  range: IndexableType[][]
) => {
  return liveQuery(() => {
    const [lower, upper] = range;
    return feedDB.feedItems
      .where('[isRead+isFavorite+readTime]')
      .between(lower, upper, true, true)
      .primaryKeys();
  }) as unknown as number[];
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

export const readFeedItems = async (ids: number[]) => {
  await feedDB.feedItems.where('id').anyOf(ids).modify({
    isRead: 1,
  });
  const undo = async () => {
    await feedDB.feedItems.where('id').anyOf(ids).modify({
      isRead: 0,
    });
  };
  return undo;
};
