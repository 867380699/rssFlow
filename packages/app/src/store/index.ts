import { defineStore } from 'pinia';

import {
  useAllFeedItems,
  useFeed,
  useFeedItem,
  useFeedItemCounts,
  useFeedItems,
} from '@/composables';
import { FeedItemFilter } from '@/enums';

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

  const { feedItems: allFeedItems } = useAllFeedItems();

  const feedItems = computed(() => {
    if (allFeedItems.value) {
      return useFeedItems(allFeedItems, feedId, feedItemFilter);
    } else {
      return [];
    }
  });

  const feedItemId = ref(0);
  const setFeedItemId = (id: number) => {
    feedItemId.value = id;
  };
  const { feedItem } = toRefs(useFeedItem(feedItemId));

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
  };
});
