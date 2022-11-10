import { defineStore } from 'pinia';

import {
  useFeed,
  useFeedItem,
  useFeedItemCounts,
  useLiveFeedItems,
  useRecentFeeds,
} from '@/composables';
import { FeedItemFilter } from '@/enums';
import { FeedItem } from '@/types';

export const useFeedStore = defineStore('feed', () => {
  /** current selected feed's id */
  const feedId = ref(0); // 0 for all

  const setFeedId = (id: number) => {
    feedId.value = id;
  };

  const { feed } = toRefs(useFeed(feedId));

  const feedItemFilter = ref(FeedItemFilter.UNREAD);

  const setFeedItemFilter = (filter: FeedItemFilter) => {
    feedItemFilter.value = filter;
  };

  const { feedItems: allFeedItems } = useLiveFeedItems(feedId, feedItemFilter);

  const { feedItems: recentFeedItems } = useRecentFeeds(feedId);

  const feedItems = computed(() => {
    const extraFeeds =
      feedItemFilter.value === FeedItemFilter.UNREAD
        ? recentFeedItems.value || []
        : [];
    const result = (allFeedItems.value || [])
      .concat(extraFeeds)
      .sort((a: any, b: any) => a.id - b.id);

    result.forEach((item: FeedItem) => {
      if (item.image && !/\/img/.test(item.image)) {
        item.image = `/img/${item.image}`;
      }
    });

    return result;
  });

  const feedItemId = ref(0);
  const setFeedItemId = (id: number) => {
    feedItemId.value = id;
  };
  const { feedItem } = useFeedItem(feedItemId);

  const { counts: feedItemCounts } = useFeedItemCounts();

  return {
    feedId,
    feed,
    setFeedId,
    feedItemFilter,
    setFeedItemFilter,
    feedItems,
    feedItem,
    feedItemId,
    setFeedItemId,
    feedItemCounts,
    recentFeedItems,
  };
});
