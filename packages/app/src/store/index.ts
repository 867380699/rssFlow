import { defineStore } from 'pinia';

import {
  useChildFeedIds,
  useFeed,
  useFeedItem,
  useFeedItemCounts,
  useHomeFeedItemsKeySet,
  useLiveHomeFeedItems,
} from '@/composables';
import { FeedItemFilter } from '@/enums';

export const useFeedStore = defineStore('feed', () => {
  /** current selected feed's id */
  const feedId = ref(0); // 0 for all

  const setFeedId = (id: number) => {
    feedId.value = id;
  };

  const { feed } = toRefs(useFeed(feedId));

  const { feedIds: childFeedIds } = useChildFeedIds(feedId);

  const feedItemFilter = ref(FeedItemFilter.UNREAD);

  const setFeedItemFilter = (filter: FeedItemFilter) => {
    feedItemFilter.value = filter;
  };

  const feedIds = computed(() => {
    return feedId.value // is all
      ? childFeedIds.value.length // is group
        ? toRaw(childFeedIds.value)
        : [feedId.value]
      : [];
  });

  const { keySet } = useHomeFeedItemsKeySet(feedIds, feedItemFilter);

  const feedItemsCount = ref(20);

  const isHomeFeedItemsDesc = ref(true);

  const { feedItems: homeFeedItems, loading: homeLoading } =
    useLiveHomeFeedItems(feedIds, keySet, feedItemsCount, isHomeFeedItemsDesc);

  const feedItemId = ref(0);
  const setFeedItemId = (id: number) => {
    feedItemId.value = id;
  };
  const { feedItem } = useFeedItem(feedItemId);

  const { counts: feedItemCounts } = useFeedItemCounts();

  return {
    feedId,
    feed,
    feedIds,
    setFeedId,
    feedItemFilter,
    setFeedItemFilter,
    keySet,
    feedItemsCount,
    homeFeedItems,
    homeLoading,
    feedItem,
    feedItemId,
    setFeedItemId,
    feedItemCounts,
    isHomeFeedItemsDesc,
  };
});
