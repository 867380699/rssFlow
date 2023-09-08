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

export const useHomeFeedItems = (
  feedIds: Ref<number[]>,
  feedItemFilter: Ref<FeedItemFilter> = ref(FeedItemFilter.UNREAD),
  orderDesc: Ref<boolean>
) => {
  /** next page loading */
  const result = ref<ReturnType<typeof createHomePagingSource>>();
  const feedItems = computed(() => result.value?.feedItems);
  const loading = computed(() => result.value?.loading);
  const nextPage = computed(() => result.value?.nextPage);

  watch(
    [feedIds, feedItemFilter, orderDesc],
    (
      [feedIds, feedItemFilter, orderDesc],
      [oldFeedIds, oldFeedItemFilter, oldOrderDesc]
    ) => {
      const idChanged = feedIds.join(',') !== oldFeedIds?.join(',');
      const filterChanged = feedItemFilter !== oldFeedItemFilter;
      const orderChanged = orderDesc !== oldOrderDesc;

      const shouldReset = idChanged || filterChanged || orderChanged;

      if (shouldReset) {
        result.value?.destory();
        result.value = createHomePagingSource(
          feedIds,
          feedItemFilter,
          orderDesc
        );
      }
    },
    { immediate: true }
  );

  return {
    feedItems,
    loading,
    nextPage,
  };
};

export const createHomePagingSource = (
  feedIds: number[],
  feedItemFilter: FeedItemFilter = FeedItemFilter.UNREAD,
  orderDesc: boolean
) => {
  const createFilter = (
    feedIds: number[],
    feedItemFilter: FeedItemFilter
  ): ((item: FeedItem) => boolean) => {
    const feedIdSet = new Set(feedIds);
    const isUnread = feedItemFilter === FeedItemFilter.UNREAD;
    const isFavorite = feedItemFilter === FeedItemFilter.FAVORITE;
    const recent = Date.now() - 2 * 60 * 1000;

    const idInclude = (item: FeedItem) => {
      return !feedIdSet.size || feedIdSet.has(item.feedId || NaN);
    };
    if (isUnread) {
      return (item: FeedItem) => {
        return (
          idInclude(item) && (!item.isRead || (item.readTime || 0) > recent)
        );
      };
    } else if (isFavorite) {
      return (item: FeedItem) => {
        return idInclude(item) && !!item.isFavorite;
      };
    }
    return (item: FeedItem) => idInclude(item);
  };

  const initPage = (
    feedIds: number[],
    pages: IndexableType[],
    pageIndex: number,
    reverse = false
  ) => {
    let observable;

    const includeLower = !reverse;
    const includeUpper = reverse;

    if (feedIds.length === 1) {
      const maxKey = [feedIds[0], Dexie.maxKey, Dexie.maxKey];
      const minKey = [feedIds[0], Dexie.minKey, Dexie.minKey];
      const lower = reverse
        ? toRaw(pages[pageIndex + 1]) || minKey
        : toRaw(pages[pageIndex]);
      const upper = reverse
        ? toRaw(pages[pageIndex])
        : toRaw(pages[pageIndex + 1]) || maxKey;
      observable = liveQuery(() => {
        const source = feedDB.feedItems
          .where(FeedItemIndex['[feedId+pubDate+id]'])
          .between(lower, upper, includeLower, includeUpper);
        return (reverse ? source.reverse() : source).filter(filter).toArray();
      });
    } else {
      observable = liveQuery(() => {
        const maxKey = [Dexie.maxKey, Dexie.maxKey];
        const minKey = [Dexie.minKey, Dexie.minKey];
        const lower = reverse
          ? toRaw(pages[pageIndex + 1]) || minKey
          : toRaw(pages[pageIndex]);
        const upper = reverse
          ? toRaw(pages[pageIndex])
          : toRaw(pages[pageIndex + 1]) || maxKey;
        const source = feedDB.feedItems
          .where(FeedItemIndex['[pubDate+id]'])
          .between(lower, upper, includeLower, includeUpper);
        return (reverse ? source.reverse() : source).filter(filter).toArray();
      });
    }
    return observable;
  };

  const appendPageItems = (feedIds: number[], pages: IndexableType[]) => {
    console.log('appendPageItems', loading.value);
    if (loading.value) {
      return;
    } else {
      loading.value = true;
    }
    const pageIndex = currentPageIndex.value;
    if (pageIndex >= pages.length) {
      return;
    }
    const observable = initPage(
      feedIds,
      pages,
      currentPageIndex.value,
      orderDesc
    );
    let inited = false;
    let index: number;
    const subscription = observable.subscribe((items) => {
      console.log(
        'appendPageItems:next',
        items.length,
        pages[pageIndex],
        pages[pageIndex + 1]
      );
      if (!inited) {
        inited = true;
        // setTimeout(() => {
        loading.value = false;
        // }, 0);
        index = currentPageIndex.value;
        if (
          currentPageIndex.value < pages.length &&
          feedItems.value.length + items.length < limit.value
        ) {
          console.log(
            'appendPageItems:init',
            feedItems.value.length,
            items.length,
            limit.value
          );
          currentPageIndex.value = currentPageIndex.value + 1;
          appendPageItems(feedIds, pages);
        }
      }
      if (feedItemPages.value[index]) {
        feedItemPages.value[index].value = items;
      } else {
        feedItemPages.value[index] = ref<FeedItem[]>(items);
      }
    });
    subscriptions.push(subscription);
  };

  /** next page loading */
  const loading = ref(false);

  const limit = ref(20);

  const filter = createFilter(feedIds, feedItemFilter);

  // live query subscription
  const subscriptions: Subscription[] = [];

  const feedItemPages = ref<Ref<FeedItem[]>[]>([]);

  const feedItems = computed(() => {
    const allFeedItems: FeedItem[] = [];

    let length = 0;
    for (let i = 0; i < feedItemPages.value.length; i++) {
      const page = feedItemPages.value[i];
      length += page?.value.length || 0;
    }

    allFeedItems.length = length;

    let itemIndex = 0;
    for (let i = 0; i < feedItemPages.value.length; i++) {
      const page = feedItemPages.value[i];
      if (page) {
        for (let j = 0; j < page.value.length; j++) {
          const feedItem = page.value[j];
          allFeedItems[itemIndex++] = feedItem;
        }
      }
    }
    return allFeedItems;
  });

  const currentPageIndex = ref(0);

  const destory = () => {
    subscriptions.forEach((s) => s.unsubscribe());
  };

  const nextSubject = new Subject<void>();

  const nextPage = () => {
    nextSubject.next();
  };

  const size = 20;

  let pageSource: Observable<IndexableType[]>;
  if (feedIds.length === 1) {
    const feedId = feedIds[0];
    pageSource = from(
      getPages(
        'feedItems',
        '[feedId+pubDate+id]',
        [
          [feedId, Dexie.minKey, Dexie.minKey],
          [feedId, Dexie.maxKey, Dexie.maxKey],
        ],
        orderDesc,
        size
      )
    );
  } else {
    pageSource = from(
      getPages('feedItems', '[pubDate+id]', [], orderDesc, size)
    );
  }

  pageSource.subscribe((pages) => {
    feedItemPages.value = new Array(pages.length);
    nextPage();
  });

  nextSubject.pipe(switchMap(() => pageSource)).subscribe((pages) => {
    console.log('next', limit.value);
    if (!loading.value) {
      limit.value += 20;
      appendPageItems(feedIds, pages);
    }
  });

  return reactive({
    feedItems,
    loading,
    destory,
    nextPage,
  });
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
