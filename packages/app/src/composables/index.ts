/* eslint-disable @typescript-eslint/no-explicit-any */
import { useObservable } from '@vueuse/rxjs';
import Dexie, { IndexableType, liveQuery, Subscription } from 'dexie';
import { combineLatest, Observable } from 'rxjs';
import { Ref } from 'vue';

import { FeedItemFilter } from '@/enums';

import {
  buildAllFeedItemPrimaryKeyObservable,
  buildFeedItemPrimaryKeyObservable,
  feedDB,
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

/**
 * return a `Set` with all available feed item ids.
 * If filter is `unread`, add recent read feedItems to result
 */
export const useHomeFeedItemsKeySet = (
  feedIds: Ref<number[]> = ref([]),
  feedItemFilter: Ref<FeedItemFilter> = ref(FeedItemFilter.UNREAD)
) => {
  const keySet: Ref<Set<number>> = ref(new Set());
  let subscription: Subscription;
  let observable: Observable<number[]>;
  watch(
    [feedIds, feedItemFilter],
    async () => {
      const t0 = performance.now();
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

        const recent = new Date().getTime() - 2 * 60 * 1000;
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
        console.log('keySet:', performance.now() - t0);
      });
    },
    { immediate: true }
  );
  return { keySet };
};

export const useLiveHomeFeedItems = (
  idSet: Ref<Set<number>>,
  limit: Ref<number>
) => {
  const feedItems = ref<FeedItem[]>([]);
  let subscription: Subscription;
  watch(
    [idSet, limit],
    () => {
      subscription?.unsubscribe();
      subscription = liveQuery(() => {
        return feedDB.feedItems
          .orderBy('[pubDate+id]')
          .reverse()
          .limit(limit.value)
          .filter(({ id }) => !!id && idSet.value.has(id))
          .toArray();
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
