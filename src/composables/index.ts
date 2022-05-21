/* eslint-disable @typescript-eslint/no-explicit-any */
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import { Ref } from 'vue';

import { feedDB } from '../service/dbService';
import { FeedItem } from '../types';

export const useAllFeedItems = () => {
  const feedItems = useObservable<FeedItem[]>(
    liveQuery(() => feedDB.feedItems.toArray()) as any
  );
  return {
    feedItems,
  };
};

export const useFeedItems = (
  feedId?: number,
  isUnRead?: boolean,
  isFavorite?: boolean
) => {
  const feedItems = useObservable<FeedItem[]>(
    liveQuery(() =>
      feedDB.feedItems
        .toCollection()
        .filter((feedItem) => {
          return !feedId || feedItem.feedId === feedId;
        })
        .filter((feedItem) => {
          return isUnRead ? feedItem.isRead === 0 : true;
        })
        .filter((feedItem) => {
          return isFavorite ? feedItem.isFavorite === 1 : true;
        })
        .toArray()
    ) as any
  );
  return {
    feedItems,
  };
};
