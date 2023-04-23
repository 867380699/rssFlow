import { defineStore } from 'pinia';

import {
  useChildFeeds,
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

  const { feeds: childFeeds } = useChildFeeds(feedId);

  const feedItemFilter = ref(FeedItemFilter.UNREAD);

  const setFeedItemFilter = (filter: FeedItemFilter) => {
    feedItemFilter.value = filter;
  };

  const feedIds = computed(() =>
    feedId.value // is all
      ? childFeeds.value.length // is group
        ? childFeeds.value.map((f) => f.id!)
        : [feedId.value]
      : []
  );

  const { feedItemIds } = useHomeFeedItemIds(feedIds, feedItemFilter);

  const feedItemId = ref(0);
  const setFeedItemId = (id: number) => {
    feedItemId.value = id;
  };
  const { feedItem } = useFeedItem(feedItemId);

  const { counts: feedItemCounts } = useFeedItemCounts();

  return {
    feedId,
    feed,
    childFeeds,
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
