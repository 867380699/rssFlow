import Dexie, { IndexableType, liveQuery, Subscription } from 'dexie';
import { firstValueFrom, from, lastValueFrom, take } from 'rxjs';

import { getFirstKey, getLastKey } from '@/db/raw';
import { FeedItemFilter } from '@/enums';
import {
  feedDB,
  FeedItemIndex,
  getPages,
  TABLE_NAME,
  TypeFeedItemIndexKey,
} from '@/service/dbService';
import { FeedItem } from '@/types';

type Result<T> = {
  value: T;
  done: boolean;
  loading?: boolean;
};

export const useWrapLoading = () => {
  const loading = ref(false);
  const wrapLoading = <T>(fn: () => Promise<T>, defaultValue: T) => {
    return async () => {
      if (loading.value) {
        return defaultValue;
      }
      loading.value = true;
      try {
        const result = await fn();
        return result;
      } finally {
        loading.value = false;
      }
    };
  };
  return { loading, wrapLoading };
};

export const useFeedItemTimeRange = (
  feedIds: Ref<number[]>,
  feedItemFilter: Ref<FeedItemFilter> = ref(FeedItemFilter.UNREAD)
) => {
  const timeRange = ref<IndexableType[]>([]);

  let subscription: Subscription;
  watch(
    [feedIds, feedItemFilter],
    () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      let t0: number;
      subscription = from(
        (async () => {
          t0 = Date.now();

          let index: TypeFeedItemIndexKey;
          let lower: IndexableType[];
          let upper: IndexableType[];

          if (feedIds.value.length === 1) {
            const feedId = feedIds.value[0];
            if (feedItemFilter.value === FeedItemFilter.UNREAD) {
              index = FeedItemIndex['[feedId+isRead+pubDate]'];
              lower = [feedId, 0, Dexie.minKey];
              upper = [feedId, 0, Dexie.maxKey];
            } else if (feedItemFilter.value === FeedItemFilter.FAVORITE) {
              index = FeedItemIndex['[feedId+isFavorite+pubDate]'];
              lower = [feedId, 1, Dexie.minKey];
              upper = [feedId, 1, Dexie.maxKey];
            } else {
              index = FeedItemIndex['[feedId+pubDate]'];
              lower = [feedId, Dexie.minKey];
              upper = [feedId, Dexie.maxKey];
            }
          } else {
            if (feedItemFilter.value === FeedItemFilter.UNREAD) {
              index = FeedItemIndex['[isRead+pubDate]'];
              lower = [0, Dexie.minKey];
              upper = [0, Dexie.maxKey];
            } else if (feedItemFilter.value === FeedItemFilter.FAVORITE) {
              index = FeedItemIndex['[isFavorite+pubDate]'];
              lower = [1, Dexie.minKey];
              upper = [1, Dexie.maxKey];
            } else {
              index = FeedItemIndex['[pubDate+id]'];
              lower = [Dexie.minKey];
              upper = [Dexie.maxKey];
            }
          }

          const query = feedDB.feedItems.where(index).between(lower, upper);

          const start = await query.first();
          const end = await query.last();

          if (feedItemFilter.value === FeedItemFilter.UNREAD) {
            const recent = Date.now() - 2 * 60 * 1000;
            const recentQuery = feedDB.feedItems
              .where(FeedItemIndex['readTime'])
              .between(recent, Dexie.maxKey);

            let recentStart: number = Number.MAX_SAFE_INTEGER;
            let recentEnd: number = Number.MIN_SAFE_INTEGER;

            await recentQuery.each((item) => {
              if (feedIds.value.length === 1) {
                if (item.feedId !== feedIds.value[0]) return;
              }
              if (recentStart > Number(item.pubDate)) {
                recentStart = Number(item.pubDate);
              }
              if (recentEnd < Number(item.pubDate)) {
                recentEnd = Number(item.pubDate);
              }
            });

            if (recentStart <= recentEnd) {
              const startTime = Math.min(
                recentStart,
                start?.pubDate || Dexie.minKey
              );
              const endTime = Math.max(
                recentEnd,
                end?.pubDate || Number.MAX_SAFE_INTEGER
              );

              console.log(
                'timeRange:recent',
                startTime,
                endTime,
                `${Date.now() - t0}ms`
              );

              return [startTime, endTime + 1];
            }
          }
          console.log('timeRange:', Date.now() - t0);
          console.log('timeRange:q', start?.pubDate, end?.pubDate);
          return [
            start?.pubDate === undefined ? Dexie.minKey : start?.pubDate,
            end?.pubDate === undefined ? Dexie.maxKey : end?.pubDate + 1,
          ];
        })()
      ).subscribe((result) => {
        console.log('timeRange:liveQuery', result, `${Date.now() - t0}ms`);

        timeRange.value = result;
      });
    },
    { immediate: true }
  );

  return {
    timeRange,
  };
};

export const usePages = (
  indexName: TypeFeedItemIndexKey,
  reverse = false,
  range: IndexableType[] = [Dexie.minKey, Dexie.maxKey]
) => {
  const [defaultLower, defaultUpper] = range;
  const pages = ref<IndexableType[]>([]);
  const firstPage = computed(() => pages.value[0]);
  const lastPage = computed(() => pages.value[pages.value.length - 1]);

  const tableName = TABLE_NAME.feedItems;
  const size = 20;
  let start = 0;
  let end = 0;

  const appendPages = (newPages: IndexableType[]) => {
    if (newPages.length) {
      const preLength = pages.value.length;
      pages.value.length += newPages.length;
      for (let i = 0; i < newPages.length; i++) {
        const page = newPages[i];
        pages.value[preLength + i] = page;
      }
    }
    return newPages.length;
  };

  const prependPages = (newPages: IndexableType[]) => {
    if (newPages.length) {
      pages.value.reverse();
      appendPages(newPages);
      pages.value.reverse();
    }
    return newPages.length;
  };

  const next = async (): Promise<Result<IndexableType>> => {
    const range = reverse
      ? [defaultLower, toRaw(lastPage.value) || defaultUpper]
      : [toRaw(lastPage.value) || defaultLower, defaultUpper];

    if (end >= pages.value.length) {
      const newPages = await getPages(
        tableName,
        indexName,
        range,
        reverse,
        size,
        10
      );
      if (pages.value.length) {
        // remove duplicate key
        newPages.shift();
      }
      if (newPages.length) {
        appendPages(newPages);
      } else {
        console.log('check end');
        // check if reached end
        const lastIndex = await getFirstKey(
          tableName,
          indexName,
          IDBKeyRange.bound(defaultLower, defaultUpper),
          reverse ? 'next' : 'prev'
        );
        if (lastIndex) {
          if (lastIndex.toString() !== lastPage.value.toString()) {
            appendPages([lastIndex as IndexableType]);
          } else if (pages.value.length === 1) {
            // edge case: only one record
            appendPages([lastIndex as IndexableType]);
          }
        }
      }
    }
    return {
      done: end >= pages.value.length,
      value: toRaw(pages.value[end++]),
    };
  };

  const prev = async (): Promise<Result<IndexableType>> => {
    const range = reverse
      ? [toRaw(firstPage.value) || defaultLower, defaultUpper]
      : [defaultLower, toRaw(firstPage.value) || defaultUpper];
    if (start <= 0) {
      const newPages = await getPages(
        tableName,
        indexName,
        range,
        !reverse,
        size,
        10
      );
      const isInit = pages.value.length === 0;
      if (!isInit) {
        newPages.shift();
      }
      if (newPages.length) {
        const count = prependPages(newPages);
        start += count + (isInit ? -1 : 0);
        end += count + (isInit ? -1 : 0);
      } else {
        // check if reached end
        const lastIndex = await getLastKey(
          tableName,
          indexName,
          IDBKeyRange.bound(defaultLower, defaultUpper),
          reverse ? 'next' : 'prev'
        );
        if (lastIndex && lastIndex.toString() !== firstPage.value.toString()) {
          prependPages([lastIndex as IndexableType]);
        }
      }
    }
    return {
      done: start <= 0,
      value: toRaw(pages.value[start--]),
    };
  };

  return {
    pages,
    next,
    prev,
  };
};

export const useFeedItems = (
  feedIds: number[],
  feedItemFilter: FeedItemFilter = FeedItemFilter.UNREAD,
  orderDesc: boolean,
  timeRange: IndexableType[] = []
) => {
  const indexName =
    feedIds.length === 1
      ? FeedItemIndex['[feedId+pubDate+id]']
      : FeedItemIndex['[pubDate+id]'];

  const timeLower = toRaw(timeRange[0]) || Dexie.minKey;
  const timeUpper = toRaw(timeRange[1]) || Dexie.maxKey;
  const range =
    feedIds.length === 1
      ? [
          [feedIds[0], timeLower] as IndexableType,
          [feedIds[0], timeUpper] as IndexableType,
        ]
      : [[timeLower] as IndexableType, [timeUpper] as IndexableType];

  const reverse = orderDesc;

  const { loading, wrapLoading } = useWrapLoading();

  const { next, prev } = usePages(indexName, reverse, range);

  let startPageIndex: IndexableType | undefined;

  let endPageIndex: IndexableType | undefined;

  const pagedFeedItems = ref<Ref<FeedItem[]>[]>([]);

  const feedItems = computed(() => {
    const allFeedItems: FeedItem[] = [];

    let length = 0;
    for (let i = 0; i < pagedFeedItems.value.length; i++) {
      const page = pagedFeedItems.value[i];
      length += page?.value.length || 0;
    }

    allFeedItems.length = length;

    let itemIndex = 0;
    for (let i = 0; i < pagedFeedItems.value.length; i++) {
      const page = pagedFeedItems.value[i];
      if (page) {
        for (let j = 0; j < page.value.length; j++) {
          const feedItem = page.value[j];
          allFeedItems[itemIndex++] = feedItem;
        }
      }
    }
    return allFeedItems;
  });

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

  const filter = createFilter(feedIds, feedItemFilter);

  const createPageSource = (
    range: IndexableType[],
    reverse = false,
    includeLower: boolean,
    includeUpper: boolean
  ) => {
    const [lower, upper] = reverse ? range.reverse() : range;

    const observable = liveQuery(() => {
      const source = feedDB.feedItems
        .where(indexName)
        .between(lower, upper, includeLower, includeUpper);
      return (reverse ? source.reverse() : source).filter(filter).toArray();
    });
    return observable;
  };

  const subscriptions: Subscription[] = [];

  const firstPage = ref<IndexableType>();

  const nextPage = async (): Promise<Result<FeedItem[]>> => {
    const isFirstPage = !endPageIndex;
    if (isFirstPage) {
      endPageIndex = (await next())?.value;
      firstPage.value = endPageIndex;
      console.log('nextPage', firstPage.value);
    }
    const nextIndex = (await next())?.value;

    const feedItemRef = ref<FeedItem[]>([]);
    pagedFeedItems.value.push(feedItemRef);

    if (endPageIndex && nextIndex) {
      const includeEdge = [isFirstPage, true];
      if (reverse) {
        includeEdge.reverse();
      }
      const [includeLower, includeUpper] = includeEdge;
      const source = createPageSource(
        [endPageIndex, nextIndex],
        reverse,
        includeLower,
        includeUpper
      );
      const subscription = source.subscribe((feedItems) => {
        feedItemRef.value = feedItems;
      });
      subscriptions.push(subscription);
      endPageIndex = nextIndex;

      const source$ = from(source);
      const feedItems = await firstValueFrom(source$.pipe(take(1)));
      return {
        value: feedItems,
        done: false,
      };
    } else {
      return {
        value: [],
        done: true,
      };
    }
  };

  const prevPage = async (): Promise<Result<FeedItem[]>> => {
    if (!startPageIndex) {
      startPageIndex = (await prev())?.value;
    }
    const prevIndex = (await prev())?.value;

    const feedItemRef = ref<FeedItem[]>([]);
    pagedFeedItems.value.unshift(feedItemRef);

    if (startPageIndex && prevIndex) {
      const includeLower = !feedItems.value.length || !reverse;
      const includeUpper = reverse;
      const source = createPageSource(
        [prevIndex, startPageIndex],
        reverse,
        includeLower,
        includeUpper
      );
      const subscription = source.subscribe((feedItems) => {
        feedItemRef.value = feedItems;
      });
      subscriptions.push(subscription);
      startPageIndex = prevIndex;
      const source$ = from(source);
      const newFeedItems = await firstValueFrom(source$.pipe(take(1)));
      return {
        value: newFeedItems,
        done: false,
      };
    }
    return {
      value: [],
      done: true,
    };
  };

  const destory = () => {
    subscriptions.forEach((s) => s.unsubscribe());
    subscriptions.length = 0;
  };

  const loadingResult: Result<FeedItem[]> = {
    value: [],
    done: false,
    loading: true,
  };

  const wrappedNextPage = wrapLoading(async () => {
    let total = 0;
    const result: Result<FeedItem[]> = {
      value: [],
      done: false,
    };
    do {
      const pageResult = await nextPage();
      result.done = pageResult.done;
      total += pageResult.value.length;
      pageResult.value.map((item) => result.value.push(item));
      // console.log('wrap next page', total, result);
    } while (!result.done && total < 20);

    return result;
  }, loadingResult);

  const wrappedPrevPage = wrapLoading(async () => {
    let total = 0;
    const result: Result<FeedItem[]> = {
      value: [],
      done: false,
    };
    do {
      const pageResult = await prevPage();
      result.done = pageResult.done;
      total += pageResult.value.length;
      pageResult.value.map((item) => result.value.push(item));
    } while (!result.done && total < 20);

    return result;
  }, loadingResult);

  const newItemCount = ref(0);

  const updateNewItemCount = async () => {
    if (!firstPage.value) return 0;
    const lower = reverse ? toRaw(firstPage.value) : range[0];
    const upper = reverse ? range[1] : toRaw(firstPage.value);
    newItemCount.value = await feedDB.feedItems
      .where(indexName)
      .between(lower, upper, false, false)
      .count();
    console.log('new Items count:', newItemCount.value, lower, upper);
  };

  watch(firstPage, () => updateNewItemCount());

  // init
  // wrappedNextPage();

  return reactive({
    feedItems,
    nextPage: wrappedNextPage,
    prevPage: wrappedPrevPage,
    loading,
    destory,
    newItemCount,
    updateNewItemCount,
  });
};

export const useHomeFeedItems = (
  feedIds: Ref<number[]>,
  feedItemFilter: Ref<FeedItemFilter> = ref(FeedItemFilter.UNREAD),
  orderDesc: Ref<boolean>
) => {
  /** next page loading */
  const result = ref<ReturnType<typeof useFeedItems>>();
  const feedItems = computed(() => result.value?.feedItems);
  const loading = computed(() => result.value?.loading);
  const nextPage = computed(() => result.value?.nextPage);
  const prevPage = computed(() => result.value?.prevPage);
  const newItemsCount = computed(() => result.value?.newItemCount);
  const updateNewItemCount = computed(() => result.value?.updateNewItemCount);

  if (nextPage.value) {
    nextPage.value();
  }

  const { timeRange } = useFeedItemTimeRange(feedIds, feedItemFilter);

  const reset = () => {
    console.log('reset home');
    result.value?.destory();
    result.value = useFeedItems(
      feedIds.value,
      feedItemFilter.value,
      orderDesc.value,
      timeRange.value
    );
    if (nextPage.value) {
      nextPage.value();
    }
  };

  let t0 = Date.now();
  watch(
    [feedIds, feedItemFilter, orderDesc, timeRange],
    (
      [feedIds, feedItemFilter, orderDesc, currentTimeRange],
      [oldFeedIds, oldFeedItemFilter, oldOrderDesc, oldTimeRange]
    ) => {
      const t1 = Date.now();
      console.log(
        'useHomeFeedItems:timeRange',
        toRaw(currentTimeRange),
        t1 - t0
      );
      t0 = t1;
      const idChanged = feedIds.join(',') !== oldFeedIds?.join(',');
      const filterChanged = feedItemFilter !== oldFeedItemFilter;
      const orderChanged = orderDesc !== oldOrderDesc;

      if (idChanged || filterChanged) {
        timeRange.value = [Dexie.minKey, Dexie.minKey];
      }

      const timeRangeReady = currentTimeRange.length || orderChanged;

      const shouldReset = timeRangeReady;

      if (shouldReset) {
        reset();
      }
    },
    { immediate: true }
  );

  return {
    feedItems,
    loading,
    nextPage,
    prevPage,
    newItemsCount,
    updateNewItemCount,
    reset,
  };
};
