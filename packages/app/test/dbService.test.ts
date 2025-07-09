import 'fake-indexeddb/auto';

import Dexie from 'dexie';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { FeedDB, FeedItemIndex, getPages } from '@/service/dbService';
import { FeedItem } from '@/types';

describe('FeedDB', () => {
  let db: FeedDB;
  const feedFixtures: FeedItem[] = [];

  beforeAll(async () => {
    db = new FeedDB();
    await db.open();

    const now = 1699129845568;
    const feedIds = [1, 2, 3];
    for (let i = 0; i < feedIds.length; i++) {
      for (let j = 0; j < 1000; j++) {
        const id = feedIds[i] * 1000 + j;
        feedFixtures.push({
          id,
          feedId: feedIds[i],
          title: `title ${i}:${j}`,
          link: `link ${i}:${j}`,
          pubDate: now + id * 1000,
        });
      }
    }

    await db.feedItems.bulkAdd(feedFixtures);
  });

  afterAll(async () => {
    db.feedItems.clear();
    db.close();
  });

  it('getPages ASC', async () => {
    const result = await getPages(
      'feedItems',
      FeedItemIndex['[feedId+pubDate+id]'],
      [
        [1, Dexie.minKey],
        [1, Dexie.maxKey],
      ],
      false,
      20,
      5
    );
    // console.log(result);
    const expected = [
      [1, 1699130845568, 1000],
      [1, 1699130865568, 1020],
      [1, 1699130885568, 1040],
      [1, 1699130905568, 1060],
      [1, 1699130925568, 1080],
    ];
    expect(result).toEqual(expected);
  });

  it('getPages DESC', async () => {
    const result = await getPages(
      'feedItems',
      FeedItemIndex['[feedId+pubDate+id]'],
      [
        [1, Dexie.minKey],
        [1, Dexie.maxKey],
      ],
      true,
      20,
      5
    );
    console.log(result);
    const expected = [
      [1, 1699131844568, 1999],
      [1, 1699131824568, 1979],
      [1, 1699131804568, 1959],
      [1, 1699131784568, 1939],
      [1, 1699131764568, 1919],
    ];
    expect(result).toEqual(expected);
  });
});
