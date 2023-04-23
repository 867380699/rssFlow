<template>
  <RecycleList ref="scroller" :items="recycleItems">
    <!-- Feed -->
    <template #feed="slotPorps">
      <div
        class="flex items-center pl-1.5 h-6"
        style="background-color: var(--ion-item-background, #fff)"
      >
        <div class="w-4 h-4 rounded-full mr-2 overflow-hidden">
          <LazyImage
            class=""
            :src="feedsMap && feedsMap[slotPorps.data.feedId].imageUrl"
          />
        </div>

        <span class="text-sm">
          {{ feedsMap && feedsMap[slotPorps.data.feedId].title }}
        </span>
      </div>
    </template>
    <!-- Date -->
    <template #date="slotPorps">
      <div
        class="flex items-center text-sm h-6 pl-1.5"
        style="background-color: var(--ion-item-background, #fff)"
      >
        {{ formatRelative(slotPorps.data.pubDate || 0, now) }}
      </div>
    </template>
    <!-- FeedItem -->
    <template #feedItem="slotPorps">
      <FeedItem :item="slotPorps.data" />
    </template>
  </RecycleList>
</template>
<script lang="ts" setup>
import { formatRelative } from 'date-fns';
import { ComponentPublicInstance } from 'vue';

import { useAllFeeds, useFeed } from '@/composables';
import { Feed, FeedItem as FeedItemType } from '@/types';

import LazyImage from './LazyImage.vue';
import RecycleList, { RecycleItem } from './RecycleTreeList.vue';

const props = withDefaults(
  defineProps<{
    feedId?: number;
    items?: FeedItemType[];
  }>(),
  { feedId: 0, items: () => [] }
);

const { feed } = useFeed(toRef(props, 'feedId'));

const { feeds } = useAllFeeds();

const feedsMap = computed(() => {
  return feeds.value?.reduce((o, feed) => {
    if (feed.id !== undefined) {
      o[feed.id] = feed;
    }
    return o;
  }, {} as Record<number, Feed>);
});

const now = new Date();

const recycleItems = computed<RecycleItem[]>(() => {
  const resultItems: RecycleItem[] = [];
  let feedId: number | undefined;
  let pubdate = 0;
  props.items.forEach((item) => {
    if (item.feedId !== feedId) {
      feedId = item.feedId;
      resultItems.push({
        height: 24,
        slot: 'feed',
        data: item,
        children: [],
      });
    }
    const prevFeed = resultItems[resultItems.length - 1];

    if (prevFeed.children) {
      const isSameFormatTime =
        formatRelative(pubdate, now) === formatRelative(item.pubDate || 0, now);
      if (!isSameFormatTime || !prevFeed.children.length) {
        pubdate = item.pubDate || 0;
        prevFeed.children.push({
          height: 24,
          slot: 'date',
          data: item,
          children: [],
        });
      }
      const prevDate = prevFeed.children[prevFeed.children.length - 1];
      if (prevDate.children) {
        prevDate.children.push({
          height: 80,
          slot: 'feedItem',
          data: item,
        });
      }
    }
  });
  return feed.value?.type === 'feed'
    ? resultItems[0]?.children || []
    : resultItems;
});

const scroller = ref<ComponentPublicInstance | null>(null);

watch(
  () => props.feedId,
  () => {
    (scroller.value?.$el as HTMLElement).scrollTop = 0;
  }
);
</script>
<style>
.feed-item {
  --padding-start: 8px;
  --padding-end: 8px;
}
</style>
