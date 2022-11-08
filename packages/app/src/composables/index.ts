/* eslint-disable @typescript-eslint/no-explicit-any */
import { useObservable } from '@vueuse/rxjs';
import { liveQuery, Subscription } from 'dexie';
import { Ref } from 'vue';

import { FeedItemFilter } from '@/enums';

import { feedDB } from '../service/dbService';
import { Feed, FeedItem } from '../types';

export const useFeed = (id: Ref<number>) => {
  const feed = ref<Feed>();
  let subscription: Subscription;
  watch(
    id,
    () => {
      console.log('effect', id.value);
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
          feedDB.feedItems.where({ feedId, isRead: 0 }).count()
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
