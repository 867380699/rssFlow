import { defineStore } from 'pinia';

import {
  useFeed,
  useFeedItem,
  useFeedItemCounts,
  useHomeFeedItemIds,
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

  const { feedItemIds } = useHomeFeedItemIds(feedId, feedItemFilter);

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
    feedItemIds,
    feedItem,
    feedItemId,
    setFeedItemId,
    feedItemCounts,
  };
});
