import Dexie, { IndexableType, liveQuery, Subscription } from 'dexie';
import { firstValueFrom, from, lastValueFrom, take } from 'rxjs';

import { getFirstKey } from '@/db/raw';
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

const usePages = (
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
      if (newPages.length) {
        if (pages.value.length) {
          // remove duplicate key
          newPages.shift();
        }
        appendPages(newPages);
      }
      if (!newPages.length) {
        const lastIndex = await getFirstKey(
          tableName,
          indexName,
          IDBKeyRange.bound(defaultLower, defaultUpper),
          reverse ? 'next' : 'prev'
        );
        if (lastIndex && lastIndex.toString() !== lastPage.value.toString()) {
          appendPages([lastIndex as IndexableType]);
        }
      }
    }
    return {
      done: end >= pages.value.length,
      value: toRaw(pages.value[end++]),
    };
  };

  const prev = async (): Promise<Result<IndexableType>> => {
    if (start <= 0) {
      const newPages = await getPages(
        tableName,
        indexName,
        reverse ? [firstPage.value] : [0, firstPage.value],
        reverse,
        size,
        10
      );
      if (newPages.length) {
        if (pages.value.length) {
          newPages.shift();
        }
        const count = prependPages(newPages);
        start += count;
        end += count;
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
  orderDesc: boolean
) => {
  const indexName =
    feedIds.length === 1
      ? FeedItemIndex['[feedId+pubDate+id]']
      : FeedItemIndex['[pubDate+id]'];

  const range =
    feedIds.length === 1
      ? [
          [feedIds[0], Dexie.minKey],
          [feedIds[0], Dexie.maxKey],
        ]
      : [Dexie.minKey, Dexie.maxKey];

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
      console.log(firstPage.value);
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
    pagedFeedItems.value.push(feedItemRef);

    if (endPageIndex && prevIndex) {
      const includeLower = !reverse;
      const includeUpper = reverse;
      const source = createPageSource(
        [endPageIndex, prevIndex],
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
      const feedItems = await lastValueFrom(source$.pipe(take(1)));
      return {
        value: feedItems,
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
      console.log('wrap next page', total, result);
    } while (!result.done && total < 20);

    return result;
  }, loadingResult);

  const wrappedPrevPage = wrapLoading(prevPage, loadingResult);

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
  wrappedNextPage();

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

  const reset = () => {
    console.log('reset home');
    result.value?.destory();
    result.value = useFeedItems(
      feedIds.value,
      feedItemFilter.value,
      orderDesc.value
    );
  };

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
