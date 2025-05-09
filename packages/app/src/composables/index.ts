/* eslint-disable @typescript-eslint/no-explicit-any */
import { useObservable } from '@vueuse/rxjs';
import Dexie, {
  IndexableType,
  liveQuery,
  Observable as DexieObservable,
  Subscription,
} from 'dexie';
import { combineLatest, from, Observable, Subject, switchMap } from 'rxjs';
import { Ref } from 'vue';

import { FeedItemFilter } from '@/enums';
import { i18n } from '@/i18n';

import {
  buildAllFeedItemPrimaryKeyObservable,
  buildFeedItemPrimaryKeyObservable,
  feedDB,
  FeedItemIndex,
  getPages,
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
  const feeds = useObservable<Feed[], Feed[]>(
    liveQuery(() => feedDB.feeds.toArray()) as any
  );
  return {
    feeds,
  };
};

export const useAllFeedItemStatistic = () => {
  const feedItemStatistic = useObservable<{
    total: number;
    unread: number;
    favorite: number;
  }>(
    liveQuery(async () => {
      const [total, unread, favorite] = await Promise.all([
        feedDB.feedItems.count(),
        feedDB.feedItems
          .where('[isRead+pubDate]')
          .between([0, Dexie.minKey], [0, Dexie.maxKey])
          .count(),
        feedDB.feedItems
          .where('[isFavorite+pubDate]')
          .between([1, Dexie.minKey], [1, Dexie.maxKey])
          .count(),
      ]);
      return {
        total,
        unread,
        favorite,
      };
    }) as any
  );
  return {
    feedItemStatistic,
  };
};

export const useChildFeeds = (parentId: Ref<number>) => {
  const feeds = ref<Feed[]>([]);
  let subscription: Subscription;
  watch(
    parentId,
    () => {
      subscription?.unsubscribe();
      subscription = liveQuery(() =>
        feedDB.feeds
          .orderBy('rank')
          .filter((feed) => feed.parentId === parentId.value)
          .toArray()
      ).subscribe((newFeeds) => {
        feeds.value = newFeeds;
      });
    },
    { immediate: true }
  );
  return { feeds };
};

export const useChildFeedIds = (parentId: Ref<number>) => {
  const feedIds = ref<number[]>([]);
  let subscription: Subscription;
  watch(
    parentId,
    () => {
      subscription?.unsubscribe();
      subscription = liveQuery(
        () =>
          feedDB.feeds
            .where({ parentId: parentId.value })
            .primaryKeys() as unknown as number[]
      ).subscribe((ids) => {
        feedIds.value = ids;
      });
    },
    { immediate: true }
  );
  return { feedIds };
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

      const feedMap = feeds.reduce((o, f) => {
        if (f.id) {
          o[f.id] = f;
        }
        return o;
      }, {} as Record<number, Feed>);

      return feeds.reduce(
        (o, v, i) => {
          if (v.type === 'feed') {
            o[v.id || -1] = counts[i];

            let currentParentId = v.parentId;
            while (currentParentId) {
              o[currentParentId] = (o[currentParentId] || 0) + counts[i];
              currentParentId = feedMap[currentParentId]?.parentId || 0;
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

/**
 * return a `Set` with all available feed item ids.
 * If filter is `unread`, add recent read feedItems to result
 */
export const useHomeFeedItemsKeySet = (
  feedIds: Ref<number[]> = ref([]),
  feedItemFilter: Ref<FeedItemFilter> = ref(FeedItemFilter.UNREAD)
) => {
  const keySet: Ref<Set<number>> = ref(new Set<number>());
  let subscription: Subscription;
  let observable: Observable<number[]>;
  watch(
    [feedIds, feedItemFilter],
    ([ids, filter], [oldIds, oldFilter]) => {
      if (ids.join(',') === oldIds?.join(',') && filter === oldFilter) {
        console.log('keySet:return');
        return;
      }

      let t0 = performance.now();
      subscription?.unsubscribe();

      const isUnread = feedItemFilter.value === FeedItemFilter.UNREAD;
      const isFavorite = feedItemFilter.value === FeedItemFilter.FAVORITE;

      let ranges: IndexableType[][][] = [];

      // [isRead+isFavorite+readTime]
      if (isUnread) {
        // unread
        ranges.push([
          [0, 0, Dexie.minKey],
          [0, 1, Dexie.maxKey],
        ]);

        const recent = Date.now() - 2 * 60 * 1000;
        // recent read
        ranges.push([
          [1, 0, recent],
          [1, 0, Dexie.maxKey],
        ]);
        ranges.push([
          [1, 1, recent],
          [1, 1, Dexie.maxKey],
        ]);
      } else if (isFavorite) {
        // unread & favorite
        ranges.push([
          [0, 1, Dexie.minKey],
          [0, 1, Dexie.maxKey],
        ]);
        // read & favorite
        ranges.push([
          [1, 1, Dexie.minKey],
          [1, 1, Dexie.maxKey],
        ]);
      } else {
        ranges.push([
          [0, 0, Dexie.minKey],
          [1, 1, Dexie.maxKey],
        ]);
      }

      if (feedIds.value.length) {
        // [feedId+isRead+isFavorite+readTime+pubDate+id]
        ranges = feedIds.value.flatMap((feedId) =>
          ranges.map(([lower, upper]) => [
            [feedId, ...lower],
            [feedId, ...upper],
          ])
        );
        observable = combineLatest(
          ranges.map((range) => buildFeedItemPrimaryKeyObservable(range))
        );
      } else {
        observable = combineLatest(
          ranges.map((range) => buildAllFeedItemPrimaryKeyObservable(range))
        );
      }
      subscription = observable.subscribe((indexes) => {
        keySet.value = new Set(indexes.flat());
        const t1 = performance.now();
        console.log(`keySet:${ranges.length}:${keySet.value.size}`, t1 - t0);
        t0 = t1;
      });
    },
    { immediate: true }
  );
  return { keySet };
};

export const useLiveHomeFeedItems = (
  feedIds: Ref<number[]>,
  idSet: Ref<Set<number>>,
  limit: Ref<number>,
  desc: Ref<boolean>
) => {
  const feedItems = ref<FeedItem[]>([]);
  const loading = ref(true);
  let subscription: Subscription;
  watch(
    [idSet, limit, desc],
    () => {
      const t0 = performance.now();
      subscription?.unsubscribe();
      loading.value = true;
      let observable: DexieObservable<FeedItem[]>;
      if (feedIds.value.length === 1) {
        const feedId = feedIds.value[0];
        observable = liveQuery(() => {
          const source = feedDB.feedItems
            .where('[feedId+pubDate+id]')
            .between(
              [feedId, Dexie.minKey, Dexie.minKey],
              [feedId, Dexie.maxKey, Dexie.maxKey],
              true,
              true
            );
          return (desc.value ? source.reverse() : source)
            .limit(Math.min(limit.value, idSet.value.size))
            .filter(({ id }) => !!id && idSet.value.has(id))
            .toArray();
        });
      } else {
        observable = liveQuery(() => {
          const source = feedDB.feedItems.orderBy('[pubDate+id]');

          return (desc.value ? source.reverse() : source)
            .limit(Math.min(limit.value, idSet.value.size))
            .filter(({ id }) => !!id && idSet.value.has(id))
            .toArray();
        });
      }
      subscription = observable.subscribe((items) => {
        feedItems.value = items;
        loading.value = false;
        console.log(`key home items:${items.length}`, performance.now() - t0);
      });
    },
    { immediate: true }
  );
  return {
    feedItems,
    loading,
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

export const useLoading = <T, P extends any[]>(
  asyncFn: (...params: P) => Promise<T>
) => {
  const isLoading: Ref<boolean> = ref(false);

  const wrappedFn = async (...params: P): Promise<T> => {
    if (isLoading.value) {
      throw new Error(i18n.global.t('loading'));
    }
    isLoading.value = true;
    try {
      const result = await asyncFn(...params);
      return result;
    } finally {
      isLoading.value = false;
    }
  };

  return [isLoading, wrappedFn];
};
