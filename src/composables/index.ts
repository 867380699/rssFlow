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

export const useUnreadFeedItems = (feedId?: number) => {
  const idQuery = feedId ? { feedId } : {};
  const feedItems = useObservable<FeedItem[]>(
    liveQuery(() =>
      feedDB.feedItems.where({ isRead: 0, ...idQuery }).toArray()
    ) as any
  );
  return {
    feedItems,
  };
};
