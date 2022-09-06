import { defineStore } from 'pinia';

import { useAllFeedItems, useFeedItem } from '@/composables';
import { FeedItemFilter } from '@/enums';

export const useFeedStore = defineStore('feed', () => {
  /** current selected feed's id */
  const feedId = ref(0); // 0 for all

  const setFeedId = (id: number) => {
    feedId.value = id;
  };

  const feedItemFilter = ref(FeedItemFilter.UNREAD);

  const setFeedItemFilter = (filter: FeedItemFilter) => {
    feedItemFilter.value = filter;
  };

  const { feedItems: allFeedItems } = useAllFeedItems();

  const feedItems = computed(() => {
    const now = new Date().getTime();
    if (allFeedItems.value) {
      return allFeedItems.value
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
    } else {
      return [];
    }
  });

  const feedItemId = ref(0);
  const setFeedItemId = (id: number) => {
    feedItemId.value = id;
  };
  const { feedItem } = toRefs(useFeedItem(feedItemId));

  return {
    feedId,
    setFeedId,
    feedItemFilter,
    setFeedItemFilter,
    feedItems,
    feedItem,
    feedItemId,
    setFeedItemId,
  };
});
