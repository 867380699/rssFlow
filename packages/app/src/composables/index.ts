/* eslint-disable @typescript-eslint/no-explicit-any */
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import { Ref } from 'vue';

import { FeedItemFilter } from '@/enums';

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
  const feedItems = useObservable<FeedItem[], FeedItem[]>(
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
  feedItems: Ref<FeedItem[]>,
  feedId: Ref<number> = ref(0),
  feedItemFilter: Ref<FeedItemFilter> = ref(FeedItemFilter.UNREAD)
) => {
  const now = new Date().getTime();
  return feedItems.value
    .filter((item) => {
      if (feedId.value && item.feedId !== feedId.value) return false;
      switch (feedItemFilter.value) {
        case FeedItemFilter.UNREAD:
          return !item.isRead || (item.readTime || 0) + 1000 * 60 * 2 > now;
        case FeedItemFilter.FAVORITE:
          return item.isFavorite;
        default:
          return true;
      }
    })
    .map((item) => ({
      ...item,
      image: item.image && `/img/${item.image}`,
    }));
};

export const useFeedItem = (id: Ref<number>) => {
  const itemStore = reactive<{ feedItem?: any }>({});

  watchEffect(() => {
    itemStore.feedItem = useObservable<FeedItem>(
      liveQuery(() => feedDB.feedItems.get(id.value)) as any
    );
  });
  return itemStore;
};
