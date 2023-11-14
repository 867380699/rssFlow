import { FeedItem } from '@/types';

/**
 * generate 3000 {@link FeedItem}s, id start from 1000 to 3999
 */
export const generateBasicFeedItems = () => {
  const feedItems: FeedItem[] = [];

  const now = 1699129845568;
  const feedIds = [1, 2, 3];
  const itemLength = 1000;

  for (let i = 0; i < feedIds.length; i++) {
    for (let j = 0; j < itemLength; j++) {
      const id = feedIds[i] * itemLength + j;
      feedItems.push({
        id,
        feedId: feedIds[i],
        title: `title ${i}:${j}`,
        link: `link ${i}:${j}`,
        pubDate: now + id * 1000,
      });
    }
  }
  return feedItems;
};
