import 'fake-indexeddb/auto';

import Dexie, { IndexableType } from 'dexie';
import { generateBasicFeedItems } from 'test/fixture/feedItems';
import { range, waitForRefChange } from 'test/utils';
import { afterAll, beforeAll, describe, expect, it, test, vi } from 'vitest';

import { FeedItemFilter } from '@/enums';
import { FeedDB, FeedItemIndex } from '@/service/dbService';
import { FeedItem } from '@/types';

import { useFeedItems, usePages } from '../../src/composables/home';

describe('Home paging', () => {
  const now = 1699129845568;

  let db: FeedDB;
  const feedFixtures: FeedItem[] = generateBasicFeedItems();

  beforeAll(async () => {
    db = new FeedDB();
    await db.open();
    await db.feedItems.bulkAdd(feedFixtures);
  });

  afterAll(async () => {
    await db.delete();
  });

  it('init pages as []', async () => {
    const { pages } = usePages(FeedItemIndex['[feedId+pubDate+id]']);
    expect(pages.value).toBeInstanceOf(Array);
  });
  it('Home next ASC', async () => {
    const { pages, next } = usePages(
      FeedItemIndex['[feedId+pubDate+id]'],
      false,
      [
        [2, Dexie.minKey],
        [2, Dexie.maxKey],
      ]
    );
    const { value: nextIndex } = await next();
    expect(nextIndex).toEqual([2, 1699131845568, 2000]);

    const { value: nextIndex2nd } = await next();
    expect(nextIndex2nd).toEqual([2, 1699131865568, 2020]);

    for (let i = 0; i < 8; i++) await next();
    const { value: nextIndex11th } = await next();
    expect(nextIndex11th).toEqual([2, 1699132045568, 2200]);

    for (let i = 0; i < 39; i++) await next();
    const { done, value: nextIndex51th } = await next();
    expect(nextIndex51th).toEqual([2, 1699132844568, 2999]);
    // console.log('51th', nextIndex51th, done);
    // console.log(pages.value);
  });
  it('Home next DESC', async () => {
    const { pages, next } = usePages(
      FeedItemIndex['[feedId+pubDate+id]'],
      true,
      [
        [2, Dexie.minKey],
        [2, Dexie.maxKey],
      ]
    );
    const { value: nextIndex } = await next();
    expect(nextIndex).toEqual([2, 1699132844568, 2999]);

    const { value: nextIndex2nd } = await next();
    expect(nextIndex2nd).toEqual([2, 1699132824568, 2979]);

    for (let i = 0; i < 8; i++) await next();
    const { value: nextIndex11th } = await next();
    expect(nextIndex11th).toEqual([2, 1699132644568, 2799]);

    for (let i = 0; i < 39; i++) await next();
    const { done, value: nextIndex51th } = await next();
    // console.log('51th', nextIndex51th, done);
    expect(nextIndex51th).toEqual([2, 1699131845568, 2000]);
    // console.log(pages.value);
  });

  it('Home prev DESC', async () => {
    const { pages, prev } = usePages(
      FeedItemIndex['[feedId+pubDate+id]'],
      true,
      [
        [2, Dexie.minKey],
        [2, Dexie.maxKey],
      ]
    );
    const { value: prevIndex } = await prev();
    expect(prevIndex).toEqual([2, 1699131845568, 2000]);

    const { value: prevIndex2nd } = await prev();
    expect(prevIndex2nd).toEqual([2, 1699131865568, 2020]);

    for (let i = 0; i < 8; i++) await prev();
    const { value: prevIndex11th } = await prev();
    expect(prevIndex11th).toEqual([2, 1699132045568, 2200]);

    for (let i = 0; i < 38; i++) await prev();
    const { done, value: nextIndex50th } = await prev();
    console.log('50th', nextIndex50th, done);
    expect(nextIndex50th).toEqual([2, 1699132844568, 2999]);
    console.log(pages.value);
  });

  it('Home prev ASC', async () => {
    const { pages, prev } = usePages(
      FeedItemIndex['[feedId+pubDate+id]'],
      false,
      [
        [2, Dexie.minKey],
        [2, Dexie.maxKey],
      ]
    );
    const { value: prevIndex } = await prev();
    expect(prevIndex).toEqual([2, 1699132844568, 2999]);

    const { value: nextPrevIndex } = await prev();
    expect(nextPrevIndex).toEqual([2, 1699132824568, 2979]);

    for (let i = 0; i < 8; i++) await prev();
    const { value: prevIndex11th } = await prev();
    expect(prevIndex11th).toEqual([2, 1699132644568, 2799]);

    for (let i = 0; i < 38; i++) await prev();
    const { done, value: nextIndex50th } = await prev();
    // console.log('50th', nextIndex50th, done);
    expect(nextIndex50th).toEqual([2, 1699131845568, 2000]);
    // console.log(pages.value);
  });

  // ====== //

  it('Home feedItems', async () => {
    const { feedItems, nextPage, prevPage, loading } = toRefs(
      useFeedItems([2], FeedItemFilter.ALL, true)
    );

    nextPage.value();

    await waitForRefChange(loading);

    const newFeedItems = [];
    for (let i = 0; i < 100; i++) {
      const id = feedFixtures.length + 1000 + i;
      newFeedItems.push({
        id,
        feedId: 2,
        title: `title + ${id}`,
        link: `link + ${id}`,
        pubDate: now + id * 1000,
      });
    }

    await db.feedItems.bulkAdd(newFeedItems);

    prevPage.value();

    await waitForRefChange(loading);

    console.log(feedItems.value.map((i) => i.id));
  });

  it('Home feedItems prev init', async () => {
    const { feedItems, prevPage, loading } = toRefs(
      useFeedItems([2], FeedItemFilter.ALL, true)
    );
    prevPage.value();
    await waitForRefChange(loading);

    prevPage.value();
    await waitForRefChange(loading);

    const expectIds = range(41, 2040, -1); // 2040 ~ 2000
    // console.log(expectIds);
    expect(feedItems.value.map((i) => i.id)).toEqual(expectIds);
  });
});
