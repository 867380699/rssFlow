/* eslint-disable @typescript-eslint/no-explicit-any */
import { useObservable } from '@vueuse/rxjs';
import Dexie, { liveQuery, Subscription } from 'dexie';
import { combineLatest } from 'rxjs';
import { Ref } from 'vue';

import { FeedItemFilter } from '@/enums';

import {
  feedDB,
  loadFeedItemIdByIndex,
  loadFeedItemsByIndex,
} from '../service/dbService';
import { Feed, FeedItem } from '../types';

export const useFeed = (id: Ref<number>) => {
  const feed = ref<Feed>();
  let subscription: Subscription;
  watch(
    id,
    () => {
      subscription?.unsubscribe();
      subscription = liveQuery(() => feedDB.feeds.get(id.value)).subscribe(
        (newFeed) => {
          feed.value = newFeed;
        }
      );
    },
    { immediate: true }
  );
  return { feed };
};

export const useAllFeeds = () => {
  const feeds = useObservable<Feed[]>(
    liveQuery(() => feedDB.feeds.toArray()) as any
  );
  return {
    feeds,
  };
};

export const useChildFeeds = (parentId: number) => {
  const feeds = useObservable<Feed[], Feed[]>(
    liveQuery(() => feedDB.feeds.where({ parentId }).sortBy('rank')) as any
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
      const feeds = await feedDB.feeds.orderBy('id').toArray();

      const counts = await Promise.all(
        feeds.map(({ id: feedId }) =>
          feedDB.feedItems
            .where('[feedId+isRead+isFavorite]')
            .between([feedId, 0, 0], [feedId, 0, 1])
            .count()
        )
      );

      return feeds.reduce(
        (o, v, i) => {
          if (v.type === 'feed') {
            o[v.id || -1] = counts[i];
            if (v.parentId !== 0) {
              o[v.parentId] = (o[v.parentId] || 0) + counts[i]; // Group
            }
            o[0] += counts[i]; // All
          }

          return o;
        },
        { 0: 0 } as Record<number, number>
      );
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
): FeedItem[] => {
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

export const useLiveFeedItems = (
  feedId: Ref<number> = ref(0),
  feedItemFilter: Ref<FeedItemFilter> = ref(FeedItemFilter.UNREAD)
) => {
  const feedItems = ref<FeedItem[]>();

  let subscription: Subscription;

  watch(
    [feedId, feedItemFilter],
    async () => {
      subscription?.unsubscribe();

      const feedIds = feedId.value ? [feedId.value] : [];

      const isReadRange =
        feedItemFilter.value === FeedItemFilter.UNREAD ? [0] : [0, 1];

      const isFavoriteRange =
        feedItemFilter.value === FeedItemFilter.FAVORITE ? [1] : [0, 1];

      subscription = liveQuery(() => {
        return loadFeedItemsByIndex({ feedIds, isReadRange, isFavoriteRange });
      }).subscribe((items) => {
        feedItems.value = items;
      });
    },
    { immediate: true }
  );

  return { feedItems };
};

export const useHomeFeedItemIds = (
  feedId: Ref<number> = ref(0),
  feedItemFilter: Ref<FeedItemFilter> = ref(FeedItemFilter.UNREAD)
) => {
  const feedItemIds = ref<number[]>([]);
  let subscription: Subscription;
  watch(
    [feedId, feedItemFilter],
    async () => {
      subscription?.unsubscribe();

      const feedIds = feedId.value ? [feedId.value] : [];

      const isReadRange =
        feedItemFilter.value === FeedItemFilter.UNREAD ? [0] : [0, 1];

      const isFavoriteRange =
        feedItemFilter.value === FeedItemFilter.FAVORITE ? [1] : [0, 1];

      const allItemsIds$ = liveQuery(async () => {
        const allItemIds = await loadFeedItemIdByIndex({
          feedIds,
          isReadRange,
          isFavoriteRange,
        });
        console.log('load all');

        return allItemIds;
      });

      const recentItemIds$ = liveQuery(async () => {
        const recentItemIds = await loadFeedItemIdByIndex({
          feedIds,
          isReadRange: [1],
          isFavoriteRange,
          readTimeRange: [new Date().getTime() - 1000 * 60 * 2, Dexie.maxKey],
        });
        console.log('load recent');

        return recentItemIds;
      });

      const source =
        feedItemFilter.value === FeedItemFilter.UNREAD
          ? [allItemsIds$, recentItemIds$]
          : [allItemsIds$];

      subscription = combineLatest<number[][]>(source).subscribe(
        ([allItemIds, recentItemIds = []]) => {
          feedItemIds.value = [
            ...new Set(allItemIds.concat(recentItemIds.slice(-5))),
          ].sort((a, b) => a - b);
        }
      );
    },
    { immediate: true }
  );
  return { feedItemIds };
};

export const useLiveFeedItemsById = (ids: Ref<number[]> = ref([])) => {
  const feedItems = ref<FeedItem[]>();
  let subscription: Subscription;
  watch(
    ids,
    () => {
      subscription?.unsubscribe();

      subscription = liveQuery(() => {
        return feedDB.feedItems.where('id').anyOf(ids.value).toArray();
      }).subscribe((items) => {
        feedItems.value = items;
      });
    },
    { immediate: true }
  );
  return {
    feedItems,
  };
};

export const useRecentFeeds = (feedId: Ref<number> = ref(0)) => {
  const feedItems = ref<FeedItem[]>();
  let subscription: Subscription;
  watch(
    feedId,
    () => {
      subscription?.unsubscribe();
      let now = new Date().getTime();

      subscription = liveQuery(() => {
        return (
          feedId.value
            ? feedDB.feedItems.where({ feedId: feedId.value })
            : feedDB.feedItems
        )
          .filter(
            (item) =>
              item.isRead === 1 && (item.readTime || 0) + 1000 * 60 * 2 > now
          )
          .reverse()
          .toArray();
      }).subscribe((items) => {
        feedItems.value = items
          .sort((a, b) => (b.readTime || 0) - (a.readTime || 0))
          .slice(0, 5);
        now = new Date().getTime();
      });
    },
    { immediate: true }
  );
  return {
    feedItems,
  };
};

export const useFeedItem = (id: Ref<number>) => {
  const feedItem = ref<FeedItem>();
  let subscription: Subscription;
  watch(
    id,
    () => {
      subscription?.unsubscribe();
      subscription = liveQuery(() => feedDB.feedItems.get(id.value)).subscribe(
        (item) => {
          feedItem.value = item;
        }
      );
    },
    { immediate: true }
  );
  return {
    feedItem,
  };
};
