import {
  useAllFeedsMap,
  useChildFeedIds,
  useFeed,
  useFeedIdTree,
  useFeedItem,
  useFeedItemCounts,
} from '@/composables';
import { useHomeFeedItems } from '@/composables/home';
import { FeedItemFilter } from '@/enums';

export const useFeedStore = defineStore('feed', () => {
  /** current selected feed's id */
  const feedId = ref(0); // 0 for all

  const setFeedId = (id: number) => {
    feedId.value = id;
    childFeedIds.value = [];
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

  const isHomeFeedItemsDesc = ref(true);

  const {
    feedItems: homeFeedItems,
    loading: homeLoading,
    nextPage: homeNextPage,
    prevPage: homePrevPage,
    newItemsCount,
    updateNewItemCount,
    reset: resetHomeFeedItems,
  } = useHomeFeedItems(feedIds, feedItemFilter, isHomeFeedItemsDesc);

  const feedItemId = ref(0);
  const setFeedItemId = (id: number) => {
    feedItemId.value = id;
  };
  const { feedItem } = useFeedItem(feedItemId);

  const { counts: feedItemCounts } = useFeedItemCounts();

  const { feedsMap } = useAllFeedsMap();

  const { feedIdTree } = useFeedIdTree();

  const getLoadingFeedIds = (feedId: number, ids: number[] = []): number[] => {
    const feed = feedsMap.value?.[feedId];
    if (feed?.id) {
      ids.push(feed.id);
      return getLoadingFeedIds(feed.parentId, ids);
    } else {
      ids.push(0);
    }
    return ids;
  };

  const loadingFeedIds = ref(new Set<number>());

  const addLoadingFeed = (feedId: number) => {
    const ids = getLoadingFeedIds(feedId);
    ids.forEach((id) => loadingFeedIds.value.add(id));
  };

  const removeLoadingFeed = (feedId: number) => {
    const ids = getLoadingFeedIds(feedId);
    ids.forEach((id) => loadingFeedIds.value.delete(id));
    if (updateNewItemCount.value) {
      updateNewItemCount.value();
    }
  };

  return {
    feedId,
    feed,
    feedIds,
    setFeedId,
    feedItemFilter,
    setFeedItemFilter,
    homeFeedItems,
    homeLoading,
    homeNextPage,
    homePrevPage,
    newItemsCount,
    resetHomeFeedItems,
    feedItem,
    feedItemId,
    setFeedItemId,
    feedItemCounts,
    isHomeFeedItemsDesc,
    feedsMap,
    feedIdTree,
    loadingFeedIds,
    addLoadingFeed,
    removeLoadingFeed,
  };
});
