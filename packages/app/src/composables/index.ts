/* eslint-disable @typescript-eslint/no-explicit-any */
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import { Ref } from 'vue';

import { feedDB } from '../service/dbService';
import { Feed, FeedItem } from '../types';

export const useAllFeeds = () => {
  const feeds = useObservable<Feed[]>(
    liveQuery(() => feedDB.feeds.toArray()) as any
  );
  return {
    feeds,
  };
};

export const useAllFeedItems = () => {
  const feedItems = useObservable<FeedItem[]>(
    liveQuery(() => feedDB.feedItems.toArray()) as any
  );
  return {
    feedItems,
  };
};

export const useFeedItemCounts = () => {
  const counts = useObservable<Record<number, number>>(
    liveQuery(async () => {
      const feedIds = (await feedDB.feeds
        .orderBy('id')
        .uniqueKeys()) as number[];

      const counts = await Promise.all(
        feedIds.map((feedId) =>
          feedDB.feedItems.where({ feedId, isRead: 0 }).count()
        )
      );

      return feedIds.reduce((o, v, i) => {
        o[v] = counts[i];
        return o;
      }, {} as Record<number, number>);
    }) as any
  );
  return {
    counts,
  };
};

export const useFeedItems = (
  feedId?: number,
  isUnRead?: boolean,
  isFavorite?: boolean
) => {
  const feedItems = useObservable<FeedItem[]>(
    liveQuery(() =>
      feedDB.feedItems
        .toCollection()
        .filter((feedItem) => {
          return !feedId || feedItem.feedId === feedId;
        })
        .filter((feedItem) => {
          return isUnRead ? feedItem.isRead === 0 : true;
        })
        .filter((feedItem) => {
          return isFavorite ? feedItem.isFavorite === 1 : true;
        })
        .toArray()
    ) as any
  );
  return {
    feedItems,
  };
};

export const useFeedItem = (id: Ref<number>) => {
  const feedItem = useObservable<FeedItem>(
    liveQuery(() => feedDB.feedItems.get(id.value)) as any
  );
  return {
    feedItem,
  };
};
